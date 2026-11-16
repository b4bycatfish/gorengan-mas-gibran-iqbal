import { api } from '../api.js';
import {
  applyServerErrors,
  clear,
  clearFieldErrors,
  compressImage,
  confirmDialog,
  el,
  emptyState,
  errorState,
  field,
  imageOrPlaceholder,
  money,
  openModal,
  setFieldError,
  spinner,
  toast,
} from '../ui.js';

const BASE_CATEGORIES = ['Gorengan', 'Camilan', 'Minuman', 'Paket', 'Lainnya'];

function input(props = {}) {
  return el('input', { ...props });
}

function statCard(label, value, hint) {
  return el(
    'div',
    { class: 'stat-card' },
    el('p', { class: 'stat-label', text: label }),
    el('p', { class: 'stat-value', text: value }),
    hint ? el('p', { class: 'stat-hint', text: hint }) : null,
  );
}

function validateProductForm(values) {
  const errors = {};
  if (!values.nama || values.nama.length < 2 || values.nama.length > 60) {
    errors.nama = 'Nama produk wajib diisi, 2–60 karakter.';
  }
  if (!values.kategori || values.kategori.length < 2 || values.kategori.length > 30) {
    errors.kategori = 'Kategori wajib diisi, 2–30 karakter.';
  }
  if (!/^\d+$/.test(values.harga)) errors.harga = 'Harga harus bilangan bulat minimal 0.';
  if (!/^\d+$/.test(values.stok)) errors.stok = 'Stok harus bilangan bulat minimal 0.';
  if (values.deskripsi.length > 200) errors.deskripsi = 'Deskripsi maksimal 200 karakter.';
  return errors;
}

