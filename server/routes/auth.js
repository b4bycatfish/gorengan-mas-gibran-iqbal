import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { query, queryOne } from '../db.js';
import { AppError, asyncHandler } from '../lib/http.js';
import {
  clearAuthCookie,
  optionalAuth,
  publicUser,
  setAuthCookie,
  signToken,
} from '../lib/auth.js';
import { validateEmail, validateName, validatePassword } from '../lib/validate.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan masuk. Coba lagi beberapa menit lagi.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak pendaftaran dari alamat ini. Coba lagi nanti.' },
});

router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const name = validateName(req.body?.name);
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);

    if (!name) throw new AppError(400, 'Nama wajib diisi, 2–80 karakter.');
    if (!email) throw new AppError(400, 'Alamat email tidak valid.');
    if (!password) throw new AppError(400, 'Kata sandi minimal 8 karakter.');

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) throw new AppError(409, 'Email sudah terdaftar. Silakan masuk.');

    // Pendaftaran publik selalu menjadi pembeli; seller/admin dibuat oleh admin.
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'buyer')`,
      [name, email, hash],
    );

    const user = await queryOne(
      `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
         FROM users WHERE id = ?`,
      [result.insertId],
    );

    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: publicUser(user) });
  }),
);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const email = validateEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) throw new AppError(400, 'Email dan kata sandi wajib diisi.');

    const user = await queryOne(
      `SELECT id, name, email, role, password_hash, phone, store_name, store_description,
              is_active, created_at
         FROM users WHERE email = ?`,
      [email],
    );

    const hash = user?.password_hash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
    const match = await bcrypt.compare(password, hash);
    if (!user || !match) throw new AppError(401, 'Email atau kata sandi salah.');
    if (!Number(user.is_active)) throw new AppError(403, 'Akun Anda dinonaktifkan oleh admin.');

    setAuthCookie(res, signToken(user));
    res.json({ user: publicUser(user) });
  }),
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', optionalAuth, (req, res) => {
  // Tanpa sesi tetap 200 agar katalog publik tidak menghasilkan galat di console.
  res.json({ user: req.user ? publicUser(req.user) : null });
});

export default router;
