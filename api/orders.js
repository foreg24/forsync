// api/orders.js
// POST /api/orders           → crear pedido (user autenticado)
// GET  /api/orders           → mis pedidos (user)
// PATCH /api/orders?admin=1  → actualizar estado (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

const VALID_STATUSES = ['pending','confirmed','in_progress','delivered','cancelled'];

export default async function handler(req, res) {
  const db = sql();
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  // Admin: actualizar estado
  if (req.method === 'PATCH') {
    if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Faltan campos' });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    const rows = await db`UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING id, order_number, status`;
    if (!rows[0]) return res.status(404).json({ error: 'Pedido no encontrado' });
    return res.json({ ok: true, order: rows[0] });
  }

  // User: crear pedido
  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, items, total, payment_method, paypal_reference } = req.body || {};
    if (!items?.length || !total) return res.status(400).json({ error: 'Datos incompletos' });
    const orderNumber = 'FS-' + Math.floor(Math.random() * 900000 + 100000);
    const id = nanoid();
    await db`INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, items, total, status, payment_status, payment_method, paypal_reference)
             VALUES (${id}, ${orderNumber}, ${session.id}, ${customer_name||session.name}, ${customer_email||session.email}, ${customer_phone||null}, ${JSON.stringify(items)}, ${total}, 'confirmed', 'paid', ${payment_method||'PayPal Sandbox'}, ${paypal_reference||null})`;
    return res.status(201).json({ ok: true, order_number: orderNumber, id });
  }

  // User: listar pedidos propios
  if (req.method === 'GET') {
    const rows = await db`SELECT id, order_number, total, status, payment_status, items, created_at FROM orders WHERE user_id = ${session.id} ORDER BY created_at DESC`;
    return res.json({ orders: rows });
  }

  res.status(405).end();
}
