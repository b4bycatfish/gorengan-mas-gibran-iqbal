import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db.js';
import { AppError, asyncHandler } from '../lib/http.js';
import { authenticate, publicUser, requireRole } from '../lib/auth.js';
import {
  normalizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validateRole,
} from '../lib/validate.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

async function countActiveAdmins(excludeId = null) {
  const [row] = await query(
    `SELECT COUNT(*) AS total FROM users
      WHERE role = 'admin' AND is_active = 1${excludeId ? ' AND id <> ?' : ''}`,
    excludeId ? [excludeId] : [],
  );
  return Number(row.total);
}

/** GET /api/admin/stats — ringkasan platform untuk admin. */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [users] = await query(
      `SELECT COUNT(*) AS totalUsers,
              COALESCE(SUM(role = 'admin'), 0) AS admins,
              COALESCE(SUM(role = 'seller'), 0) AS sellers,
              COALESCE(SUM(role = 'buyer'), 0) AS buyers,
              COALESCE(SUM(is_active = 0), 0) AS inactive
         FROM users`,
    );
    const [products] = await query(
      `SELECT COUNT(*) AS totalProducts, COALESCE(SUM(stok), 0) AS totalStock
         FROM products`,
    );

    res.json({
      users: {
        total: Number(users.totalUsers),
        admins: Number(users.admins),
        sellers: Number(users.sellers),
        buyers: Number(users.buyers),
        inactive: Number(users.inactive),
      },
      products: {
        total: Number(products.totalProducts),
        totalStock: Number(products.totalStock),
      },
    });
  }),
);

/** GET /api/admin/users — daftar pengguna dengan pencarian dan filter peran. */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').toString().trim().slice(0, 80);
    const role = validateRole(req.query.role);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));

    const where = [];
    const params = [];
    if (q) {
      where.push('(name LIKE ? OR email LIKE ?)');
      const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      params.push(like, like);
    }
    if (role) {
      where.push('role = ?');
      params.push(role);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.store_name, u.store_description,
              u.is_active, u.created_at,
              (SELECT COUNT(*) FROM products p WHERE p.seller_id = u.id) AS product_count
         FROM users u
         ${whereSql}
         ORDER BY FIELD(u.role, 'admin', 'seller', 'buyer'), u.name ASC
         LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    const [{ total }] = await query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);

    res.json({
      items: rows.map((row) => ({
        ...publicUser(row),
        productCount: Number(row.product_count),
      })),
      total: Number(total),
      page,
      limit,
    });
  }),
);

/** POST /api/admin/users — admin membuat akun dengan peran apa pun. */
router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const name = validateName(req.body?.name);
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const role = validateRole(req.body?.role);

    if (!name) throw new AppError(400, 'Nama wajib diisi, 2–80 karakter.');
    if (!email) throw new AppError(400, 'Alamat email tidak valid.');
    if (!password) throw new AppError(400, 'Kata sandi minimal 8 karakter.');
    if (!role) throw new AppError(400, 'Peran harus admin, seller, atau buyer.');

    const phoneRaw = req.body?.phone;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    if (phoneRaw && !phone) throw new AppError(400, 'Nomor WhatsApp tidak valid.');

    const storeName =
      typeof req.body?.storeName === 'string' ? req.body.storeName.trim().slice(0, 120) : null;
    if (role === 'seller' && storeName && storeName.length < 2) {
      throw new AppError(400, 'Nama toko minimal 2 karakter.');
    }

    const duplicate = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (duplicate) throw new AppError(409, 'Email sudah terdaftar.');

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, store_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hash, role, phone, role === 'seller' ? storeName || null : null],
    );

    const user = await queryOne(
      `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
         FROM users WHERE id = ?`,
      [result.insertId],
    );
    res.status(201).json({ user: publicUser(user) });
  }),
);

