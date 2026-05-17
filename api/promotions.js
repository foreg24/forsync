// api/promotions.js
// GET    /api/promotions           → promos activas (público)
// POST   /api/promotions           → validar código (público) o crear (admin con ?admin=1)
// PATCH  /api/promotions?admin=1   → activar/desactivar (admin)
// DELETE /api/promotions?admin=1   → eliminar (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  const db = sql();

  if (req.method === 'GET') {
    const rows = await db`SELECT * FROM promotions WHERE is_active = true ORDER BY created_at DESC`;
    return res.json({ promotions: rows });
  }

  // POST: validar código (público) o crear nueva promo (admin)
  if (req.method === 'POST') {
    const { code, title, description, discount_type, discount_value, start_date, end_date, usage_limit } = req.body || {};

    // Si viene code solo → validar código
    if (code && !title) {
      const rows = await db`SELECT * FROM promotions WHERE code = ${code.toUpperCase().trim()} AND is_active = true LIMIT 1`;
      if (!rows[0]) return res.status(404).json({ error: 'Código inválido o expirado' });
      return res.json({ promo: rows[0] });
    }

    // Crear promo → requiere admin
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    if (!title || !discount_type || !discount_value || !code) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    await db`INSERT INTO promotions (id, title, description, discount_type, discount_value, code, start_date, end_date, usage_limit)
             VALUES (${id}, ${title}, ${description||null}, ${discount_type}, ${discount_value}, ${code.toUpperCase()}, ${start_date||null}, ${end_date||null}, ${usage_limit||null})`;
    const rows = await db`SELECT * FROM promotions WHERE id = ${id} LIMIT 1`;
    return res.status(201).json({ ok: true, promo: rows[0] });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  if (req.method === 'PATCH') {
    const { id, is_active } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`UPDATE promotions SET is_active = ${is_active} WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`DELETE FROM promotions WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
