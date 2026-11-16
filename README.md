# Gorengan Mas Gibran

Katalog dan dashboard UMKM makanan/minuman dengan tiga peran pengguna (**admin**, **seller**, **pembeli**), backend Express, dan database MySQL.

Aplikasi ini menggantikan prototipe `localStorage` pada [SPEC.md](SPEC.md) menjadi aplikasi full-stack: autentikasi sungguhan, data tersimpan di server, dan pembatasan akses per peran di sisi API.

## Fitur per peran

| Peran | Kemampuan |
|---|---|
| **Admin** | Melihat ringkasan platform, mencari/menyaring pengguna, membuat akun (admin/seller/pembeli), mengubah data & peran, mengaktifkan/menonaktifkan akun, mengganti kata sandi pengguna, menghapus akun. |
| **Seller** | Mengelola produk milik sendiri (tambah, ubah, hapus, unggulan, stok, unggah gambar), melihat ringkasan toko, mengatur nama toko, deskripsi, dan nomor WhatsApp pemesanan. Tidak dapat menyentuh produk seller lain. |
| **Pembeli** | Melihat katalog, mencari, menyaring kategori, mengurutkan, memilih jumlah, lalu memesan lewat WhatsApp penjual. Tidak memiliki akses ke data pengguna atau pengelolaan produk. |

Katalog dapat dibuka tanpa masuk. Akun pembeli dibuat lewat pendaftaran publik; akun seller/admin hanya dibuat oleh admin.

## Teknologi

- **Backend:** Node.js 20+, Express 4, MySQL 8 (`mysql2`), JWT di cookie `httpOnly`, bcrypt, Helmet, rate limit, Multer (unggah gambar).
- **Frontend:** HTML + JavaScript vanilla (ES Modules), tanpa proses build. Disajikan oleh Express dari folder `public/`.
- **Database:** MySQL 8, dua tabel (`users`, `products`).

## Struktur proyek

```
.
├─ api/
│  └─ index.js              # entry Vercel Function (mengekspor app Express)
├─ server/
│  ├─ index.js              # server lokal: buka port + shutdown
│  ├─ app.js                # aplikasi Express, CSP, static, error handler
│  ├─ db.js                 # pool MySQL
│  ├─ lib/
│  │  ├─ auth.js            # JWT, cookie, middleware peran
│  │  ├─ validate.js        # aturan validasi bersama
│  │  ├─ upload.js          # Multer + penyimpanan gambar
│  │  └─ http.js            # AppError, asyncHandler, error handler
│  └─ routes/
│     ├─ auth.js            # login, daftar, keluar, sesi
│     ├─ products.js        # katalog publik + CRUD seller
│     ├─ images.js          # menyajikan gambar unggahan dari database
│     ├─ seller.js          # ringkasan & pengaturan toko
│     └─ admin.js           # pengelolaan pengguna
├─ db/schema.sql
├─ scripts/init-db.js       # buat database, tabel, dan data contoh
├─ vercel.json              # static public + Express sebagai Vercel Function
├─ public/
│  ├─ index.html
│  ├─ css/styles.css
│  ├─ js/                   # api, ui, app, views/{catalog,auth,seller,admin}
│  └─ placeholder/          # SVG buatan sendiri
├─ uploads/                 # hanya untuk gambar lama sebelum unggahan pindah ke database
└─ .env.example
```

## Menjalankan

Prasyarat: Node.js 20+ dan MySQL 8 yang berjalan.

```bash
npm install
cp .env.example .env        # lalu sesuaikan kredensial MySQL dan JWT_SECRET
npm run db:init             # buat database, tabel, dan data contoh
npm start                   # http://localhost:3000
```

### Database di ServBay

Database `gmg_toko` berada di datadir MariaDB 11.4 milik ServBay:

```
C:\ServBay\db\mariadb\11.4\gmg_toko
```

