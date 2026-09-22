/* ============================================================
   notificacoes.js — Lógica da Tela de Notificações
   Pulse Mais · Módulo 1AMD2
   Depende de: lucide (CDN), api.js
   ============================================================ */

/* tipo (DB) → sufixo de classe CSS (.notif-icon--*, .notif-badge--*) */
const TIPO_CLASSE = {
  Alerta:    'alerta',
  Jovem:     'aluno',
  Mentoria:  'mentoria',
  Evento:    'evento',
  Conquista: 'conquista',
  Sistema:   'sistema',
};

/* tipo (DB) → ícone lucide */
const TIPO_ICONE = {
  Alerta:    'alert-triangle',
  Jovem:     'user-plus',
  Mentoria:  'message-square',
  Evento:    'calendar',
  Conquista: 'award',
  Sistema:   'settings',
};

/* tipo (DB) → rótulo do badge */
const TIPO_LABEL = {
  Alerta:    'Alerta',
  Jovem:     'Jovem',
  Mentoria:  'Mentoria',
  Evento:    'Evento',
  Conquista: 'Conquista',
  Sistema:   'Sistema',
};

/* tipo (DB) → filtro da aba correspondente */
const TIPO_FILTRO = {
  Alerta:   'alertas',
  Jovem:    'jovens',
  Evento:   'eventos',
  Mentoria: 'mentorias',
};

/* tipo (DB) → destino padrão do botão de ação (data-navigate em main.js) */
const TIPO_DESTINO = {
  Alerta:    'jovens',
  Jovem:     'jovens',
  Evento:    'calendario',
  Mentoria:  'calendario',
  Conquista: 'dashboard',
  Sistema:   'dashboard',
};

let notificacoes  = [];
let filtroAtual   = 'todas';
const LAZY_CHUNK  = 25; // itens renderizados por "página" no scroll infinito
let _lazyObserver = null;

const NOTIF_PREFS_KEY = 'pulsar-notif-prefs';

function lerPrefsNotificacao() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? JSON.parse(raw) : { Jovem: true, Alerta: true };
  } catch {
    return { Jovem: true, Alerta: true };
  }
}

function notifVisivelPorPrefs(n, prefs) {
  if (n.tipo === 'Jovem'  && prefs.Jovem  === false) return false;
  if (n.tipo === 'Alerta' && prefs.Alerta === false) return false;
  return true;
}

document.addEventListener('DOMContentLoaded', function () {

  if (typeof lucide !== 'undefined') lucide.createIcons();

  /* ── Filtros ── */
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      filtroAtual = this.dataset.filter;
      render();
    });
  });

  carregarNotificacoes();
});

function renderSkeletonNotif(n) {
  return Array.from({ length: n }, () => `
    <div class="notif-item" style="pointer-events:none">
      <div class="notif-dot-wrap"><span class="notif-dot notif-dot--hidden"></span></div>
      <span class="skeleton" style="width:36px;height:36px;border-radius:8px;flex-shrink:0"></span>
      <div class="notif-body" style="flex:1;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:8px;align-items:center">
          <span class="skeleton" style="width:45%;height:13px"></span>
          <span class="skeleton" style="width:60px;height:20px;border-radius:10px"></span>
        </div>
        <span class="skeleton" style="width:75%;height:11px"></span>
        <span class="skeleton" style="width:30%;height:10px"></span>
      </div>
    </div>`).join('');
}

async function carregarNotificacoes() {
  const card = document.getElementById('notifCard');
  card.innerHTML = renderSkeletonNotif(6);
  window.setPageLoading?.(true);
  try {
    const usuario = window.api.getUser();
    const params = usuario?.id ? { usuario_id: usuario.id } : {};
    notificacoes = await window.api.get('/notificacoes', { params, auth: true });
    notificacoes.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    render();
  } catch (err) {
    card.innerHTML = `<div class="empty-state" style="display:flex;padding:var(--spacing-xl,32px) 0"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Sem dados</p></div>`;
  } finally {
    window.setPageLoading?.(false);
  }
}

/* Flat list com índice de início de cada grupo — usada pelo lazy render */
function _buildFlatList(filtradas) {
  const grupos = agruparPorData(filtradas);
  const flat = [];
  for (const [titulo, itens] of grupos) {
    flat.push({ type: 'header', titulo });
    for (const n of itens) flat.push({ type: 'item', notif: n });
  }
  return flat;
}

