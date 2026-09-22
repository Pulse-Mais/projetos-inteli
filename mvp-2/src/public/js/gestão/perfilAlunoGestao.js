/* ── Inicializa ícones Lucide ── */
lucide.createIcons();

/* ──────────────────────────────────────────────────────────
   GAUGE CIRCULAR — Arco tracejado com cobertura proporcional
────────────────────────────────────────────────────────── */
function initGauge(pct) {
  const r = 48;
  const C = 2 * Math.PI * r;
  const visLen = C * pct;
  const D = 10;
  const G = 4;
  const U = D + G;

  const parts = [];
  let drawn = 0;

  while (drawn + U <= visLen) {
    parts.push(D, G);
    drawn += U;
  }

  const remainder = visLen - drawn;
  if (remainder > 0) {
    parts.push(parseFloat(remainder.toFixed(2)));
    drawn += remainder;
  }

  const hiddenLen = C - visLen;
  parts.push(parseFloat(hiddenLen.toFixed(2)));

  const arc = document.getElementById('gaugeArc');
  if (arc) arc.setAttribute('stroke-dasharray', parts.join(' '));
}

/* ──────────────────────────────────────────────────────────
   Mapeamentos (espelham os ENUMs do backend)
────────────────────────────────────────────────────────── */
const STATUS_LABEL = {
  Conectado: 'Conectado',
  Capacitado: 'Capacitado',
  Transformado: 'Transformado',
  Conectado_Capacitado: 'Conectado + Capacitado',
  Capacitado_Transformado: 'Capacitado + Transformado',
  Conectado_Capacitado_Transformado: 'Conectado + Capacitado + Transformado',
};
const STATUS_BADGE = {
  Conectado: 'badge-info',
  Capacitado: 'badge-warning',
  Transformado: 'badge-success',
  Conectado_Capacitado: 'badge-warning',
  Capacitado_Transformado: 'badge-success',
  Conectado_Capacitado_Transformado: 'badge-success',
};
const EMP_LABEL = {
  Empregado: 'Empregado',
  Em_formacao: 'Em formação',
  Buscando: 'Buscando',
  Empreendedor: 'Empreendedor',
  Inativo: 'Inativo',
};
const EMP_BADGE = {
  Empregado: 'badge-success',
  Em_formacao: 'badge-info',
  Buscando: 'badge-warning',
  Empreendedor: 'badge-brand',
  Inativo: 'badge-neutral',
};
const MATRICULA_STATUS_LABEL = { Ativo: 'Ativo', Concluido: 'Concluído', Evadido: 'Evadido', Trancado: 'Trancado' };
const ENSINO_STATUS_LABEL = { Cursando: 'Cursando', Concluido: 'Concluído', Trancado: 'Trancado', Evadido: 'Evadido' };
const NOTA_BADGE = { Alerta: 'note-badge--alerta', Conquista: 'note-badge--conquista', Geral: 'note-badge--geral' };
const NOTA_ITEM = { Alerta: 'note-item--alerta', Conquista: 'note-item--conquista', Geral: 'note-item--geral' };

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

function calcIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  if (hoje.getMonth() < nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} · ${hora}`;
}

/* ──────────────────────────────────────────────────────────
   Render
────────────────────────────────────────────────────────── */
function renderHero(jovem, matriculaAtiva, programa) {
  document.getElementById('breadcrumbNome').textContent = jovem.nome;
  window.avatar.render(document.getElementById('heroAvatar'), jovem.foto_url, jovem.nome);
  document.getElementById('heroName').textContent = jovem.nome;
  document.title = `Pulsar — ${jovem.nome}`;

  const badges = [];
  if (programa) badges.push(`<span class="badge badge-brand">${esc(programa.nome)}</span>`);
  if (jovem.status_jornada) {
    const cls = STATUS_BADGE[jovem.status_jornada] || 'badge-neutral';
    badges.push(`<span class="badge ${cls}">${esc(STATUS_LABEL[jovem.status_jornada] || jovem.status_jornada)}</span>`);
  }
  if (jovem.multiplicador) badges.push(`<span class="badge badge-warning">Multiplicador(a)</span>`);
  document.getElementById('heroBadges').innerHTML = badges.join('');

  const metaParts = [`CPF ${formatCpf(jovem.cpf)}`];
  const idade = calcIdade(jovem.data_nascimento);
  if (idade !== null) metaParts.push(`${idade} anos`);
  if (jovem.cidade) metaParts.push(`${jovem.cidade}${jovem.estado ? ' / ' + jovem.estado : ''}`);
  document.getElementById('heroMeta').innerHTML = metaParts.map(esc).join(' &nbsp;&middot;&nbsp; ');
}

function renderAlertaRisco(frequencia) {
  const alerta = document.getElementById('alertRisco');
  if (frequencia && frequencia.total_aulas && frequencia.percentual != null && frequencia.percentual < 75) {
    document.getElementById('alertRiscoText').innerHTML =
      `Frequência acumulada está em <strong>${frequencia.percentual}%</strong> — abaixo do limite recomendado de 75%. Recomendamos contato e acompanhamento imediato.`;
    alerta.style.display = '';
  } else {
    alerta.style.display = 'none';
  }
}

function freqCor(pct) {
  if (pct == null) return '#DC2626';
  if (pct >= 75)   return '#16A34A';
  if (pct >= 60)   return '#EAB308';
  return '#DC2626';
}

function freqStatus(pct, total) {
  if (!total) return '—';
  if (pct >= 75) return 'Acima do limite recomendado';
  if (pct >= 60) return 'Em atenção';
  return 'Abaixo do limite recomendado';
}

function renderFrequencia(frequencia, temMatricula) {
  const semMatEl = document.getElementById('freqSemMatricula');
  const bodyEl   = document.getElementById('freqBody');

  if (!temMatricula) {
    if (semMatEl) semMatEl.hidden = false;
    if (bodyEl)   bodyEl.hidden   = true;
    return;
  }

  if (semMatEl) semMatEl.hidden = true;
  if (bodyEl)   bodyEl.hidden   = false;

  const pct   = frequencia?.percentual ?? null;
  const total = frequencia?.total_aulas ?? 0;

  initGauge((pct ?? 0) / 100);

  const arc = document.getElementById('gaugeArc');
  if (arc) arc.setAttribute('stroke', freqCor(total ? pct : null));

  document.getElementById('freqPct').textContent = pct != null ? `${pct}%` : '—';
  document.getElementById('freqSub').textContent = total
    ? `${frequencia.presencas} de ${total} aula${total === 1 ? '' : 's'}`
    : 'Sem registros de frequência';
  document.getElementById('freqMain').textContent = freqStatus(pct, total);
  document.getElementById('freqDetail').innerHTML = total
    ? `Mínimo do programa: <strong>75%</strong>`
    : '';
  document.getElementById('freqBadgeRisco').style.display = (total && pct < 75) ? '' : 'none';
}

function renderNotas(notas) {
  const list = document.getElementById('notesList');
  if (!notas.length) {
    list.innerHTML = `<p style="color:var(--color-text-secondary);">Nenhuma anotação registrada.</p>`;
    return;
  }
  list.innerHTML = notas.map(n => `
    <div class="note-item ${NOTA_ITEM[n.tipo_alerta] || 'note-item--geral'}">
      <div class="note-item__header">
        <span class="note-badge ${NOTA_BADGE[n.tipo_alerta] || 'note-badge--geral'}">${esc(n.tipo_alerta || 'Geral')}</span>
        <span class="note-item__date">${esc(formatDateTime(n.criado_em))}</span>
        <button type="button" class="note-item__edit" title="Editar anotação" aria-label="Editar anotação" data-id="${n.id}">
          <i data-lucide="pencil"></i>
        </button>
        <button type="button" class="note-item__delete" title="Excluir anotação" aria-label="Excluir anotação" data-id="${n.id}">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
      <p class="note-item__text">${esc(n.texto)}</p>
    </div>`).join('');

  list.querySelectorAll('.note-item__edit').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = `anotacoes.html?id=${jovemIdAtual}&anotacao_id=${btn.dataset.id}`;
    });
  });

  list.querySelectorAll('.note-item__delete').forEach(btn => {
    btn.addEventListener('click', () => abrirModalExcluirAnotacao(btn.dataset.id));
  });
  lucide.createIcons();
}

/* ──────────────────────────────────────────────────────────
   EXCLUSÃO DE ANOTAÇÃO
────────────────────────────────────────────────────────── */
let anotacaoIdParaExcluir = null;

function abrirModalExcluirAnotacao(id) {
  anotacaoIdParaExcluir = id;
  document.getElementById('excluirAnotacaoBackdrop').hidden = false;
  lucide.createIcons();
}

function fecharModalExcluirAnotacao() {
  anotacaoIdParaExcluir = null;
  document.getElementById('excluirAnotacaoBackdrop').hidden = true;
}

function inicializarExclusaoAnotacao() {
  const backdrop   = document.getElementById('excluirAnotacaoBackdrop');
  const btnConfirm = document.getElementById('btnConfirmarExcluirAnotacao');
  if (!backdrop || !btnConfirm) return;

  document.getElementById('btnFecharExcluirAnotacao')?.addEventListener('click', fecharModalExcluirAnotacao);
  document.getElementById('btnCancelarExcluirAnotacao')?.addEventListener('click', fecharModalExcluirAnotacao);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) fecharModalExcluirAnotacao(); });

  btnConfirm.addEventListener('click', async () => {
    if (!anotacaoIdParaExcluir) return;
    const id = anotacaoIdParaExcluir;
    const original = btnConfirm.innerHTML;
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Excluindo...';
    try {
      await window.api.delete(`/anotacoes/${id}`, { auth: true });
      fecharModalExcluirAnotacao();
      const notas = await window.api.get('/anotacoes', { params: { jovem_id: jovemIdAtual }, auth: true }).catch(() => []);
      renderNotas(Array.isArray(notas) ? notas : []);
      showToast('Anotação excluída com sucesso.', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao excluir anotação.';
      showToast(msg, 'error');
    } finally {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = original;
      lucide.createIcons();
    }
  });
}

function renderEmpregabilidade(jovem) {
  const badge = document.getElementById('empBadge');
  const status = jovem.status_empregabilidade;
  badge.className = `badge ${EMP_BADGE[status] || 'badge-neutral'}`;
  badge.textContent = `● ${EMP_LABEL[status] || '—'}`;
}

function renderEnsinoSuperior(ensinoSuperior) {
  const container = document.getElementById('ensinoFields');
  if (!ensinoSuperior || !ensinoSuperior.length) {
    container.innerHTML = `<div class="info-field"><span class="info-field__value info-field__value--empty">Sem registro de ensino superior.</span></div>`;
    return;
  }

  container.innerHTML = ensinoSuperior.map(es => `
    <div class="info-field">
      <span class="info-field__label">Situação</span>
      <span class="info-field__value">${esc(ENSINO_STATUS_LABEL[es.status] || es.status || '—')}</span>
    </div>
    <div class="info-field">
      <span class="info-field__label">Curso</span>
      <span class="info-field__value">${esc(es.cursos || '—')}</span>
    </div>
    <div class="info-field">
      <span class="info-field__label">Instituição</span>
      <span class="info-field__value">${esc(es.instituicao || '—')}</span>
    </div>
    <div class="info-field">
      <span class="info-field__label">Semestre atual</span>
      <span class="info-field__value">${es.semestre_atual ?? '—'}</span>
    </div>
    <div class="info-field">
      <span class="info-field__label">Bolsa</span>
      <span class="info-field__value${es.modalidade_bolsa ? '' : ' info-field__value--empty'}">${esc(es.modalidade_bolsa || '—')}</span>
    </div>
  `).join('<hr style="border:none;border-top:1px solid var(--color-border);margin:0.5rem 0;">');
}

function renderContato(jovem) {
  document.getElementById('contatoTelefone').textContent = jovem.telefone ? maskPhone(jovem.telefone) : '—';
  const emailEl = document.getElementById('contatoEmail');
  if (jovem.email) {
    emailEl.innerHTML = `<a href="mailto:${esc(jovem.email)}">${esc(jovem.email)}</a>`;
  } else {
    emailEl.textContent = '—';
  }
}

function renderCompetencias(competencias, certificados) {
  const container = document.getElementById('competenciasFields');
  const items = [];

  items.push(`
    <div class="info-field">
      <span class="info-field__label">Competências registradas</span>
      <span class="info-field__value">${competencias.length}</span>
    </div>`);
  items.push(`
    <div class="info-field">
      <span class="info-field__label">Certificados</span>
      <span class="info-field__value">${certificados.length}</span>
    </div>`);

  if (competencias.length) {
    items.push(`
    <div class="info-field">
      <span class="info-field__label">Principais competências</span>
      <span class="info-field__value">${esc(competencias.slice(0, 5).map(c => c.nome).join(', '))}</span>
    </div>`);
  }

  container.innerHTML = items.join('');
}

/* ──────────────────────────────────────────────────────────
   TOAST
────────────────────────────────────────────────────────── */
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#DC2626' : type === 'info' ? '#3B82F6' : '#16A34A'};
    color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,.15); max-width: 320px; word-break: break-word;
    animation: slideInToast .2s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ──────────────────────────────────────────────────────────
   EDIÇÃO INLINE — CONTATO
────────────────────────────────────────────────────────── */
function maskPhone(v) {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length > 6)  return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  if (d.length > 2)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return d;
}
function validPhone(v) {
  const d = String(v ?? '').replace(/\D/g, '');
  return !d || (d.length >= 10 && d.length <= 11);
}

function inicializarEdicaoContato() {
  const btnEditar   = document.getElementById('btnEditarContato');
  const btnCancelar = document.getElementById('btnCancelarContato');
  const display     = document.getElementById('contatoDisplay');
  const form        = document.getElementById('formContato');
  const inputTel    = document.getElementById('editTelefone');

  inputTel?.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });

  function abrirForm() {
    document.getElementById('editTelefone').value = maskPhone(jovemCache?.telefone || '');
    document.getElementById('editEmail').value    = jovemCache?.email    || '';
    display.hidden = true;
    form.hidden    = false;
  }

  function fecharForm() {
    display.hidden = false;
    form.hidden    = true;
  }

  btnEditar?.addEventListener('click', abrirForm);
  btnCancelar?.addEventListener('click', fecharForm);

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const telRaw = document.getElementById('editTelefone').value.trim();
    if (!validPhone(telRaw)) {
      showToast('Telefone deve ter 10 ou 11 dígitos (DDD + número).', 'error');
      return;
    }

    const btn = document.getElementById('btnSalvarContato');
    btn.disabled    = true;
    btn.textContent = 'Salvando...';

    const telefone = telRaw.replace(/\D/g, '') || null;
    const email    = document.getElementById('editEmail').value.trim() || null;

    try {
      const atualizado = await window.api.put(`/jovens/${jovemIdAtual}`, {
        body: { telefone, email }, auth: true,
      });
      jovemCache = { ...jovemCache, ...atualizado };
      renderContato(jovemCache);
      fecharForm();
      showToast('Contato atualizado com sucesso!');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao salvar. Tente novamente.';
      showToast(msg, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Salvar';
    }
  });
}

/* ──────────────────────────────────────────────────────────
   EDIÇÃO INLINE — EMPREGABILIDADE
────────────────────────────────────────────────────────── */
function inicializarEdicaoEmprego() {
  const btnEditar   = document.getElementById('btnEditarEmprego');
  const btnCancelar = document.getElementById('btnCancelarEmprego');
  const display     = document.getElementById('empregoDisplay');
  const form        = document.getElementById('formEmprego');

  function abrirForm() {
    document.getElementById('editEmpStatus').value = jovemCache?.status_empregabilidade || '';
    display.hidden = true;
    form.hidden    = false;
  }

  function fecharForm() {
    display.hidden = false;
    form.hidden    = true;
  }

  btnEditar?.addEventListener('click', abrirForm);
  btnCancelar?.addEventListener('click', fecharForm);

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarEmprego');
    btn.disabled    = true;
    btn.textContent = 'Salvando...';

    const status_empregabilidade = document.getElementById('editEmpStatus').value || null;

    try {
      const atualizado = await window.api.put(`/jovens/${jovemIdAtual}`, {
        body: { status_empregabilidade }, auth: true,
      });
      jovemCache = { ...jovemCache, ...atualizado };
      renderEmpregabilidade(jovemCache);
      fecharForm();
      showToast('Empregabilidade atualizada com sucesso!');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao salvar. Tente novamente.';
      showToast(msg, 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Salvar';
    }
  });
}

/* ──────────────────────────────────────────────────────────
   MODAL MATRÍCULA
────────────────────────────────────────────────────────── */
let jovemIdAtual = null;
let programasAtivos = [];
let jovemCache = null;

function abrirModalMatricula() {
  const select = document.getElementById('matPrograma');
  select.innerHTML = '<option value="">Selecione um programa</option>';
  programasAtivos.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
  document.getElementById('matTurma').value = '';
  document.getElementById('matError').hidden = true;
  document.getElementById('matBackdrop').hidden = false;
  lucide.createIcons();
}

function fecharModalMatricula() {
  document.getElementById('matBackdrop').hidden = true;
}

function inicializarModalMatricula() {
  document.getElementById('btnAdicionarPrograma')?.addEventListener('click', abrirModalMatricula);
  document.getElementById('btnFecharMatModal')?.addEventListener('click', fecharModalMatricula);
  document.getElementById('btnCancelarMat')?.addEventListener('click', fecharModalMatricula);

  document.getElementById('matBackdrop')?.addEventListener('click', e => {
    if (e.target === document.getElementById('matBackdrop')) fecharModalMatricula();
  });

  document.getElementById('formMatricula')?.addEventListener('submit', async e => {
    e.preventDefault();
    const programaId = document.getElementById('matPrograma').value;
    const turma      = document.getElementById('matTurma').value;
    const errorEl    = document.getElementById('matError');

    if (!programaId) {
      errorEl.textContent = 'Selecione um programa.';
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;

    const btn = document.getElementById('btnConfirmarMat');
    btn.disabled = true;
    btn.textContent = 'Matriculando...';

    try {
      const body = { jovem_id: Number(jovemIdAtual), programa_id: Number(programaId) };
      if (turma) body.turma = turma;
      await window.api.post('/matriculas', { body, auth: true });
      fecharModalMatricula();
      showToast('Jovem matriculado com sucesso!');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao matricular. Tente novamente.';
      errorEl.textContent = msg;
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check"></i> Matricular';
      lucide.createIcons();
    }
  });
}

/* ──────────────────────────────────────────────────────────
   MENU DE 3 PONTOS — EDITAR / EXCLUIR
────────────────────────────────────────────────────────── */
function inicializarMenuHero() {
  const menu     = document.getElementById('heroMenu');
  const botao    = document.getElementById('btnHeroMenu');
  const dropdown = document.getElementById('heroMenuDropdown');
  if (!menu || !botao || !dropdown) return;

  function fechar() {
    dropdown.hidden = true;
    botao.setAttribute('aria-expanded', 'false');
  }
  function alternar() {
    const abrir = dropdown.hidden;
    dropdown.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
  }

  botao.addEventListener('click', e => { e.stopPropagation(); alternar(); });
  document.addEventListener('click', e => { if (!menu.contains(e.target)) fechar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });

  document.getElementById('btnEditarJovem')?.addEventListener('click', () => {
    window.location.href = `cadastroJovem.html?id=${jovemIdAtual}`;
  });

  /* ── Exclusão (soft-delete via PATCH /jovens/:id/arquivar) ── */
  const backdrop   = document.getElementById('excluirBackdrop');
  const btnConfirm = document.getElementById('btnConfirmarExcluir');

  function abrirModalExcluir() {
    fechar();
    document.getElementById('excluirNome').textContent = jovemCache?.nome || 'este jovem';
    backdrop.hidden = false;
  }
  function fecharModalExcluir() { backdrop.hidden = true; }

  document.getElementById('btnExcluirJovem')?.addEventListener('click', abrirModalExcluir);
  document.getElementById('btnFecharExcluir')?.addEventListener('click', fecharModalExcluir);
  document.getElementById('btnCancelarExcluir')?.addEventListener('click', fecharModalExcluir);
  backdrop?.addEventListener('click', e => { if (e.target === backdrop) fecharModalExcluir(); });

  btnConfirm?.addEventListener('click', async () => {
    const original = btnConfirm.innerHTML;
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Excluindo...';
    try {
      await window.api.patch(`/jovens/${jovemIdAtual}/arquivar`, { auth: true });
      window.api.invalidateCache?.('/jovens');
      showToast('Jovem excluído com sucesso.', 'success');
      setTimeout(() => { window.location.href = 'telaJovens.html'; }, 800);
    } catch (e) {
      showToast(e?.data?.error || 'Erro ao excluir jovem.', 'error');
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = original;
    }
  });
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
async function init() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    document.getElementById('heroName').textContent = 'Jovem não informado';
    return;
  }
  jovemIdAtual = id;

  inicializarModalMatricula();
  inicializarEdicaoContato();
  inicializarEdicaoEmprego();
  inicializarMenuHero();
  inicializarExclusaoAnotacao();

  window.setPageLoading?.(true);
  try {
    const [ficha, notas, programas] = await Promise.all([
      window.api.get(`/jovens/${id}/ficha`, { auth: true }),
      window.api.get('/anotacoes', { params: { jovem_id: id }, auth: true }).catch(() => []),
      window.api.get('/programas', { params: { ativo: true }, auth: true }).catch(() => []),
    ]);

    programasAtivos = Array.isArray(programas) ? programas : [];

    const programasMap = {};
    programasAtivos.forEach(p => { programasMap[p.id] = p; });

    const matriculaAtiva = ficha.matriculas?.find(m => m.status === 'Ativo');
    const programaAtivo = matriculaAtiva ? programasMap[matriculaAtiva.programa_id] : null;

    jovemCache = ficha.jovem;

    renderHero(ficha.jovem, matriculaAtiva, programaAtivo);
    renderAlertaRisco(ficha.frequencia);
    renderFrequencia(ficha.frequencia, !!matriculaAtiva);
    renderNotas(Array.isArray(notas) ? notas : []);
    renderEmpregabilidade(ficha.jovem);
    renderEnsinoSuperior(ficha.ensino_superior);
    renderContato(ficha.jovem);
    renderCompetencias(ficha.competencias || [], ficha.certificados || []);

    lucide.createIcons();
  } catch (e) {
    document.getElementById('heroName').textContent = 'Erro ao carregar ficha do jovem';
  } finally {
    window.setPageLoading?.(false);
  }
}

init();
