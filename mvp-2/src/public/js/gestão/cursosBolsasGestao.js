/* ── cursosBolsasGestao.js ── */

/* ── camada de dados ── */
const dados = {
  async listar() {
    const [ativas, encerradas] = await Promise.all([
      window.api.get('/oportunidades', { params: { ativo: 'true'  }, auth: true }),
      window.api.get('/oportunidades', { params: { ativo: 'false' }, auth: true }),
    ]);
    return [...(ativas || []), ...(encerradas || [])];
  },

  async criar(body) {
    return window.api.post('/oportunidades', { body, auth: true });
  },

  async atualizar(id, body) {
    return window.api.put(`/oportunidades/${id}`, { body, auth: true });
  },

  async alterarStatus(id, ativo) {
    return window.api.patch(`/oportunidades/${id}`, { body: { ativo }, auth: true });
  },

  async excluir(id) {
    return window.api.delete(`/oportunidades/${id}`, { auth: true });
  },
};

/* ── estado ── */
let oportunidades = [];
let filtroTipo    = '';
let filtroStatus  = '';
let modoEdicao    = false;

/* ── utilidade ── */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── validação ── */
function validarForm() {
  const campos = [
    { id: 'fieldTipo',        errId: 'errTipo',        msg: 'Selecione o tipo.'                },
    { id: 'fieldTitulo',      errId: 'errTitulo',      msg: 'Informe o título.'                },
    { id: 'fieldInstituicao', errId: 'errInstituicao', msg: 'Informe a instituição.'           },
    { id: 'fieldVagas',       errId: 'errVagas',       msg: 'Informe um número de vagas > 0.' },
    { id: 'fieldLink',        errId: 'errLink',        msg: 'Link inválido (informe uma URL https… ou deixe em branco).' },
  ];

  let valido = true;

  campos.forEach(({ id, errId, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    el.classList.remove('error');
    err.hidden = true;

    let ok = true;

    if (id === 'fieldVagas') {
      ok = el.value.trim() !== '' && Number(el.value) > 0;
    } else if (id === 'fieldLink') {
      // Link é opcional: vazio é válido; se preenchido, precisa ser uma URL válida.
      const valor = el.value.trim();
      if (valor === '') ok = true;
      else { try { new URL(valor); ok = true; } catch { ok = false; } }
    } else {
      ok = el.value.trim() !== '';
    }

    if (!ok) {
      el.classList.add('error');
      err.textContent = msg;
      err.hidden = false;
      valido = false;
    }
  });

  return valido;
}

function limparErros() {
  ['fieldTipo','fieldTitulo','fieldInstituicao','fieldVagas','fieldLink'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
  ['errTipo','errTitulo','errInstituicao','errVagas','errLink'].forEach(id => {
    const el = document.getElementById(id);
    el.hidden = true;
    el.textContent = '';
  });
}

/* ── feedback do formulário ── */
function mostrarFeedback(msg, tipo) {
  const el = document.getElementById('formFeedback');
  el.textContent = msg;
  el.className = `form-feedback form-feedback--${tipo}`;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
}

/* ── render ── */
function filtrados() {
  return oportunidades.filter(o => {
    if (filtroTipo) {
      const tipo = (o.tipo || '').toLowerCase();
      if (tipo !== filtroTipo.toLowerCase()) return false;
    }
    if (filtroStatus === 'ativa'     && o.ativo !== true)  return false;
    if (filtroStatus === 'encerrada' && o.ativo !== false) return false;
    return true;
  });
}

function badgeTipo(tipo) {
  return tipo === 'Bolsa'
    ? '<span class="badge badge-brand">Bolsa</span>'
    : '<span class="badge badge-info">Curso</span>';
}

function badgeStatus(ativo) {
  return ativo !== false
    ? '<span class="badge badge-success">Ativa</span>'
    : '<span class="badge badge-error">Encerrada</span>';
}

function renderCard(o) {
  const encerrada = o.ativo === false;

  const btnReabrir = encerrada
    ? `<button class="btn-acao btn-acao--reopen" data-action="reabrir" data-id="${o.id}">
         <i data-lucide="refresh-cw"></i> Reabrir
       </button>`
    : '';

  const btnExcluir =
    `<button class="btn-acao btn-acao--danger" data-action="excluir" data-id="${o.id}">
       <i data-lucide="trash-2"></i> Excluir
     </button>`;

  return `
    <div class="op-card${encerrada ? ' op-card--encerrada' : ''}" data-id="${o.id}" data-ativo="${o.ativo}">
      <div class="op-card-header">
        <div class="op-card-badges">
          ${badgeTipo(o.tipo)}
          ${badgeStatus(o.ativo)}
        </div>
      </div>
      <p class="op-card-title">${esc(o.titulo)}</p>
      <div class="op-card-meta">
        <div class="op-card-meta-row">
          <i data-lucide="building-2"></i>
          <span>${esc(o.instituicao)}</span>
        </div>
        <div class="op-card-meta-row">
          <i data-lucide="users"></i>
          <span>${esc(o.vagas)} vagas</span>
        </div>
      </div>
      <a class="op-card-link" href="${esc(o.link)}" target="_blank" rel="noopener">${esc(o.link)}</a>
      <div class="op-card-actions">
        <button class="btn-acao" data-action="editar" data-id="${o.id}">
          <i data-lucide="pencil"></i> Editar
        </button>
        ${btnReabrir}
        ${btnExcluir}
      </div>
    </div>
  `;
}

function render() {
  const lista = filtrados();
  const grid  = document.getElementById('oportunidadesGrid');

  document.getElementById('stateLoading').hidden = true;
  document.getElementById('stateError').hidden   = true;
  document.getElementById('stateEmpty').hidden   = true;

  if (lista.length === 0) {
    document.getElementById('stateEmpty').hidden = false;
    grid.innerHTML = '';
  } else {
    grid.innerHTML = lista.map(renderCard).join('');
  }

  lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
  atualizarContador();
}

function atualizarContador() {
  const total = filtrados().length;
  document.getElementById('countBadge').textContent =
    `${total} oportunidade${total !== 1 ? 's' : ''}`;
}

/* ── estados de UI ── */
function mostrarLoading() {
  document.getElementById('stateLoading').hidden = false;
  document.getElementById('stateError').hidden   = true;
  document.getElementById('stateEmpty').hidden   = true;
  document.getElementById('oportunidadesGrid').innerHTML = '';
}

function mostrarErro(msg) {
  document.getElementById('stateLoading').hidden     = true;
  document.getElementById('stateError').hidden       = false;
  document.getElementById('stateErrorMsg').textContent = msg;
  document.getElementById('stateEmpty').hidden       = true;
  document.getElementById('oportunidadesGrid').innerHTML = '';
}

/* ── carregar ── */
async function carregar() {
  mostrarLoading();
  window.setPageLoading?.(true);
  try {
    oportunidades = await dados.listar();
    render();
  } catch (e) {
    mostrarErro(e.message ?? 'Erro ao carregar oportunidades.');
  } finally {
    window.setPageLoading?.(false);
  }
}

/* ── modo edição ── */
function entrarEdicao(o) {
  modoEdicao = true;
  document.getElementById('formTitle').textContent   = 'Editar Oportunidade';
  document.getElementById('btnSalvarLabel').textContent = 'Salvar Alterações';
  document.getElementById('btnCancelar').hidden = false;

  document.getElementById('fieldId').value          = o.id;
  document.getElementById('fieldTipo').value        = o.tipo;
  document.getElementById('fieldTitulo').value      = o.titulo;
  document.getElementById('fieldInstituicao').value = o.instituicao;
  document.getElementById('fieldVagas').value       = o.vagas;
  document.getElementById('fieldLink').value        = o.link;

  document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
  limparErros();
}

function sairEdicao() {
  modoEdicao = false;
  document.getElementById('formTitle').textContent      = 'Nova Oportunidade';
  document.getElementById('btnSalvarLabel').textContent = 'Criar Oportunidade';
  document.getElementById('btnCancelar').hidden = true;
  document.getElementById('formOportunidade').reset();
  document.getElementById('fieldId').value = '';
  limparErros();
}

/* ── submit ── */
document.getElementById('formOportunidade').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarForm()) return;

  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.disabled = true;

  const body = {
    tipo:        document.getElementById('fieldTipo').value,
    titulo:      document.getElementById('fieldTitulo').value.trim(),
    instituicao: document.getElementById('fieldInstituicao').value.trim(),
    vagas:       Number(document.getElementById('fieldVagas').value),
    link:        document.getElementById('fieldLink').value.trim() || null,
  };

  const id = document.getElementById('fieldId').value;

  try {
    if (modoEdicao && id) {
      const atualizado = await dados.atualizar(Number(id), body);
      const idx = oportunidades.findIndex(o => o.id === Number(id));
      if (idx !== -1) oportunidades[idx] = atualizado;
      mostrarFeedback('Oportunidade atualizada com sucesso.', 'success');
    } else {
      const nova = await dados.criar(body);
      oportunidades.push(nova);
      mostrarFeedback('Oportunidade criada com sucesso.', 'success');
    }
    sairEdicao();
    render();
  } catch (err) {
    mostrarFeedback(err.message ?? 'Erro ao salvar.', 'error');
  } finally {
    btnSalvar.disabled = false;
  }
});