Kredensial lokal: host `127.0.0.1`, port `3306`, user `root`, sandi `ServBay.dev`, database `gmg_toko`. Database ini muncul di daftar database ServBay bersama database lain Anda, dan dilayani otomatis saat MariaDB 11.4 berjalan.

Catatan: MariaDB dan MySQL 8.3 sama-sama memakai port 3306, jadi jangan menyalakan keduanya sekaligus. Jika suatu saat Anda beralih ke MySQL 8.3, salinan `gmg_toko` di datadirnya (`C:\ServBay\db\mysql\8.3\gmg_toko`) sudah berisi data yang sama.

`npm run dev` menjalankan server dengan auto-reload (`node --watch`).

### Perintah database

| Perintah | Efek |
|---|---|
| `npm run db:init` | Membuat database/tabel bila belum ada, mengisi data contoh bila tabel `users` masih kosong. |
| `npm run db:reset` | **Menghapus** database `DB_NAME` lalu membuat ulang beserta data contoh. |

> `db:reset` bersifat destruktif dan hanya untuk pengembangan.

### Akun demo

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@gmg.local` | `Admin#12345` |
| Seller | `gibran@gmg.local` | `Seller#12345` |
| Seller | `rina@gmg.local` | `Seller#12345` |
| Pembeli | `pembeli@gmg.local` | `Pembeli#12345` |
| Pembeli | `budi@gmg.local` | `Pembeli#12345` |

Data contoh berisi 12 produk (8 produk sesuai SPEC.md untuk Gorengan Mas Gibran dan 4 produk Dapur Bu Rina). Produk **Cireng Isi** sengaja berstok 0 untuk menguji status "Habis".

## Variabel lingkungan

