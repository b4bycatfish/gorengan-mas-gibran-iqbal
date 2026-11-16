import { Router } from 'express';
import { query, queryOne } from '../db.js';
import { AppError, asyncHandler } from '../lib/http.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validateImageUrl, validateProduct } from '../lib/validate.js';
import { removeUploadedFile, uploadImage } from '../lib/upload.js';

const router = Router();

const SORTS = {
  'nama-asc': 'p.nama ASC',
  'nama-desc': 'p.nama DESC',
  'harga-asc': 'p.harga ASC, p.nama ASC',
  'harga-desc': 'p.harga DESC, p.nama ASC',
  'stok-desc': 'p.stok DESC, p.nama ASC',
  terbaru: 'p.created_at DESC, p.id DESC',
};

export function mapProduct(row) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    nama: row.nama,
    kategori: row.kategori,
    harga: Number(row.harga),
    stok: Number(row.stok),
    deskripsi: row.deskripsi,
    imageUrl: row.image_url || null,
    unggulan: Boolean(Number(row.unggulan)),
    seller: row.store_name
      ? {
          id: row.seller_id,
          storeName: row.store_name,
          phone: row.phone,
          description: row.store_description,
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_WITH_SELLER = `
  SELECT p.*, u.store_name, u.phone, u.store_description
    FROM products p
    JOIN users u ON u.id = p.seller_id
   WHERE u.role = 'seller' AND u.is_active = 1
`;

/** GET /api/products — katalog publik dengan pencarian, filter, sorting, paginasi. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').toString().trim().slice(0, 80);
    const kategori = (req.query.kategori || '').toString().trim().slice(0, 30);
    const sellerId = Number.parseInt(req.query.sellerId, 10);
    const sortKey = SORTS[req.query.sort] ? req.query.sort : 'unggulan';
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));

    const where = [];
    const params = [];

    if (q) {
      where.push('(p.nama LIKE ? OR p.deskripsi LIKE ?)');
      const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
      params.push(like, like);
    }
    if (kategori) {
      where.push('p.kategori = ?');
      params.push(kategori);
    }
    if (Number.isInteger(sellerId) && sellerId > 0) {
      where.push('p.seller_id = ?');
      params.push(sellerId);
    }

    const whereSql = where.length ? ` AND ${where.join(' AND ')}` : '';
    const orderSql = sortKey === 'unggulan'
      ? 'p.unggulan DESC, p.nama ASC'
      : SORTS[sortKey];

    const rows = await query(
      `${SELECT_WITH_SELLER}${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM products p
         JOIN users u ON u.id = p.seller_id
        WHERE u.role = 'seller' AND u.is_active = 1${whereSql}`,
      params,
    );

    const categories = await query(
      `SELECT DISTINCT p.kategori FROM products p
         JOIN users u ON u.id = p.seller_id
        WHERE u.role = 'seller' AND u.is_active = 1
        ORDER BY p.kategori ASC`,
    );

    res.json({
      items: rows.map(mapProduct),
      total: Number(total),
      page,
      limit,
      categories: categories.map((c) => c.kategori),
    });
  }),
);

/** GET /api/products/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw new AppError(400, 'ID produk tidak valid.');
    const row = await queryOne(`${SELECT_WITH_SELLER} AND p.id = ?`, [id]);
    if (!row) throw new AppError(404, 'Produk tidak ditemukan.');
    res.json({ product: mapProduct(row) });
  }),
);

/** Menentukan nilai gambar akhir dari unggahan/URL/penghapusan. */
function resolveImage(req, existing = null) {
  if (req.file) {
    if (existing) removeUploadedFile(existing);
    return { value: `/uploads/${req.file.filename}` };
  }
  if (req.body?.imageUrl !== undefined) {
    const check = validateImageUrl(req.body.imageUrl);
    if (!check.ok) return { error: check.message };
    if (check.value !== existing) removeUploadedFile(existing);
    return { value: check.value };
  }
  return { value: existing };
}

function rejectFileOnError(req) {
  if (req.file) removeUploadedFile(`/uploads/${req.file.filename}`);
}

/** POST /api/products — hanya seller. */
router.post(
  '/',
  authenticate,
  requireRole('seller'),
  uploadImage,
  asyncHandler(async (req, res) => {
    const { values, errors } = validateProduct(req.body);
    const image = resolveImage(req);
    if (image.error) errors.imageUrl = image.error;

    if (Object.keys(errors).length) {
      rejectFileOnError(req);
      throw new AppError(400, 'Data produk belum valid.', errors);
    }

    const result = await query(
      `INSERT INTO products (seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        values.nama,
        values.kategori,
        values.harga,
        values.stok,
        values.deskripsi,
        image.value,
        values.unggulan ? 1 : 0,
      ],
    );

    const row = await queryOne(`${SELECT_WITH_SELLER} AND p.id = ?`, [result.insertId]);
    res.status(201).json({ product: mapProduct(row) });
  }),
);

/** PUT /api/products/:id — seller pemilik produk. */
router.put(
  '/:id',
  authenticate,
  requireRole('seller'),
  uploadImage,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw new AppError(400, 'ID produk tidak valid.');

    const existing = await queryOne('SELECT id, seller_id, image_url FROM products WHERE id = ?', [id]);
    if (!existing) {
      rejectFileOnError(req);
      throw new AppError(404, 'Produk tidak ditemukan.');
    }
    if (existing.seller_id !== req.user.id) {
      rejectFileOnError(req);
      throw new AppError(403, 'Anda hanya dapat mengubah produk milik sendiri.');
    }

    const { values, errors } = validateProduct(req.body);
    const image = resolveImage(req, existing.image_url);
    if (image.error) errors.imageUrl = image.error;

    if (Object.keys(errors).length) {
      rejectFileOnError(req);
      throw new AppError(400, 'Data produk belum valid.', errors);
    }

    await query(
      `UPDATE products
          SET nama = ?, kategori = ?, harga = ?, stok = ?, deskripsi = ?, image_url = ?, unggulan = ?
        WHERE id = ? AND seller_id = ?`,
      [
        values.nama,
        values.kategori,
        values.harga,
        values.stok,
        values.deskripsi,
        image.value,
        values.unggulan ? 1 : 0,
        id,
        req.user.id,
      ],
    );

    const row = await queryOne(`${SELECT_WITH_SELLER} AND p.id = ?`, [id]);
    res.json({ product: mapProduct(row) });
  }),
);

/** DELETE /api/products/:id — seller pemilik produk. */
router.delete(
  '/:id',
  authenticate,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) throw new AppError(400, 'ID produk tidak valid.');

    const existing = await queryOne('SELECT id, seller_id, image_url FROM products WHERE id = ?', [id]);
    if (!existing) throw new AppError(404, 'Produk tidak ditemukan.');
    if (existing.seller_id !== req.user.id) {
      throw new AppError(403, 'Anda hanya dapat menghapus produk milik sendiri.');
    }

    await query('DELETE FROM products WHERE id = ?', [id]);
    removeUploadedFile(existing.image_url);
    res.json({ ok: true });
  }),
);

export default router;
