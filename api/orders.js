// api/orders.js
// POST  /api/orders          → crear pedido (user autenticado)
// GET   /api/orders          → mis pedidos (user) o todos (admin)
// PATCH /api/orders          → actualizar estado (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

// Flujo permitido: pending → confirmed | cancelled
//                 confirmed → in_progress
//                 in_progress → delivered
// delivered y cancelled son estados finales
const ALLOWED_TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress'],
  in_progress: ['delivered'],
  delivered:   [],
  cancelled:   []
};

export default async function handler(req, res) {
  const db = sql();
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  // Admin: actualizar estado
  if (req.method === 'PATCH') {
    if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { id, status, cancel_reason } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Faltan campos' });

    const current = await db`SELECT status FROM orders WHERE id = ${id} LIMIT 1`;
    if (!current[0]) return res.status(404).json({ error: 'Pedido no encontrado' });

    const allowed = ALLOWED_TRANSITIONS[current[0].status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Transición de estado no permitida' });
    }
    if (status === 'cancelled' && !cancel_reason) {
      return res.status(400).json({ error: 'Debes indicar el motivo de cancelación' });
    }

    const rows = await db`
      UPDATE orders SET
        status        = ${status},
        cancel_reason = COALESCE(${cancel_reason || null}, cancel_reason),
        updated_at    = NOW()
      WHERE id = ${id}
      RETURNING id, order_number, status, cancel_reason
    `;
    return res.json({ ok: true, order: rows[0] });
  }

  // User: crear pedido
  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, items, total, payment_method, paypal_reference, promo_code } = req.body || {};
    if (!items?.length || !total) return res.status(400).json({ error: 'Datos incompletos' });
    const orderNumber = 'FS-' + Math.floor(Math.random() * 900000 + 100000);
    const id = nanoid();
    await db`
      INSERT INTO orders (id, order_number, user_id, customer_name, customer_email,
                          customer_phone, items, total, status, payment_status,
                          payment_method, paypal_reference)
      VALUES (${id}, ${orderNumber}, ${session.id},
              ${customer_name||session.name}, ${customer_email||session.email},
              ${customer_phone||null}, ${JSON.stringify(items)}, ${total},
              'pending', 'paid', ${payment_method||'PayPal Sandbox'}, ${paypal_reference||null})
    `;
    // Registrar uso del código promo si se usó uno
    if (promo_code) {
      try {
        const promos = await db`SELECT id FROM promotions WHERE code = ${promo_code.toUpperCase()} LIMIT 1`;
        if (promos[0]) {
          await db`INSERT INTO promo_usage (id, promo_id, user_id) VALUES (${nanoid()}, ${promos[0].id}, ${session.id}) ON CONFLICT DO NOTHING`;
          await db`UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ${promos[0].id}`;
        }
      } catch(e) { /* no bloquear el pedido si falla el registro de promo */ }
    }
    return res.status(201).json({ ok: true, order_number: orderNumber, id });
  }

  // GET: admin ve todos, user ve los suyos
  if (req.method === 'GET') {
    if (session.role === 'admin') {
      const rows = await db`SELECT * FROM orders ORDER BY created_at DESC`;
      return res.json({ orders: rows });
    }
    const rows = await db`
      SELECT id, order_number, total, status, payment_status, items, cancel_reason, created_at
      FROM orders WHERE user_id = ${session.id} ORDER BY created_at DESC
    `;
    return res.json({ orders: rows });
  }

  res.status(405).end();
}
