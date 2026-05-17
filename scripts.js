// ============================================================
// FORSYNC — SCRIPTS PRINCIPALES v2.0
// Backend: Vercel Functions + Neon Postgres
// Sin dependencia de Supabase
// ============================================================

// ================= CONFIG =================
var CONFIG = {
  PAYPAL_CLIENT_ID: 'EGjPYlSTAuK1D7YbOgC0MnDxW00zCVcoaBwuN6LsnAOl3VIZdR-BCqdMn4YQSNpJA5SlutQEzXBxgebO'
};

// ================= ESTADO GLOBAL =================
var App = {
  cart: [],
  user: null,          // { id, email, name, role }
  products: [],
  reviews: [],
  promotions: [],
  currentService: null,
  promoDiscount: 0,
  promoFixed: 0,
  appliedCode: null,
  checkoutTotal: 0,
  paypalLoaded: false,

  // Fallback local si la API no responde
  localProducts: [
    { id:'lp-001', name:'Landing Page Profesional', slug:'landing-page', category:'web', price:350000,
      description:'Página de aterrizaje para convertir visitantes en clientes. Diseño responsive, formulario de contacto, analytics y SEO básico.',
      features:['Diseño responsive','Hasta 3 secciones','Formulario de contacto','Google Analytics','SEO básico','1 ronda de revisiones','Código fuente incluido'],
      delivery_days:7, image:'fa-solid fa-rocket', sort_order:1 },
    { id:'tv-001', name:'Tienda Virtual Básica', slug:'tienda-virtual-basica', category:'ecommerce', price:900000,
      description:'Tienda online completa con catálogo, carrito y panel admin.',
      features:['50 productos','Carrito de compras','Panel admin','Pasarela de pagos','Diseño responsive','2 rondas de revisiones'],
      delivery_days:14, image:'fa-solid fa-cart-shopping', sort_order:2 },
    { id:'tv-002', name:'Tienda Virtual Premium', slug:'tienda-virtual-premium', category:'ecommerce', price:1800000,
      description:'E-commerce avanzado con filtros, wishlist, múltiples pagos y reportes.',
      features:['Productos ilimitados','Filtros y búsqueda','Múltiples pagos','Reportes en tiempo real','3 rondas de revisiones'],
      delivery_days:21, image:'fa-solid fa-gem', sort_order:3 },
    { id:'wc-001', name:'Web Corporativa', slug:'web-corporativa', category:'web', price:600000,
      description:'Sitio profesional de empresa hasta 5 páginas con diseño moderno.',
      features:['5 páginas','Diseño personalizado','SEO completo','Galería de imágenes','2 rondas de revisiones'],
      delivery_days:10, image:'fa-solid fa-building', sort_order:4 },
    { id:'sr-001', name:'Sistema de Reservas', slug:'sistema-reservas', category:'app', price:1200000,
      description:'Reservas online con calendario interactivo y pagos integrados.',
      features:['Calendario en tiempo real','Email/SMS automático','Pagos integrados','Panel admin completo'],
      delivery_days:18, image:'fa-solid fa-calendar-check', sort_order:5 },
    { id:'si-001', name:'Sistema de Inventario', slug:'sistema-inventario', category:'app', price:1500000,
      description:'Control de stock, alertas, proveedores y reportes detallados.',
      features:['Stock en tiempo real','Alertas de inventario','Códigos QR','Reportes PDF/Excel'],
      delivery_days:21, image:'fa-solid fa-boxes-stacked', sort_order:6 },
    { id:'bp-001', name:'Blog Personalizado', slug:'blog-personalizado', category:'web', price:480000,
      description:'Blog con CMS, categorías, comentarios moderados y newsletter.',
      features:['Editor intuitivo','Categorías y etiquetas','Comentarios moderados','Newsletter'],
      delivery_days:10, image:'fa-solid fa-pen-nib', sort_order:7 },
    { id:'aw-001', name:'App Web Dashboard', slug:'app-web-dashboard', category:'app', price:1600000,
      description:'Aplicación web con dashboard, gráficos, roles y reportes exportables.',
      features:['Dashboard con gráficos','Roles y permisos','API REST','Reportes exportables'],
      delivery_days:25, image:'fa-solid fa-chart-line', sort_order:8 },
    { id:'pc-001', name:'Portafolio Creativo', slug:'portafolio-creativo', category:'web', price:380000,
      description:'Portafolio para creativos con galería y animaciones modernas.',
      features:['Galería con filtros','Animaciones suaves','Sobre mí personalizable','Contacto integrado'],
      delivery_days:7, image:'fa-solid fa-palette', sort_order:9 },
    { id:'we-001', name:'Web Educativa / Cursos', slug:'web-educativa', category:'web', price:1100000,
      description:'Plataforma educativa con módulos, quizzes y certificados automáticos.',
      features:['Módulos y lecciones','Quizzes interactivos','Certificados','Panel de instructor'],
      delivery_days:18, image:'fa-solid fa-graduation-cap', sort_order:10 }
  ],

  localReviews: [
    { customer_name:'María González', rating:5, comment:'Excelente trabajo en mi landing page. Jesús fue muy profesional y entregó antes del plazo.', service_type:'Landing Page Profesional' },
    { customer_name:'Carlos Ruiz', rating:5, comment:'Mi tienda virtual quedó increíble. El sistema de pagos funciona perfecto.', service_type:'Tienda Virtual Básica' },
    { customer_name:'Ana Martínez', rating:4, comment:'Muy buen sistema de reservas para mi salón. Las notificaciones automáticas mejoraron mi organización.', service_type:'Sistema de Reservas' },
    { customer_name:'Pedro López', rating:5, comment:'ForSync desarrolló nuestro sistema de inventario. Soporte excelente.', service_type:'Sistema de Inventario' },
    { customer_name:'Laura Torres', rating:5, comment:'La web corporativa quedó exactamente como la imaginé. Totalmente recomendado.', service_type:'Web Corporativa' }
  ],

  faqs: [
    { q:'¿Cuánto tarda el desarrollo?', a:'Una landing page en 5-7 días, una tienda virtual en 2-3 semanas, y proyectos más complejos en 3-4 semanas. Siempre con cronograma claro desde el inicio.' },
    { q:'¿Los precios incluyen hosting y dominio?', a:'No, los precios son solo por el desarrollo. Te asesoramos sobre las mejores opciones de hosting según tu proyecto.' },
    { q:'¿Qué métodos de pago aceptan?', a:'PayPal (tarjetas de crédito/débito), transferencia bancaria y consignación. Para proyectos grandes: 50% anticipo y 50% al entregar.' },
    { q:'¿Puedo solicitar modificaciones?', a:'Sí, incluimos revisiones según el plan. Ofrecemos soporte técnico post-entrega y mantenimiento mensual.' },
    { q:'¿Entregan el código fuente?', a:'Sí, siempre. Tú eres el dueño total de tu proyecto.' },
    { q:'¿Ofrecen garantía?', a:'30 días de garantía de funcionamiento. Si hay algún bug lo corregimos sin costo adicional.' },
    { q:'¿Cómo empiezo?', a:'Elige un servicio o solicita cotización. Agendamos una llamada, firmamos acuerdo y comenzamos. ¡Hoy mismo!' }
  ]
};