function openProductForm({ product, categories, onSaved }) {
  const isEdit = Boolean(product);
  const others = categories.filter((c) => !BASE_CATEGORIES.some((b) => b.toLowerCase() === c.toLowerCase()));
  const options = [...BASE_CATEGORIES, ...others];

  const nama = input({ type: 'text', value: product?.nama || '', placeholder: 'Contoh: Bakwan Sayur', maxlength: 60 });
  const categorySelect = el(
    'select',
    {},
    ...options.map((c) => el('option', { value: c, text: c })),
    el('option', { value: '__new__', text: '+ Kategori baru...' }),
  );
  if (product?.kategori && !options.some((c) => c.toLowerCase() === product.kategori.toLowerCase())) {
    categorySelect.insertBefore(el('option', { value: product.kategori, text: product.kategori }), categorySelect.firstChild);
  }
  categorySelect.value = product?.kategori || 'Gorengan';

  const newCategory = input({ type: 'text', id: 'f-kategoriBaru', placeholder: 'Nama kategori baru', maxlength: 30 });
  const newCategoryField = el(
    'div',
    { class: 'field', dataset: { field: 'kategoriBaru' }, hidden: true },
    el('label', { text: 'Nama kategori baru' }),
    newCategory,
    el('p', { class: 'field-error', hidden: true }),
  );
  categorySelect.addEventListener('change', () => {
    newCategoryField.hidden = categorySelect.value !== '__new__';
    if (!newCategoryField.hidden) newCategory.focus();
  });

  const harga = input({ type: 'number', min: '0', step: '1', value: product ? String(product.harga) : '', placeholder: '1500' });
  const stok = input({ type: 'number', min: '0', step: '1', value: product ? String(product.stok) : '', placeholder: '20' });
  const deskripsi = el('textarea', {
    rows: '3',
    maxlength: '200',
    placeholder: 'Deskripsi singkat produk (opsional)',
  });
  deskripsi.value = product?.deskripsi || '';
  const counter = el('span', { class: 'char-count', text: `${deskripsi.value.length}/200` });
  deskripsi.addEventListener('input', () => {
    counter.textContent = `${deskripsi.value.length}/200`;
  });

  const unggulan = input({ type: 'checkbox' });
  unggulan.checked = Boolean(product?.unggulan);

  const preview = el('img', {
    class: 'image-preview',
    src: imageOrPlaceholder(product?.imageUrl),
    alt: 'Pratinjau gambar produk',
  });
  preview.addEventListener('error', () => {
    preview.src = '/placeholder/default.svg';
  });
  const fileInput = input({ type: 'file', accept: 'image/png,image/jpeg,image/webp' });
  const urlInput = input({ type: 'text', value: product?.imageUrl || '', placeholder: 'https://... atau biarkan kosong' });
  let imageBlob = null;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      imageBlob = await compressImage(file);
      preview.src = URL.createObjectURL(imageBlob);
      urlInput.value = '';
      setFieldError(form, 'image', '');
    } catch (err) {
      imageBlob = null;
      fileInput.value = '';
      setFieldError(form, 'image', err.message);
    }
  });

  urlInput.addEventListener('input', () => {
    if (imageBlob) return;
    preview.src = imageOrPlaceholder(urlInput.value.trim());
  });

  const removeImage = el(
    'button',
    {
      type: 'button',
      class: 'btn btn--ghost btn--sm',
      onClick: () => {
        imageBlob = null;
        fileInput.value = '';
        urlInput.value = '';
        preview.src = '/placeholder/default.svg';
        setFieldError(form, 'image', '');
      },
    },
    'Hapus gambar',
  );

  const submit = el('button', { type: 'submit', class: 'btn btn--primary' }, isEdit ? 'Simpan perubahan' : 'Tambah produk');

  const form = el(
    'form',
    { class: 'stack-form', novalidate: true },
    field({ label: 'Nama produk', name: 'nama', control: nama, required: true }),
    field({ label: 'Kategori', name: 'kategori', control: categorySelect, required: true }),
    newCategoryField,
    el(
      'div',
      { class: 'form-grid' },
      field({ label: 'Harga (Rp)', name: 'harga', control: harga, required: true, hint: 'Bilangan bulat, tanpa titik.' }),
      field({ label: 'Stok', name: 'stok', control: stok, required: true, hint: 'Bilangan bulat minimal 0.' }),
    ),
    field({ label: 'Deskripsi', name: 'deskripsi', control: deskripsi }),
    el(
      'div',
      { class: 'field checkbox-field' },
      el('label', {}, unggulan, el('span', { text: 'Tandai sebagai produk unggulan' })),
    ),
    el(
      'div',
      { class: 'field', dataset: { field: 'image' } },
      el('label', { text: 'Gambar produk' }),
      el(
        'div',
        { class: 'image-editor' },
        preview,
        el(
          'div',
          { class: 'image-controls' },
          el('p', { class: 'field-hint', text: 'PNG, JPG, atau WebP maksimal 5 MB. Gambar diperkecil otomatis.' }),
          fileInput,
          urlInput,
          removeImage,
        ),
      ),
      el('p', { class: 'field-error', hidden: true }),
    ),
    el('div', { class: 'form-actions' }, submit),
  );
  // Pindahkan penghitung karakter ke bawah textarea.
  deskripsi.after(counter);

  const modal = openModal({
    title: isEdit ? 'Ubah produk' : 'Tambah produk',
    content: form,
    size: 'modal--wide',
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    const kategoriValue = categorySelect.value === '__new__' ? newCategory.value.trim() : categorySelect.value;
    const values = {
      nama: nama.value.trim(),
      kategori: kategoriValue,
      harga: harga.value.trim(),
      stok: stok.value.trim(),
      deskripsi: deskripsi.value.trim(),
    };

    const errors = validateProductForm(values);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));
      return;
    }

    const data = new FormData();
    data.append('nama', values.nama);
    data.append('kategori', values.kategori);
    data.append('harga', values.harga);
    data.append('stok', values.stok);
    data.append('deskripsi', values.deskripsi);
    data.append('unggulan', unggulan.checked ? 'true' : 'false');
    data.append('imageUrl', imageBlob ? '' : urlInput.value.trim());
    if (imageBlob) data.append('image', imageBlob, 'produk.jpg');

    submit.disabled = true;
    submit.textContent = 'Menyimpan...';
    try {
      if (isEdit) await api.updateProduct(product.id, data);
      else await api.createProduct(data);
      modal.close();
      toast(isEdit ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.', 'success');
      onSaved();
    } catch (err) {
      applyServerErrors(form, err.details, err.message);
      submit.disabled = false;
      submit.textContent = isEdit ? 'Simpan perubahan' : 'Tambah produk';
    }
  });

  return modal;
}

