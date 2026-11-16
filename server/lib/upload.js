import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { query } from '../db.js';
import { AppError } from './http.js';

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);
export const IMAGE_URL_PREFIX = '/api/images/';

/**
 * Unggahan disimpan di database, bukan di disk: hosting serverless (Vercel)
 * memakai filesystem read-only dan tidak menyimpan berkas antar-permintaan.
 */
const parse = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      const err = new AppError(400, 'Berkas harus berupa gambar PNG, JPG, atau WebP.');
      err.code = 'FILE_TYPE';
      return cb(err);
    }
    return cb(null, true);
  },
}).single('image');

async function saveImage(file) {
  const id = randomUUID();
  await query('INSERT INTO product_images (id, mime, bytes) VALUES (?, ?, ?)', [
    id,
    file.mimetype,
    file.buffer,
  ]);
  return `${IMAGE_URL_PREFIX}${id}`;
}

/** Middleware: menerima berkas `image`, menyimpannya, lalu menaruh URL di `req.uploadedImageUrl`. */
export const uploadImage = (req, res, next) => {
  parse(req, res, (err) => {
    if (err) return next(err);
    if (!req.file) return next();
    return saveImage(req.file)
      .then((url) => {
        req.uploadedImageUrl = url;
        next();
      })
      .catch(next);
  });
};

/** Hapus gambar unggahan dari database (hanya URL hasil unggahan). */
export async function removeUploadedFile(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith(IMAGE_URL_PREFIX)) return;
  const id = imageUrl.slice(IMAGE_URL_PREFIX.length);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await query('DELETE FROM product_images WHERE id = ?', [id]).catch(() => {});
}
