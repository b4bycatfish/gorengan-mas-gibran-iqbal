import { api } from '../api.js';
import {
  applyServerErrors,
  clear,
  clearFieldErrors,
  confirmDialog,
  el,
  emptyState,
  errorState,
  field,
  formatDate,
  openModal,
  passwordInput,
  setFieldError,
  spinner,
  successDialog,
  toast,
} from '../ui.js';

const ROLE_LABEL = { admin: 'Admin', seller: 'Seller', buyer: 'Pembeli' };

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

function roleBadge(role) {
  return el('span', { class: `role-badge role-badge--${role}`, text: ROLE_LABEL[role] || role });
}

function openUserForm({ user, currentUserId, onSaved }) {
  const isEdit = Boolean(user);

  const name = input({ type: 'text', value: user?.name || '', placeholder: 'Nama lengkap', maxlength: 80 });
  const email = input({ type: 'email', value: user?.email || '', placeholder: 'nama@email.com' });
  const password = passwordInput({
    autocomplete: 'new-password',
    placeholder: isEdit ? 'Kosongkan bila tidak diubah' : 'Minimal 8 karakter',
  });
  const role = el(
    'select',
    {},
    el('option', { value: 'buyer', text: 'Pembeli — hanya melihat katalog & pesan WhatsApp' }),
    el('option', { value: 'seller', text: 'Seller — mengelola produk sendiri' }),
    el('option', { value: 'admin', text: 'Admin — mengelola pengguna' }),
  );
  role.value = user?.role || 'buyer';
  if (user?.id === currentUserId) {
    role.disabled = true;
    role.title = 'Peran akun sendiri tidak dapat diubah.';
  }

  const phone = input({ type: 'text', value: user?.phone || '', placeholder: '0812 3456 7890' });
  const storeName = input({ type: 'text', value: user?.storeName || '', placeholder: 'Nama toko', maxlength: 120 });
  const storeDescription = el('textarea', { rows: '2', maxlength: 255, placeholder: 'Deskripsi singkat toko' });
  storeDescription.value = user?.storeDescription || '';

  const active = input({ type: 'checkbox' });
  active.checked = user ? user.isActive : true;
  if (user?.id === currentUserId) active.disabled = true;

  const storeFields = el(
    'div',
    { class: 'store-fields' },
    field({ label: 'Nama toko', name: 'storeName', control: storeName }),
    field({ label: 'Deskripsi toko', name: 'storeDescription', control: storeDescription }),
  );

  const activeField = el(
    'div',
    { class: 'field checkbox-field' },
    el('label', {}, active, el('span', { text: 'Akun aktif (dapat masuk)' })),
  );

  const submit = el('button', { type: 'submit', class: 'btn btn--primary' }, isEdit ? 'Simpan perubahan' : 'Buat akun');

  const form = el(
    'form',
    { class: 'stack-form', novalidate: true },
    field({ label: 'Nama lengkap', name: 'name', control: name, required: true }),
    el(
      'div',
      { class: 'form-grid' },
      field({ label: 'Email', name: 'email', control: email, required: true }),
      field({ label: 'Kata sandi', name: 'password', control: password.field, required: !isEdit }),
    ),
    field({ label: 'Peran', name: 'role', control: role, required: true }),
    field({ label: 'Nomor WhatsApp', name: 'phone', control: phone, hint: 'Wajib untuk seller agar pembeli bisa memesan.' }),
    storeFields,
    activeField,
    el('div', { class: 'form-actions' }, submit),
  );

  const syncRoleFields = () => {
    storeFields.hidden = role.value !== 'seller';
  };
  role.addEventListener('change', syncRoleFields);
  syncRoleFields();

  const modal = openModal({
    title: isEdit ? `Ubah akun — ${user.name}` : 'Tambah pengguna',
    content: form,
    size: 'modal--wide',
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = {
      name: name.value.trim(),
      email: email.value.trim(),
      role: role.value,
      phone: phone.value.trim(),
      storeName: storeName.value.trim(),
      storeDescription: storeDescription.value.trim(),
      isActive: active.checked,
      password: password.input.value,
    };

    const errors = {};
    if (values.name.length < 2 || values.name.length > 80) errors.name = 'Nama wajib diisi, 2–80 karakter.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) errors.email = 'Alamat email tidak valid.';
    if (!isEdit && values.password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
    if (isEdit && values.password && values.password.length < 8) errors.password = 'Kata sandi minimal 8 karakter.';
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([key, message]) => setFieldError(form, key, message));
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Menyimpan...';
    try {
      if (isEdit) {
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        if (role.disabled) delete payload.role;
        if (active.disabled) delete payload.isActive;
        await api.adminUpdateUser(user.id, payload);
        toast('Data pengguna diperbarui.', 'success');
      } else {
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        const { user: created } = await api.adminCreateUser(payload);
        modal.close();
        onSaved();
        successDialog({
          title: 'Akun berhasil dibuat',
          message: 'Akun sudah tersimpan di database dan langsung aktif digunakan.',
          details: [
            ['Nama', created.name],
            ['Email', created.email],
            ['Peran', ROLE_LABEL[created.role] || created.role],
            created.role === 'seller'
              ? ['Toko', created.storeName || 'Belum diisi']
              : ['WhatsApp', created.phone || 'Belum diisi'],
            ['Status', created.isActive ? 'Aktif' : 'Nonaktif'],
          ],
          confirmLabel: 'Selesai',
        });
        return;
      }
      modal.close();
      onSaved();
    } catch (err) {
      applyServerErrors(form, err.details, err.message);
      submit.disabled = false;
      submit.textContent = isEdit ? 'Simpan perubahan' : 'Buat akun';
    }
  });

  return modal;
}

