// ============================================================
// FORSYNC — ADMIN SCRIPTS v2.0
// Backend: Vercel Functions + Neon Postgres
// Todos los cambios persisten en DB, sin localStorage
// ============================================================

var AdminApp = {
  data: {
    orders:   [],
    quotes:   [],
    messages: [],
    reviews:  [],
    products: [],
    promos:   [],
    stats:    {}
  },
  chart: null,
  refreshInterval: null
};

// ================= API =================
async function api(path, opts) {
  opts = opts || {};
  try {
    var res = await fetch('/api/' + path, {
      method:  opts.method || 'GET',
      headers: Object.assign({'Content-Type':'application/json'}, opts.headers || {}),
      body:    opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'include'
    });
    var data = await res.json();
    if (!res.ok) return { error: data.error || 'Error', status: res.status };
    return data;
  } catch(e) {
    return { error: e.message };
  }
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', async function() {
  // Verificar que es admin
  var me = await api('auth?action=me');
  if (!me || !me.user || me.user.role !== 'admin') {
    window.location.href = '/login.html';
    return;
  }
  var disp = document.getElementById('adminUserDisplay');
  if (disp) disp.innerText = me.user.name || me.user.email;

  await loadAllData();
  renderDashboard();
  renderProducts();
  renderOrders();
  renderQuotes();
  renderMessages();
  renderReviews();
  renderPromos();
  renderStats();

  // Auto-refresh cada 60 segundos
  AdminApp.refreshInterval = setInterval(async function() {
    await loadAllData();
    var active = document.querySelector('.admin-section.active');
    if (active) {
      var id = active.id;
      if (id === 'sec-dashboard')    renderDashboard();
      if (id === 'sec-pedidos')      renderOrders();
      if (id === 'sec-cotizaciones') renderQuotes();
      if (id === 'sec-mensajes')     renderMessages();
      if (id === 'sec-reviews')      renderReviews();
    }
  }, 60000);

  // Formularios
  var prodForm  = document.getElementById('addProductForm');
  var promoForm = document.getElementById('addPromoForm');
  if (prodForm)  prodForm.addEventListener('submit',  submitNewProduct);
  if (promoForm) promoForm.addEventListener('submit', submitNewPromo);
});

// ================= LOAD DATA =================
async function loadAllData() {
  var res = await api('dashboard');
  if (res.error) {
    if (res.status === 401 || res.status === 403) { window.location.href = '/login.html'; return; }
    showAdminToast('Error cargando datos: ' + res.error, 'error');
    return;
  }
  AdminApp.data.orders   = res.orders   || [];
  AdminApp.data.quotes   = res.quotes   || [];
  AdminApp.data.messages = res.messages || [];
  AdminApp.data.reviews  = res.reviews  || [];
  AdminApp.data.products = res.products || [];
  AdminApp.data.stats    = res.stats    || {};

  // Promos separado
  var pm = await api('promotions');
  AdminApp.data.promos = pm.promotions || [];
}

// ================= NAVIGATION =================
function abrirPestana(secId, btn) {
  document.querySelectorAll('.admin-section').forEach(function(s) { s.classList.remove('active'); });
  var sec = document.getElementById(secId);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');

  // Re-render la sección activa con datos frescos
  if (secId === 'sec-dashboard')    renderDashboard();
  if (secId === 'sec-servicios')    renderProducts();
  if (secId === 'sec-pedidos')      renderOrders();
  if (secId === 'sec-cotizaciones') renderQuotes();
  if (secId === 'sec-mensajes')     renderMessages();
  if (secId === 'sec-reviews')      renderReviews();
  if (secId === 'sec-promociones')  { renderPromos(); }
  if (secId === 'sec-estadisticas') renderStats();
}

function toggleSidebar() {
  var s = document.getElementById('adminSidebar');
  var o = document.getElementById('sidebarOverlay');
  if (s) s.classList.toggle('active');
  if (o) o.classList.toggle('active');
}

async function salirAdmin() {
  await api('auth?action=logout', { method: 'POST' });
  window.location.href = '/index.html';
}

