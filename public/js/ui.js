/* Utilitas DOM, format, notifikasi, dan modal. Tanpa innerHTML untuk data pengguna. */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'value') node.value = value;
    else if (key === 'checked') node.checked = Boolean(value);
    else if (key === 'disabled') node.disabled = Boolean(value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const child of children.flat(4)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function money(value) {
  return rupiah.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}`.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toast(message, type = 'info') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const item = el('div', { class: `toast toast--${type}`, role: 'status' }, message);
  region.append(item);
  setTimeout(() => {
    item.classList.add('toast--out');
    setTimeout(() => item.remove(), 250);
  }, 3200);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Membuat ikon SVG sederhana dari daftar [tag, atribut]. */
function svgIcon(children, size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs = {
    viewBox: '0 0 24 24',
    width: String(size),
    height: String(size),
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
  for (const [tag, tagAttrs] of children) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(tagAttrs)) node.setAttribute(key, value);
    svg.append(node);
  }
  return svg;
}

function eyeIcon(visible) {
  const parts = [
    ['path', { d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z' }],
    ['circle', { cx: '12', cy: '12', r: '3' }],
  ];
  if (!visible) parts.push(['path', { d: 'm3.5 3.5 17 17' }]);
  return svgIcon(parts);
}

function checkIcon() {
  return svgIcon(
    [
      ['circle', { cx: '12', cy: '12', r: '9.5' }],
      ['path', { d: 'm7.8 12.3 2.8 2.8 5.6-5.8' }],
    ],
    28,
  );
}

/**
 * Kolom kata sandi dengan tombol ikon mata untuk menampilkan/menyembunyikan isi.
 * Mengembalikan { field, input } — pakai `field` di DOM dan `input` untuk membaca nilai.
 */
export function passwordInput(attrs = {}) {
  const input = el('input', { type: 'password', ...attrs });
  const toggle = el(
    'button',
    {
      type: 'button',
      class: 'password-toggle',
      'aria-label': 'Tampilkan kata sandi',
      'aria-pressed': 'false',
      title: 'Tampilkan kata sandi',
      onClick: () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.setAttribute('aria-pressed', String(show));
        toggle.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
        toggle.title = show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi';
        toggle.replaceChildren(eyeIcon(show));
        input.focus();
        const end = input.value.length;
        input.setSelectionRange?.(end, end);
      },
    },
    eyeIcon(false),
  );
  const field = el('div', { class: 'password-field' }, input, toggle);
  return { field, input };
}

/**
 * Modal sederhana. Mengembalikan { root, body, close }.
 * `content` adalah Node (biasanya <form>).
 */
export function openModal({ title, content, size = '' }) {
  const body = el('div', { class: 'modal-body' }, content);
  const close = () => {
    root.remove();
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  const closeBtn = el(
    'button',
    { type: 'button', class: 'modal-close', 'aria-label': 'Tutup', onClick: close },
    '×',
  );
  const root = el(
    'div',
    {
      class: 'modal-overlay',
      onClick: (event) => {
        if (event.target === root) close();
      },
    },
    el(
      'div',
      { class: `modal ${size}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      el('div', { class: 'modal-head' }, el('h2', { text: title }), closeBtn),
      body,
    ),
  );

  document.getElementById('modal-root').append(root);
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onKey);
  root.querySelector('input, select, textarea, button.modal-close')?.focus();

  return { root, body, close };
}

/** Pop-up keberhasilan dengan rincian singkat. */
export function successDialog({ title, message, details = [], confirmLabel = 'Selesai' }) {
  const content = el(
    'div',
    { class: 'success-dialog' },
    el('span', { class: 'success-icon' }, checkIcon()),
    el('h3', { class: 'success-title', text: title }),
    message ? el('p', { class: 'success-text', text: message }) : null,
    details.length
      ? el(
          'dl',
          { class: 'success-details' },
          ...details.map(([label, value]) =>
            el('div', {}, el('dt', { text: label }), el('dd', { text: value })),
          ),
        )
      : null,
  );

  const modal = openModal({ title: 'Berhasil', content, size: 'modal--sm' });
  content.append(
    el(
      'div',
      { class: 'form-actions success-actions' },
      el('button', { type: 'button', class: 'btn btn--primary btn--block', onClick: modal.close }, confirmLabel),
    ),
  );
  content.querySelector('.btn')?.focus();
  return modal;
}

