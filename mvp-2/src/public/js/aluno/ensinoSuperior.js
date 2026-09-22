/* ensinoSuperior.js — Integração da tela Ensino Superior
   Pulsar · Pulse Mais
*/

let _dadosES = null;
let _dadosDisciplinas = [];
let _certificadosList = [];

const DISC_STATUS_LABEL = {
  Em_andamento: 'Em andamento',
  Aprovado: 'Aprovado',
  Reprovado: 'Reprovado',
  Trancado: 'Trancado',
};

document.addEventListener('DOMContentLoaded', async () => {
  const jovem_id = window.currentUser?.jovem_id;

  window.setPageLoading?.(true);
  try {
    await Promise.all([
      carregarEnsinoSuperior(jovem_id),
      carregarDisciplinas(jovem_id),
      carregarCertificados(jovem_id),
    ]);
  } finally {
    window.setPageLoading?.(false);
  }

  iniciarEdicaoES();
  iniciarVerificarStatus();
  iniciarPendencias();
  iniciarCertificados();
  iniciarEditarCertificado();
  iniciarAdicionarDisciplina();
  iniciarEditarDisciplina();
  lucide.createIcons();
});

/* ── Ensino Superior: matricula, curso, instituição, semestre ── */
async function carregarEnsinoSuperior(jovem_id) {
  try {
    const params = jovem_id ? { jovem_id } : {};

    const [esLista, matriculaLista] = await Promise.all([
      window.api.get('/ensino-superior', { auth: true, params }),
      window.api.get('/matriculas',      { auth: true, params }),
    ]);

    const es        = Array.isArray(esLista)        ? esLista[0]        : esLista;
    const matricula = Array.isArray(matriculaLista) ? matriculaLista[0] : matriculaLista;

    if (es) {
      _dadosES = es;

      setText('es-curso',       es.cursos       ?? '—');
      setText('es-instituicao', es.instituicao   ?? '—');
      setText('es-semestre',    es.semestre_atual ?? '—');

      // Badge de status
      const statusBadge = document.getElementById('es-status-badge');
      if (statusBadge && es.status) {
        atualizarBadgeStatus(statusBadge, es.status);
      }

    }

    if (matricula) {
      setText('es-matricula', matricula.numero_matricula ?? matricula.codigo ?? '—');
    }

  } catch (err) {
    console.error('Erro ao carregar ensino superior:', err);
  }
}

/* ── Disciplinas (Histórico Acadêmico) ── */
async function carregarDisciplinas(jovem_id) {
  const container = document.getElementById('es-historico-list');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/disciplinas', { auth: true, params });

    if (!lista?.length) {
      container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><p>Sem dados</p></div>';
      return;
    }

    _dadosDisciplinas = lista;

    container.innerHTML = lista.map(d => {
      const aprovado    = d.status === 'Aprovado';
      const emAndamento = ['Em_andamento', 'Em andamento'].includes(d.status);
      const iconClass   = aprovado ? 'is-success' : emAndamento ? 'is-course' : 'is-danger';
      const iconName    = aprovado ? 'check-circle' : emAndamento ? 'book-open' : 'x-circle';
      const meta        = [DISC_STATUS_LABEL[d.status] ?? d.status, d.semestre ? `${d.semestre}º semestre` : null].filter(Boolean).join(' · ');

      return `
        <article class="simple-card skill-card" data-id="${d.id}" style="cursor:pointer">
          <span class="skill-row-icon ${iconClass}">
            <i data-lucide="${iconName}"></i>
          </span>
          <div class="skill-row-body">
            <span class="skill-row-title">${d.nome ?? '—'}</span>
            <span class="skill-row-meta">${meta}</span>
          </div>
        </article>
      `;
    }).join('');

    const totalAtivas = lista.filter(d =>
      d.status === 'Em_andamento' || d.status === 'Em andamento' || d.status === 'Cursando'
    ).length;
    setText('es-disciplinas-count', `${totalAtivas} matéria${totalAtivas !== 1 ? 's' : ''}`);

    const pendencias = lista.filter(d => d.status === 'Reprovado' || d.status === 'Trancado').length;
    const pendBadge = document.getElementById('es-pendencias-badge');
    if (pendBadge) {
      pendBadge.textContent = `${pendencias} Pendência${pendencias !== 1 ? 's' : ''}`;
      pendBadge.style.display = pendencias === 0 ? 'none' : '';
    }

  } catch (err) {
    container.innerHTML = '<div class="list-item"><span>Erro ao carregar disciplinas.</span></div>';
    console.error('Erro ao carregar disciplinas:', err);
  }
}

