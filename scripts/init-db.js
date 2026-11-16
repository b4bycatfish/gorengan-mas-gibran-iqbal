import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { createAdminConnection, DB_NAME } from '../server/db.js';

const reset = process.argv.includes('--reset');

if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
  console.error(`Nama database tidak valid: ${DB_NAME}`);
  process.exit(1);
}

const ACCOUNTS = [
  {
    name: 'Admin Gibran',
    email: 'admin@gmg.local',
    password: 'Admin#12345',
    role: 'admin',
    phone: null,
    storeName: null,
  },
  {
    name: 'Mas Gibran',
    email: 'gibran@gmg.local',
    password: 'Seller#12345',
    role: 'seller',
    phone: '6281234567890',
    storeName: 'Gorengan Mas Gibran',
    storeDescription: 'Gorengan hangat digoreng setiap pagi. Renyah, murah, cepat.',
  },
  {
    name: 'Bu Rina',
    email: 'rina@gmg.local',
    password: 'Seller#12345',
    role: 'seller',
    phone: '6281299887766',
    storeName: 'Dapur Bu Rina',
    storeDescription: 'Camilan rumahan dan minuman segar untuk teman santai.',
  },
  {
    name: 'Pembeli Demo',
    email: 'pembeli@gmg.local',
    password: 'Pembeli#12345',
    role: 'buyer',
    phone: '6285712345678',
    storeName: null,
  },
  {
    name: 'Budi Santoso',
    email: 'budi@gmg.local',
    password: 'Pembeli#12345',
    role: 'buyer',
    phone: null,
    storeName: null,
  },
];

const PRODUCTS = [
  {
    seller: 'gibran@gmg.local',
    nama: 'Bakwan Sayur',
    kategori: 'Gorengan',
    harga: 1500,
    stok: 40,
    unggulan: 1,
    deskripsi: 'Bakwan renyah dengan irisan kol dan wortel.',
    image: '/placeholder/bakwan-sayur.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Tahu Isi',
    kategori: 'Gorengan',
    harga: 2000,
    stok: 30,
    unggulan: 1,
    deskripsi: 'Tahu goreng berisi sayur dan bihun, gurih di dalam.',
    image: '/placeholder/tahu-isi.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Tempe Mendoan',
    kategori: 'Gorengan',
    harga: 1500,
    stok: 35,
    unggulan: 0,
    deskripsi: 'Tempe tipis berbalut tepung bumbu, cocok dengan cabai rawit.',
    image: '/placeholder/tempe-mendoan.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Pisang Goreng',
    kategori: 'Gorengan',
    harga: 2500,
    stok: 25,
    unggulan: 1,
    deskripsi: 'Pisang manis berbalut tepung renyah, hangat saat disajikan.',
    image: '/placeholder/pisang-goreng.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Risoles Ayam',
    kategori: 'Camilan',
    harga: 3500,
    stok: 20,
    unggulan: 0,
    deskripsi: 'Risoles isi ayam suwir dan wortel dengan kulit lembut.',
    image: '/placeholder/risoles-ayam.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Cireng Isi',
    kategori: 'Camilan',
    harga: 2000,
    stok: 0,
    unggulan: 0,
    deskripsi: 'Cireng kenyal berisi sambal pedas manis.',
    image: '/placeholder/cireng-isi.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Es Teh Manis',
    kategori: 'Minuman',
    harga: 4000,
    stok: 50,
    unggulan: 0,
    deskripsi: 'Teh manis dingin dengan es batu, pelepas dahaga.',
    image: '/placeholder/es-teh-manis.svg',
  },
  {
    seller: 'gibran@gmg.local',
    nama: 'Es Jeruk',
    kategori: 'Minuman',
    harga: 5000,
    stok: 15,
    unggulan: 0,
    deskripsi: 'Perasan jeruk segar dengan gula dan es.',
    image: '/placeholder/es-jeruk.svg',
  },
  {
    seller: 'rina@gmg.local',
    nama: 'Tahu Gejrot',
    kategori: 'Camilan',
    harga: 5000,
    stok: 18,
    unggulan: 1,
    deskripsi: 'Tahu goreng disiram kuah gula merah, bawang, dan cabai.',
    image: '/placeholder/tahu-gejrot.svg',
  },
  {
    seller: 'rina@gmg.local',
    nama: 'Martabak Mini',
    kategori: 'Camilan',
    harga: 6000,
    stok: 12,
    unggulan: 0,
    deskripsi: 'Martabak manis mungil isi cokelat dan kacang.',
    image: '/placeholder/martabak-mini.svg',
  },
  {
    seller: 'rina@gmg.local',
    nama: 'Kopi Susu Gula Aren',
    kategori: 'Minuman',
    harga: 8000,
    stok: 22,
    unggulan: 1,
    deskripsi: 'Kopi seduh dingin dengan susu dan gula aren.',
    image: '/placeholder/kopi-susu.svg',
  },
  {
    seller: 'rina@gmg.local',
    nama: 'Keripik Pisang',
    kategori: 'Camilan',
    harga: 7000,
    stok: 30,
    unggulan: 0,
    deskripsi: 'Keripik pisang tipis dengan taburan gula halus.',
    image: '/placeholder/keripik-pisang.svg',
  },
];

async function main() {
  const admin = await createAdminConnection();
  try {
    if (reset) {
      console.log(`Menghapus database \`${DB_NAME}\`...`);
      await admin.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    }

    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database \`${DB_NAME}\` siap.`);

    await admin.changeUser({ database: DB_NAME });

    const schemaPath = path.resolve('db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const statement of statements) {
      await admin.query(statement);
    }
    console.log('Tabel users dan products siap.');

    const [[{ total }]] = await admin.query('SELECT COUNT(*) AS total FROM users');
    if (Number(total) > 0 && !reset) {
      console.log('Data sudah ada — seeding dilewati. Jalankan `npm run db:reset` untuk menimpa.');
      return;
    }

    const ids = new Map();
    for (const account of ACCOUNTS) {
      const hash = await bcrypt.hash(account.password, 12);
      const [result] = await admin.query(
        `INSERT INTO users (name, email, password_hash, role, phone, store_name, store_description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          account.name,
          account.email,
          hash,
          account.role,
          account.phone,
          account.storeName,
          account.storeDescription || null,
        ],
      );
      ids.set(account.email, result.insertId);
    }
    console.log(`${ACCOUNTS.length} akun contoh dibuat.`);

    for (const item of PRODUCTS) {
      await admin.query(
        `INSERT INTO products (seller_id, nama, kategori, harga, stok, deskripsi, image_url, unggulan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ids.get(item.seller),
          item.nama,
          item.kategori,
          item.harga,
          item.stok,
          item.deskripsi,
          item.image,
          item.unggulan,
        ],
      );
    }
    console.log(`${PRODUCTS.length} produk contoh dibuat.`);

    console.log('\nAkun demo:');
    console.table(
      ACCOUNTS.map((a) => ({ Peran: a.role, Email: a.email, Sandi: a.password })),
    );
  } finally {
    await admin.end();
  }
}

main().catch((err) => {
  console.error('Gagal menyiapkan database:', err.message);
  process.exit(1);
});
