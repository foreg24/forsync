import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

const VALID = ['pending','reviewing','quoted','accepted','rejected'];

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { customer_name, customer_email, customer_phone, project_type, description, budget_range, deadline } = req.body || {};
    if (!customer_name || !customer_email || !project_type || !description) return res.status(400).json({ error: 'Faltan campos' });
    const session = await getSessionUser(req);
    await query(
      'INSERT INTO quotes (id,user_id,customer_name,customer_email,customer_phone,project_type,description,budget_range,deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [nanoid(), session?.id||null, customer_name, customer_email, customer_phone||null, project_type, description, budget_range||null, deadline||null]
    );
    return res.status(201).json({ ok: true });
  }
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });

  if (req.method === 'PATCH') {
    if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    const { id, status, admin_notes, quote_amount } = req.body || {};
    if (!id || !status || !VALID.includes(status)) return res.status(400).json({ error: 'Datos inválidos' });
    const rows = await query(
      'UPDATE quotes SET status=$2, admin_notes=COALESCE($3,admin_notes), quote_amount=COALESCE($4,quote_amount), updated_at=NOW() WHERE id=$1 RETURNING id,status',
      [id, status, admin_notes||null, quote_amount||null]
    );
    return res.json({ ok: true, quote: rows[0] });
  }
  if (req.method === 'GET') {
    const rows = await query('SELECT id,project_type,status,created_at,quote_amount FROM quotes WHERE user_id=$1 ORDER BY created_at DESC', [session.id]);
    return res.json({ quotes: rows });
  }
  res.status(405).end();
}