// ================= API HELPER =================
async function api(path, opts) {
  opts = opts || {};
  try {
    var res = await fetch('/api/' + path, {
      method:  opts.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
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
  var loader = document.getElementById('pageLoader');
  function hideLoader() {
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(function() { loader && loader.remove(); }, 700);
    }
  }

  // Manejar errores OAuth en URL
  var params = new URLSearchParams(window.location.search);
  if (params.get('error')) {
    var msgs = {
      oauth_denied:   'Inicio de sesión cancelado.',
      oauth_failed:   'Error en el inicio de sesión con Google. Intenta de nuevo.',
      invalid_state:  'Error de seguridad en OAuth. Intenta de nuevo.'
    };
    showToast(msgs[params.get('error')] || 'Error de autenticación', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }

  try {
    await initAuth();
    await loadData();
    initCart();
    initNavigation();
    initNavbarScroll();
    renderServices();
    renderFeatured();
    renderReviews();
    renderFAQs();
    initFilterChips();
    initQuoteForm();
    initContactForm();
    initPromoBanner();
    initStarRating();
  } catch(e) {
    console.error('Init error:', e);
  } finally {
    hideLoader();
  }

  document.addEventListener('click', function(e) {
    var menu = document.querySelector('.user-menu-container');
    var drop = document.getElementById('userDropdown');
    if (menu && drop && !menu.contains(e.target)) drop.classList.remove('active');
  });
});

// ================= AUTH =================
async function initAuth() {
  var data = await api('auth?action=me');
  if (data && data.user) {
    App.user = data.user;
  }
  updateAuthUI();
}

function updateAuthUI() {
  var userIconBtn  = document.getElementById('userIconBtn');
  var userNameDisp = document.getElementById('userNameDisplay');
  var linkLogin    = document.getElementById('linkLogin');
  var linkPerfil   = document.getElementById('linkPerfil');
  var linkAdmin    = document.getElementById('linkAdmin');
  var linkLogout   = document.getElementById('linkLogout');

  if (App.user) {
    var name = App.user.name || App.user.email.split('@')[0];
    if (userIconBtn)  userIconBtn.classList.add('logged-in');
    if (userNameDisp) userNameDisp.innerText = name;
    if (linkLogin)    linkLogin.style.display  = 'none';
    if (linkLogout)   linkLogout.style.display  = 'block';
    if (linkAdmin)    linkAdmin.style.display   = App.user.role === 'admin' ? 'block' : 'none';
    if (linkPerfil)   linkPerfil.style.display  = 'block';
  } else {
    if (userIconBtn)  userIconBtn.classList.remove('logged-in');
    if (userNameDisp) userNameDisp.innerText = 'Entrar';
    if (linkLogin)    linkLogin.style.display  = 'block';
    if (linkPerfil)   linkPerfil.style.display = 'none';
    if (linkAdmin)    linkAdmin.style.display   = 'none';
    if (linkLogout)   linkLogout.style.display  = 'none';
  }
}

function toggleUserMenu() {
  var d = document.getElementById('userDropdown');
  if (d) d.classList.toggle('active');
}

function toggleMobileMenu() {
  var n = document.getElementById('navLinks');
  if (n) n.classList.toggle('active');
}

async function cerrarSesion() {
  await api('auth?action=logout', { method: 'POST' });
  App.user = null;
  App.cart = []; saveCart(); updateCartUI();
  updateAuthUI();
  showToast('Sesión cerrada', 'info');
  showSection('inicio');
}

// ================= DATA =================
async function loadData() {
  var [pr, rv, pm] = await Promise.all([
    api('products'),
    api('reviews'),
    api('promotions')
  ]);
  App.products   = (pr.products   && pr.products.length)   ? pr.products   : App.localProducts;
  App.reviews    = (rv.reviews    && rv.reviews.length)    ? rv.reviews    : App.localReviews;
  App.promotions = (pm.promotions && pm.promotions.length) ? pm.promotions : [];
}

// ================= CART =================
function initCart() {
  App.cart = JSON.parse(localStorage.getItem('forsync_cart') || '[]');
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('forsync_cart', JSON.stringify(App.cart));
}

function toggleCart() {
  var d = document.getElementById('cartDrawer');
  var o = document.getElementById('cartOverlay');
  if (d) d.classList.toggle('active');
  if (o) o.classList.toggle('active');
}

function addToCart(productId, qty) {
  qty = qty || 1;
  var product = App.products.find(function(p) { return p.id === productId || p.slug === productId; });
  if (!product) return;
  var existing = App.cart.find(function(i) { return i.id === product.id; });
  var effectivePrice = product.promo_price || product.price;
  if (existing) { existing.qty += qty; }
  else { App.cart.push(Object.assign({}, product, { qty: qty, price: effectivePrice, original_price: product.price })); }
  saveCart(); updateCartUI();
  showToast(product.name + ' agregado al carrito', 'success');
}

function removeFromCart(productId) {
  App.cart = App.cart.filter(function(i) { return i.id !== productId; });
  saveCart(); updateCartUI();
}

function updateQty(productId, delta) {
  var item = App.cart.find(function(i) { return i.id === productId; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId); return; }
  saveCart(); updateCartUI();
}

function updateCartUI() {
  var cartBody  = document.getElementById('cartBody');
  var cartCount = document.querySelector('.cart-count');
  var cartTotal = document.getElementById('cartTotal');
  var totalItems = 0, totalPrice = 0;
  App.cart.forEach(function(i) { totalItems += i.qty; totalPrice += i.price * i.qty; });
  if (cartCount) { cartCount.innerText = totalItems; cartCount.style.display = totalItems > 0 ? 'flex' : 'none'; }
  if (cartTotal) cartTotal.innerText = formatPrice(totalPrice);
  if (!cartBody) return;
  if (!App.cart.length) {
    cartBody.innerHTML = '<div class="cart-empty"><i class="fa-solid fa-cart-arrow-down"></i><p>Tu carrito está vacío</p></div>';
    return;
  }
  var html = '';
  App.cart.forEach(function(item) {
    html += '<div class="cart-item">';
    html += '<div class="cart-item-icon"><i class="' + (item.image||'fa-solid fa-code') + '"></i></div>';
    html += '<div class="cart-item-info"><h4>' + item.name + '</h4><p>' + formatPrice(item.price) + '</p>';
    html += '<div class="cart-item-actions">';
    html += '<button onclick="updateQty(\'' + item.id + '\',-1)"><i class="fa-solid fa-minus"></i></button>';
    html += '<span>' + item.qty + '</span>';
    html += '<button onclick="updateQty(\'' + item.id + '\',1)"><i class="fa-solid fa-plus"></i></button>';
    html += '</div></div>';
    html += '<i class="fa-solid fa-trash cart-item-remove" onclick="removeFromCart(\'' + item.id + '\')"></i>';
    html += '</div>';
  });
  cartBody.innerHTML = html;
}

function proceedToCheckout() {
  if (!App.cart.length) { showToast('Tu carrito está vacío', 'error'); return; }
  if (!App.user) {
    showToast('Debes iniciar sesión para realizar una compra', 'error');
    toggleCart();
    setTimeout(function() { window.location.href = 'login.html'; }, 1200);
    return;
  }
  toggleCart();
  showSection('checkout');
}

function formatPrice(p) { return '$' + Number(p).toLocaleString('es-CO'); }

// ================= NAVIGATION =================
function initNavigation() {
  document.querySelectorAll('[data-section]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      var sec = this.dataset.section;
      showSection(sec);
      document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active'); });
      if (this.classList.contains('nav-links') || this.closest('.nav-links')) this.classList.add('active');
      var nav = document.getElementById('navLinks');
      if (nav) nav.classList.remove('active');
      window.scrollTo({ top:0, behavior:'smooth' });
    });
  });
  var hash = window.location.hash.replace('#','');
  if (['servicios','cotizar','nosotros','contacto','faqs','perfil','checkout'].includes(hash)) showSection(hash);
}

