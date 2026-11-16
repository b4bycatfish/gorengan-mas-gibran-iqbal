import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'dotenv/config';

import { pool } from './db.js';
import { getJwtSecret } from './lib/auth.js';
import { errorHandler, notFoundHandler } from './lib/http.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import imageRoutes from './routes/images.js';
import sellerRoutes from './routes/seller.js';
import adminRoutes from './routes/admin.js';

/**
 * Membangun instance Express tanpa membuka port.
 * Dipakai server lokal (server/index.js) dan Vercel Function (api/index.js).
 */
export function createApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  getJwtSecret(); // gagal cepat bila konfigurasi belum lengkap

  if (isProd) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/images', imageRoutes);
  app.use('/api/seller', sellerRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ ok: true, database: 'up' });
    } catch {
      res.status(503).json({ ok: false, database: 'down' });
    }
  });

  // Gambar lama yang masih tersimpan di disk (sebelum unggahan pindah ke database).
  app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d', index: false }));
  app.use(express.static(path.resolve('public'), { extensions: ['html'] }));

  app.use('/api', notFoundHandler);
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
  });
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
