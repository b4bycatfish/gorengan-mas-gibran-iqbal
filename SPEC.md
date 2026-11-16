# SPEC.md — Gorengan Mas Gibran

Katalog dan dashboard produk UMKM makanan/minuman berbasis web (proyek latihan 1 hari).

| Item | Nilai |
|---|---|
| Versi dokumen | 1.0 (draf awal) |
| Status | Siap diimplementasikan |
| Tech stack | Vite + JavaScript vanilla (ES Modules), HTML, CSS |
| Backend | Tidak ada |
| Penyimpanan | `localStorage` peramban |

---

## 1. Tujuan

### 1.1 Tujuan produk
Menyediakan etalase digital sederhana untuk UMKM "Gorengan Mas Gibran" agar calon pembeli dapat melihat produk, mencari, menyaring, mengurutkan, lalu memesan lewat WhatsApp. Pengelola toko dapat mengelola data produk lewat dashboard demo tanpa backend.

### 1.2 Tujuan latihan
- Berlatih alur kerja System Analyst → Software Engineer: spesifikasi dulu, baru kode.
- Berlatih arsitektur aplikasi kecil dengan JavaScript vanilla (state, render, validasi, persistensi).
- Menghasilkan MVP yang dapat diselesaikan dan diuji secara manual dalam 1 hari kerja.

### 1.3 Indikator keberhasilan
- Semua acceptance criteria di Bagian 8 lulus pengecekan manual.
- Aplikasi berjalan dengan `npm run dev` dan `npm run build` tanpa error.
- Data tetap ada setelah halaman dimuat ulang.

---

## 2. Pengguna

| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| Calon pembeli | Pengunjung umum, kemungkinan besar memakai ponsel | Melihat produk, harga, ketersediaan stok; mencari/menyaring; memesan lewat WhatsApp |
| Pengelola toko | Pemilik/staf toko pada **perangkat yang sama** | Menambah, mengubah, menghapus produk; melihat ringkasan total produk, stok, dan kategori |

**Asumsi penting:** kedua peran memakai satu perangkat dan satu peramban. **Tidak ada login dan tidak ada autentikasi palsu.** Dashboard dibuka lewat navigasi biasa dan diberi label jelas sebagai "Mode Demo" (lihat Bagian 6, Risiko R1).

---

## 3. Daftar Fitur

Prioritas: **P0** wajib MVP, **P1** sebaiknya ada bila waktu cukup.

### 3.1 Katalog (halaman pembeli)

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| F-01 | Daftar produk | P0 | Menampilkan kartu produk: gambar, nama, kategori, harga Rupiah, stok, penanda unggulan |
| F-02 | Data contoh | P0 | 8 produk contoh nonpribadi dimuat saat pertama kali dibuka (localStorage kosong) |
| F-03 | Placeholder gambar lokal | P0 | Gambar berasal dari berkas SVG buatan sendiri di folder `public/`; tidak ada gambar dari internet |
| F-04 | Pencarian | P0 | Kotak pencarian berdasarkan nama (dan deskripsi), tidak peka huruf besar/kecil, hasil diperbarui saat mengetik |
| F-05 | Filter kategori | P0 | Pilihan "Semua" + kategori yang ada pada data |
| F-06 | Sorting | P0 | Nama A–Z, Nama Z–A, Harga termurah, Harga termahal, Stok terbanyak |
| F-07 | Produk unggulan | P0 | Lencana "Unggulan" pada kartu; produk unggulan tampil lebih dulu pada urutan bawaan |
| F-08 | Tombol Pesan via WhatsApp | P0 | Membuka tautan `https://wa.me/<nomor>?text=<pesan>` dengan pesan terisi otomatis (nama produk, harga) |
| F-09 | Status stok | P0 | Stok 0 → label "Habis" dan tombol pesan dinonaktifkan |
| F-10 | Keadaan kosong | P0 | Pesan ramah bila hasil pencarian/filter tidak ada |
| F-11 | Tombol reset filter | P1 | Mengembalikan pencarian, filter, dan sorting ke bawaan |

