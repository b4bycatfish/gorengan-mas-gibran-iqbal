import { api } from './api.js';
import { clear, el, toast } from './ui.js';
import { renderCatalog } from './views/catalog.js';
import { renderLogin, renderRegister } from './views/auth.js';
import { renderSeller } from './views/seller.js';
import { renderAdmin } from './views/admin.js';

const state = {
  user: null,
  search: '',
  category: '',
  sort: 'unggulan',
};

const main = document.getElementById('app');
const header = document.getElementById('app-header');
const ROLE_LABEL = { admin: 'Admin', seller: 'Seller', buyer: 'Pembeli' };

const ROUTES = {
  '': { render: renderCatalog, access: 'public' },
  masuk: { render: renderLogin, access: 'guest' },
  daftar: { render: renderRegister, access: 'guest' },
  toko: { render: renderSeller, access: 'seller' },
  admin: { render: renderAdmin, access: 'admin' },
};

const searchInput = el('input', {
  type: 'search',
  placeholder: 'Cari bakwan, tahu isi, es teh...',
  'aria-label': 'Cari produk',
  autocomplete: 'off',
});
const searchForm = el(
  'form',
  { class: 'header-search', role: 'search' },
  el('span', { class: 'search-icon', 'aria-hidden': 'true' }, '⌕'),
  searchInput,
  el('button', { type: 'submit', class: 'search-submit' }, 'Cari'),
);

const nav = el('nav', { class: 'header-nav', 'aria-label': 'Navigasi utama' });
const logo = el(
  'a',
  { class: 'logo', href: '#/', 'aria-label': 'Gorengan Mas Gibran, kembali ke katalog' },
  el('span', { class: 'logo-mark', 'aria-hidden': 'true' }, 'GM'),
  el('span', { class: 'logo-text' }, 'Gorengan', el('strong', { text: 'Mas Gibran' })),
);

header.append(el('div', { class: 'header-inner' }, logo, searchForm, nav));

function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  return raw.split('?')[0].replace(/\/+$/, '');
}

function homeFor(user) {
  if (!user) return '#/';
  if (user.role === 'admin') return '#/admin';
  if (user.role === 'seller') return '#/toko';
  return '#/';
}

function link(href, label, className = 'nav-link') {
  return el('a', { href, class: className, text: label });
}

function renderHeader(routeName) {
  searchForm.hidden = routeName !== '';
  searchInput.value = state.search;

  clear(nav);
  nav.append(link('#/', 'Katalog'));

  if (state.user) {
    if (state.user.role === 'seller') nav.append(link('#/toko', 'Kelola toko'));
    if (state.user.role === 'admin') nav.append(link('#/admin', 'Kelola pengguna'));

    nav.append(
      el(
        'div',
        { class: 'user-chip', title: state.user.email },
        el('span', { class: 'user-name', text: state.user.name }),
        el('span', { class: `role-badge role-badge--${state.user.role}`, text: ROLE_LABEL[state.user.role] }),
      ),
      el(
        'button',
        {
          type: 'button',
          class: 'btn btn--ghost btn--sm',
          onClick: async () => {
            try {
              await api.logout();
            } catch {
              /* sesi mungkin sudah berakhir */
            }
            state.user = null;
            toast('Anda telah keluar.', 'info');
            navigate('#/');
          },
        },
        'Keluar',
      ),
    );
  } else {
    nav.append(link('#/masuk', 'Masuk', 'btn btn--ghost btn--sm'));
  }
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render({ scroll = true } = {}) {
  const routeName = currentRoute();
  const route = ROUTES[routeName];

  if (!route) {
    location.hash = '#/';
    return;
  }

  if (route.access === 'guest' && state.user) {
    location.hash = homeFor(state.user);
    return;
  }

  if (route.access === 'seller' || route.access === 'admin') {
    if (!state.user) {
      toast('Silakan masuk terlebih dahulu.', 'info');
      location.hash = '#/masuk';
      return;
    }
    if (state.user.role !== route.access) {
      toast('Halaman ini tidak tersedia untuk peran Anda.', 'error');
      location.hash = homeFor(state.user);
      return;
    }
  }

  document.body.dataset.view = routeName || 'katalog';
  renderHeader(routeName);
  route.render({ main, state, navigate, rerender: () => render({ scroll: false }) });
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  main.focus({ preventScroll: true });
}

let searchTimer = null;
function applySearch() {
  state.search = searchInput.value.trim();
  if (currentRoute() !== '') navigate('#/');
  else render({ scroll: false });
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applySearch, 280);
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  applySearch();
});

logo.addEventListener('click', (event) => {
  event.preventDefault();
  state.search = '';
  state.category = '';
  state.sort = 'unggulan';
  searchInput.value = '';
  navigate('#/');
  render({ scroll: false });
});

window.addEventListener('hashchange', () => render());

async function boot() {
  try {
    const { user } = await api.me();
    state.user = user;
  } catch {
    state.user = null;
  }

  if (!location.hash) history.replaceState(null, '', '#/');
  if (currentRoute() && ROUTES[currentRoute()] === undefined) history.replaceState(null, '', '#/');
  render();
}

boot();
