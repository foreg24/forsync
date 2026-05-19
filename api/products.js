import { query, nanoid } from './_db.js';
import { getSessionUser } from './_auth.js';

async function requireAdmin(req, res) {
  const u = await getSessionUser(req);
  if (!u) { res.status(401).json({ error: 'No autenticado' }); return null; }
  if (u.role !== 'admin') { res.status(403).json({ error: 'Acceso denegado' }); return null; }
  return u;
}

export default async function handler(req, res) {
  if (req.method === 'GET' && !req.query.admin) {
    const rows = await query("SELECT * FROM products WHERE status = 'active' ORDER BY sort_order ASC, created_at ASC");
    return res.json({ products: rows });
  }
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const rows = await query('SELECT * FROM products ORDER BY sort_order ASC');
    return res.json({ products: rows });
  }
  if (req.method === 'POST') {
    const { name, category, price, promo_price, description, features, delivery_days, image } = req.body || {};
    if (!name || !category || !price || !description || !delivery_days) return res.status(400).json({ error: 'Faltan campos' });
    const id = nanoid();
    const slug = name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    const maxOrder = await query('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM products');
    await query(
      'INSERT INTO products (id,name,slug,category,price,promo_price,description,features,delivery_days,image,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [id, name, slug, category, price, promo_price||null, description, JSON.stringify(features||[]), delivery_days, image||'fa-solid fa-code', maxOrder[0].n]
    );
    const rows = await query('SELECT * FROM products WHERE id = $1', [id]);
    return res.status(201).json({ ok: true, product: rows[0] });
  }
  if (req.method === 'PATCH') {
    const { id, status, price, promo_price, name, description, delivery_days, features } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await query(
      'UPDATE products SET status=COALESCE($2,status), price=COALESCE($3,price), promo_price=COALESCE($4,promo_price), name=COALESCE($5,name), description=COALESCE($6,description), delivery_days=COALESCE($7,delivery_days) WHERE id=$1',
      [id, status||null, price||null, promo_price||null, name||null, description||null, delivery_days||null]
    );
    const rows = await query('SELECT * FROM products WHERE id = $1', [id]);
    return res.json({ ok: true, product: rows[0] });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Falta el id' });
    await query('DELETE FROM products WHERE id = $1', [id]);
    // Return the deleted id so clients can purge it from their carts
    return res.json({ ok: true, deleted_id: id });
  }
  res.status(405).end();
}