/* empregabilidade.js — Integração da tela Empregabilidade
   Pulsar · Pulse Mais
*/

let _empId          = null;
let _competencias   = [];
let _historicoList  = [];

document.addEventListener('DOMContentLoaded', async () => {
  const jovem_id = window.currentUser?.jovem_id;

  window.setPageLoading?.(true);
  try {
    await Promise.all([
      carregarStatusCarreira(jovem_id),
      carregarCompetencias(jovem_id),
      carregarHistoricoCarreiras(jovem_id),
    ]);
  } finally {
    window.setPageLoading?.(false);
  }

  iniciarEdicaoEmpregabilidade();
  iniciarAdicionarCompetencia();
  iniciarAdicionarHistorico();
  iniciarModalEdicao();
  lucide.createIcons();
});

/* ── Career status: cargo atual, empresa, tempo ── */
async function carregarStatusCarreira(jovem_id) {
  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/empregabilidade', { auth: true, params });
    const atual  = Array.isArray(lista) ? lista.find(e => e.ativo) ?? lista[0] : lista;

    if (!atual) return;

    _empId = atual.id ?? null;

    setText('emp-cargo',   atual.cargo   ?? atual.funcao        ?? '—');
    setText('emp-empresa', atual.empresa ?? atual.organizacao   ?? '—');

    if (atual.data_admissao) {
      setText('emp-tempo', calcularTempo(atual.data_admissao));
    } else if (atual.duracao) {
      setText('emp-tempo', atual.duracao);
    }
  } catch (err) {
    console.error('Erro ao carregar status de carreira:', err);
  }
}

