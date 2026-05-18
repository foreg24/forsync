import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query("SELECT customer_name,rating,comment,service_type,created_at FROM reviews WHERE is_approved=true ORDER BY created_at DESC LIMIT 20");
    return res.json({ reviews: rows });
  }
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'POST') {
    const orders = await query("SELECT id FROM orders WHERE user_id=$1 AND payment_status='paid' LIMIT 1", [session.id]);
    if (!orders.length) return res.status(403).json({ error: 'Solo clientes con pedidos pagados pueden dejar reseñas' });
    const { rating, comment, service_type } = req.body || {};
    if (!rating || !comment) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    await query(
      'INSERT INTO reviews (id,user_id,customer_name,customer_email,rating,comment,service_type) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [id, session.id, session.name||session.email, session.email, parseInt(rating), comment.trim(), service_type||null]
    );
    return res.status(201).json({ ok: true });
  }
  if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  if (req.method === 'PATCH') {
    const { id } = req.body || {};
    await query('UPDATE reviews SET is_approved=true WHERE id=$1', [id]);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    await query('DELETE FROM reviews WHERE id=$1', [id]);
    return res.json({ ok: true });
  }
  res.status(405).end();
}
