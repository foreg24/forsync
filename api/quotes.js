// api/quotes.js
// POST /api/quotes           → enviar cotización
// GET  /api/quotes           → mis cotizaciones (user)
// PATCH /api/quotes?admin=1  → actualizar estado (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

const VALID = ['pending','reviewing','quoted','accepted','rejected'];

export default async function handler(req, res) {
  const db = sql();

  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, project_type, description, budget_range, deadline } = req.body || {};
    if (!customer_name || !customer_email || !project_type || !description) return res.status(400).json({ error: 'Faltan campos' });
    const session = await getSessionUser(req);
    const id = nanoid();
    await db`INSERT INTO quotes (id, user_id, customer_name, customer_email, customer_phone, project_type, description, budget_range, deadline)
             VALUES (${id}, ${session?.id||null}, ${customer_name}, ${customer_email}, ${customer_phone||null}, ${project_type}, ${description}, ${budget_range||null}, ${deadline||null})`;
    return res.status(201).json({ ok: true, id });
  }

  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'PATCH') {
    if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { id, status, admin_notes, quote_amount } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Faltan campos' });
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    const rows = await db`UPDATE quotes SET status = ${status},
      admin_notes  = COALESCE(${admin_notes  || null}, admin_notes),
      quote_amount = COALESCE(${quote_amount || null}, quote_amount),
      updated_at   = NOW() WHERE id = ${id} RETURNING id, status`;
    if (!rows[0]) return res.status(404).json({ error: 'No encontrada' });
    return res.json({ ok: true, quote: rows[0] });
  }

  if (req.method === 'GET') {
    const rows = await db`SELECT id, project_type, status, created_at, quote_amount FROM quotes WHERE user_id = ${session.id} ORDER BY created_at DESC`;
    return res.json({ quotes: rows });
  }

  res.status(405).end();
}
