/* main.js — Auth guard + navegação para telas de Gestão
   Pulsar · Pulse Mais
*/

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const PERFIS_GESTAO = ['GestaoGeral', 'Coordenacao', 'Assistente'];

(function authGuard() {
  const token = window.api?.getToken?.();
  if (!token) {
    window.location.href = '/pages/login.html';
    return;
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !PERFIS_GESTAO.includes(payload.perfil)) {
    window.api.clearToken();
    window.location.href = '/pages/login.html';
    return;
  }

  window.currentUser = {
    id:     payload.id,
    nome:   payload.nome,
    perfil: payload.perfil,
    cargo:  payload.cargo ?? null,
  };
})();

const pages = {
  dashboard:   'dashboardGestao.html',
  perfilAluno: 'perfilAlunoGestao.html',
  anotacoes: 'anotacoes.html',
  calendario: 'calendarioGestao.html',
  configuracoes: 'configuraçoes.html',
  importarPlanilha: 'importarPlanilha.html',
  importarFrequencia: 'importarFrequencia.html',
  notificacoes: 'notificacoes.html',
  jovens: 'telaJovens.html',
  buscar: 'buscaAlunos.html',
  frequencia: 'telaFrequencia.html',
  cadastroJovem: 'cadastroJovem.html',
  jovemVisaoGestor: 'jovemVisaoGestor.html',
  cursosBolsas: 'cursosBolsasGestao.html',
  cadastrarMentor: 'cadastrarMentorGestao.html',
};

document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-navigate]');
  if (!target) return;
  let dest = pages[target.dataset.navigate];
  if (!dest) return;

  if (target.dataset.jovemId) {
    dest += `?id=${target.dataset.jovemId}`;
  } else if (target.dataset.navigate === 'anotacoes') {
    const jovemId = new URLSearchParams(window.location.search).get('id');
    if (jovemId) dest += `?id=${jovemId}`;
  }

  window.location.href = dest;
});

function lerPrefsNotificacaoBadge() {
  try {
    const raw = localStorage.getItem('pulsar-notif-prefs');
    return raw ? JSON.parse(raw) : { Jovem: true, Alerta: true };
  } catch {
    return { Jovem: true, Alerta: true };
  }
}

async function carregarBadgeNotificacoes() {
  const notifItem = document.querySelector('[data-navigate="notificacoes"]');
  if (!notifItem) return;

  const iconWrap = notifItem.querySelector('.sidebar-item-icon');
  if (!iconWrap) return;

  let badge = document.getElementById('sidebarNotifBadge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'sidebarNotifBadge';
    badge.className = 'sidebar-notif-badge';
    badge.hidden = true;
    iconWrap.appendChild(badge);
  }

  try {
    const usuario = window.currentUser;
    const params  = { lida: 'false', ...(usuario?.id ? { usuario_id: usuario.id } : {}) };
    const lista   = await window.api.get('/notificacoes', { params, auth: true });
    const prefs   = lerPrefsNotificacaoBadge();
    const filtradas = Array.isArray(lista) ? lista.filter(n => {
      if (n.tipo === 'Jovem'  && prefs.Jovem  === false) return false;
      if (n.tipo === 'Alerta' && prefs.Alerta === false) return false;
      return true;
    }) : [];
    const count = filtradas.length;
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? '99+' : String(count);
  } catch {
    /* badge é não-crítico, falha silenciosa */
  }
}

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

document.addEventListener('DOMContentLoaded', () => {

  /* Injeta overlay e hamburger no header (mobile) */
  if (!document.getElementById('sidebarOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', _closeMobileSidebar);
  }

  const header = document.querySelector('.header');
  if (header && !document.getElementById('headerHamburger')) {
    const btn = document.createElement('button');
    btn.id = 'headerHamburger';
    btn.className = 'header-hamburger';
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    header.prepend(btn);
    btn.addEventListener('click', _toggleMobileSidebar);
  }

  /* Preenche nome e papel no avatar do header */
  const nameEl = document.querySelector('.avatar-name');
  const roleEl = document.querySelector('.avatar-role');
  if (nameEl && window.currentUser?.nome)   nameEl.textContent = window.currentUser.nome;
  if (roleEl && window.currentUser?.perfil) roleEl.textContent = window.currentUser.perfil;

  /* Foto de perfil no header */
  (async function carregarFotoHeader() {
    try {
      const usuario = window.api.getUser();
      let fotoUrl = usuario?.foto_url;
      if (fotoUrl === undefined) {
        const me = await window.api.get('/me', { auth: true, cache: true, cacheTtl: 60000 });
        fotoUrl = me?.foto_url || null;
        if (usuario) { usuario.foto_url = fotoUrl; window.api.setUser(usuario); }
      }
      if (fotoUrl) {
        const avatarEl = document.querySelector('.avatar-trigger .avatar');
        if (avatarEl) avatarEl.innerHTML = `<img src="${fotoUrl}" alt="Foto" class="avatar__img" />`;
      }
    } catch { /* foto é não-crítico */ }
  })();

  carregarBadgeNotificacoes();
  setInterval(carregarBadgeNotificacoes, 60_000);

  /* ── Sidebar toggle ── */
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('is-expanded');
    });
  }

  /* ── Avatar dropdown ── */
  const avatarMenu     = document.getElementById('avatarMenu');
  const avatarTrigger  = document.getElementById('avatarTrigger');
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
