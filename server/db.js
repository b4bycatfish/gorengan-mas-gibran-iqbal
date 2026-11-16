import mysql from 'mysql2/promise';
import 'dotenv/config';

export const DB_NAME = process.env.DB_NAME || 'gmg_toko';

const baseConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
};

/** Pool untuk database aplikasi (dipakai seluruh route). */
export const pool = mysql.createPool({ ...baseConfig, database: DB_NAME });

/** Koneksi tanpa `database`, dipakai skrip inisialisasi. */
export function createAdminConnection() {
  const { database, ...rest } = baseConfig;
  return mysql.createConnection(rest);
}

/** SELECT sederhana, mengembalikan baris. */
export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** SELECT yang diharapkan menghasilkan satu baris. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}
