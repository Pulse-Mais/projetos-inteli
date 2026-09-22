// Init icons
(function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else {
    document.addEventListener('DOMContentLoaded', () => lucide.createIcons());
  }
})();

// Nav click
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ──────────────────────────────────────────────────────────
   Mapas auxiliares
────────────────────────────────────────────────────────── */
const JOURNEY_STEPS = ['Conectado', 'Capacitado', 'Transformado'];

const STATUS_BADGE = {
  Conectado: 'badge-info',
  Capacitado: 'badge-warning',
  Transformado: 'badge-success',
};

const MATRICULA_STATUS_LABEL = {
  Ativo: 'Ativo',
  Concluido: 'Concluído',
  Evadido: 'Evadido',
  Trancado: 'Trancado',
};

let PROGRAMAS_MAP = {};
let currentJovemId = null;
let currentCpf = '';
let searchDebounce = null;

const el = {
  searchInput: document.getElementById('searchInput'),
  resultsSection: document.getElementById('resultsSection'),
  resultsCount: document.getElementById('resultsCount'),
  resultsList: document.getElementById('resultsList'),
  perfilCard: document.getElementById('perfilCard'),
  perfilAvatar: document.getElementById('perfilAvatar'),
  perfilNome: document.getElementById('perfilNome'),
  perfilMultiplicadora: document.getElementById('perfilMultiplicadora'),
  perfilCpf: document.getElementById('perfilCpf'),
  perfilProgramas: document.getElementById('perfilProgramas'),
  perfilJornada: document.getElementById('perfilJornada'),
  perfilFooterMeta: document.getElementById('perfilFooterMeta'),
  perfilBtnRelatorio: document.getElementById('perfilBtnRelatorio'),
};

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initials(nome) {
  const partes = String(nome || '').trim().split(/\s+/);
  return partes.length >= 2
    ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
}

function formatCpf(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : (cpf || '—');
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function journeySteps(status) {
  const reached = String(status || '').split('_');
  const lastIdx = JOURNEY_STEPS.reduce((acc, step, i) => (reached.includes(step) ? i : acc), -1);

  return JOURNEY_STEPS.map((step, i) => {
    let label, cls;
    if (i < lastIdx || (i === lastIdx && lastIdx === JOURNEY_STEPS.length - 1)) {
      label = 'Concluído'; cls = 'status-concluido';
    } else if (i === lastIdx) {
      label = 'Em curso'; cls = 'status-em-curso';
    } else {
      label = 'Próximo'; cls = 'status-proximo';
    }
    return { step, label, cls };
  });
}

/* ──────────────────────────────────────────────────────────
   Copiar CPF
────────────────────────────────────────────────────────── */
function copyCPF() {
  if (!currentCpf) return;
  navigator.clipboard.writeText(currentCpf).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.style.background = 'var(--color-success-soft)';
    btn.style.borderColor = 'var(--color-success)';
    btn.style.color = 'var(--color-success)';
    setTimeout(() => {
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  });
}
window.copyCPF = copyCPF;

/* ──────────────────────────────────────────────────────────
   Busca de jovens
────────────────────────────────────────────────────────── */
async function loadProgramas() {
  try {
    const data = await window.api.get('/programas', { params: { ativo: true }, auth: true });
    PROGRAMAS_MAP = {};
    (Array.isArray(data) ? data : []).forEach(p => { PROGRAMAS_MAP[p.id] = p; });
  } catch (e) { /* segue sem nomes de programa */ }
}

async function search(nome) {
  if (!nome) {
    el.resultsSection.style.display = 'none';
    el.perfilCard.style.display = 'none';
    return;
  }

  try {
    const data = await window.api.get('/jovens', { params: { nome, ativo: true }, auth: true });
    renderResults(Array.isArray(data) ? data : []);
  } catch (e) {
    renderResults([]);
  }
}

function renderResults(jovens) {
  el.resultsSection.style.display = '';
  el.resultsCount.textContent = `${jovens.length} resultado${jovens.length === 1 ? '' : 's'}`;

  if (jovens.length === 0) {
    el.resultsList.innerHTML = `<div class="empty-state" style="display:flex;padding:var(--spacing-xl,32px) 0"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>Sem dados</p></div>`;
    el.perfilCard.style.display = 'none';
    return;
  }

  el.resultsList.innerHTML = jovens.map(j => {
    const lastStep = String(j.status_jornada || '').split('_').pop();
    const badgeClass = STATUS_BADGE[lastStep] || 'badge-brand';
    return `
      <a class="result-item" href="#" data-id="${j.id}">
        <div class="result-avatar">${esc(initials(j.nome))}</div>
        <div class="result-info">
          <div class="result-name">${esc(j.nome)}</div>
          <div class="result-meta">${esc(formatCpf(j.cpf))}</div>
        </div>
        <div class="result-right">
          <span class="badge ${badgeClass}">● ${esc(lastStep || '—')}</span>
          <span class="result-chevron"><i data-lucide="chevron-right"></i></span>
        </div>
      </a>`;
  }).join('');

  // Foto de cada aluno na lista (fonte: usuarios.foto_url da conta vinculada); fallback iniciais
  const fotoPorId = new Map(jovens.map(j => [String(j.id), { foto: j.foto_url, nome: j.nome }]));
  el.resultsList.querySelectorAll('.result-item[data-id]').forEach(item => {
    const dados = fotoPorId.get(item.dataset.id);
    if (dados?.foto) window.avatar.render(item.querySelector('.result-avatar'), dados.foto, dados.nome);
  });

  if (window.lucide) lucide.createIcons();

  el.resultsList.querySelectorAll('.result-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      openPerfil(item.dataset.id);
    });
  });

  if (!jovens.some(j => String(j.id) === String(currentJovemId))) {
    el.perfilCard.style.display = 'none';
    currentJovemId = null;
  }
}

