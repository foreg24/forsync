import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

const ALLOWED = { pending:['confirmed','cancelled'], confirmed:['in_progress'], in_progress:['delivered'], delivered:[], cancelled:[] };

export default async function handler(req, res) {
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'PATCH') {
    if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { id, status, cancel_reason } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Faltan campos' });
    const current = await query('SELECT status FROM orders WHERE id=$1 LIMIT 1', [id]);
    if (!current[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (!(ALLOWED[current[0].status]||[]).includes(status)) return res.status(400).json({ error: 'Transición no permitida' });
    if (status === 'cancelled' && !cancel_reason) return res.status(400).json({ error: 'Debes indicar el motivo de cancelación' });
    const rows = await query(
      'UPDATE orders SET status=$2, cancel_reason=COALESCE($3,cancel_reason), updated_at=NOW() WHERE id=$1 RETURNING id,order_number,status,cancel_reason',
      [id, status, cancel_reason||null]
    );
    return res.json({ ok: true, order: rows[0] });
  }

  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, items, total, payment_method, paypal_reference, promo_code } = req.body || {};
    if (!items?.length || !total) return res.status(400).json({ error: 'Datos incompletos' });
    const orderNumber = 'FS-' + Math.floor(Math.random()*900000+100000);
    const id = nanoid();
    await query(
      'INSERT INTO orders (id,order_number,user_id,customer_name,customer_email,customer_phone,items,total,status,payment_status,payment_method,paypal_reference) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [id, orderNumber, session.id, customer_name||session.name, customer_email||session.email, customer_phone||null, JSON.stringify(items), total, 'pending', 'paid', payment_method||'PayPal Sandbox', paypal_reference||null]
    );
    if (promo_code) {
      try {
        const promos = await query('SELECT id FROM promotions WHERE code=$1 LIMIT 1', [promo_code.toUpperCase()]);
        if (promos[0]) {
          await query('INSERT INTO promo_usage (id,promo_id,user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [nanoid(), promos[0].id, session.id]);
          await query('UPDATE promotions SET usage_count=usage_count+1 WHERE id=$1', [promos[0].id]);
        }
      } catch(e) {}
    }
    return res.status(201).json({ ok: true, order_number: orderNumber, id });
  }

  if (req.method === 'GET') {
    if (session.role === 'admin') {
      const rows = await query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.json({ orders: rows });
    }
    const rows = await query('SELECT id,order_number,total,status,payment_status,items,cancel_reason,created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [session.id]);
    return res.json({ orders: rows });
  }
  res.status(405).end();
}
