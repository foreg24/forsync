// api/products.js
// GET  /api/products              → listado público
// POST /api/products?admin=1      → crear (admin)
// PATCH /api/products?admin=1     → actualizar (admin)
// DELETE /api/products?admin=1    → eliminar (admin)

import { sql, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

async function requireAdmin(req, res) {
  const u = await getSessionUser(req);
  if (!u) { res.status(401).json({ error: 'No autenticado' }); return null; }
  if (u.role !== 'admin') { res.status(403).json({ error: 'Acceso denegado' }); return null; }
  return u;
}

export default async function handler(req, res) {
  const db = sql();

  // Público: GET sin admin
  if (req.method === 'GET' && !req.query.admin) {
    const rows = await db`SELECT * FROM products WHERE status = 'active' ORDER BY sort_order ASC, created_at ASC`;
    return res.json({ products: rows });
  }

  // Admin: requiere auth
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const rows = await db`SELECT * FROM products ORDER BY sort_order ASC`;
    return res.json({ products: rows });
  }

  if (req.method === 'POST') {
    const { name, category, price, promo_price, description, features, delivery_days, image } = req.body || {};
    if (!name || !category || !price || !description || !delivery_days) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const maxOrder = await db`SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM products`;
    await db`INSERT INTO products (id, name, slug, category, price, promo_price, description, features, delivery_days, image, sort_order)
             VALUES (${id}, ${name}, ${slug}, ${category}, ${price}, ${promo_price||null}, ${description}, ${JSON.stringify(features||[])}, ${delivery_days}, ${image||'fa-solid fa-code'}, ${maxOrder[0].n})`;
    const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    return res.status(201).json({ ok: true, product: rows[0] });
  }

  if (req.method === 'PATCH') {
    const { id, status, price, promo_price, name, description, delivery_days, features } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`UPDATE products SET
      status        = COALESCE(${status        || null}, status),
      price         = COALESCE(${price         || null}, price),
      promo_price   = COALESCE(${promo_price   || null}, promo_price),
      name          = COALESCE(${name          || null}, name),
      description   = COALESCE(${description   || null}, description),
      delivery_days = COALESCE(${delivery_days || null}, delivery_days),
      features      = COALESCE(${features ? JSON.stringify(features) : null}::jsonb, features)
      WHERE id = ${id}`;
    const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    return res.json({ ok: true, product: rows[0] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await db`DELETE FROM products WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
