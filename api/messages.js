import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Faltan campos' });
    await query('INSERT INTO contacts (id,name,email,subject,message) VALUES ($1,$2,$3,$4,$5)',
      [nanoid(), name, email, subject||'Sin asunto', message]);
    return res.status(201).json({ ok: true });
  }
  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  if (req.method === 'PATCH') {
    await query('UPDATE contacts SET is_read=true WHERE id=$1', [req.body.id]);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await query('DELETE FROM contacts WHERE id=$1', [req.body.id]);
    return res.json({ ok: true });
  }
  res.status(405).end();
}
