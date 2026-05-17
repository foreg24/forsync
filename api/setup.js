// api/setup.js — Inicializa el schema y datos por defecto
// Llamar UNA VEZ: GET https://forsync.vercel.app/api/setup?key=SETUP_SECRET
import { initSchema, sql, nanoid } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Proteger con una clave para que nadie más lo llame
  const key = req.query.key;
  if (key !== process.env.JWT_SECRET?.slice(0, 16)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await initSchema();
    const db = sql();

    // Insertar admin si no existe
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@forsync.com';
    const existing = await db`SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1`;
    if (existing.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await db`
        INSERT INTO users (id, email, name, password_hash, role)
        VALUES (${nanoid()}, ${adminEmail}, 'Administrador', ${hash}, 'admin')
      `;
    }

    // Insertar promo por defecto si no existe
    const promos = await db`SELECT id FROM promotions LIMIT 1`;
    if (promos.length === 0) {
      await db`
        INSERT INTO promotions (id, title, description, discount_type, discount_value, code, is_active)
        VALUES (${nanoid()}, 'Lanzamiento ForSync', '20% de descuento en tu primer proyecto',
                'percentage', 20, 'FORSYNC20', true)
      `;
    }

    res.json({ ok: true, message: 'Schema creado y datos iniciales insertados.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
