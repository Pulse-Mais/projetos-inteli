/* main.js — Lógica comum a todas as telas do aluno
   Pulsar · Pulse Mais
   Responsabilidades:
     - Auth guard: redireciona para login se não houver token
     - Decodifica o JWT e expõe window.currentUser
     - Preenche nome/papel no avatar do topbar
     - Controla sidebar toggle e avatar dropdown
*/

/* ── Decodifica payload do JWT sem biblioteca ── */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/* ── Auth guard ── */
(function authGuard() {
  const token = window.api?.getToken?.();
  if (!token) {
    window.location.href = '/pages/login.html';
    return;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    window.api.clearToken();
    window.location.href = '/pages/login.html';
    return;
  }

  // Expõe dados do usuário logado para os scripts de cada tela
  window.currentUser = {
    id:       payload.id,
    nome:     payload.nome,
    perfil:   payload.perfil,
    jovem_id: payload.jovem_id ?? null,
  };
})();

/* ── Page spinner (unificado) ────────────────────────────── */
(function injectPageSpinner() {
  if (document.getElementById('pageSpinner')) return;
  const el = document.createElement('div');
  el.id = 'pageSpinner';
  el.className = 'page-spinner';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Carregando…');
  el.hidden = true;
  el.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
  document.body.appendChild(el);
})();

window.setPageLoading = function (loading) {
  const spinner = document.getElementById('pageSpinner');
  if (spinner) spinner.hidden = !loading;
};

/* ── Mobile sidebar / hamburger ──────────────────────────── */
function _closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('is-mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('is-visible');
}

function _toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen = sidebar?.classList.toggle('is-mobile-open');
  overlay?.classList.toggle('is-visible', isOpen ?? false);
}

/* ── Inicialização do DOM ── */
document.addEventListener('DOMContentLoaded', () => {

  /* Injeta overlay e hamburger no topbar (mobile) */
  if (!document.getElementById('sidebarOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', _closeMobileSidebar);
  }

  const topbar = document.querySelector('.topbar');
  if (topbar && !document.getElementById('topbarHamburger')) {
    const btn = document.createElement('button');
    btn.id = 'topbarHamburger';
    btn.className = 'topbar-hamburger';
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    topbar.prepend(btn);
    btn.addEventListener('click', _toggleMobileSidebar);
  }

  /* Preenche nome e papel no avatar do topbar */
  const nameEl = document.querySelector('.avatar-name');
  const roleEl = document.querySelector('.avatar-role');
  if (nameEl && window.currentUser?.nome) nameEl.textContent = window.currentUser.nome;
  if (roleEl && window.currentUser?.perfil) roleEl.textContent = window.currentUser.perfil;

  /* Foto de perfil do aluno no topbar (fonte: /me → usuarios.foto_url) */
  (async function carregarFotoTopbar() {
    try {
      const usuario = window.api.getUser();
      let fotoUrl = usuario?.foto_url;
      if (fotoUrl === undefined) {
        const me = await window.api.get('/me', { auth: true, cache: true, cacheTtl: 60_000 });
        fotoUrl = me?.foto_url || null;
        if (usuario) { usuario.foto_url = fotoUrl; window.api.setUser(usuario); }
      }
      if (fotoUrl) {
        window.avatar.render(document.querySelector('.avatar-trigger .avatar'), fotoUrl, window.currentUser?.nome);
      }
    } catch { /* foto é não-crítica */ }
  })();

  /* ── Sidebar toggle ── */
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle-btn') ?? document.getElementById('sidebarToggle');

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('is-expanded');
    });
  }

  /* ── Avatar dropdown ── */
  const avatarMenu    = document.getElementById('avatar-menu') ?? document.getElementById('avatarMenu');
  const avatarTrigger = document.getElementById('avatar-trigger') ?? document.getElementById('avatarTrigger');
  const avatarDropdown = document.querySelector('.avatar-dropdown');

  if (avatarTrigger && avatarDropdown) {
    avatarTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = avatarMenu?.classList.toggle('is-open');
      avatarTrigger.setAttribute('aria-expanded', String(isOpen ?? false));
      avatarDropdown.hidden = !isOpen;
    });

    document.addEventListener('click', () => {
      avatarMenu?.classList.remove('is-open');
      avatarTrigger.setAttribute('aria-expanded', 'false');
      avatarDropdown.hidden = true;
    });
  }

  /* ── Logout ── */
  const btnLogout = document.getElementById('btnLogout') ?? document.querySelector('.dropdown-item.is-danger');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      window.api.logout();
    });
  }
});
