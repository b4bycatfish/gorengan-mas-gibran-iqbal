import { api } from '../api.js';
import { clear, el, passwordInput, showFormError, successDialog, toast } from '../ui.js';

function authShell({ title, subtitle, children }) {
  return el(
    'section',
    { class: 'auth-wrap' },
    el(
      'div',
      { class: 'auth-card' },
      el('p', { class: 'eyebrow', text: 'Gorengan Mas Gibran' }),
      el('h1', { class: 'auth-title', text: title }),
      el('p', { class: 'auth-subtitle', text: subtitle }),
      children,
    ),
  );
}

function redirectByRole(user, navigate) {
  if (user.role === 'admin') navigate('#/admin');
  else if (user.role === 'seller') navigate('#/toko');
  else navigate('#/');
}

export function renderLogin({ main, state, navigate }) {
  clear(main);

  const email = el('input', { type: 'email', name: 'email', autocomplete: 'email', placeholder: 'nama@email.com' });
  const password = passwordInput({
    id: 'login-password',
    name: 'password',
    autocomplete: 'current-password',
    placeholder: 'Kata sandi',
  });
  const submit = el('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Masuk');

  const form = el(
    'form',
    { class: 'auth-form', novalidate: true },
    el('div', { class: 'field' }, el('label', { for: 'login-email', text: 'Email' }), email),
    el('div', { class: 'field' }, el('label', { for: 'login-password', text: 'Kata sandi' }), password.field),
    submit,
  );
  email.id = 'login-email';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!email.value.trim() || !password.input.value) {
      showFormError(form, 'Email dan kata sandi wajib diisi.');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Memproses...';
    try {
      const { user } = await api.login(email.value.trim(), password.input.value);
      state.user = user;
      toast(`Selamat datang, ${user.name}.`, 'success');
      redirectByRole(user, navigate);
    } catch (err) {
      showFormError(form, err.message);
      submit.disabled = false;
      submit.textContent = 'Masuk';
    }
  });

  main.append(
    authShell({
      title: 'Masuk ke akun Anda',
      subtitle: 'Kelola produk toko atau lanjutkan belanja dari satu tempat.',
      children: el(
        'div',
        {},
        form,
        el(
          'div',
          { class: 'auth-alt' },
          'Belum punya akun? ',
          el('a', { href: '#/daftar', text: 'Daftar sebagai pembeli' }),
        ),
        el(
          'div',
          { class: 'demo-hint' },
          el('p', {}, el('strong', { text: 'Akun demo:' })),
          el('p', { text: 'Admin — admin@gmg.local / Admin#12345' }),
          el('p', { text: 'Seller — gibran@gmg.local / Seller#12345' }),
          el('p', { text: 'Pembeli — pembeli@gmg.local / Pembeli#12345' }),
        ),
      ),
    }),
  );
  email.focus();
}

export function renderRegister({ main, state, navigate }) {
  clear(main);

  const name = el('input', { type: 'text', id: 'reg-name', autocomplete: 'name', placeholder: 'Nama lengkap' });
  const email = el('input', { type: 'email', id: 'reg-email', autocomplete: 'email', placeholder: 'nama@email.com' });
  const password = passwordInput({
    id: 'reg-password',
    autocomplete: 'new-password',
    placeholder: 'Minimal 8 karakter',
  });
  const confirm = passwordInput({
    id: 'reg-confirm',
    autocomplete: 'new-password',
    placeholder: 'Ulangi kata sandi',
  });
  const submit = el('button', { type: 'submit', class: 'btn btn--primary btn--block' }, 'Daftar');

  const form = el(
    'form',
    { class: 'auth-form', novalidate: true },
    el('div', { class: 'field' }, el('label', { for: 'reg-name', text: 'Nama lengkap' }), name),
    el('div', { class: 'field' }, el('label', { for: 'reg-email', text: 'Email' }), email),
    el('div', { class: 'field' }, el('label', { for: 'reg-password', text: 'Kata sandi' }), password.field),
    el('div', { class: 'field' }, el('label', { for: 'reg-confirm', text: 'Ulangi kata sandi' }), confirm.field),
    submit,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (name.value.trim().length < 2) return showFormError(form, 'Nama minimal 2 karakter.');
    if (password.input.value.length < 8) return showFormError(form, 'Kata sandi minimal 8 karakter.');
    if (password.input.value !== confirm.input.value) return showFormError(form, 'Konfirmasi kata sandi tidak sama.');

    submit.disabled = true;
    submit.textContent = 'Mendaftar...';
    try {
      const { user } = await api.register({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.input.value,
      });
      state.user = user;
      successDialog({
        title: 'Pendaftaran berhasil',
        message: 'Akun pembeli sudah aktif. Selamat berbelanja!',
        details: [
          ['Nama', user.name],
          ['Email', user.email],
          ['Peran', 'Pembeli'],
        ],
        confirmLabel: 'Lihat katalog',
      });
      navigate('#/');
    } catch (err) {
      showFormError(form, err.message);
      submit.disabled = false;
      submit.textContent = 'Daftar';
    }
  });

  main.append(
    authShell({
      title: 'Daftar akun pembeli',
      subtitle: 'Akun pembeli gratis. Anda dapat melihat katalog dan memesan lewat WhatsApp.',
      children: el(
        'div',
        {},
        form,
        el('div', { class: 'auth-alt' }, 'Sudah punya akun? ', el('a', { href: '#/masuk', text: 'Masuk' })),
        el(
          'p',
          { class: 'auth-note' },
          'Ingin berjualan? Akun penjual dibuat oleh admin agar produk dan nomor WhatsApp dapat diverifikasi.',
        ),
      ),
    }),
  );
  name.focus();
}