// ================= DASHBOARD =================
function renderDashboard() {
  var s = AdminApp.data.stats;
  setText('dashSales',    formatPrice(s.totalSales  || 0));
  setText('dashOrders',   s.totalOrders  || 0);
  setText('dashQuotes',   s.totalQuotes  || 0);
  setText('dashServices', s.activeProducts || 0);
  setText('dashMessages', s.unreadMessages || 0);
  setText('dashPending',  s.pendingOrders  || 0);

  // Actividad reciente
  var act = document.getElementById('recentActivity');
  if (!act) return;
  var items = [];
  AdminApp.data.orders.slice(0,5).forEach(function(o) {
    items.push({ type:'order', text:'Nuevo pedido #'+o.order_number+' de '+o.customer_name+' — '+formatPrice(o.total), date: o.created_at });
  });
  AdminApp.data.quotes.slice(0,5).forEach(function(q) {
    items.push({ type:'quote', text:'Cotización de '+q.customer_name+': '+getProjectTypeName(q.project_type), date: q.created_at });
  });
  AdminApp.data.messages.slice(0,5).forEach(function(m) {
    items.push({ type:'message', text:'Mensaje de '+m.name+': '+m.subject, date: m.created_at });
  });
  AdminApp.data.reviews.filter(function(r){ return !r.is_approved; }).slice(0,5).forEach(function(r) {
    items.push({ type:'review', text:'Nueva reseña de '+r.customer_name+' ('+r.rating+'★) pendiente de aprobación', date: r.created_at });
  });

  items.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
  if (!items.length) { act.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Sin actividad reciente.</p>'; return; }
  act.innerHTML = items.slice(0,10).map(function(i) {
    var icons = { order:'fa-shopping-cart order', quote:'fa-file-invoice quote', message:'fa-envelope message', review:'fa-star review' };
    return '<div class="activity-item">'
      + '<i class="fa-solid '+icons[i.type]+'" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;"></i>'
      + '<div class="activity-content"><p>'+i.text+'</p><span>'+formatDateFull(i.date)+'</span></div></div>';
  }).join('');
}

// ================= PRODUCTS =================
function renderProducts() {
  var body = document.getElementById('productsTableBody');
  if (!body) return;
  var ps = AdminApp.data.products;
  setText('statProducts', ps.length);
  setText('statActive',   ps.filter(function(p){ return p.status==='active'; }).length);
  setText('statHidden',   ps.filter(function(p){ return p.status!=='active'; }).length);

  if (!ps.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#999;">No hay servicios aún.</td></tr>'; return; }
  body.innerHTML = ps.map(function(p) {
    var catName = { web:'Desarrollo Web', ecommerce:'E-Commerce', app:'Aplicación Web' }[p.category] || p.category;
    var statusBadge = p.status === 'active'
      ? '<span class="badge badge-success">Activo</span>'
      : '<span class="badge badge-secondary">Oculto</span>';
    return '<tr>'
      + '<td><strong>'+p.name+'</strong></td>'
      + '<td>'+catName+'</td>'
      + '<td>'+formatPrice(p.price)+(p.promo_price?'<br><small style="color:#10B981;">Promo: '+formatPrice(p.promo_price)+'</small>':'')+'</td>'
      + '<td>'+p.delivery_days+' días</td>'
      + '<td>'+statusBadge+'</td>'
      + '<td><div class="table-actions">'
      + '<button class="btn-hide" onclick="toggleProductStatus(\''+p.id+'\',\''+p.status+'\')"><i class="fa-solid fa-eye'+(p.status==='active'?'-slash':'')+'"></i> '+(p.status==='active'?'Ocultar':'Mostrar')+'</button>'
      + '<button class="btn-delete" onclick="deleteProduct(\''+p.id+'\',\''+p.name+'\')"><i class="fa-solid fa-trash"></i> Eliminar</button>'
      + '</div></td></tr>';
  }).join('');
}

async function submitNewProduct(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'; }

  var features = (document.getElementById('prodFeatures').value||'').split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  var promoChecked = document.getElementById('checkPromo') && document.getElementById('checkPromo').checked;
  var promoPrice   = promoChecked && document.getElementById('precioPromo') ? parseInt(document.getElementById('precioPromo').value)||null : null;

  var res = await api('products', {
    method: 'POST',
    body: {
      name:          document.getElementById('prodName').value,
      category:      document.getElementById('prodCategory').value,
      price:         parseInt(document.getElementById('prodPrice').value),
      promo_price:   promoPrice,
      description:   document.getElementById('prodDesc').value,
      features:      features,
      delivery_days: parseInt(document.getElementById('prodDelivery').value)
    }
  });

  if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-save"></i> Guardar Servicio'; }
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }

  showAdminToast('Servicio creado correctamente', 'success');
  e.target.reset();
  document.getElementById('precioPromo') && (document.getElementById('precioPromo').style.display='none');
  await loadAllData();
  renderProducts();
}

async function toggleProductStatus(id, current) {
  var newStatus = current === 'active' ? 'hidden' : 'active';
  var res = await api('products', { method: 'PATCH', body: { id, status: newStatus } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Estado actualizado', 'success');
  await loadAllData();
  renderProducts();
}

async function deleteProduct(id, name) {
  if (!confirm('¿Eliminar el servicio "'+name+'"? Esta acción no se puede deshacer.')) return;
  var res = await api('products', { method: 'DELETE', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Servicio eliminado', 'success');
  await loadAllData();
  renderProducts();
}

function togglePromoInput() {
  var cb  = document.getElementById('checkPromo');
  var inp = document.getElementById('precioPromo');
  if (!inp) return;
  inp.style.display = cb && cb.checked ? 'block' : 'none';
}

// ================= ORDERS =================
function renderOrders() {
  var container = document.getElementById('ordersContainer');
  if (!container) return;
  var orders = AdminApp.data.orders;
  var pend = orders.filter(function(o){ return o.status==='pending'; }).length;
  var prog = orders.filter(function(o){ return o.status==='in_progress'; }).length;
  var ent  = orders.filter(function(o){ return o.status==='delivered'; }).length;
  setText('pedPendientes', pend); setText('pedProgreso', prog); setText('pedEntregados', ent);
  if (!orders.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fa-solid fa-box-open" style="font-size:3rem;margin-bottom:15px;display:block;"></i>No hay pedidos aún.</div>'; return; }
  var nextBtns = {
    pending:     [{s:'confirmed',label:'<i class="fa-solid fa-check"></i> Confirmar',cls:'btn-verde'},{s:'cancelled',label:'<i class="fa-solid fa-xmark"></i> Cancelar',cls:'btn-rojo',ask:true}],
    confirmed:   [{s:'in_progress',label:'<i class="fa-solid fa-code"></i> En Desarrollo',cls:'btn-azul'}],
    in_progress: [{s:'delivered',label:'<i class="fa-solid fa-box"></i> Entregado',cls:'btn-verde'}],
    delivered:   [], cancelled: []
  };
  container.innerHTML = orders.map(function(o) {
    var items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
    var itemsList = items.map(function(i){ return escHtml(i.name)+(i.qty>1?' x'+i.qty:''); }).join(', ');
    var btns = (nextBtns[o.status]||[]).map(function(b){
      if (b.ask) return '<button class="btn btn-sm '+b.cls+'" onclick="promptCancelOrder(\''+o.id+'\')">'+b.label+'</button>';
      return '<button class="btn btn-sm '+b.cls+'" onclick="updateOrderStatus(\''+o.id+'\',\''+b.s+'\')">'+b.label+'</button>';
    }).join('');
    var cancelNote = (o.status==='cancelled' && o.cancel_reason)
      ? '<p style="font-size:0.82rem;color:#EF4444;background:#FEF2F2;padding:8px 12px;border-radius:8px;margin-top:8px;"><i class="fa-solid fa-ban"></i> Motivo: '+escHtml(o.cancel_reason)+'</p>' : '';
    var isFinal = (o.status==='delivered'||o.status==='cancelled');
    return '<div class="venta-card '+o.status+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
      +'<h3><i class="fa-solid fa-box"></i> #'+escHtml(o.order_number)+'</h3>'
      +'<span class="badge '+statusBadgeClass(o.status)+'">'+statusLabel(o.status)+'</span>'
      +'</div>'
      +'<p style="font-size:0.9rem;color:#666;margin-bottom:5px;"><i class="fa-solid fa-user"></i> '+escHtml(o.customer_name)+' &lt;'+escHtml(o.customer_email)+'&gt;</p>'
      +'<p style="font-size:0.85rem;color:#888;margin-bottom:8px;">'+itemsList+'</p>'
      +cancelNote
      +'<div class="venta-meta"><span>'+formatDateFull(o.created_at)+'</span><span class="monto">'+formatPrice(o.total)+'</span></div>'
      +(btns ? '<div class="venta-actions">'+btns+'</div>' : (isFinal?'<p style="font-size:0.8rem;color:#aaa;margin-top:8px;"><i class="fa-solid fa-lock"></i> Estado final</p>':''))
      +'</div>';
  }).join('');
}

function promptCancelOrder(id) {
  var reason = window.prompt('Motivo de cancelación (el cliente lo verá):');
  if (reason === null) return;
  if (!reason.trim()) { showAdminToast('El motivo no puede estar vacío', 'error'); return; }
  updateOrderStatus(id, 'cancelled', reason.trim());
}

async function updateOrderStatus(id, status, cancelReason) {
  var body = { id: id, status: status };
  if (cancelReason) body.cancel_reason = cancelReason;
  var res = await api('orders', { method: 'PATCH', body: body });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Estado actualizado: '+statusLabel(status), 'success');
  await loadAllData(); renderOrders(); renderDashboard();
}

// ================= QUOTES =================
function renderQuotes() {
  var container = document.getElementById('quotesContainer');
  if (!container) return;
  var quotes = AdminApp.data.quotes;
  if (!quotes.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fa-solid fa-file-invoice" style="font-size:3rem;margin-bottom:15px;display:block;"></i>No hay cotizaciones aún.</div>'; return; }

  container.innerHTML = quotes.map(function(q) {
    return '<div class="venta-card '+q.status+'">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
      + '<h3><i class="fa-solid fa-file-invoice-dollar"></i> '+getProjectTypeName(q.project_type)+'</h3>'
      + '<span class="badge '+quoteStatusBadgeClass(q.status)+'">'+quoteStatusLabel(q.status)+'</span>'
      + '</div>'
      + '<p style="font-size:0.9rem;color:#666;margin-bottom:5px;"><i class="fa-solid fa-user"></i> '+q.customer_name+'</p>'
      + '<p style="font-size:0.85rem;color:#666;margin-bottom:8px;"><i class="fa-solid fa-envelope"></i> '+q.customer_email+(q.customer_phone?'  <i class="fa-solid fa-phone"></i> '+q.customer_phone:'')+'</p>'
      + '<p style="font-size:0.85rem;color:#555;margin-bottom:8px;">'+q.description.substring(0,150)+(q.description.length>150?'...':'')+'</p>'
      + (q.budget_range?'<p style="font-size:0.8rem;color:#888;"><i class="fa-solid fa-coins"></i> Presupuesto: '+q.budget_range+(q.deadline?' · Plazo: '+q.deadline:'')+'</p>':'')
      + '<div style="margin:12px 0;">'
      + '<input id="amt-'+q.id+'" type="number" placeholder="Monto cotizado ($)" style="padding:8px;border:2px solid #e0e0e0;border-radius:8px;width:100%;margin-bottom:8px;font-family:Inter,sans-serif;"'+(q.quote_amount?' value="'+q.quote_amount+'"':'')+'>'
      + '<textarea id="notes-'+q.id+'" rows="2" placeholder="Notas para el cliente (opcional)" style="padding:8px;border:2px solid #e0e0e0;border-radius:8px;width:100%;font-family:Inter,sans-serif;resize:vertical;">'+( q.admin_notes||'')+'</textarea>'
      + '</div>'
      + '<div class="venta-actions">'
      + ['reviewing','quoted','accepted','rejected'].filter(function(s){ return s!==q.status; }).map(function(s) {
          return '<button class="btn btn-sm '+quoteStatusBtnClass(s)+'" onclick="updateQuoteStatus(\''+q.id+'\',\''+s+'\')">'+quoteStatusLabel(s)+'</button>';
        }).join('')
      + '</div></div>';
  }).join('');
}

async function updateQuoteStatus(id, status) {
  var notesEl  = document.getElementById('notes-'+id);
  var amtEl    = document.getElementById('amt-'+id);
  var notes    = notesEl  ? notesEl.value.trim()  || null : null;
  var amount   = amtEl    ? parseInt(amtEl.value) || null : null;
  var res = await api('quotes', { method: 'PATCH', body: { id, status, admin_notes: notes, quote_amount: amount } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Cotización actualizada: '+quoteStatusLabel(status), 'success');
  await loadAllData();
  renderQuotes();
  renderDashboard();
}

// ================= MESSAGES =================
function renderMessages() {
  var container = document.getElementById('messagesContainer');
  if (!container) return;
  var msgs = AdminApp.data.messages;
  if (!msgs.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fa-solid fa-envelope-open" style="font-size:3rem;margin-bottom:15px;display:block;"></i>No hay mensajes aún.</div>'; return; }

  container.innerHTML = msgs.map(function(m) {
    return '<div class="venta-card" style="border-left-color:'+(m.is_read?'#10B981':'#F97316')+'">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
      + '<h3><i class="fa-solid fa-envelope"></i> '+escHtml(m.subject||'Sin asunto')+'</h3>'
      + (m.is_read?'<span class="badge badge-success">Leído</span>':'<span class="badge badge-warning">Nuevo</span>')
      + '</div>'
      + '<p style="font-size:0.9rem;color:#666;margin-bottom:5px;"><i class="fa-solid fa-user"></i> '+escHtml(m.name)+' &lt;'+escHtml(m.email)+'&gt;</p>'
      + '<p style="font-size:0.9rem;color:#444;background:#f9f9f9;padding:12px;border-radius:8px;margin:10px 0;line-height:1.6;">'+escHtml(m.message)+'</p>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;">'
      + '<small style="color:#aaa;">'+formatDateFull(m.created_at)+'</small>'
      + '<div class="table-actions">'
      + (m.is_read?'':'<button class="btn-view" onclick="markMessageRead(\''+m.id+'\')"><i class="fa-solid fa-check"></i> Marcar leído</button>')
      + '<a href="mailto:'+escHtml(m.email)+'?subject=Re:+'+encodeURIComponent(m.subject||'Tu mensaje')+'" class="btn btn-sm btn-azul" style="text-decoration:none;"><i class="fa-solid fa-reply"></i> Responder</a>'
      + '<button class="btn-delete" onclick="deleteMessage(\''+m.id+'\')"><i class="fa-solid fa-trash"></i></button>'
      + '</div></div></div>';
  }).join('');
}

async function markMessageRead(id) {
  var res = await api('messages', { method: 'PATCH', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  await loadAllData();
  renderMessages();
  renderDashboard();
}

async function deleteMessage(id) {
  if (!confirm('¿Eliminar este mensaje?')) return;
  var res = await api('messages', { method: 'DELETE', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Mensaje eliminado', 'success');
  await loadAllData();
  renderMessages();
  renderDashboard();
}

// ================= REVIEWS =================
function renderReviews() {
  var container = document.getElementById('reviewsAdminContainer');
  if (!container) return;
  var reviews = AdminApp.data.reviews;
  if (!reviews.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fa-solid fa-star" style="font-size:3rem;margin-bottom:15px;display:block;"></i>No hay reseñas aún.</div>'; return; }

  var pending  = reviews.filter(function(r){ return !r.is_approved; });
  var approved = reviews.filter(function(r){ return  r.is_approved; });

  var html = '';
  if (pending.length) {
    html += '<div style="grid-column:1/-1;margin-bottom:5px;"><h3 style="color:var(--naranja);font-size:1rem;"><i class="fa-solid fa-clock"></i> Pendientes de aprobación ('+pending.length+')</h3></div>';
    html += pending.map(buildReviewCard).join('');
    html += '<div style="grid-column:1/-1;border-top:2px solid #f0f0f0;margin:15px 0;"></div>';
  }
  if (approved.length) {
    html += '<div style="grid-column:1/-1;margin-bottom:5px;"><h3 style="color:var(--verde);font-size:1rem;"><i class="fa-solid fa-check-circle"></i> Aprobadas ('+approved.length+')</h3></div>';
    html += approved.map(buildReviewCard).join('');
  }
  container.innerHTML = html;
}

function buildReviewCard(r) {
  var stars = '';
  for (var i=0;i<5;i++) stars += '<i class="fa-solid fa-star" style="color:'+(i<r.rating?'#F59E0B':'#e0e0e0')+'"></i>';
  return '<div class="venta-card" style="border-left-color:'+(r.is_approved?'#10B981':'#F59E0B')+'">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
    + '<h3>'+stars+'</h3>'
    + (r.is_approved?'<span class="badge badge-success">Aprobada</span>':'<span class="badge badge-warning">Pendiente</span>')
    + '</div>'
    + '<p style="font-size:0.9rem;color:#666;margin-bottom:5px;"><i class="fa-solid fa-user"></i> '+escHtml(r.customer_name)+(r.service_type?' · <small>'+escHtml(r.service_type)+'</small>':'')+'</p>'
    + '<p style="font-size:0.9rem;color:#444;background:#f9f9f9;padding:12px;border-radius:8px;margin:10px 0;line-height:1.6;">"'+escHtml(r.comment)+'"</p>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    + '<small style="color:#aaa;">'+formatDateFull(r.created_at)+'</small>'
    + '<div class="table-actions">'
    + (r.is_approved?'':'<button class="btn-view" onclick="approveReview(\''+r.id+'\')"><i class="fa-solid fa-check"></i> Aprobar</button>')
    + '<button class="btn-delete" onclick="deleteReview(\''+r.id+'\')"><i class="fa-solid fa-trash"></i> Eliminar</button>'
    + '</div></div></div>';
}

async function approveReview(id) {
  var res = await api('reviews', { method: 'PATCH', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Reseña aprobada y publicada', 'success');
  await loadAllData();
  renderReviews();
  renderDashboard();
}

async function deleteReview(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  var res = await api('reviews', { method: 'DELETE', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Reseña eliminada', 'success');
  await loadAllData();
  renderReviews();
}

// ================= PROMOS =================
function renderPromos() {
  var body = document.getElementById('promosTableBody');
  if (!body) return;
  var ps = AdminApp.data.promos;
  if (!ps.length) { body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#999;">No hay promociones.</td></tr>'; return; }
  body.innerHTML = ps.map(function(p) {
    var val = p.discount_type==='percentage' ? p.discount_value+'%' : formatPrice(p.discount_value);
    var vigencia = (p.start_date || p.end_date)
      ? (p.start_date?formatDate(p.start_date):'Siempre') + ' → ' + (p.end_date?formatDate(p.end_date):'Siempre')
      : 'Sin límite';
    var estado = p.is_active ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>';
    var usos = (p.usage_count||0) + (p.usage_limit?' / '+p.usage_limit : '');
    return '<tr>'
      + '<td><strong>'+escHtml(p.title)+'</strong><br><small style="color:#888;">'+escHtml(p.description||'')+'</small></td>'
      + '<td><code style="background:#f0f0f0;padding:3px 8px;border-radius:5px;">'+escHtml(p.code||'')+'</code></td>'
      + '<td>'+val+'</td>'
      + '<td>'+vigencia+'</td>'
      + '<td>'+usos+'</td>'
      + '<td>'+estado+'</td>'
      + '<td><div class="table-actions">'
      + '<button class="btn-edit" onclick="openEditPromo('+JSON.stringify(p)+')" style="background:#F59E0B;"><i class="fa-solid fa-pen"></i> Editar</button>'
      + '<button class="btn-hide" onclick="togglePromoStatus(\''+p.id+'\','+p.is_active+')"><i class="fa-solid fa-toggle-'+(p.is_active?'on':'off')+'"></i> '+(p.is_active?'Desactivar':'Activar')+'</button>'
      + '<button class="btn-delete" onclick="deletePromo(\''+p.id+'\')"><i class="fa-solid fa-trash"></i></button>'
      + '</div></td></tr>';
  }).join('');
}

async function submitNewPromo(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creando...'; }
  var res = await api('promotions', {
    method: 'POST',
    body: {
      title:          document.getElementById('promoTitle').value,
      description:    document.getElementById('promoDesc').value  || null,
      discount_type:  document.getElementById('promoType').value,
      discount_value: parseInt(document.getElementById('promoValue').value),
      code:           document.getElementById('promoCode').value,
      start_date:     document.getElementById('promoStart').value || null,
      end_date:       document.getElementById('promoEnd').value   || null,
      usage_limit:    parseInt(document.getElementById('promoLimit').value) || null
    }
  });
  if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-save"></i> Crear Promoción'; }
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Promoción creada', 'success');
  e.target.reset();
  var pm = await api('promotions');
  AdminApp.data.promos = pm.promotions || [];
  renderPromos();
}

async function togglePromoStatus(id, current) {
  var res = await api('promotions', { method: 'PATCH', body: { id, is_active: !current } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Promoción actualizada', 'success');
  var pm = await api('promotions');
  AdminApp.data.promos = pm.promotions || [];
  renderPromos();
}

async function deletePromo(id) {
  if (!confirm('¿Eliminar esta promoción?')) return;
  var res = await api('promotions', { method: 'DELETE', body: { id } });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Promoción eliminada', 'success');
  var pm = await api('promotions');
  AdminApp.data.promos = pm.promotions || [];
  renderPromos();
}

// ================= STATS =================
function renderStats() {
  var s = AdminApp.data.stats;
  var orders = AdminApp.data.orders;
  setText('statSales',          formatPrice(s.totalSales || 0));
  setText('statOrders',         s.totalOrders   || 0);
  setText('statProductsActive', s.activeProducts|| 0);
  setText('statPending',        s.pendingOrders || 0);

  renderSalesChart();
}

function updateStats() { renderStats(); }

function renderSalesChart() {
  var canvas = document.getElementById('salesChart');
  if (!canvas) return;
  var period = (document.getElementById('periodSelector')||{}).value || 'month';
  var orders = AdminApp.data.orders;

  var labels = [], values = [];
  var now = new Date();

  if (period === 'week') {
    for (var d=6;d>=0;d--) {
      var day = new Date(now); day.setDate(now.getDate()-d);
      var label = day.toLocaleDateString('es-CO', { weekday:'short', day:'numeric' });
      var total = orders.filter(function(o) {
        var od = new Date(o.created_at);
        return od.toDateString() === day.toDateString();
      }).reduce(function(s,o){ return s+(o.total||0); }, 0);
      labels.push(label); values.push(total);
    }
  } else if (period === 'month') {
    var daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    for (var d=1;d<=daysInMonth;d++) {
      labels.push(d);
      var total = orders.filter(function(o) {
        var od = new Date(o.created_at);
        return od.getMonth()===now.getMonth() && od.getDate()===d && od.getFullYear()===now.getFullYear();
      }).reduce(function(s,o){ return s+(o.total||0); }, 0);
      values.push(total);
    }
  } else {
    var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    for (var m=0;m<12;m++) {
      labels.push(months[m]);
      var total = orders.filter(function(o) {
        var od = new Date(o.created_at);
        return od.getMonth()===m && od.getFullYear()===now.getFullYear();
      }).reduce(function(s,o){ return s+(o.total||0); }, 0);
      values.push(total);
    }
  }

  if (AdminApp.chart) { AdminApp.chart.destroy(); AdminApp.chart = null; }
  AdminApp.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label:'Ventas ($)', data: values, backgroundColor:'rgba(37,99,235,0.7)', borderColor:'#2563EB', borderWidth:1, borderRadius:6 }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{ display:false } },
      scales: {
        y: { beginAtZero:true, ticks:{ callback:function(v){ return '$'+v.toLocaleString('es-CO'); } } }
      }
    }
  });
}

// ================= HELPERS =================
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.innerText = val;
}

function formatPrice(p) { return '$'+Number(p).toLocaleString('es-CO'); }
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO', { day:'numeric', month:'short' });
}
function formatDateFull(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('es-CO', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function statusLabel(s) {
  return ({pending:'Pendiente', confirmed:'Confirmado', in_progress:'En Desarrollo', delivered:'Entregado', cancelled:'Cancelado'})[s] || s;
}
function statusBadgeClass(s) {
  return ({pending:'badge-warning', confirmed:'badge-info', in_progress:'badge-info', delivered:'badge-success', cancelled:'badge-danger'})[s] || 'badge-secondary';
}
function statusBtnClass(s) {
  return ({pending:'btn-naranja', confirmed:'btn-azul', in_progress:'btn-azul', delivered:'btn-verde', cancelled:'btn-rojo'})[s] || '';
}
function statusOptions(all, current) {
  return all.filter(function(s){ return s !== current; });
}
function quoteStatusLabel(s) {
  return ({pending:'Pendiente', reviewing:'Revisando', quoted:'Cotizado', accepted:'Aceptado', rejected:'Rechazado'})[s] || s;
}
function quoteStatusBadgeClass(s) {
  return ({pending:'badge-warning', reviewing:'badge-info', quoted:'badge-info', accepted:'badge-success', rejected:'badge-danger'})[s] || 'badge-secondary';
}
function quoteStatusBtnClass(s) {
  return ({reviewing:'btn-azul', quoted:'btn-naranja', accepted:'btn-verde', rejected:'btn-rojo'})[s] || '';
}
function getProjectTypeName(t) {
  return ({landing:'Landing Page', ecommerce:'Tienda Virtual', corporativa:'Web Corporativa', reservas:'Sistema de Reservas', inventario:'Sistema de Inventario', blog:'Blog/Web Educativa', dashboard:'App Web/Dashboard', portafolio:'Portafolio', otro:'Proyecto Personalizado'})[t] || t;
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showAdminToast(msg, type) {
  var c = document.getElementById('adminToastContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'adminToastContainer';
    c.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(c);
  }
  var t = document.createElement('div');
  var colors = { success:'#10B981', error:'#EF4444', info:'#2563EB' };
  var icons  = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info' };
  t.style.cssText = 'background:'+( colors[type]||'#2563EB')+';color:white;padding:12px 20px;border-radius:10px;font-size:0.9rem;display:flex;align-items:center;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.2);max-width:320px;';
  t.innerHTML = '<i class="fa-solid '+(icons[type]||'fa-circle-info')+'"></i><span>'+escHtml(msg)+'</span>';
  c.appendChild(t);
  setTimeout(function() {
    t.style.transition = 'all 0.3s ease'; t.style.opacity = '0'; t.style.transform = 'translateX(100%)';
    setTimeout(function(){ t.remove(); }, 300);
  }, 4000);
}

// ================= EDITAR PROMO =================
function openEditPromo(p) {
  document.getElementById('editPromoId').value          = p.id;
  document.getElementById('editPromoTitle').value       = p.title || '';
  document.getElementById('editPromoDesc').value        = p.description || '';
  document.getElementById('editPromoType').value        = p.discount_type || 'percentage';
  document.getElementById('editPromoValue').value       = p.discount_value || '';
  document.getElementById('editPromoCode').value        = p.code || '';
  document.getElementById('editPromoLimit').value       = p.usage_limit || '';
  document.getElementById('editPromoStart').value       = p.start_date ? p.start_date.slice(0,10) : '';
  document.getElementById('editPromoEnd').value         = p.end_date   ? p.end_date.slice(0,10)   : '';
  document.getElementById('editPromoModal').style.display = 'flex';
}

function closeEditPromo() {
  document.getElementById('editPromoModal').style.display = 'none';
}

async function saveEditPromo(e) {
  if (e) e.preventDefault();
  var id = document.getElementById('editPromoId').value;
  var res = await api('promotions', {
    method: 'PATCH',
    body: {
      id,
      title:          document.getElementById('editPromoTitle').value,
      description:    document.getElementById('editPromoDesc').value  || null,
      discount_type:  document.getElementById('editPromoType').value,
      discount_value: parseInt(document.getElementById('editPromoValue').value),
      code:           document.getElementById('editPromoCode').value,
      usage_limit:    parseInt(document.getElementById('editPromoLimit').value) || null,
      start_date:     document.getElementById('editPromoStart').value || null,
      end_date:       document.getElementById('editPromoEnd').value   || null
    }
  });
  if (res.error) { showAdminToast('Error: '+res.error, 'error'); return; }
  showAdminToast('Promoción actualizada', 'success');
  closeEditPromo();
  var pm = await api('promotions');
  AdminApp.data.promos = pm.promotions || [];
  renderPromos();
}