function _appendItems(card, flat, from, to) {
  const frag = document.createDocumentFragment();
  for (let i = from; i < Math.min(to, flat.length); i++) {
    const entry = flat[i];
    if (entry.type === 'header') {
      const h = document.createElement('p');
      h.className = 'notif-group__title';
      h.textContent = entry.titulo;
      frag.appendChild(h);
    } else {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderItem(entry.notif);
      const el = wrapper.firstElementChild;
      el.addEventListener('click', () => marcarComoLida(Number(el.dataset.id), el));
      frag.appendChild(el);
    }
  }
  card.appendChild(frag);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function render() {
  const prefs    = lerPrefsNotificacao();
  const visiveis = notificacoes.filter(n => notifVisivelPorPrefs(n, prefs));

  atualizarContadores(visiveis);

  const filtradas = visiveis.filter(n => {
    if (filtroAtual === 'todas') return true;
    if (filtroAtual === 'nao-lidas') return !n.lida;
    return TIPO_FILTRO[n.tipo] === filtroAtual;
  });

  const card = document.getElementById('notifCard');

  // Desconecta observador anterior ao trocar de filtro
  if (_lazyObserver) { _lazyObserver.disconnect(); _lazyObserver = null; }
  card.innerHTML = '';

  if (filtradas.length === 0) {
    card.innerHTML = `<div class="empty-state" style="display:flex;padding:var(--spacing-xl,32px) 0"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><p>Sem dados</p></div>`;
    return;
  }

  const flat = _buildFlatList(filtradas);
  let rendered = 0;

  function appendNext() {
    const until = rendered + LAZY_CHUNK;
    _appendItems(card, flat, rendered, until);
    rendered = Math.min(until, flat.length);
  }

  // Renderiza o primeiro lote imediatamente
  appendNext();

  // Se ainda há itens, registra sentinela de scroll infinito
  if (rendered < flat.length) {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    card.appendChild(sentinel);

    _lazyObserver = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      appendNext();
      if (rendered >= flat.length) {
        _lazyObserver.disconnect();
        _lazyObserver = null;
        sentinel.remove();
      }
    }, { rootMargin: '300px' });

    _lazyObserver.observe(sentinel);
  }
}

function renderItem(n) {
  const classe = TIPO_CLASSE[n.tipo] || 'sistema';
  const icone  = TIPO_ICONE[n.tipo] || 'bell';
  const label  = TIPO_LABEL[n.tipo] || n.tipo;
  const destino = TIPO_DESTINO[n.tipo] || 'dashboard';

  const jovemId = n.link?.match(/^\/jovens\/(\d+)$/)?.[1];

  return `
    <div class="notif-item" data-id="${n.id}" data-type="${esc(TIPO_FILTRO[n.tipo] || '')}" data-unread="${!n.lida}">
      <div class="notif-dot-wrap"><span class="notif-dot${n.lida ? ' notif-dot--hidden' : ''}"></span></div>
      <div class="notif-icon notif-icon--${classe}"><i data-lucide="${icone}"></i></div>
      <div class="notif-body">
        <div class="notif-title-row">
          <span class="notif-title">${esc(n.titulo)}</span>
          <span class="notif-badge notif-badge--${classe}">${esc(label)}</span>
        </div>
        ${n.descricao ? `<p class="notif-desc">${esc(n.descricao)}</p>` : ''}
        <p class="notif-meta">${tempoRelativo(n.criado_em)}</p>
        <button class="notif-action notif-action--brand"
          data-navigate="${jovemId ? 'perfilAluno' : destino}"
          ${jovemId ? `data-jovem-id="${jovemId}"` : ''}>
          Ver mais <i data-lucide="chevron-right"></i>
        </button>
      </div>
    </div>
  `;
}

async function marcarComoLida(id, itemEl) {
  const notif = notificacoes.find(n => n.id === id);
  if (!notif || notif.lida) return;

  notif.lida = true;
  const dot = itemEl.querySelector('.notif-dot');
  if (dot) dot.classList.add('notif-dot--hidden');
  itemEl.dataset.unread = 'false';
  atualizarContadores();

  try {
    await window.api.patch(`/notificacoes/${id}/lida`, { auth: true });
  } catch (err) {
    notif.lida = false;
    if (dot) dot.classList.remove('notif-dot--hidden');
    itemEl.dataset.unread = 'true';
    atualizarContadores();
  }
}

function atualizarContadores(visiveis = notificacoes) {
  const total    = visiveis.length;
  const naoLidas = visiveis.filter(n => !n.lida).length;
  const porTipo  = (filtro) => visiveis.filter(n => TIPO_FILTRO[n.tipo] === filtro).length;

  setText('notifCountBadge', naoLidas);
  setText('countTodas',      total);
  setText('countNaoLidas',   naoLidas);
  setText('countAlertas',    porTipo('alertas'));
  setText('countJovens',     porTipo('jovens'));
  setText('countEventos',    porTipo('eventos'));
  setText('countMentorias',  porTipo('mentorias'));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ── Agrupamento por data (Hoje / Ontem / Esta semana / Mais antigas) ── */
function agruparPorData(itens) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const grupos = new Map([
    ['Hoje', []],
    ['Ontem', []],
    ['Esta semana', []],
    ['Mais antigas', []],
  ]);

  itens.forEach(n => {
    const data = new Date(n.criado_em);
    const dataZero = new Date(data);
    dataZero.setHours(0, 0, 0, 0);
    const diffDias = Math.round((hoje - dataZero) / 86400000);

    if (diffDias <= 0) grupos.get('Hoje').push(n);
    else if (diffDias === 1) grupos.get('Ontem').push(n);
    else if (diffDias <= 7) grupos.get('Esta semana').push(n);
    else grupos.get('Mais antigas').push(n);
  });

  return [...grupos.entries()].filter(([, itens]) => itens.length > 0);
}

/* ── Tempo relativo (há Xmin / há Xh / dd/mm) ── */
function tempoRelativo(dataStr) {
  const data  = new Date(dataStr);
  const agora = new Date();
  const diffMs  = agora - data;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffDias= Math.floor(diffH / 24);

  if (diffMin < 1)  return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffH < 24)   return `há ${diffH}h`;
  if (diffDias === 1) return 'ontem';
  if (diffDias < 7) return `há ${diffDias} dias`;
  return data.toLocaleDateString('pt-BR');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