### 3.2 Dashboard demo (halaman pengelola)

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| F-20 | Ringkasan | P0 | Tiga kartu: total produk, total stok (jumlah seluruh stok), jumlah kategori unik |
| F-21 | Tabel/daftar produk | P0 | Menampilkan seluruh produk beserta tombol Ubah dan Hapus |
| F-22 | Tambah produk | P0 | Formulir untuk membuat produk baru dengan validasi |
| F-23 | Ubah produk | P0 | Formulir terisi data lama; simpan memperbarui data |
| F-24 | Hapus produk | P0 | Konfirmasi sebelum menghapus |
| F-25 | Validasi formulir | P0 | Pesan kesalahan per kolom sesuai aturan Bagian 4.2 |
| F-26 | Reset data contoh | P1 | Mengembalikan 8 produk awal setelah konfirmasi |
| F-27 | Label Mode Demo | P0 | Banner permanen: "Mode Demo — data hanya tersimpan di peramban ini" |

### 3.3 Persistensi

| ID | Fitur | Prioritas | Deskripsi |
|---|---|---|---|
| F-30 | Simpan otomatis | P0 | Setiap tambah/ubah/hapus langsung disimpan ke `localStorage` |
| F-31 | Muat saat start | P0 | Aplikasi membaca `localStorage`; bila kosong/rusak, memakai data contoh |
| F-32 | Penanganan galat | P0 | Bila `localStorage` tidak tersedia/penuh atau JSON rusak, aplikasi tidak crash dan menampilkan pesan |

### 3.4 Data contoh (8 produk, nonpribadi, fiktif)

| # | Nama | Kategori | Harga (Rp) | Stok | Unggulan |
|---|---|---|---|---|---|
| 1 | Bakwan Sayur | Gorengan | 1.500 | 40 | Ya |
| 2 | Tahu Isi | Gorengan | 2.000 | 30 | Ya |
| 3 | Tempe Mendoan | Gorengan | 1.500 | 35 | Tidak |
| 4 | Pisang Goreng | Gorengan | 2.500 | 25 | Ya |
| 5 | Risoles Ayam | Camilan | 3.500 | 20 | Tidak |
| 6 | Cireng Isi | Camilan | 2.000 | 0 | Tidak |
| 7 | Es Teh Manis | Minuman | 4.000 | 50 | Tidak |
| 8 | Es Jeruk | Minuman | 5.000 | 15 | Tidak |

Deskripsi tiap produk berupa 1 kalimat pendek buatan sendiri. Produk #6 sengaja berstok 0 untuk menguji status "Habis".

---

## 4. Data Model

### 4.1 Entitas `Produk`

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `id` | string | Ya | Unik; dibuat otomatis (mis. `crypto.randomUUID()` atau fallback `p-<timestamp>-<acak>`); tidak dapat diubah |
| `nama` | string | Ya | Setelah di-trim: 2–60 karakter |
| `kategori` | string | Ya | Setelah di-trim: 2–30 karakter; dipilih dari dropdown (Gorengan, Camilan, Minuman, Paket, Lainnya) ditambah kategori lain yang sudah ada di data |
| `harga` | number | Ya | Angka bilangan terhingga, `>= 0`, disimpan dalam Rupiah utuh (tanpa desimal) |
| `stok` | number (integer) | Ya | Bilangan bulat `>= 0` |
| `deskripsi` | string | Tidak | Maksimal 200 karakter; boleh kosong |
| `imageUrl` | string | Tidak | Kosong, data URL gambar hasil unggah (`data:image/...`, sudah diperkecil), atau URL `http(s)`. Bila kosong/gagal dimuat, pakai placeholder SVG lokal |
| `unggulan` | boolean | Ya | `true`/`false`; bawaan `false` |

Contoh JSON:

```json
{
  "id": "p-001",
  "nama": "Bakwan Sayur",
  "kategori": "Gorengan",
  "harga": 1500,
  "stok": 40,
  "deskripsi": "Bakwan renyah dengan irisan kol dan wortel.",
  "imageUrl": "/placeholder/bakwan.svg",
  "unggulan": true
}
```

### 4.2 Aturan validasi

1. `nama`: wajib, 2–60 karakter setelah trim.
2. `kategori`: wajib, 2–30 karakter setelah trim.
3. `harga`: wajib, angka, `>= 0`; input kosong, huruf, atau negatif ditolak.
4. `stok`: wajib, bilangan bulat `>= 0`; desimal (mis. `2.5`) ditolak.
5. `deskripsi`: maksimal 200 karakter.
6. `imageUrl`: bila diisi, harus diawali `http://`, `https://`, atau `data:image/`; skema lain (mis. `javascript:`) ditolak.
7. Data hasil baca `localStorage` divalidasi ulang; entri yang tidak lolos dibuang atau seluruh data diganti data contoh (keputusan ada di Bagian 5.3).

### 4.3 Penyimpanan