/* ── Certificados ── */
async function carregarCertificados(jovem_id) {
  const container = document.getElementById('es-certificados-list');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/certificados', { auth: true, params });

    if (!lista?.length) {
      _certificadosList = [];
      container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg><p>Sem dados</p></div>';
      return;
    }

    _certificadosList = lista;

    container.innerHTML = lista.map(c => {
      const meta = [c.instituicao, c.data_conclusao ? formatarData(c.data_conclusao) : null].filter(Boolean).join(' · ');
      return `
        <article class="simple-card skill-card" data-id="${c.id}" style="cursor:pointer">
          <span class="skill-row-icon is-warning">
            <i data-lucide="award"></i>
          </span>
          <div class="skill-row-body">
            <span class="skill-row-title">${c.nome ?? c.titulo ?? '—'}</span>
            ${meta ? `<span class="skill-row-meta">${meta}</span>` : ''}
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div class="list-item"><span>Erro ao carregar certificados.</span></div>';
    console.error('Erro ao carregar certificados:', err);
  }
}

/* ── Adicionar Certificado ── */
function iniciarCertificados() {
  const btnAdd     = document.getElementById('btn-add-cert');
  const btnCancelar = document.getElementById('cert-btn-cancelar');
  const btnSalvar  = document.getElementById('cert-btn-salvar');
  const form       = document.getElementById('cert-form');
  const erroEl     = document.getElementById('cert-erro');
  if (!btnAdd) return;

  btnAdd.addEventListener('click', () => {
    form.hidden = false;
    btnAdd.hidden = true;
    erroEl.hidden = true;
    document.getElementById('cert-nome').focus();
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

    const nome = document.getElementById('cert-nome').value.trim();
    if (!nome) {
      erroEl.textContent = 'O nome do certificado é obrigatório.';
      erroEl.hidden = false;
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        nome,
        instituicao:    document.getElementById('cert-inst').value.trim()  || null,
        data_conclusao: document.getElementById('cert-data').value         || null,
        link_documento: document.getElementById('cert-link').value.trim()  || null,
      };

      await window.api.post('/certificados', { body, auth: true });

      form.hidden = true;
      btnAdd.hidden = false;
      form.reset();

      await carregarCertificados(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao salvar certificado.');
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Verificar Status ── */
function iniciarVerificarStatus() {
  const btn      = document.getElementById('btn-verificar-status');
  const btnFechar = document.getElementById('btn-fechar-status');
  const painel   = document.getElementById('status-detail');
  if (!btn || !painel) return;

  btn.addEventListener('click', () => {
    const es = _dadosES;
    const discs = _dadosDisciplinas;

    setText('sd-status',      es?.status ?? es?.situacao ?? '—');
    setText('sd-curso',       es?.cursos ?? '—');
    setText('sd-instituicao', es?.instituicao ?? '—');
    setText('sd-semestre',    es?.semestre_atual ?? '—');
    setText('sd-bolsa',       formatarBolsa(es?.modalidade_bolsa));

    const aprovadas  = discs.filter(d => d.status === 'Aprovado').length;
    const andamento  = discs.filter(d => ['Em_andamento', 'Em andamento'].includes(d.status)).length;
    const reprovadas = discs.filter(d => d.status === 'Reprovado' || d.status === 'Trancado').length;

    setText('sd-disc-aprovadas', `${aprovadas} aprovada${aprovadas !== 1 ? 's' : ''}`);
    setText('sd-disc-andamento', `${andamento} em andamento`);
    setText('sd-disc-reprovadas', `${reprovadas} reprovada${reprovadas !== 1 ? 's' : ''}`);

    painel.hidden = false;
    lucide.createIcons();
    painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  btnFechar.addEventListener('click', () => { painel.hidden = true; });
}

/* ── Pendências (disciplinas Reprovado/Trancado) ── */
function iniciarPendencias() {
  const btn       = document.getElementById('btn-pendencias');
  const btnFechar = document.getElementById('btn-fechar-pend');
  const painel    = document.getElementById('pend-detail');
  const lista     = document.getElementById('pend-list');
  if (!btn || !painel) return;

  btn.addEventListener('click', () => {
    painel.hidden = false;

    const pendentes = _dadosDisciplinas.filter(d => d.status === 'Reprovado' || d.status === 'Trancado');

    if (!pendentes.length) {
      lista.innerHTML = '<p class="pend-empty">Nenhuma pendência encontrada.</p>';
      painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    lista.innerHTML = pendentes.map(d => {
      const reprovado = d.status === 'Reprovado';
      return `
        <div class="pend-item">
          <span class="pend-item-icon ${reprovado ? 'is-danger' : 'is-warning'}">
            <i data-lucide="${reprovado ? 'x-circle' : 'pause-circle'}"></i>
          </span>
          <div class="pend-item-body">
            <span class="pend-item-title">${d.nome ?? '—'}</span>
            <span class="pend-item-meta">${d.semestre ? d.semestre + 'º semestre' : '—'}</span>
          </div>
          <span class="pend-badge ${reprovado ? 'is-danger' : 'is-warning'}">
            ${reprovado ? 'Reprovado' : 'Trancado'}
          </span>
        </div>
      `;
    }).join('');

    lucide.createIcons();
    painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  btnFechar.addEventListener('click', () => { painel.hidden = true; });
}

/* ── Editar/Excluir Certificado (modal) ── */
function iniciarEditarCertificado() {
  const overlay    = document.getElementById('edit-cert-modal');
  const btnClose   = document.getElementById('edit-cert-close');
  const btnCancel  = document.getElementById('edit-cert-cancelar');
  const btnExcluir = document.getElementById('edit-cert-excluir');
  const form       = document.getElementById('edit-cert-form');
  const erroEl     = document.getElementById('edit-cert-erro');
  if (!overlay) return;

  const abrir  = () => { overlay.classList.add('is-visible');    document.body.style.overflow = 'hidden'; };
  const fechar = () => { overlay.classList.remove('is-visible'); document.body.style.overflow = ''; };

  btnClose?.addEventListener('click', fechar);
  btnCancel?.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  document.getElementById('es-certificados-list').addEventListener('click', (e) => {
    const card = e.target.closest('article[data-id]');
    if (!card) return;
    const item = _certificadosList.find(c => String(c.id) === card.dataset.id);
    if (!item) return;

    document.getElementById('edit-cert-nome').value = item.nome ?? '';
    document.getElementById('edit-cert-inst').value = item.instituicao ?? '';
    document.getElementById('edit-cert-data').value = item.data_conclusao ? item.data_conclusao.slice(0, 10) : '';
    document.getElementById('edit-cert-link').value = item.link_documento ?? '';
    erroEl.hidden = true;
    form.dataset.id = item.id;
    abrir();
    lucide.createIcons();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;
    const id   = form.dataset.id;
    const nome = document.getElementById('edit-cert-nome').value.trim();
    if (!nome) { erroEl.textContent = 'Nome obrigatório.'; erroEl.hidden = false; return; }

    const btnSalvar = document.getElementById('edit-cert-salvar');
    btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando…';
    try {
      const body = {
        nome,
        instituicao:    document.getElementById('edit-cert-inst').value.trim() || null,
        data_conclusao: document.getElementById('edit-cert-data').value        || null,
        link_documento: document.getElementById('edit-cert-link').value.trim() || null,
      };
      await window.api.put(`/certificados/${id}`, { body, auth: true });
      fechar();
      await carregarCertificados(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao salvar.'); erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false; btnSalvar.textContent = 'Salvar';
    }
  });

  btnExcluir.addEventListener('click', async () => {
    if (!confirm('Excluir este certificado? Esta ação não pode ser desfeita.')) return;
    const id = form.dataset.id;
    try {
      await window.api.delete(`/certificados/${id}`, { auth: true });
      fechar();
      await carregarCertificados(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao excluir.'); erroEl.hidden = false;
    }
  });
}

/* ── Adicionar Disciplina ── */
function iniciarAdicionarDisciplina() {
  const btnAdd      = document.getElementById('btn-add-disc');
  const btnCancelar = document.getElementById('disc-btn-cancelar');
  const btnSalvar   = document.getElementById('disc-btn-salvar');
  const form        = document.getElementById('disc-form');
  const erroEl      = document.getElementById('disc-erro');
  if (!btnAdd) return;

  btnAdd.addEventListener('click', () => {
    form.hidden = false;
    btnAdd.hidden = true;
    erroEl.hidden = true;
    document.getElementById('disc-nome').focus();
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

    const nome = document.getElementById('disc-nome').value.trim();
    if (!nome) {
      erroEl.textContent = 'O nome da disciplina é obrigatório.';
      erroEl.hidden = false;
      return;
    }

    const status = document.getElementById('disc-status').value;
    if (!status) {
      erroEl.textContent = 'Selecione um status.';
      erroEl.hidden = false;
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        nome,
        status,
        semestre: document.getElementById('disc-semestre').value ? Number(document.getElementById('disc-semestre').value) : null,
      };

      if (_dadosES?.id) body.ensino_superior_id = _dadosES.id;

      await window.api.post('/disciplinas', { body, auth: true });

      form.hidden = true;
      btnAdd.hidden = false;
      form.reset();

      await carregarDisciplinas(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao salvar disciplina.');
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Editar/Excluir Disciplina (modal) ── */
function iniciarEditarDisciplina() {
  const overlay    = document.getElementById('edit-disc-modal');
  const btnClose   = document.getElementById('edit-disc-close');
  const btnCancel  = document.getElementById('edit-disc-cancelar');
  const btnExcluir = document.getElementById('edit-disc-excluir');
  const form       = document.getElementById('edit-disc-form');
  const erroEl     = document.getElementById('edit-disc-erro');
  if (!overlay) return;

  const abrir  = () => { overlay.classList.add('is-visible');    document.body.style.overflow = 'hidden'; };
  const fechar = () => { overlay.classList.remove('is-visible'); document.body.style.overflow = ''; };

  btnClose?.addEventListener('click', fechar);
  btnCancel?.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

  document.getElementById('es-historico-list').addEventListener('click', (e) => {
    const card = e.target.closest('article[data-id]');
    if (!card) return;
    const item = _dadosDisciplinas.find(d => String(d.id) === card.dataset.id);
    if (!item) return;

    document.getElementById('edit-disc-nome').value     = item.nome ?? '';
    document.getElementById('edit-disc-status').value   = item.status ?? '';
    document.getElementById('edit-disc-semestre').value = item.semestre ?? '';
    erroEl.hidden = true;
    form.dataset.id = item.id;
    abrir();
    lucide.createIcons();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;
    const id   = form.dataset.id;
    const nome = document.getElementById('edit-disc-nome').value.trim();
    if (!nome) { erroEl.textContent = 'Nome obrigatório.'; erroEl.hidden = false; return; }
    const status = document.getElementById('edit-disc-status').value;
    if (!status) { erroEl.textContent = 'Selecione um status.'; erroEl.hidden = false; return; }

    const btnSalvar = document.getElementById('edit-disc-salvar');
    btnSalvar.disabled = true; btnSalvar.textContent = 'Salvando…';
    try {
      const body = {
        nome,
        status,
        semestre: document.getElementById('edit-disc-semestre').value ? Number(document.getElementById('edit-disc-semestre').value) : null,
      };
      await window.api.put(`/disciplinas/${id}`, { body, auth: true });
      fechar();
      await carregarDisciplinas(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao salvar.'); erroEl.hidden = false;
    } finally {
      btnSalvar.disabled = false; btnSalvar.textContent = 'Salvar';
    }
  });

  btnExcluir.addEventListener('click', async () => {
    if (!confirm('Excluir esta disciplina? Esta ação não pode ser desfeita.')) return;
    const id = form.dataset.id;
    try {
      await window.api.delete(`/disciplinas/${id}`, { auth: true });
      fechar();
      await carregarDisciplinas(window.currentUser?.jovem_id);
      lucide.createIcons();
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao excluir.'); erroEl.hidden = false;
    }
  });
}

function msgErro(err, fallback) {
  if (err?.status === 403 || err?.data?.status === 403 || err?.message === 'Forbidden')
    return 'Você não tem permissão para realizar esta ação. Entre em contato com a coordenação.';
  return err?.data?.message || err?.data?.error || err?.message || fallback;
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function formatarBolsa(modalidade) {
  if (!modalidade || modalidade === 'Sem_bolsa') return 'Sem bolsa';
  return modalidade.replace(/_/g, ' ');
}

/* ── Edição de Ensino Superior ── */
function iniciarEdicaoES() {
  const btnEditar   = document.getElementById('btn-es-editar');
  const btnCancelar = document.getElementById('es-btn-cancelar');
  const btnSalvar   = document.getElementById('es-btn-salvar');
  const form        = document.getElementById('es-form');
  const erroEl      = document.getElementById('es-erro');
  if (!btnEditar) return;

  btnEditar.addEventListener('click', () => {
    const es = _dadosES;
    setVal('es-input-curso',    es?.cursos         ?? '');
    setVal('es-input-inst',     es?.instituicao    ?? '');
    setVal('es-input-status',   es?.status         ?? '');
    setVal('es-input-bolsa',    es?.modalidade_bolsa ?? '');
    setVal('es-input-semestre', es?.semestre_atual  ?? '');
    setVal('es-input-matricula',es?.numero_matricula_ies ?? '');
    setVal('es-input-inicio',   es?.data_inicio ? es.data_inicio.slice(0, 10) : '');
    setVal('es-input-conclusao',es?.data_conclusao ? es.data_conclusao.slice(0, 10) : '');

    erroEl.hidden = true;
    form.hidden   = false;
    document.getElementById('es-input-curso').focus();
  });

  btnCancelar.addEventListener('click', () => {
    form.hidden = true;
    erroEl.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const cursos      = document.getElementById('es-input-curso').value.trim();
    const instituicao = document.getElementById('es-input-inst').value.trim();
    const status      = document.getElementById('es-input-status').value;

    if (!cursos) {
      erroEl.textContent = 'O nome do curso é obrigatório.';
      erroEl.hidden = false;
      return;
    }
    if (!status) {
      erroEl.textContent = 'Selecione um status.';
      erroEl.hidden = false;
      return;
    }

    btnSalvar.disabled    = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        cursos,
        instituicao:          instituicao || null,
        status,
        modalidade_bolsa:     document.getElementById('es-input-bolsa').value     || null,
        semestre_atual:       document.getElementById('es-input-semestre').value.trim() || null,
        numero_matricula_ies: document.getElementById('es-input-matricula').value.trim() || null,
        data_inicio:          document.getElementById('es-input-inicio').value    || null,
        data_conclusao:       document.getElementById('es-input-conclusao').value || null,
      };

      let resultado;
      if (_dadosES?.id) {
        resultado = await window.api.put(`/ensino-superior/${_dadosES.id}`, { body, auth: true });
      } else {
        resultado = await window.api.post('/ensino-superior', { body, auth: true });
      }

      _dadosES = resultado;

      setText('es-curso',       resultado.cursos          ?? '—');
      setText('es-instituicao', resultado.instituicao      ?? '—');
      setText('es-semestre',    resultado.semestre_atual   ?? '—');
      setText('es-matricula',   resultado.numero_matricula_ies ?? '—');

      const statusBadge = document.getElementById('es-status-badge');
      if (statusBadge && resultado.status) atualizarBadgeStatus(statusBadge, resultado.status);

      form.hidden = true;
    } catch (err) {
      erroEl.textContent = msgErro(err, 'Erro ao salvar. Tente novamente.');
      erroEl.hidden = false;
    } finally {
      btnSalvar.disabled    = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function atualizarBadgeStatus(el, status) {
  const labels = { Cursando: 'Cursando', Concluido: 'Concluído', Trancado: 'Trancado', Desistente: 'Desistente' };
  const cursando  = status === 'Cursando';
  const concluido = status === 'Concluido';
  const trancado  = status === 'Trancado';
  const cls  = cursando || concluido ? 'badge badge-success' : trancado ? 'badge badge-warning' : 'badge badge-danger';
  const icon = cursando || concluido ? 'check' : trancado ? 'pause-circle' : 'x';
  el.className = cls;
  el.innerHTML = `<i data-lucide="${icon}" style="width:12px;height:12px;stroke-width:3"></i> ${labels[status] ?? status}`;
  el.hidden = false;
  lucide.createIcons();
}

/* ── Helper ── */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
