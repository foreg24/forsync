import { query, nanoid } from './_db.js';
import { signToken, verifyToken, setSessionCookie, clearSessionCookie, getSessionUser } from './_auth.js';
import { parse as parseCookies, serialize } from 'cookie';
import bcrypt from 'bcryptjs';

function ok(res, data, status) { res.status(status||200).json(data); }
function err(res, msg, status) { res.status(status||400).json({ error: msg }); }

export default async function handler(req, res) {
  const action = req.query.action;
  const method = req.method;

  // GET me
  if (action === 'me') {
    const user = await getSessionUser(req);
    if (!user) return err(res, 'No autenticado', 401);
    return ok(res, { user });
  }

  // POST login
  if (action === 'login' && method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return err(res, 'Faltan campos');
    const rows = await query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user || !user.password_hash) return err(res, 'Correo o contraseña incorrectos');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return err(res, 'Correo o contraseña incorrectos');
    const token = await signToken({ id:user.id, email:user.email, name:user.name, role:user.role });
    setSessionCookie(res, token);
    return ok(res, { user: { id:user.id, email:user.email, name:user.name, role:user.role } });
  }

  // POST register
  if (action === 'register' && method === 'POST') {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) return err(res, 'Faltan campos');
    if (password.length < 6) return err(res, 'Contraseña mínimo 6 caracteres');
    const existing = await query('SELECT id FROM users WHERE email=$1 LIMIT 1', [email.toLowerCase().trim()]);
    if (existing.length > 0) return err(res, 'Este correo ya está registrado');
    const hash = await bcrypt.hash(password, 10);
    const id = nanoid();
    await query('INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
      [id, email.toLowerCase().trim(), name.trim(), hash, 'user']);
    const token = await signToken({ id, email:email.toLowerCase().trim(), name:name.trim(), role:'user' });
    setSessionCookie(res, token);
    return ok(res, { user: { id, email, name, role:'user' } }, 201);
  }

  // POST logout
  if (action === 'logout') {
    clearSessionCookie(res);
    return ok(res, { ok: true });
  }

  // GET google — inicia OAuth
  if (action === 'google') {
    const appUrl = process.env.APP_URL || 'https://forsync.vercel.app';
    const redirect = encodeURIComponent(`${appUrl}/api/auth?action=callback`);
    const state = Math.random().toString(36).slice(2);
    res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=select_account`;
    return res.redirect(302, url);
  }

  // GET callback — Google OAuth callback
  if (action === 'callback') {
    const { code, state, error } = req.query;
    const appUrl = process.env.APP_URL || 'https://forsync.vercel.app';
    if (error || !code) return res.redirect(302, `${appUrl}/login?error=oauth_denied`);
    const cookies = parseCookies(req.headers.cookie || '');
    if (state !== cookies.oauth_state) return res.redirect(302, `${appUrl}/login?error=invalid_state`);
    try {
      const redirect = `${appUrl}/api/auth?action=callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({ code, client_id:process.env.GOOGLE_CLIENT_ID, client_secret:process.env.GOOGLE_CLIENT_SECRET, redirect_uri:redirect, grant_type:'authorization_code' })
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) throw new Error('No access token');
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers:{ Authorization:`Bearer ${tokens.access_token}` } });
      const gUser = await userRes.json();
      if (!gUser.email) throw new Error('No email');
      let rows = await query('SELECT * FROM users WHERE email=$1 LIMIT 1', [gUser.email]);
      let user = rows[0];
      if (!user) {
        const id = nanoid();
        await query('INSERT INTO users (id,email,name,provider,role) VALUES ($1,$2,$3,$4,$5)',
          [id, gUser.email, gUser.name||gUser.email, 'google', 'user']);
        rows = await query('SELECT * FROM users WHERE id=$1 LIMIT 1', [id]);
        user = rows[0];
      }
      const token = await signToken({ id:user.id, email:user.email, name:user.name, role:user.role });
      res.setHeader('Set-Cookie', [
        serialize('fs_token', token, { httpOnly:true, secure:true, sameSite:'lax', maxAge:60*60*24*30, path:'/' }),
        'oauth_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'
      ]);
      return res.redirect(302, user.role === 'admin' ? `${appUrl}/admin` : `${appUrl}/`);
    } catch(e) {
      console.error('OAuth error:', e);
      return res.redirect(302, `${process.env.APP_URL||'https://forsync.vercel.app'}/login?error=oauth_failed`);
    }
  }

  // GET|PATCH profile
  if (action === 'profile') {
    const session = await getSessionUser(req);
    if (!session) return err(res, 'No autenticado', 401);
    if (method === 'GET') {
      const rows = await query('SELECT id,email,name,phone,city,role FROM users WHERE id=$1 LIMIT 1', [session.id]);
      return ok(res, { user: rows[0] });
    }
    if (method === 'PATCH') {
      const { name, phone, city, password, new_password } = req.body || {};
      if (new_password) {
        if (!password) return err(res, 'Se requiere la contraseña actual');
        const rows = await query('SELECT password_hash FROM users WHERE id=$1 LIMIT 1', [session.id]);
        if (!rows[0]?.password_hash) return err(res, 'Cuenta Google no puede cambiar contraseña aquí');
        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) return err(res, 'Contraseña actual incorrecta');
        const hash = await bcrypt.hash(new_password, 10);
        await query('UPDATE users SET password_hash=$2 WHERE id=$1', [session.id, hash]);
      }
      await query('UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone), city=COALESCE($4,city) WHERE id=$1',
        [session.id, name||null, phone||null, city||null]);
      const updated = await query('SELECT id,email,name,role FROM users WHERE id=$1 LIMIT 1', [session.id]);
      const u = updated[0];
      const newToken = await signToken({ id:u.id, email:u.email, name:u.name, role:u.role });
      setSessionCookie(res, newToken);
      return ok(res, { ok:true, user:u });
    }
  }

  // POST reset-request
  if (action === 'reset-request' && method === 'POST') {
    const { email } = req.body || {};
    if (!email) return err(res, 'Falta el correo');
    const rows = await query('SELECT id,email FROM users WHERE email=$1 LIMIT 1', [email.toLowerCase()]);
    if (!rows.length) return ok(res, { ok:true });
    const token = await signToken({ id:rows[0].id, email:rows[0].email, type:'reset' });
    const link = `${process.env.APP_URL||'https://forsync.vercel.app'}/reset-password?token=${token}`;
    console.log('[RESET LINK]', link);
    return ok(res, { ok:true, _dev_link: link });
  }

  // POST reset-password
  if (action === 'reset-password' && method === 'POST') {
    const { token, password } = req.body || {};
    if (!token || !password || password.length < 6) return err(res, 'Datos inválidos');
    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'reset') return err(res, 'Token inválido o expirado');
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash=$2 WHERE id=$1', [payload.id, hash]);
    return ok(res, { ok:true });
  }

  // POST delete-account
  if (action === 'delete-account' && method === 'POST') {
    const session = await getSessionUser(req);
    if (!session) return err(res, 'No autenticado', 401);
    const { password } = req.body || {};
    if (!password) return err(res, 'Falta la contraseña');
    const rows = await query('SELECT password_hash FROM users WHERE id=$1 LIMIT 1', [session.id]);
    if (!rows[0]) return err(res, 'Usuario no encontrado', 404);
    if (rows[0].password_hash) {
      const valid = await bcrypt.compare(password, rows[0].password_hash);
      if (!valid) return err(res, 'Contraseña incorrecta');
    }
    await query('DELETE FROM orders  WHERE user_id=$1', [session.id]);
    await query('DELETE FROM quotes  WHERE user_id=$1', [session.id]);
    await query('DELETE FROM reviews WHERE user_id=$1', [session.id]);
    await query('DELETE FROM users   WHERE id=$1',      [session.id]);
    clearSessionCookie(res);
    return ok(res, { ok:true });
  }

  err(res, 'Acción no encontrada', 404);
}