| Kunci localStorage | Isi |
|---|---|
| `gmg.products.v1` | JSON array `Produk[]` |

Akhiran `v1` disiapkan untuk migrasi bila skema berubah.

### 4.4 Konfigurasi (bukan data pengguna)

| Konstanta | Nilai | Catatan |
|---|---|---|
| `WA_NUMBER` | `6281234567890` | **Nomor placeholder fiktif**, format internasional tanpa `+`. Ganti oleh pemilik sebelum produksi. Bukan rahasia, tetapi jangan memakai nomor pribadi sungguhan pada repositori publik |
| `STORE_NAME` | `Gorengan Mas Gibran` | Nama tampilan |

Template pesan WhatsApp: `Halo Mas Gibran, saya mau pesan {nama} (Rp {harga}). Apakah masih tersedia?` (di-encode dengan `encodeURIComponent`).

---

## 5. Perilaku Rinci dan Keputusan Desain

### 5.1 Halaman dan navigasi
- Satu halaman (SPA sederhana) dengan dua tampilan: **Katalog** dan **Dashboard**, dipindah lewat tombol navigasi di header atau hash (`#/` dan `#/dashboard`).
- Tidak ada pustaka router; cukup `hashchange`.

### 5.2 Pipeline katalog
Urutan pemrosesan: data → filter kategori → pencarian → sorting → render.
- Urutan bawaan: unggulan dahulu, lalu nama A–Z.
- Pencarian dan filter bersifat gabungan (AND).

### 5.3 Penanganan data rusak
- JSON tidak dapat diparse → tampilkan pesan, muat data contoh, jangan menimpa penyimpanan sampai pengguna mengubah data.
- Struktur bukan array → perlakukan sebagai rusak.

### 5.4 Format Rupiah
Gunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`. Contoh keluaran: `Rp 1.500`.

### 5.5 Keamanan tampilan
- Seluruh teks pengguna dirender dengan `textContent`/`createElement`, **bukan** `innerHTML` dengan data mentah (mencegah XSS).
- Tautan WhatsApp dibuat dari konstanta + `encodeURIComponent`, dibuka dengan `target="_blank" rel="noopener noreferrer"`.

### 5.6 Struktur berkas yang direncanakan

```
gorengan-mas-gibran/
├─ index.html
├─ package.json
├─ SPEC.md
├─ public/placeholder/        # SVG buatan sendiri (default.svg + 8 gambar)
└─ src/
   ├─ main.js                 # titik masuk, routing hash
   ├─ config.js               # WA_NUMBER, STORE_NAME, kunci storage
   ├─ data/seed.js            # 8 produk contoh
   ├─ storage.js              # baca/tulis localStorage + penanganan galat
   ├─ validators.js           # validasi produk
   ├─ format.js               # format Rupiah, pembuat tautan WA
   ├─ views/catalog.js
   ├─ views/dashboard.js
   └─ styles.css
