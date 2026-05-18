import { initSchema, query, nanoid } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const key = req.query.key;
  if (key !== process.env.JWT_SECRET?.slice(0, 16)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await initSchema();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@forsync.com';
    const existing = await query('SELECT id FROM users WHERE email=$1 LIMIT 1', [adminEmail]);
    if (existing.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await query('INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
        [nanoid(), adminEmail, 'Administrador', hash, 'admin']);
    }
    const promos = await query('SELECT id FROM promotions LIMIT 1');
    if (promos.length === 0) {
      await query(
        "INSERT INTO promotions (id,title,description,discount_type,discount_value,code,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [nanoid(), 'Lanzamiento ForSync', '20% de descuento en tu primer proyecto', 'percentage', 20, 'FORSYNC20', true]
      );
    }
    res.json({ ok: true, message: 'Schema creado y datos iniciales insertados.' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
