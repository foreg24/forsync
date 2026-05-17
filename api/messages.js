// api/messages.js
// POST   /api/messages            → enviar mensaje de contacto
// PATCH  /api/messages?admin=1    → marcar leído (admin)
// DELETE /api/messages?admin=1    → eliminar (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  const db = sql();

  // Público: enviar mensaje
  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    await db`INSERT INTO contacts (id, name, email, subject, message)
             VALUES (${id}, ${name}, ${email}, ${subject||'Sin asunto'}, ${message})`;
    return res.status(201).json({ ok: true });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  if (req.method === 'PATCH') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`UPDATE contacts SET is_read = true WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`DELETE FROM contacts WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