```

---

## 6. Non-Functional Requirements

| ID | Kategori | Persyaratan |
|---|---|---|
| NFR-01 | Kinerja | Halaman awal tampil interaktif < 2 detik pada laptop biasa; filter/pencarian terasa instan untuk hingga 200 produk |
| NFR-02 | Responsif | Tata letak dapat dipakai pada lebar 360 px (ponsel) hingga 1280 px (desktop) tanpa scroll horizontal |
| NFR-03 | Aksesibilitas | Semua gambar memiliki `alt`; kolom formulir memiliki `<label>`; tombol dapat dijangkau keyboard; kontras teks memadai |
| NFR-04 | Kompatibilitas | Chrome, Firefox, Edge, dan Safari versi terbaru |
| NFR-05 | Keamanan | Tidak ada API key/rahasia di kode atau repositori; tidak ada `innerHTML` dengan data pengguna; tidak ada `eval`; tidak ada permintaan jaringan selain pembukaan tautan WhatsApp oleh pengguna |
| NFR-06 | Privasi | Hanya data contoh fiktif dan nonpribadi; tidak ada pelacakan, analitik, atau cookie |
| NFR-07 | Kelegalan aset | Semua gambar dibuat sendiri (SVG sederhana), font memakai font sistem, tidak ada logo/foto/ikon berhak cipta |
| NFR-08 | Keterpeliharaan | Kode dipisah per modul; fungsi murni untuk validasi/filter/sort sehingga mudah diuji; tanpa dependensi runtime (hanya Vite sebagai devDependency) |
| NFR-09 | Ketahanan | Aplikasi tidak crash saat `localStorage` kosong, penuh, diblokir, atau berisi JSON rusak |
| NFR-10 | Keamanan operasional | Perintah yang dipakai hanya standar: `npm install`, `npm run dev`, `npm run build`, `npm run preview`; tidak ada skrip yang menghapus berkas di luar proyek atau memakai `sudo`/`rm -rf` |
| NFR-11 | Bahasa | Seluruh antarmuka dalam Bahasa Indonesia |

---

## 7. Risiko

| ID | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| R1 | Dashboard terbuka untuk siapa saja pada perangkat yang sama karena tanpa login | Pembeli dapat mengubah data | Diterima untuk latihan; banner "Mode Demo" permanen; tidak ada klaim keamanan; dicantumkan di out-of-scope |
| R2 | Data hanya ada di satu peramban; hilang bila cache dibersihkan | Kehilangan data | Ada tombol Reset data contoh; diberi catatan di dashboard; ekspor/impor ada di luar MVP |
| R3 | Kuota `localStorage` (~5 MB) terlampaui atau diblokir (mode privat) | Gagal menyimpan | Bungkus dengan `try/catch`, tampilkan pesan galat, UI tetap berjalan dengan data di memori |
| R4 | XSS melalui nama/deskripsi yang diketik pengelola | Eksekusi skrip | Render via `textContent`; validasi skema `imageUrl`; unggahan hanya PNG/JPG/WebP (SVG unggahan tidak diterima) |
| R5 | Nomor WhatsApp salah atau memakai nomor pribadi | Pesan nyasar / privasi | Nomor placeholder fiktif di `config.js`; dokumentasikan cara menggantinya |
| R6 | Cakupan melebar sehingga tidak selesai dalam sehari | Proyek tidak rampung | Prioritas P0/P1; iterasi dengan batas waktu; P1 dikerjakan hanya bila P0 selesai |
| R7 | Gambar placeholder berlisensi tidak jelas | Pelanggaran hak cipta | Buat SVG sendiri (bentuk geometri + inisial produk); tanpa unduhan dari internet |
| R8 | Skema data berubah di masa depan | Data lama tidak cocok | Kunci storage berversi (`v1`); validasi saat memuat |
| R9 | Harga floating-point/ketik desimal membingungkan | Tampilan harga janggal | Harga disimpan sebagai bilangan bulat Rupiah; validasi menolak desimal untuk harga |
| R10 | Saran perintah/skrip berbahaya saat setup | Risiko keamanan mesin | Batasi perintah ke daftar NFR-10; tinjau `package.json` sebelum menjalankan |

---

## 8. Out of Scope

Tidak dikerjakan pada MVP ini:
- Backend, basis data server, atau API apa pun.
- Login, registrasi, peran pengguna, atau pengamanan dashboard (termasuk "login palsu").
- Keranjang belanja, checkout, pembayaran, ongkos kirim, dan manajemen pesanan.
- Unggah gambar ke server atau penyimpanan cloud (unggahan lokal ke `localStorage` termasuk dalam cakupan, lihat Revisi 1.1).
- Sinkronisasi antarperangkat, ekspor/impor data, dan multi-toko.
- Integrasi WhatsApp Business API (hanya tautan `wa.me`).
- Bahasa selain Indonesia, mata uang selain Rupiah.
- Pengujian otomatis (unit/E2E) — pengujian dilakukan manual; fungsi dirancang agar mudah diuji nanti.
- SEO, PWA/offline, analitik, dan penerapan ke hosting produksi.

---

## 9. Acceptance Criteria (Pemeriksaan Manual)

Cara pakai: kosongkan `localStorage` (DevTools → Application → Local Storage → hapus `gmg.products.v1`), jalankan `npm run dev`, lalu centang tiap butir.

### 9.1 Katalog

| ID | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| AC-01 | Buka aplikasi pertama kali | Tampil tepat 8 kartu produk sesuai Bagian 3.4 | ☐ |
| AC-02 | Periksa tiap kartu | Terlihat gambar placeholder, nama, kategori, harga format `Rp 1.500`, dan stok | ☐ |
| AC-03 | Periksa Network di DevTools | Tidak ada permintaan ke domain eksternal (gambar semua lokal) | ☐ |
| AC-04 | Lihat urutan awal | Produk unggulan (3 buah) berlabel "Unggulan" dan tampil paling awal | ☐ |
| AC-05 | Ketik `tahu` di pencarian | Hanya "Tahu Isi" tampil; huruf besar `TAHU` memberi hasil sama | ☐ |
| AC-06 | Ketik `zzzz` | Muncul pesan "produk tidak ditemukan"; tidak ada error di console | ☐ |
| AC-07 | Pilih kategori "Minuman" | Hanya Es Teh Manis dan Es Jeruk tampil | ☐ |
| AC-08 | Pilih "Gorengan" lalu ketik `pisang` | Hanya Pisang Goreng tampil (filter + pencarian gabungan) | ☐ |
| AC-09 | Sorting "Harga termurah" lalu "Harga termahal" | Urutan harga naik lalu turun dengan benar | ☐ |
| AC-10 | Sorting "Nama A–Z" lalu "Nama Z–A" | Urutan alfabet benar | ☐ |
| AC-11 | Sorting "Stok terbanyak" | Es Teh Manis (50) paling awal | ☐ |
| AC-12 | Klik "Pesan via WhatsApp" pada Bakwan Sayur | Tab baru terbuka ke `wa.me/6281234567890` dengan teks berisi nama dan harga produk | ☐ |
| AC-13 | Lihat Cireng Isi (stok 0) | Berlabel "Habis" dan tombol pesan nonaktif (tidak dapat diklik) | ☐ |
| AC-14 | Tampilan 360 px (mode responsif DevTools) | Tidak ada scroll horizontal; kartu tersusun 1 kolom | ☐ |

### 9.2 Dashboard

| ID | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| AC-20 | Buka dashboard | Banner "Mode Demo" terlihat; tidak ada layar login | ☐ |
| AC-21 | Lihat ringkasan awal | Total produk = 8; total stok = 215; kategori = 3 | ☐ |
| AC-22 | Tambah produk valid (mis. "Combro", Gorengan, 2000, 10) | Produk muncul di tabel; total produk = 9; total stok = 225; kategori tetap 3 | ☐ |
| AC-23 | Tambah produk dengan kategori baru "Kue" | Kategori menjadi 4 dan "Kue" muncul pada filter katalog | ☐ |
| AC-24 | Kirim formulir dengan nama kosong | Pesan galat pada kolom nama; data tidak tersimpan | ☐ |
| AC-25 | Isi harga `-100` | Ditolak dengan pesan galat | ☐ |
| AC-26 | Isi harga `0` | Diterima (batas bawah valid) | ☐ |
| AC-27 | Isi stok `2.5` | Ditolak (harus bilangan bulat) | ☐ |
| AC-28 | Isi stok `-1` | Ditolak | ☐ |
| AC-29 | Isi `imageUrl` dengan `javascript:alert(1)` atau `https://...` | Ditolak atau diganti placeholder default; tidak ada skrip berjalan | ☐ |
| AC-30 | Ubah harga Bakwan Sayur menjadi 2000 | Tabel dan katalog menampilkan `Rp 2.000` | ☐ |
| AC-31 | Ubah stok Cireng Isi dari 0 menjadi 5 | Label "Habis" hilang; tombol pesan aktif; total stok ikut berubah | ☐ |
| AC-32 | Ubah status unggulan sebuah produk | Lencana "Unggulan" muncul/hilang di katalog | ☐ |
| AC-33 | Klik Hapus lalu Batal | Produk tetap ada | ☐ |
| AC-34 | Klik Hapus lalu Konfirmasi | Produk hilang dari tabel dan katalog; ringkasan diperbarui | ☐ |
| AC-35 | Ketik `<b>x</b>` sebagai nama produk | Tampil sebagai teks apa adanya, bukan cetak tebal (tidak ada injeksi HTML) | ☐ |