function showSection(id) {
  document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
  var target = document.getElementById('sec-' + id);
  if (target) { target.classList.add('active'); history.replaceState(null,'','#'+id); }
  if (id === 'servicios') renderServices();
  if (id === 'detalle')   renderServiceDetail();
  if (id === 'checkout')  { resetCheckout(); renderCheckout(); initCheckoutForm(); }
  if (id === 'perfil')    renderProfile();
}

function initNavbarScroll() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', function() {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

function scrollCarousel(dir) {
  var c = document.getElementById('carouselFeatured');
  if (c) c.scrollBy({ left: 320*dir, behavior:'smooth' });
}

// ================= RENDER SERVICES =================
var Filters = { cat: '', minPrice: 0, maxPrice: 0, promoOnly: false };

function initFilterChips() {
  document.querySelectorAll('.filter-chips .chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.filter-chips .chip').forEach(function(c){ c.classList.remove('active'); });
      this.classList.add('active');
      Filters.cat = this.dataset.cat;
      applyFilters();
    });
  });
}

function applyFilters() {
  var minEl   = document.getElementById('filterMinPrice');
  var maxEl   = document.getElementById('filterMaxPrice');
  var promoEl = document.getElementById('filterPromo');
  Filters.minPrice  = minEl   ? (parseInt(minEl.value)   || 0)     : 0;
  Filters.maxPrice  = maxEl   ? (parseInt(maxEl.value)   || 0)     : 0;
  Filters.promoOnly = promoEl ? promoEl.checked : false;
  renderServices();
}

function resetFilters() {
  Filters = { cat: '', minPrice: 0, maxPrice: 0, promoOnly: false };
  var minEl   = document.getElementById('filterMinPrice');
  var maxEl   = document.getElementById('filterMaxPrice');
  var promoEl = document.getElementById('filterPromo');
  if (minEl)   minEl.value    = '';
  if (maxEl)   maxEl.value    = '';
  if (promoEl) promoEl.checked = false;
  document.querySelectorAll('.filter-chips .chip').forEach(function(c){ c.classList.remove('active'); });
  var allChip = document.querySelector('.filter-chips .chip[data-cat=""]');
  if (allChip) allChip.classList.add('active');
  renderServices();
}

