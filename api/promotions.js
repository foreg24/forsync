// api/promotions.js
// GET    → promos activas (público)
// POST   → validar código (público) o crear promo (admin + title)
// PATCH  → activar/desactivar o EDITAR promo (admin)
// DELETE → eliminar (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  const db = sql();

  if (req.method === 'GET') {
    const rows = await db`SELECT * FROM promotions WHERE is_active = true ORDER BY created_at DESC`;
    return res.json({ promotions: rows });
  }

  // POST: validar código (público) O crear nueva (admin)
  if (req.method === 'POST') {
    const { code, title, description, discount_type, discount_value, start_date, end_date, usage_limit } = req.body || {};

    // Validar código — incluye check de uso por usuario
    if (code && !title) {
      const rows = await db`SELECT * FROM promotions WHERE code = ${code.toUpperCase().trim()} AND is_active = true LIMIT 1`;
      if (!rows[0]) return res.status(404).json({ error: 'Código inválido o expirado' });
      const promo = rows[0];

      // Verificar límite de uso global
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        return res.status(410).json({ error: 'Este código ya alcanzó su límite de usos' });
      }

      // Verificar uso por usuario (si está autenticado)
      const session = await getSessionUser(req);
      if (session) {
        const used = await db`SELECT id FROM promo_usage WHERE promo_id = ${promo.id} AND user_id = ${session.id} LIMIT 1`;
        if (used.length > 0) return res.status(409).json({ error: 'Ya usaste este código anteriormente' });
      }

      return res.json({ promo: rows[0] });
    }

    // Crear promo → admin
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    if (!title || !discount_type || !discount_value || !code) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    await db`INSERT INTO promotions (id, title, description, discount_type, discount_value, code, start_date, end_date, usage_limit)
             VALUES (${id}, ${title}, ${description||null}, ${discount_type}, ${discount_value},
                    ${code.toUpperCase()}, ${start_date||null}, ${end_date||null}, ${usage_limit||null})`;
    const rows = await db`SELECT * FROM promotions WHERE id = ${id} LIMIT 1`;
    return res.status(201).json({ ok: true, promo: rows[0] });
  }

  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  // PATCH: editar o cambiar estado
  if (req.method === 'PATCH') {
    const { id, is_active, title, description, discount_type, discount_value, code, usage_limit, start_date, end_date } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });

    // Si sólo viene is_active → toggle
    if (is_active !== undefined && !title) {
      await db`UPDATE promotions SET is_active = ${is_active} WHERE id = ${id}`;
      return res.json({ ok: true });
    }

    // Edición completa
    await db`UPDATE promotions SET
      title          = COALESCE(${title          || null}, title),
      description    = COALESCE(${description    || null}, description),
      discount_type  = COALESCE(${discount_type  || null}, discount_type),
      discount_value = COALESCE(${discount_value || null}, discount_value),
      code           = COALESCE(${code ? code.toUpperCase() : null}, code),
      usage_limit    = COALESCE(${usage_limit    || null}, usage_limit),
      start_date     = COALESCE(${start_date     || null}, start_date),
      end_date       = COALESCE(${end_date       || null}, end_date),
      is_active      = COALESCE(${is_active !== undefined ? is_active : null}, is_active)
      WHERE id = ${id}`;
    const rows = await db`SELECT * FROM promotions WHERE id = ${id} LIMIT 1`;
    return res.json({ ok: true, promo: rows[0] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`DELETE FROM promotions WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