/* ── Competências ── */
async function carregarCompetencias(jovem_id) {
  const container = document.getElementById('emp-competencias-body');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/competencias', { auth: true, params });

    if (!lista?.length) {
      container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg><p>Sem dados</p></div>';
      return;
    }

    _competencias = lista;

    container.innerHTML = lista.map(c => {
      const tipo      = c.tipo?.toLowerCase() ?? 'competencia';
      const isEvento  = tipo.includes('evento');
      const isCurso   = tipo.includes('curso');
      const iconClass = isEvento ? 'is-event' : isCurso ? 'is-course' : '';
      const iconName  = isEvento ? 'calendar' : isCurso ? 'file-text' : 'award';
      const meta      = [c.tipo, c.nivel ?? c.carga_horaria, c.instituicao]
        .filter(Boolean).join(' · ');

      return `
        <article class="simple-card skill-card" data-id="${c.id}">
          <span class="skill-row-icon ${iconClass}">
            <i data-lucide="${iconName}"></i>
          </span>
          <div class="skill-row-body">
            <span class="skill-row-title">${c.nome ?? '—'}</span>
            <span class="skill-row-meta">${meta}</span>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Sem dados</p></div>';
    console.error('Erro ao carregar competências:', err);
  }
}

/* ── Histórico de carreiras ── */
async function carregarHistoricoCarreiras(jovem_id) {
  const container = document.getElementById('emp-historico-body');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/empregabilidade', { auth: true, params });

    if (!lista?.length) {
      container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><p>Sem dados</p></div>';
      return;
    }

    _historicoList = lista;

    container.innerHTML = lista.map(e => {
      const duracao = e.data_admissao
        ? calcularTempo(e.data_admissao, e.data_saida)
        : (e.duracao ?? '—');
      const meta = [e.empresa ?? e.organizacao, e.tipo_vinculo, duracao]
        .filter(Boolean).join(' · ');
      return `
        <article class="simple-card skill-card" data-id="${e.id}">
          <span class="skill-row-icon is-course">
            <i data-lucide="briefcase"></i>
          </span>
          <div class="skill-row-body">
            <span class="skill-row-title">${e.cargo ?? e.funcao ?? '—'}</span>
            <span class="skill-row-meta">${meta}</span>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="opp-empty">Erro ao carregar histórico.</p>';
    console.error('Erro ao carregar histórico de carreiras:', err);
  }
}

/* ── Adicionar Competência ── */
function iniciarAdicionarCompetencia() {
  const btnAdd      = document.getElementById('btn-add-comp');
  const btnCancelar = document.getElementById('comp-btn-cancelar');
  const btnSalvar   = document.getElementById('comp-btn-salvar');
  const form        = document.getElementById('comp-form');
  const erroEl      = document.getElementById('comp-erro');
  if (!btnAdd) return;

  btnAdd.addEventListener('click', () => {
    form.hidden = false;
    btnAdd.hidden = true;
    erroEl.hidden = true;
    document.getElementById('comp-nome').focus();
  });

  btnCancelar.addEventListener('click', () => {
    form.hidden = true;
    btnAdd.hidden = false;
    erroEl.hidden = true;
    form.reset();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const nome = document.getElementById('comp-nome').value.trim();
    const tipo = document.getElementById('comp-tipo').value;

    if (!nome) {
      erroEl.textContent = 'O nome é obrigatório.';
      erroEl.hidden = false;
      return;
    }
    if (!tipo) {
      erroEl.textContent = 'Selecione um tipo.';
      erroEl.hidden = false;
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        nome,
        tipo,
        nivel:       document.getElementById('comp-nivel').value || null,
        instituicao: document.getElementById('comp-inst').value.trim() || null,
      };

      await window.api.post('/competencias', { body, auth: true });

      form.hidden = true;
      btnAdd.hidden = false;
      form.reset();

      await carregarCompetencias(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = err.message ?? 'Erro ao salvar competência.';
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Adicionar Histórico de Carreira ── */
function iniciarAdicionarHistorico() {
  const btnAdd      = document.getElementById('btn-add-hist');
  const btnCancelar = document.getElementById('hist-btn-cancelar');
  const btnSalvar   = document.getElementById('hist-btn-salvar');
  const form        = document.getElementById('hist-form');
  const erroEl      = document.getElementById('hist-erro');
  if (!btnAdd) return;

  btnAdd.addEventListener('click', () => {
    form.hidden = false;
    btnAdd.hidden = true;
    erroEl.hidden = true;
    document.getElementById('hist-cargo').focus();
  });

  btnCancelar.addEventListener('click', () => {
    form.hidden = true;
    btnAdd.hidden = false;
    erroEl.hidden = true;
    form.reset();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const cargo = document.getElementById('hist-cargo').value.trim();
    if (!cargo) {
      erroEl.textContent = 'O cargo é obrigatório.';
      erroEl.hidden = false;
      return;
    }

    const histAdmissao = document.getElementById('hist-admissao').value || null;
    const histSaida    = document.getElementById('hist-saida').value    || null;
    const erroData = validarDatasEmprego(histAdmissao, histSaida);
    if (erroData) { erroEl.textContent = erroData; erroEl.hidden = false; return; }

    btnSalvar.disabled    = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        cargo,
        empresa:       document.getElementById('hist-empresa').value.trim()  || null,
        tipo_vinculo:  document.getElementById('hist-vinculo').value         || null,
        data_admissao: histAdmissao,
        data_saida:    histSaida,
        ativo:         false,
      };

      await window.api.post('/empregabilidade', { body, auth: true });

      form.hidden   = true;
      btnAdd.hidden = false;
      form.reset();

      await carregarHistoricoCarreiras(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = err.message ?? 'Erro ao salvar. Tente novamente.';
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled    = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Edição de empregabilidade ── */
function iniciarEdicaoEmpregabilidade() {
  const btnEditar   = document.getElementById('btn-emp-editar');
  const btnCancelar = document.getElementById('emp-btn-cancelar');
  const btnSalvar   = document.getElementById('emp-btn-salvar');
  const form        = document.getElementById('emp-form');
  const view        = document.getElementById('emp-view');
  const erroEl      = document.getElementById('emp-erro');
  if (!btnEditar) return;

  btnEditar.addEventListener('click', () => {
    // Pré-preenche com valores atuais
    const cargo   = document.getElementById('emp-cargo')?.textContent;
    const empresa = document.getElementById('emp-empresa')?.textContent;
    setValue('emp-input-cargo',   cargo   !== '—' ? cargo   : '');
    setValue('emp-input-empresa', empresa !== '—' ? empresa : '');

    view.hidden = true;
    form.hidden = false;
    erroEl.hidden = true;
  });

  btnCancelar.addEventListener('click', () => {
    view.hidden = false;
    form.hidden = true;
    erroEl.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const cargo    = document.getElementById('emp-input-cargo').value.trim();
    const empresa  = document.getElementById('emp-input-empresa').value.trim();
    const admissao = document.getElementById('emp-input-admissao').value || null;
    const vinculo  = document.getElementById('emp-input-vinculo').value  || null;
    const modalidade = document.getElementById('emp-input-modalidade').value || null;
    const salario  = document.getElementById('emp-input-salario').value.trim() || null;

    if (!cargo) {
      erroEl.textContent = 'O cargo é obrigatório.';
      erroEl.hidden = false;
      return;
    }

    const erroData = validarDatasEmprego(admissao, null);
    if (erroData) { erroEl.textContent = erroData; erroEl.hidden = false; return; }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        cargo,
        empresa:       empresa   || null,
        data_admissao: admissao,
        ...(vinculo    && { tipo_vinculo:   vinculo }),
        ...(modalidade && { modalidade }),
        ...(salario    && { faixa_salarial: salario }),
        ativo: true,
      };
      let resultado;

      if (_empId) {
        resultado = await window.api.put(`/empregabilidade/${_empId}`, { body, auth: true });
      } else {
        resultado = await window.api.post('/empregabilidade', { body, auth: true });
        _empId = resultado.id;
      }

      setText('emp-cargo',   resultado.cargo   ?? '—');
      setText('emp-empresa', resultado.empresa ?? '—');
      if (resultado.data_admissao) setText('emp-tempo', calcularTempo(resultado.data_admissao));

      view.hidden = false;
      form.hidden = true;

      // Recarrega histórico
      await carregarHistoricoCarreiras(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = err.message ?? 'Erro ao salvar. Tente novamente.';
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Modal de edição / exclusão ── */
function iniciarModalEdicao() {
  const overlay  = document.getElementById('edit-modal');
  const btnClose = document.getElementById('edit-modal-close');
  const titulo   = document.getElementById('edit-modal-titulo');
  const formComp = document.getElementById('edit-comp-form');
  const formHist = document.getElementById('edit-hist-form');
  if (!overlay) return;

  const abrir  = () => { overlay.classList.add('is-visible');    document.body.style.overflow = 'hidden'; };
  const fechar = () => { overlay.classList.remove('is-visible'); document.body.style.overflow = ''; };

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  /* — Abre modal com dados de Competência — */
  document.getElementById('emp-competencias-body').addEventListener('click', (e) => {
    const card = e.target.closest('article[data-id]');
    if (!card) return;
    const item = _competencias.find(c => String(c.id) === card.dataset.id);
    if (!item) return;

    titulo.textContent = 'Editar Competência';
    formComp.hidden = false;
    formHist.hidden = true;
    document.getElementById('edit-comp-nome').value  = item.nome         ?? '';
    document.getElementById('edit-comp-tipo').value  = item.tipo         ?? '';
    document.getElementById('edit-comp-nivel').value = item.nivel        ?? '';
    document.getElementById('edit-comp-inst').value  = item.instituicao  ?? '';
    document.getElementById('edit-comp-erro').hidden = true;
    formComp.dataset.id = item.id;
    abrir();
    lucide.createIcons();
  });

  /* — Abre modal com dados de Histórico — */
  document.getElementById('emp-historico-body').addEventListener('click', (e) => {
    const card = e.target.closest('article[data-id]');
    if (!card) return;
    const item = _historicoList.find(h => String(h.id) === card.dataset.id);
    if (!item) return;

    titulo.textContent = 'Editar Histórico de Carreira';
    formComp.hidden = true;
    formHist.hidden = false;
    document.getElementById('edit-hist-cargo').value   = item.cargo        ?? '';
    document.getElementById('edit-hist-empresa').value = item.empresa       ?? '';
    document.getElementById('edit-hist-vinculo').value = item.tipo_vinculo  ?? '';
    document.getElementById('edit-hist-admissao').value = item.data_admissao ? item.data_admissao.slice(0, 10) : '';
    document.getElementById('edit-hist-saida').value    = item.data_saida   ? item.data_saida.slice(0, 10)    : '';
    document.getElementById('edit-hist-erro').hidden = true;
    formHist.dataset.id = item.id;
    abrir();
    lucide.createIcons();
  });

  /* — Salvar Competência — */
  formComp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById('edit-comp-erro');
    erroEl.hidden = true;
    const id   = formComp.dataset.id;
    const nome = document.getElementById('edit-comp-nome').value.trim();
    if (!nome) { erroEl.textContent = 'Nome obrigatório.'; erroEl.hidden = false; return; }

    const btnSalvar = document.getElementById('edit-comp-salvar');
    btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando…';
    try {
      const body = {
        nome,
        tipo:       document.getElementById('edit-comp-tipo').value  || undefined,
        nivel:      document.getElementById('edit-comp-nivel').value || null,
        instituicao:document.getElementById('edit-comp-inst').value.trim() || null,
      };
      await window.api.put(`/competencias/${id}`, { body, auth: true });
      fechar();
      await carregarCompetencias(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = err.message ?? 'Erro ao salvar.'; erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false; btnSalvar.textContent = 'Salvar';
    }
  });

  /* — Excluir Competência — */
  document.getElementById('edit-comp-excluir').addEventListener('click', async () => {
    if (!confirm('Excluir esta competência? Esta ação não pode ser desfeita.')) return;
    const id = formComp.dataset.id;
    try {
      await window.api.delete(`/competencias/${id}`, { auth: true });
      fechar();
      await carregarCompetencias(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      const erroEl = document.getElementById('edit-comp-erro');
      erroEl.textContent = err.message ?? 'Erro ao excluir.'; erroEl.hidden = false;
    }
  });

  /* — Salvar Histórico — */
  formHist.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erroEl = document.getElementById('edit-hist-erro');
    erroEl.hidden = true;
    const id    = formHist.dataset.id;
    const cargo = document.getElementById('edit-hist-cargo').value.trim();
    if (!cargo) { erroEl.textContent = 'Cargo obrigatório.'; erroEl.hidden = false; return; }

    const editAdmissao = document.getElementById('edit-hist-admissao').value || null;
    const editSaida    = document.getElementById('edit-hist-saida').value    || null;
    const erroData2 = validarDatasEmprego(editAdmissao, editSaida);
    if (erroData2) { erroEl.textContent = erroData2; erroEl.hidden = false; return; }

    const btnSalvar = document.getElementById('edit-hist-salvar');
    btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando…';
    try {
      const body = {
        cargo,
        empresa:       document.getElementById('edit-hist-empresa').value.trim() || null,
        ...(document.getElementById('edit-hist-vinculo').value  && { tipo_vinculo: document.getElementById('edit-hist-vinculo').value }),
        data_admissao: editAdmissao,
        data_saida:    editSaida,
      };
      await window.api.put(`/empregabilidade/${id}`, { body, auth: true });
      fechar();
      await carregarHistoricoCarreiras(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = err.message ?? 'Erro ao salvar.'; erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false; btnSalvar.textContent = 'Salvar';
    }
  });

  /* — Excluir Histórico — */
  document.getElementById('edit-hist-excluir').addEventListener('click', async () => {
    if (!confirm('Excluir este registro de carreira? Esta ação não pode ser desfeita.')) return;
    const id = formHist.dataset.id;
    try {
      await window.api.delete(`/empregabilidade/${id}`, { auth: true });
      fechar();
      await carregarHistoricoCarreiras(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      const erroEl = document.getElementById('edit-hist-erro');
      erroEl.textContent = err.message ?? 'Erro ao excluir.'; erroEl.hidden = false;
    }
  });
}

const ANO_MINIMO = 1950;

function validarDatasEmprego(admissaoVal, saidaVal) {
  if (admissaoVal) {
    const admissao = new Date(admissaoVal);
    if (admissao.getFullYear() < ANO_MINIMO) return `A data de admissão não pode ser anterior a ${ANO_MINIMO}.`;
    if (admissao > new Date()) return 'A data de admissão não pode ser no futuro.';
  }
  if (saidaVal) {
    const saida = new Date(saidaVal);
    if (saida.getFullYear() < ANO_MINIMO) return `A data de saída não pode ser anterior a ${ANO_MINIMO}.`;
    if (saida > new Date()) return 'A data de saída não pode ser no futuro.';
  }
  if (admissaoVal && saidaVal && new Date(saidaVal) < new Date(admissaoVal)) {
    return 'A data de saída não pode ser anterior à data de admissão.';
  }
  return null;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

/* ── Helpers ── */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function calcularTempo(dataInicio, dataFim = null) {
  const inicio = new Date(dataInicio);
  const fim    = dataFim ? new Date(dataFim) : new Date();
  const meses  = (fim.getFullYear() - inicio.getFullYear()) * 12
               + (fim.getMonth() - inicio.getMonth());
  if (meses < 1)  return 'menos de 1 mês';
  if (meses < 12) return `${meses} ${meses !== 1 ? 'meses' : 'mês'}`;
  const anos = Math.floor(meses / 12);
  const rest = meses % 12;
  return rest > 0
    ? `${anos} ano${anos > 1 ? 's' : ''} e ${rest} ${rest !== 1 ? 'meses' : 'mês'}`
    : `${anos} ano${anos > 1 ? 's' : ''}`;
}