function renderServices() {
  var grid = document.getElementById('servicesGrid');
  if (!grid) return;

  var filtered = App.products.filter(function(p) {
    if (Filters.cat && p.category !== Filters.cat) return false;
    var effectivePrice = p.promo_price || p.price;
    if (Filters.minPrice > 0 && effectivePrice < Filters.minPrice) return false;
    if (Filters.maxPrice > 0 && effectivePrice > Filters.maxPrice) return false;
    if (Filters.promoOnly && !p.promo_price) return false;
    return true;
  });

  var html = '<div class="service-card quote-card" onclick="showSection(\'cotizar\')">'
    + '<div class="service-card-header"><div class="service-card-icon" style="background:rgba(255,255,255,0.15);color:white;"><i class="fa-solid fa-wand-magic-sparkles"></i></div><h3>Proyecto Personalizado</h3></div>'
    + '<div class="service-card-body"><p>¿Necesitas algo único? Cuéntanos tu idea y te enviamos una cotización a tu medida.</p>'
    + '<div class="service-features"><span>Desarrollo a medida</span><span>Consultoría técnica</span><span>Presupuesto flexible</span></div></div>'
    + '<div class="service-card-footer"><div class="service-price"><span class="from">Desde</span> Cotización</div>'
    + '<button class="btn btn-outline-white btn-sm">Cotizar Ahora</button></div></div>';

  if (filtered.length === 0) {
    html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">'
      + '<i class="fa-solid fa-filter" style="font-size:2rem;margin-bottom:10px;display:block;"></i>'
      + '<p>No hay servicios con esos filtros. <button onclick="resetFilters()" style="background:none;border:none;color:var(--azul-claro);cursor:pointer;text-decoration:underline;">Limpiar filtros</button></p></div>';
  } else {
    filtered.forEach(function(p) { html += buildServiceCard(p); });
  }
  grid.innerHTML = html;
}

function buildServiceCard(p) {
  var cls = { web:'purple', ecommerce:'salmon', app:'green' }[p.category] || 'blue';
  var feats = parseFeatures(p.features);
  var priceHtml = p.promo_price
    ? '<span class="from">Promo</span> <span class="price-promo">' + formatPrice(p.promo_price) + '</span> <span class="price-original">' + formatPrice(p.price) + '</span>'
    : '<span class="from">Desde</span> ' + formatPrice(p.price);
  return '<div class="service-card" onclick="showServiceDetail(\'' + p.slug + '\')">'
    + '<div class="service-card-header"><div class="service-card-icon ' + cls + '"><i class="' + (p.image||'fa-solid fa-code') + '"></i></div>'
    + (p.promo_price ? '<span class="promo-badge">PROMO</span>' : '')
    + '<h3>' + p.name + '</h3></div>'
    + '<div class="service-card-body"><p>' + p.description + '</p><div class="service-features">'
    + feats.slice(0,3).map(function(f){ return '<span>'+f+'</span>'; }).join('')
    + '</div></div><div class="service-card-footer">'
    + '<div class="service-price">' + priceHtml + ' <span class="note">Sin hosting ni dominio</span></div>'
    + '<button class="btn btn-azul btn-sm" onclick="event.stopPropagation();addToCart(\'' + p.id + '\')"><i class="fa-solid fa-cart-plus"></i> Agregar</button>'
    + '</div></div>';
}

function renderFeatured() {
  var c = document.getElementById('carouselFeatured');
  if (!c) return;
  c.innerHTML = App.products.slice(0,6).map(buildFeaturedCard).join('');
}

function buildFeaturedCard(p) {
  var priceHtml = p.promo_price
    ? '<span class="price-promo">' + formatPrice(p.promo_price) + '</span> <span class="price-original">' + formatPrice(p.price) + '</span>'
    : '<span class="from">Desde</span> ' + formatPrice(p.price);
  return '<div class="featured-card" onclick="showServiceDetail(\'' + p.slug + '\')">'
    + (p.promo_price ? '<span class="promo-badge" style="position:absolute;top:10px;right:10px;">PROMO</span>' : '')
    + '<div class="featured-img" style="position:relative;"><i class="' + (p.image||'fa-solid fa-code') + '"></i></div>'
    + '<div class="featured-info"><h4>' + p.name + '</h4>'
    + '<p class="price">' + priceHtml + '</p>'
    + '<button class="add-to-cart" onclick="event.stopPropagation();addToCart(\'' + p.id + '\')"><i class="fa-solid fa-cart-plus"></i> Agregar</button>'
    + '</div></div>';
}

function parseFeatures(f) {
  if (!f) return [];
  if (Array.isArray(f)) return f;
  try { return JSON.parse(f); } catch(e) { return []; }
}

// ================= SERVICE DETAIL =================
function showServiceDetail(slug) {
  App.currentService = App.products.find(function(p) { return p.slug === slug; });
  showSection('detalle');
}