/* ── cancelar edição ── */
document.getElementById('btnCancelar').addEventListener('click', sairEdicao);

/* ── ações nos cards (delegação) ── */
document.getElementById('oportunidadesGrid').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id     = Number(btn.dataset.id);
  const op     = oportunidades.find(o => o.id === id);
  if (!op) return;

  if (action === 'editar') {
    entrarEdicao(op);
    return;
  }

  if (action === 'excluir') {
    if (!confirm(`Excluir a oportunidade "${op.titulo}"? Esta ação não pode ser desfeita.`)) return;
    btn.disabled = true;
    try {
      await dados.excluir(id);
      oportunidades = oportunidades.filter(o => o.id !== id);
      // Se a oportunidade excluída estava em edição, sai do modo edição.
      if (modoEdicao && Number(document.getElementById('fieldId').value) === id) sairEdicao();
      render();
      mostrarFeedback('Oportunidade excluída com sucesso.', 'success');
    } catch (err) {
      alert(`Erro: ${err.message ?? 'Não foi possível excluir.'}`);
      btn.disabled = false;
    }
    return;
  }

  if (action === 'reabrir') {
    btn.disabled = true;
    try {
      const atualizado = await dados.alterarStatus(id, true);
      const idx = oportunidades.findIndex(o => o.id === id);
      if (idx !== -1) oportunidades[idx] = atualizado;
      render();
    } catch (err) {
      alert(`Erro: ${err.message}`);
      btn.disabled = false;
    }
  }
});

/* ── filtros ── */
document.getElementById('filterTipo').addEventListener('change', e => {
  filtroTipo = e.target.value;
  render();
});

document.getElementById('filterStatus').addEventListener('change', e => {
  filtroStatus = e.target.value;
  render();
});

/* ── tentar de novo ── */
document.getElementById('btnTentarNovamente').addEventListener('click', carregar);

/* ── init ── */
lucide.createIcons();
carregar();
