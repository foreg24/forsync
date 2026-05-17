// api/auth.js — Toda la autenticación en una función
// Rutas por query param ?action=...
// GET  ?action=me
// POST ?action=login
// POST ?action=register
// POST ?action=logout
// GET  ?action=google        → redirige a Google
// GET  ?action=callback      → callback de Google OAuth
// GET  ?action=profile
// PATCH ?action=profile
// POST ?action=reset-request
// POST ?action=reset-password

import { sql, nanoid } from './_db.js';
import { signToken, verifyToken, setSessionCookie, clearSessionCookie, getSessionUser } from './_auth.js';
import { parse as parseCookies, serialize } from 'cookie';
import bcrypt from 'bcryptjs';

function json(res, data, status) { res.status(status || 200).json(data); }
function err(res, msg, status)   { res.status(status || 400).json({ error: msg }); }

export default async function handler(req, res) {
  const action = req.query.action;
  const method = req.method;

  // ── GET /api/auth?action=me ──────────────────────────────
  if (action === 'me') {
    const user = await getSessionUser(req);
    if (!user) return err(res, 'No autenticado', 401);
    return json(res, { user });
  }

  // ── POST /api/auth?action=login ──────────────────────────
  if (action === 'login' && method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return err(res, 'Faltan campos');
    const db = sql();
    const rows = await db`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    const user = rows[0];
    if (!user || !user.password_hash) return err(res, 'Correo o contraseña incorrectos');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return err(res, 'Correo o contraseña incorrectos');
    const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    setSessionCookie(res, token);
    return json(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  // ── POST /api/auth?action=register ──────────────────────
  if (action === 'register' && method === 'POST') {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) return err(res, 'Faltan campos');
    if (password.length < 6) return err(res, 'Contraseña mínimo 6 caracteres');
    const db = sql();
    const existing = await db`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    if (existing.length > 0) return err(res, 'Este correo ya está registrado');
    const hash = await bcrypt.hash(password, 10);
    const id = nanoid();
    await db`INSERT INTO users (id, email, name, password_hash, role)
             VALUES (${id}, ${email.toLowerCase().trim()}, ${name.trim()}, ${hash}, 'user')`;
    const token = await signToken({ id, email: email.toLowerCase().trim(), name: name.trim(), role: 'user' });
    setSessionCookie(res, token);
    return json(res, { user: { id, email, name, role: 'user' } }, 201);
  }

  // ── POST /api/auth?action=logout ─────────────────────────
  if (action === 'logout') {
    clearSessionCookie(res);
    return json(res, { ok: true });
  }

  // ── GET /api/auth?action=google ──────────────────────────
  if (action === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl   = process.env.APP_URL || 'https://forsync.vercel.app';
    const redirect = encodeURIComponent(`${appUrl}/api/auth?action=callback`);
    const state    = Math.random().toString(36).slice(2);
    res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirect}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=select_account`;
    return res.redirect(302, url);
  }

  // ── GET /api/auth?action=callback ────────────────────────
  if (action === 'callback') {
    const { code, state, error } = req.query;
    const appUrl = process.env.APP_URL || 'https://forsync.vercel.app';
    if (error || !code) return res.redirect(302, `${appUrl}/login?error=oauth_denied`);
    const cookies = parseCookies(req.headers.cookie || '');
    if (state !== cookies.oauth_state) return res.redirect(302, `${appUrl}/login?error=invalid_state`);
    try {
      const redirect = `${appUrl}/api/auth?action=callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' })
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) throw new Error('No access token');
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const gUser = await userRes.json();
      if (!gUser.email) throw new Error('No email from Google');
      const db = sql();
      let rows = await db`SELECT * FROM users WHERE email = ${gUser.email} LIMIT 1`;
      let user = rows[0];
      if (!user) {
        const id = nanoid();
        await db`INSERT INTO users (id, email, name, provider, role) VALUES (${id}, ${gUser.email}, ${gUser.name || gUser.email}, 'google', 'user')`;
        rows = await db`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
        user = rows[0];
      }
      const token = await signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      // Setear sesión y limpiar oauth_state en una sola respuesta
      res.setHeader('Set-Cookie', [
        serialize('fs_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60*60*24*30, path: '/' }),
        'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
      ]);
      return res.redirect(302, user.role === 'admin' ? `${appUrl}/admin` : `${appUrl}/`);
    } catch(e) {
      console.error('OAuth error:', e);
      return res.redirect(302, `${(process.env.APP_URL||'https://forsync.vercel.app')}/login?error=oauth_failed`);
    }
  }

  // ── GET|PATCH /api/auth?action=profile ───────────────────
  if (action === 'profile') {
    const session = await getSessionUser(req);
    if (!session) return err(res, 'No autenticado', 401);
    const db = sql();
    if (method === 'GET') {
      const rows = await db`SELECT id, email, name, phone, city, role FROM users WHERE id = ${session.id} LIMIT 1`;
      return json(res, { user: rows[0] });
    }
    if (method === 'PATCH') {
      const { name, phone, city, password, new_password } = req.body || {};
      if (new_password) {
        if (!password) return err(res, 'Se requiere la contraseña actual');
        const rows = await db`SELECT password_hash FROM users WHERE id = ${session.id} LIMIT 1`;
        if (!rows[0]?.password_hash) return err(res, 'Cuenta Google no puede cambiar contraseña aquí');
        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) return err(res, 'Contraseña actual incorrecta');
        const hash = await bcrypt.hash(new_password, 10);
        await db`UPDATE users SET password_hash = ${hash} WHERE id = ${session.id}`;
      }
      await db`UPDATE users SET
        name  = COALESCE(${name  || null}, name),
        phone = COALESCE(${phone || null}, phone),
        city  = COALESCE(${city  || null}, city)
        WHERE id = ${session.id}`;
      const updated = await db`SELECT id, email, name, role FROM users WHERE id = ${session.id} LIMIT 1`;
      const u = updated[0];
      const newToken = await signToken({ id: u.id, email: u.email, name: u.name, role: u.role });
      setSessionCookie(res, newToken);
      return json(res, { ok: true, user: u });
    }
  }

  // ── POST /api/auth?action=reset-request ─────────────────
  if (action === 'reset-request' && method === 'POST') {
    const { email } = req.body || {};
    if (!email) return err(res, 'Falta el correo');
    const db = sql();
    const rows = await db`SELECT id, email FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (!rows.length) return json(res, { ok: true }); // no revelar si existe
    const token = await signToken({ id: rows[0].id, email: rows[0].email, type: 'reset' });
    const appUrl = process.env.APP_URL || 'https://forsync.vercel.app';
    const link = `${appUrl}/reset-password?token=${token}`;
    console.log('[RESET LINK]', link); // TODO: enviar por email real
    return json(res, { ok: true, _dev_link: link });
  }

  // ── POST /api/auth?action=reset-password ─────────────────
  if (action === 'reset-password' && method === 'POST') {
    const { token, password } = req.body || {};
    if (!token || !password) return err(res, 'Faltan campos');
    if (password.length < 6) return err(res, 'Mínimo 6 caracteres');
    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'reset') return err(res, 'Token inválido o expirado');
    const hash = await bcrypt.hash(password, 10);
    await sql()`UPDATE users SET password_hash = ${hash} WHERE id = ${payload.id}`;
    return json(res, { ok: true });
  }

  err(res, 'Acción no encontrada', 404);
}