| Variabel | Keterangan |
|---|---|
| `PORT` | Port server (default `3000`). |
| `NODE_ENV` | Set `production` agar cookie memakai flag `secure` dan `trust proxy` aktif. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Koneksi MySQL. Default lokal ServBay: `127.0.0.1:3306`, `root` / `ServBay.dev`, database `gmg_toko`. |
| `DB_SSL` | Set `true` bila server MySQL mewajibkan TLS (TiDB Cloud, Aiven, dan penyedia cloud lain). |
| `DB_POOL_SIZE` | Jumlah koneksi per instance (default `10`; serverless sebaiknya `3`–`5`). |
| `JWT_SECRET` | Wajib, minimal 16 karakter. Buat dengan `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |

`.env` sudah tercantum di `.gitignore`.

## Deploy ke Vercel

Repo ini sudah disiapkan untuk Vercel: berkas `public/` dilayani CDN, sedangkan seluruh aplikasi Express berjalan sebagai **satu Vercel Function** (`api/index.js`) dan dipanggil lewat `/api/*` (lihat `vercel.json`). Karena Vercel tidak menyediakan MySQL, database harus berupa MySQL cloud yang bisa diakses dari internet.

1. Buat database MySQL cloud (misalnya TiDB Cloud Serverless atau Aiven for MySQL) dan catat host, port, user, password, serta nama database. Aktifkan TLS.
2. Isi skema dan data contoh ke database tersebut dari komputer Anda:

   ```bash
   DB_HOST=... DB_PORT=4000 DB_USER=... DB_PASSWORD=... DB_NAME=gmg_toko DB_SSL=true npm run db:init
   ```

3. Di dashboard Vercel → **Project Settings → Environment Variables**, tambahkan:

   | Variabel | Nilai |
   |---|---|
   | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | kredensial database cloud |
   | `DB_SSL` | `true` |
   | `DB_POOL_SIZE` | `3` |
   | `JWT_SECRET` | string acak ≥ 32 karakter |
   | `NODE_ENV` | `production` |

4. Deploy ulang (push ke `main`, atau `vercel --prod`).
5. Periksa `https://<proyek>.vercel.app/api/health` → harus `{"ok":true,"database":"up"}`, lalu buka katalog dan pastikan 12 produk tampil.

Catatan serverless:

- Unggahan gambar disimpan di tabel `product_images` dan disajikan lewat `/api/images/<id>`, karena filesystem Vercel read-only. Folder `uploads/` hanya untuk gambar lama.
- Batas body request Vercel 4,5 MB; gambar sudah diperkecil di peramban sebelum diunggah, jadi normalnya jauh di bawah batas itu.
- Setiap instance Function membuka pool sendiri; `DB_POOL_SIZE` kecil mencegah koneksi database habis.
- `npm run db:init` aman dijalankan pada database terkelola: `CREATE DATABASE` dilewati bila tidak ada hak, pembuatan tabel memakai `IF NOT EXISTS`, dan data contoh hanya diisi saat tabel `users` kosong.

## Alur pemesanan WhatsApp

Setiap seller mengatur nomor WhatsApp di **Kelola toko → Pengaturan toko**. Nomor dinormalisasi (spasi/tanda hubung/`+` dibuang, awalan `0` menjadi `62`, 10–15 digit). Pembeli menekan **Pesan via WhatsApp** pada kartu atau mengatur jumlah di detail produk; aplikasi membuka:

```
https://wa.me/<nomor>?text=<pesan ter-encode>
```

Pesan berisi nama toko, jumlah, nama produk, dan total harga. Tidak ada pesanan yang disimpan di server — WhatsApp adalah kanal transaksi, sesuai lingkup SPEC.md.

## API ringkas

| Method | Endpoint | Akses |
|---|---|---|
| `POST` | `/api/auth/register` | publik (selalu membuat pembeli) |
| `POST` | `/api/auth/login`, `/api/auth/logout` | publik |
| `GET` | `/api/auth/me` | publik (mengembalikan `user: null` bila belum masuk) |
| `GET` | `/api/products` | publik — `q`, `kategori`, `sort`, `sellerId`, `page`, `limit` |
| `GET` | `/api/products/:id` | publik |
| `POST`/`PUT`/`DELETE` | `/api/products[/:id]` | seller (hanya produk sendiri) |
| `GET` | `/api/seller/summary`, `/api/seller/products` | seller |
| `PUT` | `/api/seller/store` | seller |
| `GET` | `/api/admin/stats`, `/api/admin/users` | admin |
| `POST`/`PATCH`/`DELETE` | `/api/admin/users[/:id]` | admin |
| `GET` | `/api/health` | publik |

Validasi produk mengikuti SPEC.md: nama 2–60 karakter, kategori 2–30, harga bilangan bulat ≥ 0, stok bilangan bulat ≥ 0, deskripsi ≤ 200, gambar hanya PNG/JPG/WebP ≤ 5 MB atau URL `http(s)`/`data:image/`.

## Catatan keamanan produksi

- Ganti `JWT_SECRET` dan seluruh kata sandi akun demo sebelum dipakai publik.
- Jalankan di belakang HTTPS dan set `NODE_ENV=production` (cookie `secure`, `trust proxy`).
- Gambar unggahan disimpan di tabel `product_images`, jadi ikut cadangan database.
- Batas percobaan login: 20 per 10 menit per IP; pendaftaran: 10 per jam per IP.
- Admin tidak dapat menghapus/menonaktifkan/menurunkan peran akunnya sendiri, dan sistem selalu menyisakan minimal satu admin aktif.
- Hapus akun seller akan menghapus produknya (foreign key `ON DELETE CASCADE`).

## Verifikasi yang sudah dilakukan

- `npm run db:init` / `npm run db:reset` berhasil membuat skema dan data contoh.
- Login dan pembatasan peran diuji lewat API (seller/buyer ditolak `403` pada endpoint admin, seller lain ditolak `403` saat mengubah produk).
- Validasi server diuji: harga negatif, stok desimal, URL `javascript:`, berkas PDF, dan gambar > 5 MB semuanya ditolak `400`.
- Smoke test browser headless: katalog tampil, pencarian & filter bekerja, login admin/seller/pembeli, CRUD produk, validasi form, hapus produk, pembeli tidak bisa membuka halaman seller, dan tidak ada scroll horizontal pada lebar 390 px.
