import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const rows = await query("SELECT * FROM promotions WHERE is_active=true ORDER BY created_at DESC");
    return res.json({ promotions: rows });
  }
  if (req.method === 'POST') {
    const { code, title, description, discount_type, discount_value, start_date, end_date, usage_limit } = req.body || {};
    if (code && !title) {
      const rows = await query("SELECT * FROM promotions WHERE code=$1 AND is_active=true LIMIT 1", [code.toUpperCase().trim()]);
      if (!rows[0]) return res.status(404).json({ error: 'Código inválido o expirado' });
      const promo = rows[0];
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return res.status(410).json({ error: 'Código agotado' });
      const session = await getSessionUser(req);
      if (session) {
        const used = await query('SELECT id FROM promo_usage WHERE promo_id=$1 AND user_id=$2 LIMIT 1', [promo.id, session.id]);
        if (used.length) return res.status(409).json({ error: 'Ya usaste este código' });
      }
      return res.json({ promo: rows[0] });
    }
    const session = await getSessionUser(req);
    if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
    if (!title || !discount_type || !discount_value || !code) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    await query(
      'INSERT INTO promotions (id,title,description,discount_type,discount_value,code,start_date,end_date,usage_limit) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, title, description||null, discount_type, discount_value, code.toUpperCase(), start_date||null, end_date||null, usage_limit||null]
    );
    const rows = await query('SELECT * FROM promotions WHERE id=$1', [id]);
    return res.status(201).json({ ok: true, promo: rows[0] });
  }
  const session = await getSessionUser(req);
  if (!session || session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  if (req.method === 'PATCH') {
    const { id, is_active, title, description, discount_type, discount_value, code, usage_limit, start_date, end_date } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    if (is_active !== undefined && !title) {
      await query('UPDATE promotions SET is_active=$2 WHERE id=$1', [id, is_active]);
    } else {
      await query(
        'UPDATE promotions SET title=COALESCE($2,title), description=COALESCE($3,description), discount_type=COALESCE($4,discount_type), discount_value=COALESCE($5,discount_value), code=COALESCE($6,code), usage_limit=COALESCE($7,usage_limit), start_date=COALESCE($8,start_date), end_date=COALESCE($9,end_date) WHERE id=$1',
        [id, title||null, description||null, discount_type||null, discount_value||null, code?code.toUpperCase():null, usage_limit||null, start_date||null, end_date||null]
      );
    }
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    await query('DELETE FROM promotions WHERE id=$1', [req.body.id]);
    return res.json({ ok: true });
  }
  res.status(405).end();
}