### 9.3 Persistensi dan ketahanan

| ID | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| AC-40 | Lakukan tambah/ubah/hapus lalu muat ulang (F5) | Perubahan tetap ada | ☐ |
| AC-41 | Periksa `localStorage` di DevTools | Kunci `gmg.products.v1` berisi JSON array produk | ☐ |
| AC-42 | Hapus kunci storage lalu muat ulang | 8 produk contoh kembali | ☐ |
| AC-43 | Ubah nilai kunci storage menjadi `{rusak` lalu muat ulang | Aplikasi tidak crash; pesan peringatan; data contoh tampil | ☐ |
| AC-44 | (P1) Klik "Reset data contoh" lalu konfirmasi | Kembali ke 8 produk awal | ☐ |

### 9.4 Keamanan, legalitas, dan kualitas

| ID | Langkah | Hasil yang diharapkan | ✓ |
|---|---|---|---|
| AC-50 | Cari teks `key`, `token`, `secret`, `apikey` di seluruh `src/` dan `index.html` | Tidak ada kredensial atau API key | ☐ |
| AC-51 | Cari `innerHTML`, `eval(` di `src/` | Tidak dipakai dengan data pengguna | ☐ |
| AC-52 | Periksa `public/placeholder/` | Seluruh gambar berupa SVG buatan sendiri; tidak ada logo/foto pihak lain | ☐ |
| AC-53 | Periksa data contoh | Hanya produk fiktif; tidak ada nama orang, alamat, atau nomor pribadi nyata | ☐ |
| AC-54 | Jalankan `npm run build` | Berhasil tanpa error | ☐ |
| AC-55 | Buka Console saat memakai semua fitur | Tidak ada error merah | ☐ |
| AC-56 | Navigasi hanya dengan keyboard (Tab/Enter) | Pencarian, filter, sorting, tombol pesan, dan formulir dapat dioperasikan | ☐ |

