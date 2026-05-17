// api/reviews.js
// GET    /api/reviews            → reseñas aprobadas (público)
// POST   /api/reviews            → enviar reseña (user con compra)
// PATCH  /api/reviews?admin=1    → aprobar (admin)
// DELETE /api/reviews?admin=1    → eliminar (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  const db = sql();

  // Público: reseñas aprobadas
  if (req.method === 'GET') {
    const rows = await db`SELECT customer_name, rating, comment, service_type, created_at FROM reviews WHERE is_approved = true ORDER BY created_at DESC LIMIT 20`;
    return res.json({ reviews: rows });
  }

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  // User: enviar reseña
  if (req.method === 'POST') {
    const orders = await db`SELECT id FROM orders WHERE user_id = ${session.id} AND payment_status = 'paid' LIMIT 1`;
    if (!orders.length) return res.status(403).json({ error: 'Solo clientes con pedidos pagados pueden dejar reseñas' });
    const { rating, comment, service_type } = req.body || {};
    if (!rating || !comment) return res.status(400).json({ error: 'Faltan campos' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating inválido' });
    const id = nanoid();
    await db`INSERT INTO reviews (id, user_id, customer_name, customer_email, rating, comment, service_type)
             VALUES (${id}, ${session.id}, ${session.name||session.email}, ${session.email}, ${parseInt(rating)}, ${comment.trim()}, ${service_type||null})`;
    return res.status(201).json({ ok: true });
  }

  if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  // Admin: aprobar
  if (req.method === 'PATCH') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`UPDATE reviews SET is_approved = true WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  // Admin: eliminar
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`DELETE FROM reviews WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
