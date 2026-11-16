import jwt from 'jsonwebtoken';
import { queryOne } from '../db.js';
import { AppError, asyncHandler } from './http.js';

const COOKIE_NAME = 'gmg_token';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET belum diatur (minimal 16 karakter). Periksa berkas .env.');
  }
  return secret;
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, getJwtSecret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_TTL_SECONDS * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

function readToken(req) {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const header = req.get('authorization') || '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Memuat pengguna dari token dan menempelkannya pada `req.user`.
 * Token yang valid tetap ditolak bila akun sudah dinonaktifkan/dihapus.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new AppError(401, 'Silakan masuk terlebih dahulu.');

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    clearAuthCookie(res);
    throw new AppError(401, 'Sesi sudah berakhir. Silakan masuk kembali.');
  }

  const user = await queryOne(
    `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
       FROM users WHERE id = ?`,
    [payload.sub],
  );

  if (!user) {
    clearAuthCookie(res);
    throw new AppError(401, 'Akun tidak ditemukan.');
  }
  if (!Number(user.is_active)) {
    clearAuthCookie(res);
    throw new AppError(403, 'Akun Anda dinonaktifkan oleh admin.');
  }

  req.user = user;
  next();
});

/** Batasi endpoint ke peran tertentu. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, 'Silakan masuk terlebih dahulu.'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Anda tidak memiliki akses ke fitur ini.'));
    }
    return next();
  };
}

/** Cek login opsional: dipakai endpoint publik yang menampilkan info personal. */
export async function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await queryOne(
      `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
         FROM users WHERE id = ?`,
      [payload.sub],
    );
    if (user && Number(user.is_active)) req.user = user;
  } catch {
    // Abaikan token rusak pada endpoint opsional.
  }
  return next();
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    storeName: user.store_name,
    storeDescription: user.store_description,
    isActive: Boolean(Number(user.is_active)),
    createdAt: user.created_at,
  };
}