**Definisi selesai (Definition of Done):** semua butir P0 pada Bagian 9 lulus, `npm run build` sukses, dan tidak ada error di console.

---

## 10. Implementation Plan per Iterasi

Perkiraan total ±8 jam kerja efektif. Setiap iterasi diakhiri dengan pengecekan manual pada AC terkait dan commit terpisah.

### Iterasi 0 — Persiapan (±30 menit)
**Tujuan:** kerangka proyek berjalan.
- Inisialisasi Vite vanilla JS; tinjau `package.json` (hanya Vite sebagai devDependency).
- Buat struktur folder (Bagian 5.6), `.gitignore` (`node_modules`, `dist`), dan `config.js`.
- Pastikan `npm run dev` menampilkan halaman kosong.
- **Selesai bila:** server dev berjalan dan `npm run build` sukses.

### Iterasi 1 — Data, format, dan penyimpanan (±1 jam)
**Tujuan:** fondasi data tanpa UI rumit.
- Tulis `seed.js` (8 produk), `format.js` (Rupiah, tautan WA), `validators.js`, `storage.js` (baca/tulis/galat).
- Buat 9 berkas SVG placeholder (default + 8 produk).
- **Selesai bila:** data contoh termuat dari storage dan dapat dicek di console; AC-41, AC-42, AC-43 lulus.

### Iterasi 2 — Katalog dasar (±1,5 jam)
**Tujuan:** pembeli dapat melihat produk dan memesan.
- Render kartu produk, lencana unggulan, status "Habis", tombol WhatsApp.
- CSS dasar responsif (grid, 360–1280 px).
- **Selesai bila:** AC-01 s.d. AC-04, AC-12, AC-13, AC-14 lulus.

### Iterasi 3 — Pencarian, filter, sorting (±1 jam)
**Tujuan:** katalog mudah dijelajahi.
- Tambah kontrol pencarian, dropdown kategori, dropdown sorting; pipeline filter → cari → sort.
- Keadaan kosong dan (P1) tombol reset filter.
- **Selesai bila:** AC-05 s.d. AC-11 lulus.

### Iterasi 4 — Dashboard: ringkasan dan Read (±1 jam)
**Tujuan:** pengelola melihat kondisi toko.
- Routing hash dan navigasi Katalog ↔ Dashboard; banner Mode Demo.
- Tiga kartu ringkasan dan tabel produk.
- **Selesai bila:** AC-20, AC-21 lulus.

### Iterasi 5 — Dashboard: Create, Update, Delete (±2 jam)
**Tujuan:** CRUD lengkap dan aman.
- Formulir tambah/ubah dengan validasi per kolom dan pesan galat.
- Hapus dengan konfirmasi; simpan otomatis ke localStorage; ringkasan dan katalog sinkron.
- **Selesai bila:** AC-22 s.d. AC-35 dan AC-40 lulus.

### Iterasi 6 — Penyempurnaan dan verifikasi (±1 jam)
**Tujuan:** kualitas dan kepatuhan batasan.
- (P1) Reset data contoh (AC-44).
- Aksesibilitas (label, `alt`, fokus), perapihan tampilan.
- Jalankan seluruh checklist Bagian 9, terutama AC-50 s.d. AC-56.
- Tulis `README.md` singkat: cara menjalankan dan cara mengganti `WA_NUMBER`.
- **Selesai bila:** Definisi Selesai terpenuhi.

