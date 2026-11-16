import { api } from '../api.js';
import {
  clear,
  el,
  emptyState,
  errorState,
  imageOrPlaceholder,
  money,
  openModal,
  spinner,
} from '../ui.js';

const SORT_OPTIONS = [
  ['unggulan', 'Unggulan & nama A–Z'],
  ['nama-asc', 'Nama A–Z'],
  ['nama-desc', 'Nama Z–A'],
  ['harga-asc', 'Harga termurah'],
  ['harga-desc', 'Harga termahal'],
  ['stok-desc', 'Stok terbanyak'],
  ['terbaru', 'Terbaru'],
];

export function whatsappLink(product, qty = 1) {
  const phone = (product.seller?.phone || '').replace(/\D/g, '');
  if (!phone) return null;
  const store = product.seller?.storeName || 'penjual';
  const total = money(product.harga * qty);
  const jumlah = qty > 1 ? `${qty} ` : '';
  const text = `Halo ${store}, saya mau pesan ${jumlah}${product.nama} (${total}). Apakah masih tersedia?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function productImage(product, className = '') {
  const img = el('img', {
    class: className,
    src: imageOrPlaceholder(product.imageUrl),
    alt: `Foto ${product.nama}`,
    loading: 'lazy',
  });
  img.addEventListener('error', () => {
    if (!img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = '/placeholder/default.svg';
    }
  });
  return img;
}

function productCard(product, onDetail) {
  const habis = product.stok <= 0;
  const link = whatsappLink(product);

  return el(
    'article',
    { class: `product-card${habis ? ' is-soldout' : ''}` },
    el(
      'button',
      { class: 'product-media', type: 'button', onClick: () => onDetail(product), 'aria-label': `Lihat detail ${product.nama}` },
      productImage(product),
      product.unggulan ? el('span', { class: 'badge badge--gold', text: 'Unggulan' }) : null,
      habis ? el('span', { class: 'badge badge--dark', text: 'Habis' }) : null,
    ),
    el(
      'div',
      { class: 'product-body' },
      el('p', { class: 'product-cat', text: product.kategori }),
      el('h3', { class: 'product-name' }, el('button', { type: 'button', class: 'link-plain', onClick: () => onDetail(product) }, product.nama)),
      el('p', { class: 'product-store', text: product.seller?.storeName ? `oleh ${product.seller.storeName}` : 'Penjual' }),
      el(
        'div',
        { class: 'product-meta' },
        el('span', { class: 'price', text: money(product.harga) }),
        habis
          ? el('span', { class: 'stock stock--out', text: 'Stok habis' })
          : el('span', { class: 'stock', text: `Stok ${product.stok}` }),
      ),
      habis || !link
        ? el('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: true }, 'Stok habis')
        : el(
            'a',
            {
              class: 'btn btn--primary btn--block',
              href: link,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            'Pesan via WhatsApp',
          ),
      el(
        'a',
        { class: 'product-detail-link', href: '#', onClick: (e) => { e.preventDefault(); onDetail(product); } },
        'Lihat detail',
      ),
    ),
  );
}

function openDetail(product) {
  let qty = 1;
  const habis = product.stok <= 0;
  const maxQty = Math.max(1, Math.min(product.stok, 99));

  const qtyValue = el('span', { class: 'qty-value', text: '1' });
  const qtyTotal = el('span', { class: 'qty-total', text: money(product.harga) });

  const orderLink = el('a', {
    class: 'btn btn--primary btn--block',
    href: whatsappLink(product) || '#',
    target: '_blank',
    rel: 'noopener noreferrer',
  });
  const syncOrder = () => {
    qtyValue.textContent = String(qty);
    qtyTotal.textContent = money(product.harga * qty);
    const link = whatsappLink(product, qty);
    orderLink.textContent = qty > 1 ? `Pesan ${qty} item via WhatsApp` : 'Pesan via WhatsApp';
    orderLink.href = link || '#';
    orderLink.setAttribute('aria-disabled', habis || !link ? 'true' : 'false');
    orderLink.classList.toggle('is-disabled', habis || !link);
  };

  const decrease = el('button', { type: 'button', class: 'qty-btn', 'aria-label': 'Kurangi jumlah' }, '−');
  const increase = el('button', { type: 'button', class: 'qty-btn', 'aria-label': 'Tambah jumlah' }, '+');
  decrease.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    syncOrder();
  });
  increase.addEventListener('click', () => {
    qty = Math.min(maxQty, qty + 1);
    syncOrder();
  });
  if (habis) {
    decrease.disabled = true;
    increase.disabled = true;
  }

  const content = el(
    'div',
    { class: 'product-detail' },
    el('div', { class: 'product-detail-media' }, productImage(product)),
    el(
      'div',
      { class: 'product-detail-info' },
      el('p', { class: 'product-cat', text: product.kategori }),
      el('h3', { class: 'detail-name', text: product.nama }),
      el('p', { class: 'detail-store', text: product.seller?.storeName ? `Dijual oleh ${product.seller.storeName}` : '' }),
      el('p', { class: 'detail-price', text: money(product.harga) }),
      el('p', { class: 'detail-desc', text: product.deskripsi || 'Belum ada deskripsi untuk produk ini.' }),
      el(
        'p',
        { class: `stock ${habis ? 'stock--out' : ''}` },
        habis ? 'Stok habis — hubungi penjual untuk ketersediaan.' : `Stok tersedia: ${product.stok}`,
      ),
      habis
        ? null
        : el(
            'div',
            { class: 'qty-row' },
            el('span', { class: 'qty-label', text: 'Jumlah' }),
            el('div', { class: 'qty-control' }, decrease, qtyValue, increase),
            qtyTotal,
          ),
      habis
        ? el('button', { class: 'btn btn--primary btn--block', type: 'button', disabled: true }, 'Stok habis')
        : orderLink,
      el(
        'p',
        { class: 'detail-note' },
        product.seller?.phone
          ? `Pesanan diteruskan ke WhatsApp penjual (${product.seller.phone}).`
          : 'Penjual belum mengatur nomor WhatsApp.',
      ),
    ),
  );

  const modal = openModal({ title: 'Detail produk', content, size: 'modal--wide' });
  syncOrder();
  if (habis) orderLink.addEventListener('click', (e) => e.preventDefault());
  return modal;
}

export function renderCatalog({ main, state }) {
  clear(main);

  const hero = el(
    'section',
    { class: 'hero' },
    el(
      'div',
      { class: 'hero-copy' },
      el('p', { class: 'eyebrow', text: 'UMKM makanan & minuman' }),
      el('h1', {}, 'Gorengan hangat, ', el('span', { class: 'hero-accent', text: 'harga bersahabat.' })),
      el('p', {
        class: 'hero-text',
        text: 'Pilih produk dari penjual lokal, atur jumlahnya, lalu pesan langsung lewat WhatsApp. Tanpa aplikasi tambahan.',
      }),
      el(
        'div',
        { class: 'hero-points' },
        el('span', { text: '✓ Produk segar' }),
        el('span', { text: '✓ Harga jelas' }),
        el('span', { text: '✓ Pesan lewat WhatsApp' }),
      ),
    ),
    el(
      'div',
      { class: 'hero-art', 'aria-hidden': 'true' },
      productImage({ nama: 'Gorengan', imageUrl: '/placeholder/bakwan-sayur.svg' }, 'hero-float hero-float--a'),
      productImage({ nama: 'Es teh', imageUrl: '/placeholder/es-teh-manis.svg' }, 'hero-float hero-float--b'),
      productImage({ nama: 'Pisang goreng', imageUrl: '/placeholder/pisang-goreng.svg' }, 'hero-float hero-float--c'),
    ),
  );

  const tabList = el('div', { class: 'tabs', role: 'tablist' });
  const sectionTitle = el('h2', { class: 'section-title', text: 'Semua produk' });
  const resultCount = el('p', { class: 'result-count' });
  const sortSelect = el(
    'select',
    { class: 'select', 'aria-label': 'Urutkan produk' },
    ...SORT_OPTIONS.map(([value, label]) => el('option', { value, text: label })),
  );
  sortSelect.value = state.sort;

  const grid = el('div', { class: 'product-grid' });
  const footer = el('div', { class: 'catalog-footer' });

  const toolbar = el('div', { class: 'catalog-toolbar' }, tabList);
  const sectionHead = el(
    'div',
    { class: 'section-head' },
    el('div', {}, sectionTitle, resultCount),
    el('label', { class: 'sort-control' }, el('span', { text: 'Urutkan' }), sortSelect),
  );

  main.append(hero, toolbar, sectionHead, grid, footer);

  let page = 1;
  let total = 0;
  let loading = false;
  let requestId = 0;

  const renderTabs = (categories = []) => {
    clear(tabList);
    const options = [{ value: '', label: 'Semua' }, ...categories.map((c) => ({ value: c, label: c }))];
    for (const option of options) {
      const active = option.value === state.category;
      tabList.append(
        el(
          'button',
          {
            type: 'button',
            role: 'tab',
            class: `tab${active ? ' is-active' : ''}`,
            'aria-selected': active ? 'true' : 'false',
            onClick: () => {
              state.category = option.value;
              renderTabs(categories);
              page = 1;
              load(true);
            },
          },
          option.label,
        ),
      );
    }
  };

  renderTabs();

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    page = 1;
    load(true);
  });

  async function load(reset) {
    if (loading) return;
    loading = true;
    const current = ++requestId;
    if (reset) {
      clear(grid);
      grid.append(spinner('Memuat produk...'));
      clear(footer);
    } else {
      footer.append(spinner('Memuat...'));
    }
    sectionTitle.textContent = state.category || 'Semua produk';

    try {
      const data = await api.products({
        q: state.search,
        kategori: state.category,
        sort: state.sort,
        page,
        limit: 24,
      });
      if (current !== requestId) return;

      total = data.total;
      if (reset) clear(grid);
      clear(footer);

      if (data.items.length === 0 && reset) {
        grid.append(
          emptyState(
            'Produk tidak ditemukan',
            state.search
              ? `Tidak ada produk yang cocok dengan "${state.search}". Coba kata kunci lain atau reset filter.`
              : 'Belum ada produk pada kategori ini.',
            el(
              'button',
              {
                type: 'button',
                class: 'btn btn--ghost',
                onClick: () => {
                  state.search = '';
                  state.category = '';
                  state.sort = 'unggulan';
                  sortSelect.value = 'unggulan';
                  const input = document.querySelector('.header-search input');
                  if (input) input.value = '';
                  renderTabs(data.categories);
                  load(true);
                },
              },
              'Reset filter',
            ),
          ),
        );
      } else {
        data.items.forEach((product) => grid.append(productCard(product, openDetail)));
      }

      renderTabs(data.categories.length ? data.categories : state.category ? [state.category] : []);
      resultCount.textContent = `${data.items.length} dari ${total} produk`;

      if (data.items.length < total) {
        footer.append(
          el(
            'button',
            {
              type: 'button',
              class: 'btn btn--ghost',
              onClick: () => {
                page += 1;
                load(false);
              },
            },
            'Muat lebih banyak',
          ),
        );
      }
    } catch (err) {
      if (current !== requestId) return;
      clear(grid);
      clear(footer);
      grid.append(errorState(err.message, () => load(true)));
    } finally {
      loading = false;
    }
  }

  load(true);
}
