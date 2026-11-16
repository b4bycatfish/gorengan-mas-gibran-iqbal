import { Router } from 'express';
import { queryOne } from '../db.js';
import { AppError, asyncHandler } from '../lib/http.js';

const router = Router();

/** GET /api/images/:id — menyajikan gambar unggahan yang tersimpan di database. */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError(400, 'ID gambar tidak valid.');

    const row = await queryOne('SELECT mime, bytes FROM product_images WHERE id = ?', [id]);
    if (!row) throw new AppError(404, 'Gambar tidak ditemukan.');

    res.set('Content-Type', row.mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.isBuffer(row.bytes) ? row.bytes : Buffer.from(row.bytes));
  }),
);

export default router;
