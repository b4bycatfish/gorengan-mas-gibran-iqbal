/** Galat dengan status HTTP yang jelas. */
export class AppError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Membungkus handler async agar galat diteruskan ke error handler Express. */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Data sudah terdaftar. Gunakan nilai lain.' });
  }
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran gambar maksimal 5 MB.' });
  }
  if (err?.name === 'MulterError' || err?.code === 'FILE_TYPE') {
    return res.status(400).json({ error: err.message || 'Berkas gambar tidak valid.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Data terlalu besar.' });
  }
  console.error('[server]', err);
  return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
}
