/** Aturan validasi bersama untuk produk, pengguna, dan nomor WhatsApp. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IMAGE_SCHEME_RE = /^(https?:\/\/|data:image\/|\/uploads\/|\/placeholder\/)/i;

export function normalizePhone(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith('62')) digits = `62${digits}`;
  if (!/^62\d{8,13}$/.test(digits)) return null; // total 10–15 digit, diawali 62
  return digits;
}

export function toInt(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value !== 'string' || value.trim() === '') return NaN;
  if (!/^-?\d+$/.test(value.trim())) return NaN;
  return Number.parseInt(value, 10);
}

function isTrue(value) {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 'on';
}

/**
 * Validasi payload produk. Mengembalikan { values, errors }.
 * `errors` berisi { field: pesan } agar dapat ditampilkan per kolom.
 */
export function validateProduct(input = {}) {
  const errors = {};
  const values = {};

  const nama = typeof input.nama === 'string' ? input.nama.trim() : '';
  if (nama.length < 2 || nama.length > 60) {
    errors.nama = 'Nama produk wajib diisi, 2–60 karakter.';
  } else {
    values.nama = nama;
  }

  const kategori = typeof input.kategori === 'string' ? input.kategori.trim() : '';
  if (kategori.length < 2 || kategori.length > 30) {
    errors.kategori = 'Kategori wajib diisi, 2–30 karakter.';
  } else {
    values.kategori = kategori;
  }

  const harga = toInt(input.harga);
  if (Number.isNaN(harga) || harga < 0 || harga > 1_000_000_000) {
    errors.harga = 'Harga harus bilangan bulat minimal 0.';
  } else {
    values.harga = harga;
  }

  const stok = toInt(input.stok);
  if (Number.isNaN(stok) || stok < 0 || stok > 1_000_000) {
    errors.stok = 'Stok harus bilangan bulat minimal 0.';
  } else {
    values.stok = stok;
  }

  const deskripsi = typeof input.deskripsi === 'string' ? input.deskripsi.trim() : '';
  if (deskripsi.length > 200) {
    errors.deskripsi = 'Deskripsi maksimal 200 karakter.';
  } else {
    values.deskripsi = deskripsi;
  }

  values.unggulan = isTrue(input.unggulan);

  return { values, errors };
}

/** Validasi kolom gambar: boleh kosong, URL http(s), data URL, atau unggahan lokal. */
export function validateImageUrl(raw) {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  const value = String(raw).trim();
  if (value === '') return { ok: true, value: null };
  if (value.length > 2_000_000) {
    return { ok: false, value: null, message: 'Gambar terlalu besar.' };
  }
  if (!IMAGE_SCHEME_RE.test(value)) {
    return { ok: false, value: null, message: 'Tautan gambar harus diawali http://, https://, atau data:image/.' };
  }
  return { ok: true, value };
}

export function validateEmail(raw) {
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!email || email.length > 160 || !EMAIL_RE.test(email)) return null;
  return email;
}

export function validatePassword(raw) {
  if (typeof raw !== 'string' || raw.length < 8 || raw.length > 72) return null;
  return raw;
}

export function validateName(raw) {
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (name.length < 2 || name.length > 80) return null;
  return name;
}

export function validateRole(raw) {
  return ['admin', 'seller', 'buyer'].includes(raw) ? raw : null;
}