### Urutan prioritas bila waktu mepet
1. Iterasi 0–2 (katalog tampil dan bisa pesan).
2. Iterasi 5 versi minimal (tambah + hapus) bersama Iterasi 4.
3. Iterasi 3.
4. Sisanya (ubah lengkap, P1, penyempurnaan).

---

## 11. Catatan dan Asumsi
- Nomor WhatsApp pada spesifikasi adalah placeholder fiktif; pemilik toko menggantinya sendiri.
- Kategori bersifat bebas-ketik namun dinormalisasi (trim) agar filter konsisten; perbedaan huruf besar/kecil diperlakukan sebagai kategori yang sama saat penghitungan (keputusan implementasi: bandingkan dengan `toLowerCase()`).
- Spesifikasi ini sengaja tidak memuat kode aplikasi; kode ditulis setelah spesifikasi disetujui.


---

## 12. Revisi 1.1

### 12.1 Perubahan
| ID | Perubahan | Rincian |
|---|---|---|
| R-01 | Tema visual "kampanye" | Palet biru tua, merah, putih, dan emas; header bergaya spanduk dengan tiga "misi" (Renyah, Murah, Cepat); kartu produk bergaris merah. **Parodi bergaya umum:** tanpa logo partai, tanpa foto tokoh, tanpa slogan atau kutipan resmi siapa pun. Header memuat keterangan "Tema parodi kampanye untuk latihan. Bukan materi kampanye resmi." |
| R-02 | Pilihan kategori | Field kategori pada form berupa dropdown: Gorengan, Camilan, Minuman, Paket, Lainnya, ditambah kategori lain yang sudah ada di data agar data lama tetap dapat diubah |
| R-03 | Upload gambar | Form menerima berkas PNG/JPG/WebP maksimal 5 MB. Gambar diperkecil di peramban (sisi terpanjang 640 px, JPEG) lalu disimpan sebagai data URL di `localStorage`. Tersedia pratinjau, tombol "Hapus gambar", dan opsi tempel URL |

### 12.2 Acceptance criteria tambahan
| ID | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|
| AC-R01 | Buka halaman | Header bernuansa spanduk kampanye dan keterangan parodi terlihat; teks tetap terbaca (kontras cukup) | ☐ |
| AC-R02 | Buka form tambah produk | Kategori berupa dropdown dengan 5 pilihan awal | ☐ |
| AC-R03 | Ubah produk berkategori selain 5 pilihan (data lama) | Kategori lama tetap muncul dan terpilih | ☐ |
| AC-R04 | Pilih berkas PNG/JPG/WebP valid lalu simpan | Pratinjau muncul; gambar tampil di katalog dan tabel | ☐ |
| AC-R05 | Refresh halaman | Gambar unggahan tetap tampil | ☐ |
| AC-R06 | Pilih berkas selain PNG/JPG/WebP (mis. PDF, SVG) | Ditolak dengan pesan galat di bawah field gambar | ☐ |
| AC-R07 | Pilih gambar lebih dari 5 MB | Ditolak dengan pesan galat | ☐ |
| AC-R08 | Klik "Hapus gambar" lalu simpan | Kartu kembali memakai placeholder | ☐ |
| AC-R09 | Unggah gambar, lalu tempel URL | URL dipakai menggantikan unggahan; sebaliknya unggah baru menggantikan URL | ☐ |

---

## 13. Revisi 1.2 — Ubah nomor WhatsApp

### 13.1 Perubahan
| ID | Perubahan | Rincian |
|---|---|---|
| R-04 | Pengaturan nomor WhatsApp | Panel "Nomor WhatsApp pemesanan" di tampilan Kelola. Pengelola dapat mengubah nomor tujuan pesan tanpa menyunting kode |
| R-05 | Normalisasi nomor | Spasi, tanda hubung, tanda kurung, dan `+` dibuang; awalan `0` diubah menjadi `62`. Hasil harus berawalan `62` dan 10–15 digit |
| R-06 | Penyimpanan pengaturan | Kunci `localStorage` baru `gmg.settings.v1` berisi `{"waNumber":"62..."}`. Bila rusak atau tidak valid, dipakai nomor contoh |
| R-07 | Tombol reset | "Pakai nomor contoh" mengembalikan `6281234567890` (fiktif), dengan konfirmasi |

Konstanta `WA_NUMBER` pada Bagian 4.4 kini menjadi nilai bawaan (`DEFAULT_WA`). Nomor yang dimasukkan pengelola hanya tersimpan di peramban ini dan tidak dikirim ke server; nomor pribadi sungguhan sebaiknya tidak dimasukkan ke repositori publik.