export function renderAdmin({ main, state, rerender }) {
  clear(main);

  const statsGrid = el('div', { class: 'stat-grid' });
  const tableWrap = el('div', { class: 'table-wrap' });
  const countLabel = el('p', { class: 'result-count' });
  const searchInput = input({ type: 'search', placeholder: 'Cari nama atau email...', 'aria-label': 'Cari pengguna' });
  const roleFilter = el(
    'select',
    { class: 'select', 'aria-label': 'Saring peran' },
    el('option', { value: '', text: 'Semua peran' }),
    el('option', { value: 'admin', text: 'Admin' }),
    el('option', { value: 'seller', text: 'Seller' }),
    el('option', { value: 'buyer', text: 'Pembeli' }),
  );

  const addButton = el(
    'button',
    { type: 'button', class: 'btn btn--primary', onClick: () => openUserForm({ currentUserId: state.user?.id, onSaved: reload }) },
    '+ Tambah pengguna',
  );

  main.append(
    el(
      'section',
      { class: 'page-head' },
      el(
        'div',
        {},
        el('p', { class: 'eyebrow', text: 'Dashboard admin' }),
        el('h1', { class: 'page-title', text: 'Kelola pengguna' }),
        el('p', {
          class: 'page-subtitle',
          text: 'Buat akun seller, atur peran, dan nonaktifkan akun yang tidak dipakai.',
        }),
      ),
      el('div', { class: 'page-actions' }, addButton),
    ),
    el('section', { class: 'panel' }, el('div', { class: 'panel-head' }, el('h2', { text: 'Ringkasan platform' })), statsGrid),
    el(
      'section',
      { class: 'panel' },
      el(
        'div',
        { class: 'panel-head' },
        el('h2', { text: 'Daftar pengguna' }),
        el('div', { class: 'table-tools' }, searchInput, roleFilter, countLabel),
      ),
      tableWrap,
    ),
  );

  let users = [];
  let searchTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadUsers, 250);
  });
  roleFilter.addEventListener('change', loadUsers);

  async function loadStats() {
    clear(statsGrid);
    statsGrid.append(spinner('Memuat ringkasan...'));
    try {
      const { users: u, products } = await api.adminStats();
      clear(statsGrid);
      statsGrid.append(
        statCard('Total pengguna', String(u.total), `${u.inactive} akun nonaktif`),
        statCard('Seller', String(u.sellers), 'Toko aktif di katalog'),
        statCard('Pembeli', String(u.buyers), 'Akun pembeli terdaftar'),
        statCard('Produk', String(products.total), `Total stok ${products.totalStock}`),
      );
    } catch (err) {
      clear(statsGrid);
      statsGrid.append(errorState(err.message, loadStats));
    }
  }

  async function loadUsers() {
    clear(tableWrap);
    tableWrap.append(spinner('Memuat pengguna...'));
    try {
      const data = await api.adminUsers({
        q: searchInput.value.trim(),
        role: roleFilter.value,
        limit: 100,
      });
      users = data.items;
      countLabel.textContent = `${data.total} akun`;
      renderTable();
    } catch (err) {
      clear(tableWrap);
      tableWrap.append(errorState(err.message, loadUsers));
    }
  }

  async function toggleActive(user) {
    const next = !user.isActive;
    if (!next) {
      const ok = await confirmDialog({
        title: 'Nonaktifkan akun',
        message: `Nonaktifkan akun ${user.name}? Pengguna tidak dapat masuk sampai diaktifkan kembali.`,
        confirmLabel: 'Nonaktifkan',
      });
      if (!ok) return;
    }
    try {
      await api.adminUpdateUser(user.id, { isActive: next });
      toast(next ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.', 'success');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function removeUser(user) {
    const ok = await confirmDialog({
      title: 'Hapus akun',
      message: `Hapus akun ${user.name} (${user.email})? Semua produk milik seller ini juga akan terhapus.`,
      confirmLabel: 'Hapus akun',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.adminDeleteUser(user.id);
      toast('Akun dihapus.', 'success');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function renderTable() {
    clear(tableWrap);
    if (users.length === 0) {
      tableWrap.append(emptyState('Tidak ada pengguna', 'Ubah kata kunci atau filter peran.'));
      return;
    }

    const table = el('table', { class: 'table' });
    const head = el(
      'thead',
      {},
      el(
        'tr',
        {},
        ...['Pengguna', 'Peran', 'Toko / WhatsApp', 'Produk', 'Status', 'Aksi'].map((label) =>
          el('th', { scope: 'col', text: label }),
        ),
      ),
    );
    const body = el('tbody');

    for (const user of users) {
      const isSelf = user.id === state.user?.id;
      body.append(
        el(
          'tr',
          { class: user.isActive ? '' : 'row--inactive' },
          el(
            'td',
            {},
            el('span', { class: 'cell-title', text: user.name }),
            el('span', { class: 'cell-sub', text: user.email }),
            el('span', { class: 'cell-sub', text: `Terdaftar ${formatDate(user.createdAt)}` }),
          ),
          el('td', {}, roleBadge(user.role)),
          el(
            'td',
            {},
            user.role === 'seller'
              ? el(
                  'div',
                  { class: 'cell-stack' },
                  el('span', { class: 'cell-title', text: user.storeName || 'Belum ada nama toko' }),
                  el('span', { class: 'cell-sub', text: user.phone || 'WhatsApp belum diatur' }),
                )
              : el('span', { class: 'cell-sub', text: user.phone || '—' }),
          ),
          el('td', { text: user.role === 'seller' ? String(user.productCount) : '—' }),
          el(
            'td',
            {},
            user.isActive
              ? el('span', { class: 'status-dot status-dot--ok', text: 'Aktif' })
              : el('span', { class: 'status-dot status-dot--off', text: 'Nonaktif' }),
          ),
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
                  onClick: () => openUserForm({ user, currentUserId: state.user?.id, onSaved: reload }),
                },
                'Ubah',
              ),
              isSelf
                ? el('span', { class: 'cell-sub', text: 'Akun Anda' })
                : el(
                    'button',
                    {
                      type: 'button',
                      class: 'btn btn--ghost btn--sm',
                      onClick: () => toggleActive(user),
                    },
                    user.isActive ? 'Nonaktifkan' : 'Aktifkan',
                  ),
              isSelf
                ? null
                : el(
                    'button',
                    {
                      type: 'button',
                      class: 'btn btn--danger-ghost btn--sm',
                      onClick: () => removeUser(user),
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

  function reload() {
    loadStats();
    loadUsers();
  }

  reload();
}