function renderServiceDetail() {
  var container = document.getElementById('serviceDetail');
  var p = App.currentService || App.products[0];
  if (!container || !p) return;
  var feats = parseFeatures(p.features);
  var catName = { web:'Desarrollo Web', ecommerce:'E-Commerce', app:'Aplicación Web' }[p.category] || p.category;
  var priceHtml = p.promo_price
    ? '<span class="price-promo" style="font-size:2rem;font-weight:800;color:var(--salmon);">' + formatPrice(p.promo_price) + '</span>'
      + ' <span class="price-original" style="font-size:1.2rem;color:#aaa;text-decoration:line-through;margin-left:8px;">' + formatPrice(p.price) + '</span>'
      + ' <span class="promo-badge" style="margin-left:8px;">PROMO</span>'
    : '<span class="from">Desde</span> <strong style="font-size:2rem;">' + formatPrice(p.price) + '</strong>';

  container.innerHTML = '<div class="service-detail">'
    + '<div class="detail-icon"><i class="' + (p.image||'fa-solid fa-code') + '"></i></div>'
    + '<div class="detail-info">'
    + '<span class="detail-category">' + catName + '</span>'
    + '<h1>' + p.name + '</h1>'
    + '<div class="price" style="margin:15px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' + priceHtml + ' <span class="note" style="font-size:0.8rem;color:#999;">No incluye hosting ni dominio</span></div>'
    + '<p class="desc">' + p.description + '</p>'
    + '<div class="features-list"><h4><i class="fa-solid fa-list-check"></i> ¿Qué incluye?</h4><ul>'
    + feats.map(function(f){ return '<li><i class="fa-solid fa-check"></i> '+f+'</li>'; }).join('')
    + '</ul></div>'
    + '<div class="delivery-info"><i class="fa-solid fa-clock"></i> Entrega estimada: <strong>' + p.delivery_days + ' días hábiles</strong></div>'
    + '<div class="actions">'
    + '<button class="btn btn-azul" onclick="addToCart(\'' + p.id + '\')"><i class="fa-solid fa-cart-plus"></i> Agregar al Carrito</button>'
    + '<button class="btn btn-salmon" onclick="showSection(\'cotizar\')"><i class="fa-solid fa-file-invoice-dollar"></i> Solicitar Cotización</button>'
    + '</div></div></div>'
    + '<section class="on-fire" style="margin-top:3rem;">'
    + '<h2 style="color:var(--azul-oscuro);text-align:center;margin-bottom:2rem;">Otros Servicios</h2>'
    + '<div class="carousel-wrapper">'
    + '<button class="scroll-btn left" onclick="document.getElementById(\'carouselSimilar\').scrollBy({left:-320,behavior:\'smooth\'})"><i class="fa-solid fa-chevron-left"></i></button>'
    + '<div class="carousel" id="carouselSimilar">'
    + App.products.filter(function(x){ return x.id!==p.id; }).slice(0,5).map(buildFeaturedCard).join('')
    + '</div>'
    + '<button class="scroll-btn right" onclick="document.getElementById(\'carouselSimilar\').scrollBy({left:320,behavior:\'smooth\'})"><i class="fa-solid fa-chevron-right"></i></button>'
    + '</div></section>';
}
}

// ================= REVIEWS =================
function renderReviews() {
  var grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  var list = App.reviews.length ? App.reviews : App.localReviews;
  grid.innerHTML = list.map(function(r) {
    return '<div class="review-card">'
      + '<div class="review-stars">' + starsHtml(r.rating) + '</div>'
      + '<p>"' + r.comment + '"</p>'
      + '<div class="review-author">'
      + '<div class="review-author-avatar">' + r.customer_name.charAt(0) + '</div>'
      + '<div class="review-author-info"><h4>' + r.customer_name + '</h4><span>' + (r.service_type||'Cliente ForSync') + '</span></div>'
      + '</div></div>';
  }).join('');
}

function starsHtml(n) {
  var h = '';
  for (var i=0;i<5;i++) h += i<n ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  return h;
}

// ================= FAQs =================
function renderFAQs() {
  var c = document.getElementById('faqsContainer');
  if (!c) return;
  c.innerHTML = App.faqs.map(function(f,i) {
    return '<div class="faq-item">'
      + '<button class="faq-question" onclick="toggleFAQ('+i+')">' + f.q + '<i class="fa-solid fa-chevron-down"></i></button>'
      + '<div class="faq-answer" id="faq-' + i + '"><p>' + f.a + '</p></div>'
      + '</div>';
  }).join('');
}

function toggleFAQ(idx) {
  var ans = document.getElementById('faq-' + idx);
  document.querySelectorAll('.faq-answer.active').forEach(function(a) {
    if (a !== ans) { a.classList.remove('active'); if(a.previousElementSibling) a.previousElementSibling.classList.remove('active'); }
  });
  if (ans) { ans.classList.toggle('active'); if(ans.previousElementSibling) ans.previousElementSibling.classList.toggle('active'); }
}

// ================= QUOTE FORM =================
function initQuoteForm() {
  var form = document.getElementById('quoteForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'; }
    var data = {
      customer_name:  document.getElementById('quoteName').value,
      customer_email: document.getElementById('quoteEmail').value,
      customer_phone: document.getElementById('quotePhone').value || null,
      project_type:   document.getElementById('quoteType').value,
      description:    document.getElementById('quoteDesc').value,
      budget_range:   document.getElementById('quoteBudget').value || null,
      deadline:       document.getElementById('quoteDeadline').value || null
    };
    var res = await api('quotes', { method: 'POST', body: data });
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Cotización'; }
    if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
    showToast('¡Cotización enviada! Te contactaremos pronto.', 'success');
    form.reset();
  });
}

// ================= CONTACT FORM =================
function initContactForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'; }
    var data = {
      name:    document.getElementById('contactName').value,
      email:   document.getElementById('contactEmail').value,
      subject: document.getElementById('contactSubject').value || 'Sin asunto',
      message: document.getElementById('contactMessage').value
    };
    var res = await api('messages', { method: 'POST', body: data });
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Mensaje'; }
    if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
    showToast('¡Mensaje enviado! Respondemos en 24 horas.', 'success');
    form.reset();
  });
}

// ================= CHECKOUT =================
function resetCheckout() {
  var formEl  = document.getElementById('checkoutForm');
  var success = document.getElementById('mensajeExito');
  if (formEl)  formEl.style.display = 'block';
  if (success) success.style.display = 'none';
  App.promoDiscount = 0; App.promoFixed = 0; App.appliedCode = null;
  var pi = document.getElementById('promoCodeInput');
  var pm = document.getElementById('promoCodeMsg');
  if (pi) pi.value = '';
  if (pm) { pm.style.display = 'none'; pm.innerHTML = ''; }
}

function initCheckoutForm() {
  if (!App.user) return;
  var n = document.getElementById('checkoutName');
  var e = document.getElementById('checkoutEmail');
  if (n && App.user.name) n.value = App.user.name;
  if (e && App.user.email) e.value = App.user.email;
}

