/* solicitacoesCadastro.js — seção dentro de telaJovens.html */
const USE_MOCK = false;

/* ══════════════════════════════════════════
   MOCK (USE_MOCK = true para desenvolvimento local)
   ══════════════════════════════════════════ */
const MOCK_SOLICITACOES = [
  { id: 1, nome: 'João Silva',     email: 'joao.silva@email.com',   criado_em: '2026-06-20T10:00:00Z' },
  { id: 2, nome: 'Maria Santos',   email: 'maria.santos@email.com', criado_em: '2026-06-21T14:30:00Z' },
  { id: 3, nome: 'Pedro Lima',     email: 'pedro.lima@email.com',   criado_em: '2026-06-22T09:15:00Z' },
];

/* ══════════════════════════════════════════
   CAMADA DE DADOS
   ══════════════════════════════════════════ */
async function apiListar() {
  if (USE_MOCK) {
    return new Promise(resolve =>
      setTimeout(() => resolve(MOCK_SOLICITACOES.map(s => ({ ...s }))), 600)
    );
  }
  // Alunos com ativo=false são os pendentes de aprovação
  return window.api.get('/usuarios', {
    params: { perfil: 'Aluno', ativo: 'false' },
    auth: true,
  });
}

async function apiAprovar(id) {
  if (USE_MOCK) return new Promise(r => setTimeout(() => r({ id }), 400));
  return window.api.patch(`/usuarios/${id}/reativar`, { auth: true });
}

async function apiRejeitar(id) {
  if (USE_MOCK) return new Promise(r => setTimeout(() => r({ id }), 400));
  return window.api.delete(`/usuarios/${id}`, { auth: true });
}

/* ══════════════════════════════════════════
   ESTADO LOCAL
   ══════════════════════════════════════════ */
let solicitacoes = [];
let _pollingTimer = null;

/* ══════════════════════════════════════════
   UI — ESTADOS, BADGE E TIMESTAMP
   ══════════════════════════════════════════ */
function mostrarEstado(estado) {
  document.getElementById('solLoading').hidden = estado !== 'loading';
  document.getElementById('solError').hidden   = estado !== 'error';
  document.getElementById('solEmpty').hidden   = estado !== 'empty';
  document.getElementById('solList').hidden    = estado !== 'list';
}

function atualizarBadge() {
  document.getElementById('solBadge').textContent = String(solicitacoes.length);
}

function atualizarTimestamp() {
  const el = document.getElementById('solTimestamp');
  if (!el) return;
  el.textContent = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

/* ══════════════════════════════════════════
   UI — RENDER
   ══════════════════════════════════════════ */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtData(iso) {
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return '—'; }
}

function renderLista() {
  const list = document.getElementById('solList');
  list.innerHTML = solicitacoes.map(s => `
    <div class="sol-item" data-id="${s.id}">
      <div class="sol-item-info">
        <span class="sol-item-nome">${esc(s.nome)}</span>
        <span class="sol-item-email">${esc(s.email)}</span>
        <span class="sol-item-data">Solicitado em ${fmtData(s.criado_em)}</span>
      </div>
      <div class="sol-item-actions">
        <button class="btn btn-secondary sol-btn-rejeitar"
                data-action="rejeitar" data-id="${s.id}">
          Rejeitar
        </button>
        <button class="btn btn-primary sol-btn-aprovar"
                data-action="aprovar" data-id="${s.id}">
          <i data-lucide="check"></i> Aprovar
        </button>
      </div>
    </div>
  `).join('');

  lucide.createIcons({ attrs: { 'stroke-width': 2 } });
  atualizarBadge();
  atualizarTimestamp();
}

/* ══════════════════════════════════════════
   CARREGAR (com loading spinner)
   ══════════════════════════════════════════ */
async function carregarSolicitacoes() {
  mostrarEstado('loading');
  try {
    solicitacoes = await apiListar() ?? [];
    if (solicitacoes.length === 0) {
      mostrarEstado('empty');
      atualizarBadge();
      atualizarTimestamp();
    } else {
      mostrarEstado('list');
      renderLista();
    }
  } catch (err) {
    document.getElementById('solErrorMsg').textContent =
      err.message ?? 'Erro ao carregar solicitações.';
    mostrarEstado('error');
  }
}

/* ══════════════════════════════════════════
   POLLING SILENCIOSO (sem spinner — só atualiza se houver mudança)
   ══════════════════════════════════════════ */
async function _pollSilencioso() {
  if (document.hidden) return;
  try {
    const novas = await apiListar() ?? [];
    const idsAntes = solicitacoes.map(s => s.id).sort().join(',');
    const idsDepois = novas.map(s => s.id).sort().join(',');
    if (idsAntes !== idsDepois) {
      solicitacoes = novas;
      if (solicitacoes.length === 0) {
        mostrarEstado('empty');
        atualizarBadge();
      } else {
        mostrarEstado('list');
        renderLista();
      }
    }
    atualizarTimestamp();
  } catch {
    // polling silencioso — não exibe erro para não interromper o trabalho
  }
}

function iniciarPolling() {
  pararPolling();
  _pollingTimer = setInterval(_pollSilencioso, 30_000);
}

function pararPolling() {
  if (_pollingTimer) { clearInterval(_pollingTimer); _pollingTimer = null; }
}

// pausa quando a aba está escondida, retoma quando volta
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pararPolling();
  } else {
    _pollSilencioso();   // atualiza imediatamente ao voltar
    iniciarPolling();
  }
});

/* ══════════════════════════════════════════
   AÇÃO COM ATUALIZAÇÃO OTIMISTA
   ══════════════════════════════════════════ */
async function agir(id, acao) {
  const idx = solicitacoes.findIndex(s => s.id === id);
  if (idx === -1) return;

  const backup = solicitacoes[idx];
  solicitacoes.splice(idx, 1);

  if (solicitacoes.length === 0) {
    mostrarEstado('empty');
    atualizarBadge();
    atualizarTimestamp();
  } else {
    mostrarEstado('list');
    renderLista();
  }

  try {
    if (acao === 'aprovar') {
      await apiAprovar(id);
      window.api.invalidateCache('/jovens');
      if (typeof loadJovens === 'function') loadJovens();
    } else {
      await apiRejeitar(id);
    }
  } catch (err) {
    // restaura no índice original
    solicitacoes.splice(idx, 0, backup);
    mostrarEstado('list');
    renderLista();

    const itemEl = document.querySelector(`.sol-item[data-id="${id}"]`);
    if (itemEl) {
      const errSpan = document.createElement('span');
      errSpan.className = 'sol-item-error';
      errSpan.textContent =
        err.message ?? `Não foi possível ${acao === 'aprovar' ? 'aprovar' : 'rejeitar'}.`;
      itemEl.querySelector('.sol-item-info').appendChild(errSpan);
    }
  }
}

/* ══════════════════════════════════════════
   EVENTOS
   ══════════════════════════════════════════ */
document.getElementById('solList').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn || btn.disabled) return;
  btn.closest('.sol-item').querySelectorAll('button').forEach(b => { b.disabled = true; });
  agir(Number(btn.dataset.id), btn.dataset.action);
});

document.getElementById('solBtnRecarregar').addEventListener('click', carregarSolicitacoes);

/* ── Init ── */
carregarSolicitacoes().then(iniciarPolling);
