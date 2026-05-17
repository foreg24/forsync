// api/_auth.js — JWT helpers para todas las rutas
import { SignJWT, jwtVerify } from 'jose';
import { parse as parseCookies, serialize } from 'cookie';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(await secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, await secret());
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const cookieHeader = req.headers.cookie || req.headers.get?.('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  return cookies.fs_token || null;
}

export async function getSessionUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res, token) {
  const cookie = serialize('fs_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize('fs_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookie);
}

export function json(res, data, status = 200) {
  res.status(status).json(data);
}

export function err(res, msg, status = 400) {
  res.status(status).json({ error: msg });
}