function renderCheckout() {
  var itemsEl = document.getElementById('checkoutItems');
  var totalEl = document.getElementById('checkoutTotal');
  if (!itemsEl) return;
  var subtotal = 0, html = '';
  App.cart.forEach(function(item) {
    var t = item.price * item.qty;
    subtotal += t;
    html += '<div class="item-row"><span>' + item.name + ' x' + item.qty + '</span><span>' + formatPrice(t) + '</span></div>';
  });
  var descuento = 0;
  if (App.promoDiscount > 0) {
    descuento = Math.round(subtotal * App.promoDiscount / 100);
    html += '<div class="item-row" style="color:#10B981"><span><i class="fa-solid fa-tag"></i> Descuento (' + App.promoDiscount + '%)</span><span>-' + formatPrice(descuento) + '</span></div>';
  } else if (App.promoFixed > 0) {
    descuento = Math.min(App.promoFixed, subtotal);
    html += '<div class="item-row" style="color:#10B981"><span><i class="fa-solid fa-tag"></i> Descuento</span><span>-' + formatPrice(descuento) + '</span></div>';
  }
  App.checkoutTotal = subtotal - descuento;
  itemsEl.innerHTML = html;
  if (totalEl) totalEl.innerText = formatPrice(App.checkoutTotal);
  setupPayPalButton(App.checkoutTotal);
}

async function aplicarPromoCode() {
  var input = document.getElementById('promoCodeInput');
  var msg   = document.getElementById('promoCodeMsg');
  if (!input || !msg) return;
  var code = input.value.trim().toUpperCase();
  if (!code) { showToast('Ingresa un código', 'error'); return; }

  var res = await api('promotions', { method: 'POST', body: { code } });
  if (res.error) {
    msg.style.display = 'block'; msg.style.color = '#EF4444';
    msg.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Código inválido o expirado.';
    App.promoDiscount = 0; App.promoFixed = 0; App.appliedCode = null;
    renderCheckout(); return;
  }
  var found = res.promo;
  App.appliedCode = code;
  if (found.discount_type === 'percentage') { App.promoDiscount = found.discount_value; App.promoFixed = 0; }
  else { App.promoFixed = found.discount_value; App.promoDiscount = 0; }
  msg.style.display = 'block'; msg.style.color = '#10B981';
  var txt = found.discount_type === 'percentage' ? found.discount_value + '% off' : formatPrice(found.discount_value) + ' off';
  msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Código aplicado! ' + found.title + ' — ' + txt;
  renderCheckout();
}

// ================= PAYPAL =================
function loadPayPalSDK(cb) {
  if (window.paypal && App.paypalLoaded) { cb(); return; }
  var old = document.querySelector('script[src*="paypal.com/sdk"]');
  if (old) old.remove();
  window.paypal = undefined;
  var s = document.createElement('script');
  s.src = 'https://www.paypal.com/sdk/js?client-id=' + CONFIG.PAYPAL_CLIENT_ID
        + '&currency=USD&intent=capture&components=buttons&disable-funding=credit,card';
  s.onload = function() { App.paypalLoaded = true; cb(); };
  s.onerror = function() {
    var fb = document.getElementById('paypalFallbackBtn');
    if (fb) fb.style.display = 'inline-flex';
  };
  document.head.appendChild(s);
}

function setupPayPalButton(amount) {
  var container = document.getElementById('paypal-button-container');
  var fallback  = document.getElementById('paypalFallbackBtn');
  if (!container) return;
  container.innerHTML = '<p style="color:#aaa;font-size:0.85rem;padding:15px 0;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando PayPal...</p>';
  loadPayPalSDK(function() {
    container.innerHTML = '';
    if (!window.paypal) { if (fallback) fallback.style.display = 'inline-flex'; return; }
    try {
      window.paypal.Buttons({
        style: { layout:'vertical', color:'blue', shape:'rect', label:'pay' },
        createOrder: function(data, actions) {
          return actions.order.create({
            purchase_units: [{ amount: { value: (amount/4000).toFixed(2), currency_code:'USD' }, description:'Servicios ForSync' }]
          });
        },
        onApprove: function(data, actions) {
          return actions.order.capture().then(processSuccessfulPayment);
        },
        onCancel: function() { showToast('Pago cancelado', 'info'); },
        onError: function(err) {
          console.error('PayPal error:', err);
          if (fallback) fallback.style.display = 'inline-flex';
        }
      }).render('#paypal-button-container');
      if (fallback) fallback.style.display = 'none';
    } catch(e) {
      console.error('PayPal render:', e);
      if (fallback) fallback.style.display = 'inline-flex';
    }
  });
}

function simulatePaypalPayment() {
  processSuccessfulPayment({ id: 'SIM-' + Date.now(), status:'COMPLETED' });
}

async function processSuccessfulPayment(details) {
  var name  = (document.getElementById('checkoutName')  || {}).value || App.user.name || 'Cliente';
  var email = (document.getElementById('checkoutEmail') || {}).value || App.user.email || '';
  var phone = (document.getElementById('checkoutPhone') || {}).value || '';

  var res = await api('orders', {
    method: 'POST',
    body: {
      customer_name:    name,
      customer_email:   email,
      customer_phone:   phone || null,
      items:            App.cart.map(function(i){ return { id:i.id, name:i.name, qty:i.qty, price:i.price }; }),
      total:            App.checkoutTotal,
      payment_method:   'PayPal Sandbox',
      paypal_reference: details.id || 'sim',
      promo_code:       App.appliedCode || null
    }
  });

  if (res.error) { showToast('Error guardando el pedido: ' + res.error, 'error'); return; }

  App.cart = []; saveCart(); updateCartUI();
  App.checkoutTotal = 0;

  var formEl  = document.getElementById('checkoutForm');
  var success = document.getElementById('mensajeExito');
  var numGuia = document.getElementById('numGuia');
  if (formEl)  formEl.style.display  = 'none';
  if (success) success.style.display = 'block';
  if (numGuia) numGuia.innerText = res.order_number;

  showToast('¡Pago exitoso! Pedido #' + res.order_number, 'success');
}

