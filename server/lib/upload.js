import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { AppError } from './http.js';

export const UPLOAD_DIR = path.resolve('uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${randomUUID()}${ALLOWED[file.mimetype]}`),
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      const err = new AppError(400, 'Berkas harus berupa gambar PNG, JPG, atau WebP.');
      err.code = 'FILE_TYPE';
      return cb(err);
    }
    return cb(null, true);
  },
}).single('image');

/** Hapus berkas unggahan lokal (hanya di dalam folder uploads). */
export function removeUploadedFile(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return;
  const name = path.basename(imageUrl);
  fs.promises.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
