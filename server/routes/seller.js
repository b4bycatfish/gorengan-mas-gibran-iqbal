import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { AppError, asyncHandler } from '../lib/http.js';
import { authenticate, publicUser, requireRole } from '../lib/auth.js';
import { normalizePhone } from '../lib/validate.js';
import { mapProduct } from './products.js';

const router = Router();

// Semua endpoint di bawah ini hanya untuk seller yang sudah masuk.
router.use(authenticate, requireRole('seller'));

/** Ringkasan toko: jumlah produk, total stok, jumlah kategori. */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [stats] = await query(
      `SELECT COUNT(*) AS productCount,
              COALESCE(SUM(stok), 0) AS totalStock,
              COUNT(DISTINCT kategori) AS categoryCount,
              COALESCE(SUM(stok = 0), 0) AS outOfStock
         FROM products WHERE seller_id = ?`,
      [req.user.id],
    );

    res.json({
      store: {
        name: req.user.store_name,
        description: req.user.store_description,
        phone: req.user.phone,
      },
      stats: {
        productCount: Number(stats.productCount),
        totalStock: Number(stats.totalStock),
        categoryCount: Number(stats.categoryCount),
        outOfStock: Number(stats.outOfStock),
      },
    });
  }),
);

/** Seluruh produk milik seller (termasuk yang tidak tampil di katalog publik). */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').toString().trim().slice(0, 80);
    const where = ['p.seller_id = ?'];
    const params = [req.user.id];
    if (q) {
      where.push('(p.nama LIKE ? OR p.kategori LIKE ?)');
      const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      params.push(like, like);
    }

    const rows = await query(
      `SELECT p.*, u.store_name, u.phone, u.store_description
         FROM products p JOIN users u ON u.id = p.seller_id
        WHERE ${where.join(' AND ')}
        ORDER BY p.unggulan DESC, p.nama ASC`,
      params,
    );

    res.json({ items: rows.map(mapProduct) });
  }),
);

/** Ubah profil toko dan nomor WhatsApp tujuan pemesanan. */
router.put(
  '/store',
  asyncHandler(async (req, res) => {
    const storeName = typeof req.body?.storeName === 'string' ? req.body.storeName.trim() : '';
    const description =
      typeof req.body?.storeDescription === 'string' ? req.body.storeDescription.trim() : '';
    const phone = normalizePhone(req.body?.phone);

    if (storeName.length < 2 || storeName.length > 120) {
      throw new AppError(400, 'Nama toko wajib diisi, 2–120 karakter.');
    }
    if (!phone) {
      throw new AppError(400, 'Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890.');
    }
    if (description.length > 255) {
      throw new AppError(400, 'Deskripsi toko maksimal 255 karakter.');
    }

    await query(
      `UPDATE users SET store_name = ?, store_description = ?, phone = ? WHERE id = ?`,
      [storeName, description, phone, req.user.id],
    );

    const user = await queryOne(
      `SELECT id, name, email, role, phone, store_name, store_description, is_active, created_at
         FROM users WHERE id = ?`,
      [req.user.id],
    );
    res.json({ user: publicUser(user) });
  }),
);

export default router;