/** Dialog konfirmasi -> Promise<boolean>. */
export function confirmDialog({ title, message, confirmLabel = 'Ya, lanjutkan', danger = false }) {
  return new Promise((resolve) => {
    let modal;
    const finish = (value) => {
      modal.close();
      resolve(value);
    };
    const content = el(
      'div',
      { class: 'confirm' },
      el('p', { text: message }),
      el(
        'div',
        { class: 'form-actions' },
        el('button', { type: 'button', class: 'btn btn--ghost', onClick: () => finish(false) }, 'Batal'),
        el(
          'button',
          {
            type: 'button',
            class: `btn ${danger ? 'btn--danger' : 'btn--primary'}`,
            onClick: () => finish(true),
          },
          confirmLabel,
        ),
      ),
    );
    modal = openModal({ title, content, size: 'modal--sm' });
    content.querySelector('.btn--ghost')?.focus();
  });
}

/** Satu baris formulir: label + kontrol + tempat pesan galat. */
export function field({ label, control, hint, name, required = false }) {
  const error = el('p', { class: 'field-error', id: `${name}-error`, hidden: true });
  const inputEl =
    control instanceof Node && !control.matches('input, select, textarea')
      ? control.querySelector('input, select, textarea')
      : control;
  if (inputEl) {
    inputEl.id = inputEl.id || `f-${name}`;
    inputEl.setAttribute('aria-describedby', `${name}-error`);
    if (required) inputEl.required = true;
  }
  return el(
    'div',
    { class: 'field', dataset: { field: name } },
    el(
      'label',
      { for: inputEl?.id || `f-${name}` },
      label,
      required ? el('span', { class: 'req', text: ' *' }) : null,
    ),
    control,
    hint ? el('p', { class: 'field-hint', text: hint }) : null,
    error,
  );
}

export function setFieldError(form, name, message) {
  const wrapper = form.querySelector(`[data-field="${name}"]`);
  if (!wrapper) return;
  const error = wrapper.querySelector('.field-error');
  const control = wrapper.querySelector('input, select, textarea');
  if (message) {
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    wrapper.classList.add('has-error');
    control?.setAttribute('aria-invalid', 'true');
  } else {
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
    wrapper.classList.remove('has-error');
    control?.removeAttribute('aria-invalid');
  }
}

export function clearFieldErrors(form) {
  form.querySelectorAll('[data-field]').forEach((wrapper) => {
    const name = wrapper.dataset.field;
    setFieldError(form, name, '');
  });
  const banner = form.querySelector('.form-error');
  if (banner) banner.remove();
}

export function showFormError(form, message) {
  clearFieldErrors(form);
  form.prepend(el('p', { class: 'form-error', role: 'alert', text: message }));
}

export function applyServerErrors(form, details, fallback) {
  if (details && typeof details === 'object') {
    for (const [name, message] of Object.entries(details)) setFieldError(form, name, message);
    if (!form.querySelector('.form-error')) {
      form.prepend(el('p', { class: 'form-error', role: 'alert', text: fallback }));
    }
  } else {
    showFormError(form, fallback);
  }
}

export function spinner(label = 'Memuat data...') {
  return el('div', { class: 'state state--loading' }, el('span', { class: 'spinner' }), label);
}

export function emptyState(title, description, action) {
  return el(
    'div',
    { class: 'state' },
    el('p', { class: 'state-title', text: title }),
    description ? el('p', { class: 'state-text', text: description }) : null,
    action || null,
  );
}

export function errorState(message, onRetry) {
  return el(
    'div',
    { class: 'state state--error' },
    el('p', { class: 'state-title', text: 'Terjadi masalah' }),
    el('p', { class: 'state-text', text: message }),
    onRetry
      ? el('button', { class: 'btn btn--ghost', type: 'button', onClick: onRetry }, 'Coba lagi')
      : null,
  );
}

/** Kompresi gambar di peramban: sisi terpanjang 900 px, JPEG. */
export async function compressImage(file) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Berkas harus berupa gambar PNG, JPG, atau WebP.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Gambar gagal diproses.');
  return blob;
}

export function imageOrPlaceholder(url) {
  return url || '/placeholder/default.svg';
}