### 13.2 Acceptance criteria tambahan
| ID | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|
| AC-W01 | Buka Kelola | Panel nomor WhatsApp tampil dengan nomor aktif (awalnya contoh) dan catatan bahwa itu nomor contoh | ☐ |
| AC-W02 | Isi `0812 3456 7890`, simpan | Muncul pesan tersimpan; nomor aktif menjadi `+6281234567890` (tanpa spasi atau tanda hubung) | ☐ |
| AC-W03 | Isi `+62 811-222-3333`, simpan | Nomor aktif menjadi `+628112223333` | ☐ |
| AC-W04 | Setelah AC-W03, buka Katalog dan klik tombol pesan | Tautan tujuan `wa.me/628112223333` dengan teks pesan produk | ☐ |
| AC-W05 | Refresh halaman | Nomor yang disimpan tetap dipakai | ☐ |
| AC-W06 | Isi `abc`, kosong, `0812` (terlalu pendek), atau `+1 555 123 4567` | Ditolak dengan pesan galat jelas; nomor lama tidak berubah | ☐ |
| AC-W07 | Klik "Pakai nomor contoh" lalu setuju | Nomor kembali `+6281234567890` | ☐ |
| AC-W08 | Isi `gmg.settings.v1` dengan teks bukan JSON lalu refresh | Aplikasi tidak error dan memakai nomor contoh | ☐ |

---

## 14. Revisi 1.3 — Desain ulang bergaya situs ritel modern

Menggantikan tema "kampanye" pada Revisi 1.1 (R-01). Keterangan parodi kampanye dihapus karena tema tersebut tidak dipakai lagi.

### 14.1 Perubahan
| ID | Perubahan | Rincian |
|---|---|---|
| R-08 | Header transparan di atas hero | Logo teks merah, tab kategori (Semua + kategori dari data) sebagai filter, kolom cari berbentuk pil, dan ikon Kelola. Pada tampilan Kelola, header menjadi bilah merah solid |
| R-09 | Hero kolase | Kisi gambar dari produk sendiri (termasuk gambar unggahan; placeholder bila kosong) dengan kotak merah di tengah berisi judul besar berhuruf kapital dan tautan "Lihat produk" |
| R-10 | Notifikasi kecil | Kotak pemberitahuan yang dapat ditutup dengan tombol silang. Tidak disimpan; muncul lagi saat halaman dimuat ulang |
| R-11 | Kartu produk datar | Gambar persegi, nama, kategori, harga tebal, stok, dan tombol merah bersudut tajam; tanpa bingkai atau bayangan |
| R-12 | Urutan dipindah ke atas daftar | Dropdown sorting berada di samping judul bagian; pencarian berada di header |

Prinsip aset: tata letak terinspirasi pola umum situs ritel, tetapi **tidak** memakai logo, foto, atau teks merek pihak lain. Semua gambar adalah placeholder SVG lokal atau unggahan pengelola; font memakai font sistem.

### 14.2 Acceptance criteria tambahan
| ID | Langkah | Hasil yang diharapkan | Status |
|---|---|---|---|
| AC-D01 | Buka halaman pada layar desktop | Header transparan di atas hero kolase, kotak merah di tengah, kolom cari pil di kanan | ☐ |
| AC-D02 | Klik tab "Minuman" | Judul bagian berubah menjadi "Minuman", hanya produk minuman tampil, tab terbawahi garis | ☐ |
| AC-D03 | Ketik di kolom cari saat berada di Kelola | Aplikasi pindah ke katalog dan menyaring produk | ☐ |
| AC-D04 | Klik ikon Kelola, lalu klik lagi | Masuk ke dashboard (header merah solid, hero hilang), lalu kembali ke katalog | ☐ |
| AC-D05 | Klik logo | Kembali ke katalog dengan filter kategori dan pencarian direset | ☐ |
| AC-D06 | Klik tombol silang pada notifikasi | Notifikasi hilang | ☐ |
| AC-D07 | Unggah gambar pada satu produk | Gambar tampil di kartu dan ikut muncul pada kisi hero | ☐ |
| AC-D08 | Ubah lebar jendela menjadi 390 px | Header menyusun ulang (logo, cari, ikon, lalu tab bisa digeser); kotak merah tidak terpotong; notifikasi pindah ke bawah hero | ☐ |
| AC-D09 | Tekan Tab berulang kali | Semua kontrol header, hero, dan kartu punya fokus terlihat | ☐ |