export function renderSeller({ main, state, rerender }) {
  clear(main);

  const statsGrid = el('div', { class: 'stat-grid' });
  const tableWrap = el('div', { class: 'table-wrap' });
  const listCount = el('p', { class: 'result-count' });
  const searchInput = input({ type: 'search', placeholder: 'Cari produk saya...', 'aria-label': 'Cari produk saya' });

  const storeName = input({ type: 'text', id: 'store-name', value: state.user?.storeName || '', maxlength: 120 });
  const phone = input({ type: 'text', id: 'store-phone', value: state.user?.phone || '', placeholder: '0812 3456 7890' });
  const storeDescription = el('textarea', { rows: '2', id: 'store-desc', maxlength: 255, placeholder: 'Ceritakan singkat tentang toko Anda' });
  storeDescription.value = state.user?.storeDescription || '';
  const saveStore = el('button', { type: 'submit', class: 'btn btn--primary' }, 'Simpan pengaturan');

  const storeForm = el(
    'form',
    { class: 'store-form', novalidate: true },
    el(
      'div',
      { class: 'form-grid' },
      el('div', { class: 'field' }, el('label', { for: 'store-name' }, 'Nama toko'), storeName),
      el(
        'div',
        { class: 'field' },
        el('label', { for: 'store-phone' }, 'Nomor WhatsApp pemesanan'),
        phone,
        el('p', { class: 'field-hint', text: 'Dipakai pembeli untuk memesan. Awalan 0 otomatis menjadi 62.' }),
      ),
    ),
    el('div', { class: 'field' }, el('label', { for: 'store-desc' }, 'Deskripsi toko'), storeDescription),
    el('div', { class: 'form-actions' }, saveStore),
  );

  storeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveStore.disabled = true;
    saveStore.textContent = 'Menyimpan...';
    try {
      const { user } = await api.updateStore({
        storeName: storeName.value.trim(),
        phone: phone.value.trim(),
        storeDescription: storeDescription.value.trim(),
      });
      state.user = user;
      toast('Pengaturan toko tersimpan.', 'success');
      rerender();
    } catch (err) {
      showStoreError(formErrorTarget, err.message);
    } finally {
      saveStore.disabled = false;
      saveStore.textContent = 'Simpan pengaturan';
    }
  });

  const formErrorTarget = el('p', { class: 'form-error', role: 'alert', hidden: true });
  function showStoreError(target, message) {
    target.textContent = message || '';
    target.hidden = !message;
  }
  storeForm.prepend(formErrorTarget);

  const addButton = el(
    'button',
    { type: 'button', class: 'btn btn--primary', onClick: () => openProductForm({ product: null, categories, onSaved: reload }) },
    '+ Tambah produk',
  );

  main.append(
    el(
      'section',
      { class: 'page-head' },
      el(
        'div',
        {},
        el('p', { class: 'eyebrow', text: 'Dashboard seller' }),
        el('h1', { class: 'page-title', text: state.user?.storeName || 'Toko saya' }),
        el('p', { class: 'page-subtitle', text: 'Kelola produk, stok, dan nomor WhatsApp yang dilihat pembeli.' }),
      ),
      el('div', { class: 'page-actions' }, addButton),
    ),
    el('section', { class: 'panel' }, el('div', { class: 'panel-head' }, el('h2', { text: 'Ringkasan toko' })), statsGrid),
    el(
      'section',
      { class: 'panel' },
      el(
        'div',
        { class: 'panel-head' },
        el('h2', { text: 'Produk saya' }),
        el('div', { class: 'table-tools' }, searchInput, listCount),
      ),
      tableWrap,
    ),
    el(
      'section',
      { class: 'panel' },
      el(
        'div',
        { class: 'panel-head' },
        el('h2', { text: 'Pengaturan toko' }),
        el('p', { class: 'panel-note', text: 'Nomor WhatsApp hanya dipakai untuk tautan pesanan, tidak dikirim ke pihak lain.' }),
      ),
      storeForm,
    ),
  );

  let products = [];
  let categories = [...BASE_CATEGORIES];
  let searchTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadProducts, 250);
  });

  async function loadProducts() {
    clear(tableWrap);
    tableWrap.append(spinner('Memuat produk...'));
    try {
      const { items } = await api.sellerProducts(searchInput.value.trim());
      products = items;
      categories = [...new Set([...BASE_CATEGORIES, ...items.map((p) => p.kategori)])];
      listCount.textContent = `${items.length} produk`;
      renderTable();
    } catch (err) {
      clear(tableWrap);
      tableWrap.append(errorState(err.message, loadProducts));
    }
  }

  function renderTable() {
    clear(tableWrap);
    if (products.length === 0) {
      tableWrap.append(
        emptyState(
          'Belum ada produk',
          'Tambahkan produk pertama Anda agar muncul di katalog pembeli.',
          el(
            'button',
            {
              type: 'button',
              class: 'btn btn--primary',
              onClick: () => openProductForm({ product: null, categories, onSaved: reload }),
            },
            'Tambah produk',
          ),
        ),
      );
      return;
    }

    const table = el('table', { class: 'table' });
    const head = el(
      'thead',
      {},
      el(
        'tr',
        {},
        ...['Produk', 'Kategori', 'Harga', 'Stok', 'Status', 'Aksi'].map((label) =>
          el('th', { scope: 'col', text: label }),
        ),
      ),
    );
    const body = el('tbody');

    for (const product of products) {
      const img = el('img', { class: 'thumb', src: imageOrPlaceholder(product.imageUrl), alt: '', loading: 'lazy' });
      img.addEventListener('error', () => {
        img.src = '/placeholder/default.svg';
      });

      body.append(
        el(
          'tr',
          {},
          el(
            'td',
            {},
            el(
              'div',
              { class: 'cell-product' },
              img,
              el(
                'div',
                {},
                el('span', { class: 'cell-title', text: product.nama }),
                product.unggulan ? el('span', { class: 'badge badge--gold badge--sm', text: 'Unggulan' }) : null,
              ),
            ),
          ),
          el('td', { text: product.kategori }),
          el('td', { text: money(product.harga) }),
          el('td', { text: String(product.stok) }),
          el('td', {}, product.stok > 0
            ? el('span', { class: 'status-dot status-dot--ok', text: 'Tersedia' })
            : el('span', { class: 'status-dot status-dot--off', text: 'Habis' })),
          el(
            'td',
            {},
            el(
              'div',
              { class: 'row-actions' },
              el(
                'button',
                {
                  type: 'button',
                  class: 'btn btn--ghost btn--sm',
                  onClick: () => openProductForm({ product, categories, onSaved: reload }),
                },
                'Ubah',
              ),
              el(
                'button',
                {
                  type: 'button',
                  class: 'btn btn--danger-ghost btn--sm',
                  onClick: async () => {
                    const ok = await confirmDialog({
                      title: 'Hapus produk',
                      message: `Hapus "${product.nama}"? Tindakan ini tidak dapat dibatalkan.`,
                      confirmLabel: 'Hapus produk',
                      danger: true,
                    });
                    if (!ok) return;
                    try {
                      await api.deleteProduct(product.id);
                      toast('Produk dihapus.', 'success');
                      reload();
                    } catch (err) {
                      toast(err.message, 'error');
                    }
                  },
                },
                'Hapus',
              ),
            ),
          ),
        ),
      );
    }

    table.append(head, body);
    tableWrap.append(table);
  }

  async function loadSummary() {
    clear(statsGrid);
    statsGrid.append(spinner('Memuat ringkasan...'));
    try {
      const { stats } = await api.sellerSummary();
      clear(statsGrid);
      statsGrid.append(
        statCard('Produk', String(stats.productCount), 'Total produk di toko Anda'),
        statCard('Total stok', String(stats.totalStock), 'Jumlah seluruh stok'),
        statCard('Kategori', String(stats.categoryCount), 'Kategori unik'),
        statCard('Stok habis', String(stats.outOfStock), 'Produk perlu diisi ulang'),
      );
    } catch (err) {
      clear(statsGrid);
      statsGrid.append(errorState(err.message, loadSummary));
    }
  }

  function reload() {
    loadSummary();
    loadProducts();
  }

  reload();
}
