export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const options = { method, credentials: 'same-origin', headers: {} };
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    options.signal = AbortSignal.timeout(20000);
  }
  if (formData) {
    options.body = formData;
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  if (method !== 'GET') options.headers['X-Requested-With'] = 'fetch';

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new ApiError(0, 'Server tidak merespons dalam 20 detik. Periksa koneksi atau pastikan server aplikasi berjalan.');
    }
    throw new ApiError(0, 'Tidak dapat menghubungi server. Periksa koneksi Anda.');
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    // 404 non-JSON biasanya berarti halaman ini hanya hosting statis (mis. Vercel)
    // tanpa server Express/MySQL, bukan produk yang hilang.
    const apiMissing = response.status === 404 && !isJson;
    const message = apiMissing
      ? 'Server API tidak ditemukan di alamat ini. Hosting statis tidak menjalankan Express/MySQL; jalankan aplikasi dengan "npm start" lalu buka http://localhost:3000.'
      : payload.error || 'Permintaan gagal diproses.';
    throw new ApiError(response.status, message, payload.details);
  }
  return payload;
}

function qs(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

export const api = {
  me: () => request('/auth/me'),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  products: (params) => request(`/products${qs(params)}`),
  product: (id) => request(`/products/${id}`),

  sellerSummary: () => request('/seller/summary'),
  sellerProducts: (q) => request(`/seller/products${qs({ q })}`),
  updateStore: (data) => request('/seller/store', { method: 'PUT', body: data }),
  createProduct: (formData) => request('/products', { method: 'POST', formData }),
  updateProduct: (id, formData) => request(`/products/${id}`, { method: 'PUT', formData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  adminStats: () => request('/admin/stats'),
  adminUsers: (params) => request(`/admin/users${qs(params)}`),
  adminCreateUser: (data) => request('/admin/users', { method: 'POST', body: data }),
  adminUpdateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PATCH', body: data }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
};