// ================= PROMO BANNER =================
function initPromoBanner() {
  var banner = document.getElementById('promoBanner');
  var text   = document.getElementById('promoText');
  if (!banner || !text || !App.promotions.length) return;
  var p = App.promotions[0];
  text.innerHTML = '<i class="fa-solid fa-tag"></i> ' + p.title + ' | Usa el código <strong>' + p.code + '</strong> al pagar';
  banner.style.display = 'block';
}

// ================= PROFILE =================
async function renderProfile() {
  if (!App.user) { showSection('inicio'); return; }

  // Cargar datos frescos del servidor
  var profileRes = await api('auth?action=profile');
  var user = (profileRes && profileRes.user) ? profileRes.user : App.user;

  var g = function(id) { return document.getElementById(id); };
  var name = user.name || user.email.split('@')[0];
  if (g('perfilNameDisplay')) g('perfilNameDisplay').innerText = name;
  if (g('perfilEmailDisplay')) g('perfilEmailDisplay').innerText = user.email;
  if (g('perfilNombre')) g('perfilNombre').value = name;
  if (g('perfilEmail'))  g('perfilEmail').value  = user.email;
  if (g('perfilPhone')) g('perfilPhone').value = user.phone || '';
  if (g('perfilCity'))  g('perfilCity').value  = user.city  || '';

  // Guardar perfil
  var saveBtn = g('saveProfile');
  if (saveBtn) {
    saveBtn.onclick = async function() {
      var n  = g('perfilNombre') ? g('perfilNombre').value : '';
      var ph = g('perfilPhone')  ? g('perfilPhone').value  : '';
      var ci = g('perfilCity')   ? g('perfilCity').value   : '';
      var res = await api('auth?action=profile', { method: 'PATCH', body: { name: n, phone: ph, city: ci } });
      if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
      App.user = Object.assign(App.user, { name: n });
      updateAuthUI();
      showToast('Perfil actualizado', 'success');
    };
  }

  // Cambiar contraseña
  var changePwdBtn = g('changePwdBtn');
  if (changePwdBtn) {
    changePwdBtn.onclick = function() { g('changePwdModal') && (g('changePwdModal').style.display = 'flex'); };
  }

  // Pedidos
  var ordersList = g('ordersList');
  if (ordersList) {
    var ordersRes = await api('orders');
    if (ordersRes.error) {
      ordersList.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">Error cargando pedidos.</p>';
    } else if (!ordersRes.orders || !ordersRes.orders.length) {
      ordersList.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">No tienes pedidos aún.</p>';
    } else {
      ordersList.innerHTML = ordersRes.orders.map(function(o) {
        var cancelNote = (o.status === 'cancelled' && o.cancel_reason)
          ? '<div class="cancel-reason-box"><i class="fa-solid fa-ban"></i> Cancelado: ' + o.cancel_reason + '</div>' : '';
        return '<div class="order-row"><div><h4>#' + o.order_number + '</h4><p>' + formatDate(o.created_at) + ' · ' + statusLabel(o.status) + '</p>' + cancelNote + '</div><span class="order-total">' + formatPrice(o.total) + '</span></div>';
      }).join('');
      var hasBought = ordersRes.orders.some(function(o) { return o.payment_status === 'paid'; });
      var reviewSec = g('reviewSection');
      if (reviewSec) reviewSec.style.display = hasBought ? 'block' : 'none';
    }
  }

  // Cotizaciones
  var quotesList = g('quotesList');
  if (quotesList) {
    var quotesRes = await api('quotes');
    if (quotesRes.error || !quotesRes.quotes || !quotesRes.quotes.length) {
      quotesList.innerHTML = '<p style="text-align:center;color:#999;padding:30px;">No tienes cotizaciones.</p>';
    } else {
      quotesList.innerHTML = quotesRes.quotes.map(function(q) {
        return '<div class="order-row"><div><h4>' + getProjectTypeName(q.project_type) + '</h4><p>' + formatDate(q.created_at) + ' · ' + quoteStatusLabel(q.status) + '</p></div></div>';
      }).join('');
    }
  }

  // Formulario de reseña
  var reviewForm = g('reviewSubmitForm');
  if (reviewForm) {
    reviewForm.onsubmit = async function(e) {
      e.preventDefault();
      var rating  = parseInt(g('reviewRatingVal') ? g('reviewRatingVal').value : 0);
      var comment = g('reviewComment') ? g('reviewComment').value.trim() : '';
      var service = g('reviewService') ? g('reviewService').value : '';
      if (!rating)  { showToast('Selecciona una calificación', 'error'); return; }
      if (!comment) { showToast('Escribe un comentario', 'error'); return; }
      var res = await api('reviews', { method: 'POST', body: { rating, comment, service_type: service } });
      if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
      showToast('¡Reseña enviada! Pendiente de aprobación.', 'success');
      reviewForm.reset();
      if (g('reviewRatingVal')) g('reviewRatingVal').value = '';
      document.querySelectorAll('#starRatingDisplay i').forEach(function(s) { s.className = 'fa-regular fa-star'; });
    };
  }
}

// ================= STAR RATING UI =================
function initStarRating() {
  var display  = document.getElementById('starRatingDisplay');
  var valInput = document.getElementById('reviewRatingVal');
  if (!display || !valInput) return;
  var stars = display.querySelectorAll('i');
  stars.forEach(function(star, idx) {
    star.addEventListener('mouseover', function() {
      stars.forEach(function(s,i) { s.className = i <= idx ? 'fa-solid fa-star' : 'fa-regular fa-star'; });
    });
    star.addEventListener('mouseout', function() {
      var cur = parseInt(valInput.value || 0);
      stars.forEach(function(s,i) { s.className = i < cur ? 'fa-solid fa-star' : 'fa-regular fa-star'; });
    });
    star.addEventListener('click', function() {
      valInput.value = idx + 1;
      stars.forEach(function(s,i) { s.className = i <= idx ? 'fa-solid fa-star' : 'fa-regular fa-star'; });
    });
  });
}