/** PATCH /api/admin/users/:id — ubah data, peran, status, atau kata sandi. */
router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw new AppError(400, 'ID pengguna tidak valid.');

    const existing = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) throw new AppError(404, 'Pengguna tidak ditemukan.');

    const fields = {};
    if (req.body?.name !== undefined) {
      const name = validateName(req.body.name);
      if (!name) throw new AppError(400, 'Nama wajib diisi, 2–80 karakter.');
      fields.name = name;
    }
    if (req.body?.email !== undefined) {
      const email = validateEmail(req.body.email);
      if (!email) throw new AppError(400, 'Alamat email tidak valid.');
      if (email !== existing.email) {
        const duplicate = await queryOne('SELECT id FROM users WHERE email = ? AND id <> ?', [email, id]);
        if (duplicate) throw new AppError(409, 'Email sudah dipakai pengguna lain.');
      }
      fields.email = email;
    }
    if (req.body?.role !== undefined) {
      const role = validateRole(req.body.role);
      if (!role) throw new AppError(400, 'Peran tidak valid.');
      if (id === req.user.id && role !== 'admin') {
        throw new AppError(400, 'Anda tidak dapat mengubah peran akun sendiri.');
      }
      if (existing.role === 'admin' && role !== 'admin' && Number(existing.is_active)) {
        const others = await countActiveAdmins(id);
        if (others === 0) throw new AppError(400, 'Harus ada minimal satu admin aktif.');
      }
      fields.role = role;
    }
    if (req.body?.phone !== undefined) {
      const phoneRaw = req.body.phone;
      const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
      if (phoneRaw && !phone) throw new AppError(400, 'Nomor WhatsApp tidak valid.');
      fields.phone = phone;
    }
    if (req.body?.storeName !== undefined) {
      const storeName = String(req.body.storeName || '').trim();
      if (storeName.length > 120) throw new AppError(400, 'Nama toko maksimal 120 karakter.');
      fields.store_name = storeName || null;
    }
    if (req.body?.storeDescription !== undefined) {
      const desc = String(req.body.storeDescription || '').trim();
      if (desc.length > 255) throw new AppError(400, 'Deskripsi toko maksimal 255 karakter.');
      fields.store_description = desc || null;
    }
    if (req.body?.isActive !== undefined) {
      const active = req.body.isActive === true || req.body.isActive === 'true' || req.body.isActive === 1;
      if (id === req.user.id && !active) {
        throw new AppError(400, 'Anda tidak dapat menonaktifkan akun sendiri.');
      }
      if (!active && existing.role === 'admin') {
        const others = await countActiveAdmins(id);
        if (others === 0) throw new AppError(400, 'Harus ada minimal satu admin aktif.');
      }
      fields.is_active = active ? 1 : 0;
    }
    if (req.body?.password !== undefined && req.body.password !== '') {
      const password = validatePassword(req.body.password);
      if (!password) throw new AppError(400, 'Kata sandi minimal 8 karakter.');
      fields.password_hash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(fields).length === 0) throw new AppError(400, 'Tidak ada perubahan untuk disimpan.');

    const assignments = Object.keys(fields).map((key) => `${key} = ?`).join(', ');
    await query(`UPDATE users SET ${assignments} WHERE id = ?`, [...Object.values(fields), id]);

    const user = await queryOne(
      `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
         FROM users WHERE id = ?`,
      [id],
    );
    res.json({ user: publicUser(user) });
  }),
);

/** DELETE /api/admin/users/:id — produk seller ikut terhapus lewat FK. */
router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw new AppError(400, 'ID pengguna tidak valid.');
    if (id === req.user.id) throw new AppError(400, 'Anda tidak dapat menghapus akun sendiri.');

    const existing = await queryOne('SELECT id, role, is_active FROM users WHERE id = ?', [id]);
    if (!existing) throw new AppError(404, 'Pengguna tidak ditemukan.');
    if (existing.role === 'admin' && Number(existing.is_active)) {
      const others = await countActiveAdmins(id);
      if (others === 0) throw new AppError(400, 'Harus ada minimal satu admin aktif.');
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ ok: true });
  }),
);

export default router;
