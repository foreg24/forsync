// api/_db.js — Neon Postgres client
// Usa neon() con .query() para compatibilidad con CommonJS de Vercel
import { neon } from '@neondatabase/serverless';

let _db = null;

export function getDb() {
  if (!_db) _db = neon(process.env.DATABASE_URL);
  return _db;
}

// Wrapper que convierte tagged template a .query() normal
// Uso: await query('SELECT * FROM users WHERE id = $1', [id])
export async function query(sql, params) {
  const db = getDb();
  return db(sql, params || []);
}

export async function initSchema() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT,
      password_hash TEXT, provider TEXT DEFAULT 'email',
      role TEXT DEFAULT 'user', phone TEXT, city TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL, price INTEGER NOT NULL, promo_price INTEGER,
      description TEXT NOT NULL, features JSONB DEFAULT '[]',
      delivery_days INTEGER NOT NULL, status TEXT DEFAULT 'active',
      image TEXT, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL,
      user_id TEXT REFERENCES users(id), customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL, customer_phone TEXT,
      items JSONB NOT NULL DEFAULT '[]', total INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', payment_status TEXT DEFAULT 'pending',
      payment_method TEXT, paypal_reference TEXT, cancel_reason TEXT,
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
      customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
      customer_phone TEXT, project_type TEXT NOT NULL, description TEXT NOT NULL,
      budget_range TEXT, deadline TEXT, status TEXT DEFAULT 'pending',
      admin_notes TEXT, quote_amount INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
      subject TEXT, message TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
      customer_name TEXT NOT NULL, customer_email TEXT,
      rating INTEGER NOT NULL, comment TEXT NOT NULL, service_type TEXT,
      is_approved BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      discount_type TEXT NOT NULL, discount_value INTEGER NOT NULL,
      code TEXT UNIQUE, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
      usage_limit INTEGER, usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE TABLE IF NOT EXISTS promo_usage (
      id TEXT PRIMARY KEY, promo_id TEXT NOT NULL, user_id TEXT NOT NULL,
      used_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(promo_id, user_id))`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT`
  ];
  for (const sql of tables) {
    await query(sql);
  }
}

export function nanoid() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}