// ================= PASSWORD CHANGE =================
function closeChangePwdModal() {
  var m = document.getElementById('changePwdModal');
  if (m) m.style.display = 'none';
}

async function submitNewPassword(e) {
  if (e) e.preventDefault();
  var np = document.getElementById('newPassword');
  var cp = document.getElementById('confirmPassword');
  var op = document.getElementById('oldPassword');
  if (!np || !cp) return;
  if (!op || !op.value) { showToast('Ingresa tu contraseña actual', 'error'); return; }
  if (np.value !== cp.value) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (np.value.length < 6)  { showToast('Mínimo 6 caracteres', 'error'); return; }
  var res = await api('auth?action=profile', {
    method: 'PATCH',
    body: { password: op.value, new_password: np.value }
  });
  if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
  showToast('¡Contraseña actualizada!', 'success');
  closeChangePwdModal();
  np.value = ''; cp.value = ''; op.value = '';
}

// ================= DELETE ACCOUNT =================
function openDeleteAccountModal() {
  var m = document.getElementById('deleteAccountModal');
  if (m) m.style.display = 'flex';
}
function closeDeleteAccountModal() {
  var m = document.getElementById('deleteAccountModal');
  if (m) m.style.display = 'none';
  var p = document.getElementById('deleteAccountPassword');
  var c = document.getElementById('deleteAccountConfirm');
  if (p) p.value = ''; if (c) c.value = '';
}
async function confirmarEliminarCuenta() {
  var pwd  = document.getElementById('deleteAccountPassword');
  var conf = document.getElementById('deleteAccountConfirm');
  if (!pwd || !pwd.value)  { showToast('Ingresa tu contraseña', 'error'); return; }
  if (!conf || conf.value !== 'ELIMINAR') { showToast('Escribe ELIMINAR para confirmar', 'error'); return; }
  var res = await api('auth?action=delete-account', { method: 'POST', body: { password: pwd.value } });
  if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
  showToast('Cuenta eliminada. Hasta luego.', 'info');
  setTimeout(function() { window.location.href = '/'; }, 1500);
}

// ================= HELPERS =================
function statusLabel(s) {
  return ({ pending:'⏳ Pendiente', confirmed:'✅ Confirmado', in_progress:'🔧 En Desarrollo', delivered:'📦 Entregado', cancelled:'❌ Cancelado' })[s] || s;
}
function quoteStatusLabel(s) {
  return ({ pending:'⏳ Pendiente', reviewing:'🔍 Revisando', quoted:'💰 Cotizado', accepted:'✅ Aceptado', rejected:'❌ Rechazado' })[s] || s;
}
function getProjectTypeName(t) {
  return ({ landing:'Landing Page', ecommerce:'Tienda Virtual', corporativa:'Web Corporativa', reservas:'Sistema de Reservas', inventario:'Sistema de Inventario', blog:'Blog / Web Educativa', dashboard:'App Web / Dashboard', portafolio:'Portafolio Creativo', otro:'Proyecto Personalizado' })[t] || t;
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' });
}

// ================= TOAST =================
function showToast(msg, type) {
  var c = document.getElementById('toastContainer');
  if (!c) { c = document.createElement('div'); c.id='toastContainer'; c.className='toast-container'; document.body.appendChild(c); }
  var t = document.createElement('div');
  t.className = 'toast ' + (type||'info');
  t.innerHTML = '<i class="fa-solid ' + ({ success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info' }[type]||'fa-circle-info') + '"></i><span>' + msg + '</span>';
  c.appendChild(t);
  setTimeout(function() {
    t.style.transition='all 0.3s ease'; t.style.opacity='0'; t.style.transform='translateX(100%)';
    setTimeout(function(){ t.remove(); },300);
  }, 4000);
}

// ================= LOGIN PAGE FUNCTIONS =================
// Usadas desde login.html

async function procesarLogin(e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim();
  var pass  = document.getElementById('password').value;
  var btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ingresando...'; }

  var res = await api('auth?action=login', { method: 'POST', body: { email, password: pass } });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrow-right"></i> Ingresar'; }
  if (res.error) { showToast('Error: ' + res.error, 'error'); return; }

  showToast('¡Bienvenido!', 'success');
  setTimeout(function() {
    window.location.href = (res.user && res.user.role === 'admin') ? 'admin.html' : 'index.html';
  }, 800);
}

function iniciarGoogleOAuth() {
  // Redirige a nuestra Vercel Function que inicia el flujo con Google
  // Google verá forsync.vercel.app/api/auth/callback como el redirect_uri
  window.location.href = '/api/auth?action=google';
}

async function enviarResetPassword(e) {
  e.preventDefault();
  var emailEl = document.getElementById('resetEmail');
  if (!emailEl || !emailEl.value) { showToast('Ingresa tu correo', 'error'); return; }
  var btn = e.target.querySelector('button');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'; }

  var res = await api('auth?action=reset-request', { method: 'POST', body: { email: emailEl.value.trim() } });
  if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> Enviar enlace'; }

  if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
  showToast('¡Enlace enviado! Revisa tu correo.', 'success');
  var rf = document.getElementById('resetForm');
  var rc = document.getElementById('resetConfirm');
  if (rf) rf.style.display = 'none';
  if (rc) rc.style.display = 'block';
}

async function procesarRegistro(e) {
  e.preventDefault();
  var name  = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var pass  = document.getElementById('regPassword').value;
  var pass2 = document.getElementById('regPassword2').value;
  if (pass !== pass2) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (pass.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return; }

  var btn = e.target.querySelector('button[type=submit]');
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Creando...'; }

  var res = await api('auth?action=register', { method: 'POST', body: { name, email, password: pass } });
  if (btn) { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-user-plus"></i> Crear Cuenta'; }

  if (res.error) { showToast('Error: ' + res.error, 'error'); return; }
  showToast('¡Cuenta creada! Iniciando sesión...', 'success');
  setTimeout(function() { window.location.href = 'index.html'; }, 900);
}