/* ──────────────────────────────────────────────────────────
   Perfil do jovem selecionado
────────────────────────────────────────────────────────── */
async function openPerfil(id) {
  currentJovemId = id;
  try {
    const ficha = await window.api.get(`/jovens/${id}/ficha`, { auth: true });
    renderPerfil(ficha);
  } catch (e) {
    el.perfilCard.style.display = 'none';
  }
}

function renderPerfil(ficha) {
  const jovem = ficha.jovem;
  currentCpf = jovem.cpf || '';

  window.avatar.render(el.perfilAvatar, jovem.foto_url, jovem.nome);
  el.perfilNome.textContent = jovem.nome;
  el.perfilCpf.textContent = formatCpf(jovem.cpf);
  el.perfilMultiplicadora.style.display = jovem.multiplicador ? '' : 'none';

  /* Programas */
  if (ficha.matriculas && ficha.matriculas.length) {
    el.perfilProgramas.innerHTML = ficha.matriculas.map(m => {
      const prog = PROGRAMAS_MAP[m.programa_id];
      const nome = prog ? prog.nome : `Programa #${m.programa_id}`;
      const statusLabel = MATRICULA_STATUS_LABEL[m.status] || m.status;
      const rowClass = m.status === 'Ativo' ? 'programa-row active-row' : 'programa-row';
      const statusClass = m.status === 'Ativo' ? 'programa-status ativo' : 'programa-status';
      const dataLabel = m.status === 'Concluido'
        ? `Concluído em ${formatDate(m.data_conclusao)}`
        : `Desde ${formatDate(m.data_matricula)}`;
      return `
        <div class="${rowClass}">
          <div>
            <div class="programa-name">${esc(nome)}</div>
            <div class="programa-date">${esc(dataLabel)}</div>
          </div>
          <span class="${statusClass}">${esc(statusLabel)}</span>
        </div>`;
    }).join('');
  } else {
    el.perfilProgramas.innerHTML = `<p style="color:var(--color-text-secondary);">Nenhum programa registrado.</p>`;
  }

  /* Jornada */
  el.perfilJornada.innerHTML = journeySteps(jovem.status_jornada).map(s => `
    <div class="jornada-row">
      <div class="jornada-step">
        <div class="jornada-step-name">${esc(s.step)}</div>
        <div class="jornada-step-date">—</div>
      </div>
      <span class="status-badge ${s.cls}">
        <span class="status-badge-dot"></span>
        ${esc(s.label)}
      </span>
    </div>`).join('');

  /* Footer */
  const metaParts = [];
  const primeiraMatricula = ficha.matriculas?.[0];
  const programa = primeiraMatricula ? PROGRAMAS_MAP[primeiraMatricula.programa_id] : null;
  if (programa?.coorte) metaParts.push(`Coorte ${esc(programa.coorte)}`);
  if (primeiraMatricula?.data_matricula) metaParts.push(`Início em ${formatDate(primeiraMatricula.data_matricula)}`);
  if (jovem.cidade) metaParts.push(`${esc(jovem.cidade)}${jovem.estado ? ' · ' + esc(jovem.estado) : ''}`);

  el.perfilFooterMeta.innerHTML = metaParts.length
    ? metaParts.map((p, i) => i === 0 ? `<span>${p}</span>` : `<div class="footer-dot"></div><span>${p}</span>`).join('')
    : '<span>—</span>';

  el.perfilBtnRelatorio.href = `perfilAlunoGestao.html?id=${jovem.id}`;

  el.perfilCard.style.display = '';
  if (window.lucide) lucide.createIcons();
}

/* ──────────────────────────────────────────────────────────
   Init
────────────────────────────────────────────────────────── */
el.searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => search(el.searchInput.value.trim()), 300);
});

loadProgramas();
