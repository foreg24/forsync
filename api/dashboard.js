import { query } from './_db.js';
import { getSessionUser } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getSessionUser(req);
  if (!session) return res.status(401).json({ error: 'No autenticado' });
  if (session.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });

  const [orders, quotes, messages, reviews, products] = await Promise.all([
    query('SELECT * FROM orders ORDER BY created_at DESC'),
    query('SELECT * FROM quotes ORDER BY created_at DESC'),
    query('SELECT * FROM contacts ORDER BY created_at DESC'),
    query('SELECT * FROM reviews ORDER BY created_at DESC'),
    query('SELECT * FROM products ORDER BY sort_order ASC')
  ]);

  res.json({
    stats: {
      totalSales:     orders.reduce((s,o) => s+(o.total||0), 0),
      pendingOrders:  orders.filter(o => o.status==='pending').length,
      unreadMessages: messages.filter(m => !m.is_read).length,
      activeProducts: products.filter(p => p.status==='active').length,
      totalOrders:    orders.length,
      totalQuotes:    quotes.length
    },
    orders:   orders.slice(0,50),
    quotes:   quotes.slice(0,50),
    messages: messages.slice(0,50),
    reviews,
    products
  });
}
