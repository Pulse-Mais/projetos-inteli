/* registrarMentoriaMentor.js — Lista, filtros, paginação e registro de mentorias */

// ── State ────────────────────────────────────────────────────────────────────
let allMentorias = [];
let currentPage      = 1;
const PER_PAGE       = 10;

let filterStatus = '';
let filterAluno  = '';
let filterFrom   = '';
let filterTo     = '';

let allJovens = [];
let editingMentoriaId = null;
let editingJovemIds = new Set();
let editJovensFilter = '';

const TOPICOS_PADRAO = ['Carreira', 'Programação', 'Soft Skills', 'Empregabilidade', 'Projeto'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso, full = false) {
  if (!iso) return '—';
  const d  = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return full ? `${dd}/${mm}/${d.getUTCFullYear()}` : `${dd}/${mm}`;
}

function statusBadge(status) {
  const cls = { Realizada: 'badge-soft-success', Agendada: 'badge-soft-info', Cancelada: 'badge-soft-warning' };
  return `<span class="badge ${cls[status] || ''}">${status}</span>`;
}

function nomeJovem(j) {
  return (j.nome ?? j.jovem_nome ?? '').trim();
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : '';
}

function showListFeedback(message, type = 'success') {
  const el = document.getElementById('mentoriasFeedback');
  if (!el) return;
  el.hidden = false;
  el.className = `form-feedback mentorias-feedback is-${type}`;
  el.textContent = message;
  if (type === 'success') setTimeout(() => { el.hidden = true; }, 3500);
}

// ── Filters ──────────────────────────────────────────────────────────────────
function getFiltered() {
  return allMentorias.filter(m => {
    if (filterStatus && m.status_mentoria !== filterStatus) return false;
    if (filterAluno) {
      const q = filterAluno.toLowerCase();
      const match = (m.jovens || []).some(j => nomeJovem(j).toLowerCase().includes(q));
      if (!match) return false;
    }
    const dataStr = (m.data_mentoria ?? '').slice(0, 10);
    if (filterFrom && dataStr < filterFrom) return false;
    if (filterTo   && dataStr > filterTo)   return false;
    return true;
  });
}

// ── Render cards ─────────────────────────────────────────────────────────────
function renderMentoriasList(mentorias) {
  const container = document.getElementById('mentoriasList');
  if (!container) return;

  if (!mentorias.length) {
    const hasFilter = filterStatus || filterAluno || filterFrom || filterTo;
    container.innerHTML = `<p class="muted">${
      hasFilter ? 'Nenhuma mentoria encontrada para os filtros selecionados.' : 'Nenhuma mentoria registrada ainda.'
    }</p>`;
    return;
  }

  container.innerHTML = mentorias.map(m => {
    const jovensLinks = (m.jovens || []).filter(j => nomeJovem(j)).map(j => {
      const nome = nomeJovem(j);
      const jovemId = Number(j.jovem_id ?? j.id);
      return `<button type="button" class="mentee-name-link" data-action="perfil-aluno" data-jovem="${esc(nome)}" data-jovem-id="${jovemId}">${esc(nome)}</button>`;
    }).join(', ') || '—';
    const temas = Array.isArray(m.temas) && m.temas.length ? m.temas.join(' · ') : '—';
    return `
      <article class="mentoria-card" data-mentoria-id="${m.id}">
        <div class="mentoria-card-header">
          <div class="mentoria-card-meta">
            <time class="mentoria-card-date">${formatDate(m.data_mentoria, true)}</time>
            ${statusBadge(m.status_mentoria)}
          </div>
          <span class="mentoria-card-duration">
            <i data-lucide="clock" style="width:14px;height:14px"></i>
            ${m.duracao_minutos ?? '—'} min
          </span>
          <div class="mentoria-card-actions">
            <button class="icon-action-btn" type="button" data-action="edit" data-id="${m.id}" aria-label="Editar mentoria" title="Editar mentoria">
              <i data-lucide="pencil" style="width:15px;height:15px"></i>
            </button>
            <button class="icon-action-btn is-danger" type="button" data-action="delete" data-id="${m.id}" aria-label="Excluir mentoria" title="Excluir mentoria">
              <i data-lucide="trash-2" style="width:15px;height:15px"></i>
            </button>
          </div>
        </div>
        <div class="mentoria-card-body">
          <p class="mentoria-card-mentees">
            <i data-lucide="user" style="width:14px;height:14px;flex-shrink:0"></i>
            ${jovensLinks}
          </p>
          <p class="mentoria-card-topics">
            <i data-lucide="tag" style="width:14px;height:14px;flex-shrink:0"></i>
            ${esc(temas)}
          </p>
        </div>
        ${m.observacao_mentoria
          ? `<p class="mentoria-card-obs">${esc(m.observacao_mentoria)}</p>`
          : ''}
      </article>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ── Render pagination ─────────────────────────────────────────────────────────
function renderPagination(total, totalPages) {
  const countEl = document.getElementById('mentoriasCount');
  const container = document.getElementById('mentoriasPagination');

  if (countEl) {
    const start = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
    const end   = Math.min(currentPage * PER_PAGE, total);
    countEl.textContent = total === 0
      ? ''
      : `Exibindo ${start}–${end} de ${total} mentorias`;
  }

  if (!container) return;

  if (totalPages <= 1) { container.hidden = true; return; }
  container.hidden = false;

  // Build page list with ellipsis (Google-style)
  const WING = 2;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - WING && i <= currentPage + WING)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  container.innerHTML = `
    <button class="page-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
      <i data-lucide="chevron-left" style="width:16px;height:16px"></i>
    </button>
    ${pages.map(p => p === '…'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === currentPage ? 'is-active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">
      <i data-lucide="chevron-right" style="width:16px;height:16px"></i>
    </button>`;

  if (window.lucide) lucide.createIcons();

  container.querySelector('#prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderPage(); scrollToList(); }
  });
  container.querySelector('#nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; renderPage(); scrollToList(); }
  });
  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = Number(btn.dataset.page);
      renderPage();
      scrollToList();
    });
  });
}

function scrollToList() {
  document.getElementById('mentoriasFilters')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getMentoriaById(id) {
  return allMentorias.find(m => Number(m.id) === Number(id));
}

function ensureMentoriaDialogs() {
  if (document.getElementById('editMentoriaModal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="mentoria-modal-backdrop" id="editMentoriaModal" hidden aria-modal="true" role="dialog" aria-labelledby="editMentoriaTitle">
      <div class="mentoria-modal">
        <div class="mentoria-modal-header">
          <div>
            <h2 class="mentoria-modal-title" id="editMentoriaTitle">Editar mentoria</h2>
            <p class="mentoria-modal-subtitle">Atualize os dados do registro selecionado.</p>
          </div>
          <button class="modal-icon-btn" type="button" id="closeEditMentoriaBtn" aria-label="Fechar">
            <i data-lucide="x" style="width:18px;height:18px"></i>
          </button>
        </div>

        <form class="mentoria-edit-form" id="editMentoriaForm">
          <span class="form-label">Mentorados</span>
          <div class="mentee-selector" id="editMenteeSelector" role="button" tabindex="0">
            <i data-lucide="users" style="width:20px;height:20px;flex-shrink:0"></i>
            <div class="selected-mentees" id="editSelectedMentees"></div>
            <i data-lucide="chevron-down" class="mentee-chevron" style="width:16px;height:16px;flex-shrink:0"></i>
          </div>
          <div class="jovens-dropdown" id="editJovensDropdown" hidden>
            <div class="jovens-search">
              <i data-lucide="search" style="width:16px;height:16px;flex-shrink:0"></i>
              <input type="text" id="editJovensSearch" placeholder="Buscar mentorado pelo nome…" autocomplete="off" />
            </div>
            <div class="jovens-list" id="editJovensList"></div>
          </div>

          <div class="form-grid">
            <label class="form-field">
              <span>Status</span>
              <select id="editSessionStatus" required>
                <option value="Agendada">Agendada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </label>

            <label class="form-field">
              <span>Data da sessão</span>
              <div class="input-with-icon">
                <i data-lucide="calendar-days" style="width:20px;height:20px"></i>
                <input id="editSessionDate" type="date" required />
              </div>
            </label>

            <label class="form-field">
              <span>Duração (min)</span>
              <div class="input-with-icon">
                <i data-lucide="clock" style="width:20px;height:20px"></i>
                <input id="editSessionDuration" type="number" min="15" step="15" required />
              </div>
            </label>
          </div>

          <fieldset class="topics-fieldset">
            <legend>Temas abordados</legend>
            <div class="topic-list" id="editTopicList"></div>
            <div class="topic-add">
              <input type="text" id="editNewTopicInput" class="topic-add__input"
                placeholder="Adicionar outro tema…" autocomplete="off" maxlength="40" />
              <button type="button" class="btn btn-secondary topic-add__btn" id="editAddTopicBtn">
                <i data-lucide="plus" style="width:16px;height:16px"></i>
                Adicionar tema
              </button>
            </div>
          </fieldset>

          <label class="form-field observations-field">
            <span>Observações</span>
            <textarea id="editSessionNotes" placeholder="Descreva o que foi abordado na sessão..."></textarea>
          </label>

          <div class="form-feedback is-error" id="editMentoriaFeedback" hidden></div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" id="cancelEditMentoriaBtn">Cancelar</button>
            <button class="btn btn-primary" type="submit" id="saveEditMentoriaBtn">
              <i data-lucide="save" style="width:17px;height:17px"></i>
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="mentoria-modal-backdrop" id="deleteMentoriaModal" hidden aria-modal="true" role="dialog" aria-labelledby="deleteMentoriaTitle">
      <div class="mentoria-confirm-modal">
        <div class="confirm-icon is-danger">
          <i data-lucide="trash-2" style="width:24px;height:24px"></i>
        </div>
        <h2 class="mentoria-modal-title" id="deleteMentoriaTitle">Excluir mentoria</h2>
        <p class="mentoria-modal-subtitle" id="deleteMentoriaText">Esta ação não pode ser desfeita.</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" type="button" id="cancelDeleteMentoriaBtn">Cancelar</button>
          <button class="btn btn-danger" type="button" id="confirmDeleteMentoriaBtn">Excluir mentoria</button>
        </div>
      </div>
    </div>
  `);

  document.getElementById('closeEditMentoriaBtn')?.addEventListener('click', closeEditModal);
  document.getElementById('cancelEditMentoriaBtn')?.addEventListener('click', closeEditModal);
  document.getElementById('cancelDeleteMentoriaBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('editMentoriaModal')?.addEventListener('click', e => {
    if (e.target.id === 'editMentoriaModal') closeEditModal();
  });
  document.getElementById('deleteMentoriaModal')?.addEventListener('click', e => {
    if (e.target.id === 'deleteMentoriaModal') closeDeleteModal();
  });

  setupEditMenteeSelector();
  setupEditTopicAdd();
  setupEditForm();
  setupDeleteConfirm();

  if (window.lucide) lucide.createIcons();
}

function renderEditMentees() {
  const container = document.getElementById('editSelectedMentees');
  if (!container) return;

  const selected = allJovens.filter(j => editingJovemIds.has(Number(j.id)));
  if (!selected.length) {
    container.innerHTML = '<span class="muted">Selecionar mentorados...</span>';
    return;
  }

  container.innerHTML = selected.map(j => `
    <span class="mentee-chip" data-id="${j.id}">
      ${esc(j.nome)}
      <button type="button" class="remove-mentee" data-id="${j.id}" title="Remover">
        <i data-lucide="x" style="width:12px;height:12px"></i>
      </button>
    </span>`).join('');

  container.querySelectorAll('.remove-mentee').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      editingJovemIds.delete(Number(btn.dataset.id));
      renderEditJovensDropdown();
      renderEditMentees();
    });
  });

  if (window.lucide) lucide.createIcons();
}

function renderEditJovensDropdown() {
  const list = document.getElementById('editJovensList');
  if (!list) return;

  if (!allJovens.length) {
    list.innerHTML = '<p class="muted" style="padding:var(--space-3)">Nenhum jovem disponível.</p>';
    return;
  }

  const termo = editJovensFilter.trim().toLowerCase();
  if (!termo) {
    list.innerHTML = '<p class="muted" style="padding:var(--space-3)">Digite para buscar um mentorado.</p>';
    return;
  }
  const filtrados = allJovens.filter(j => (j.nome ?? '').toLowerCase().includes(termo));

  if (!filtrados.length) {
    list.innerHTML = '<p class="muted" style="padding:var(--space-3)">Nenhum mentorado encontrado.</p>';
    return;
  }

  list.innerHTML = filtrados.map(j => `
    <button type="button" class="jovem-chip ${editingJovemIds.has(Number(j.id)) ? 'selected' : ''}" data-id="${j.id}">
      ${esc(j.nome)}
    </button>`).join('');
}

function setupEditMenteeSelector() {
  const selector = document.getElementById('editMenteeSelector');
  const dropdown = document.getElementById('editJovensDropdown');
  const search   = document.getElementById('editJovensSearch');
  if (!selector || !dropdown) return;

  const setDropdown = (open) => {
    dropdown.hidden = !open;
    selector.classList.toggle('is-open', open);
    if (open) search?.focus();
  };

  // Clicar no seletor (incluindo a seta) abre/fecha o dropdown
  selector.addEventListener('click', () => setDropdown(dropdown.hidden));

  // Busca incremental: filtra a lista conforme o usuário digita
  search?.addEventListener('input', e => {
    editJovensFilter = e.target.value;
    renderEditJovensDropdown();
  });
  search?.addEventListener('click', e => e.stopPropagation());

  dropdown.addEventListener('click', e => {
    const chip = e.target.closest('.jovem-chip');
    if (!chip) return;

    const id = Number(chip.dataset.id);
    if (editingJovemIds.has(id)) editingJovemIds.delete(id);
    else editingJovemIds.add(id);

    renderEditJovensDropdown();
    renderEditMentees();
  });

  document.addEventListener('click', e => {
    if (!selector.contains(e.target) && !dropdown.contains(e.target)) {
      setDropdown(false);
    }
  });
}

function renderEditTopics(selectedTopics = []) {
  const container = document.getElementById('editTopicList');
  if (!container) return;

  const topicSet = new Set([...TOPICOS_PADRAO, ...selectedTopics.filter(Boolean)]);
  container.innerHTML = [...topicSet].map(topic => `
    <button type="button" class="topic-chip ${selectedTopics.includes(topic) ? 'selected' : ''}" data-topic="${esc(topic)}">
      ${esc(topic)}
    </button>`).join('');

  container.querySelectorAll('.topic-chip').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('selected'));
  });
}

function setupEditTopicAdd() {
  const input = document.getElementById('editNewTopicInput');
  const btn   = document.getElementById('editAddTopicBtn');
  const list  = document.getElementById('editTopicList');
  if (!input || !btn || !list) return;

  function addTopic() {
    const nome = input.value.trim();
    if (!nome) return;

    // Evita duplicar um tema já existente (ignora maiúsc./minúsc.)
    const existente = [...list.querySelectorAll('.topic-chip')]
      .find(c => (c.dataset.topic ?? '').toLowerCase() === nome.toLowerCase());
    if (existente) {
      existente.classList.add('selected');
    } else {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'topic-chip selected';
      chip.dataset.topic = nome;
      chip.textContent = nome;
      chip.addEventListener('click', () => chip.classList.toggle('selected'));
      list.appendChild(chip);
    }

    input.value = '';
    input.focus();
  }

  btn.addEventListener('click', addTopic);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addTopic(); }
  });
}

async function ensureJovensLoaded() {
  if (allJovens.length) return;

  try {
    const data = await window.api.get('/jovens?ativo=true', { auth: true });
    allJovens = Array.isArray(data) ? data : (data.jovens ?? []);
  } catch {
    const dash = await window.api.get('/dashboard/mentor', { auth: true });
    allJovens = dash.meus_jovens ?? [];
  }
}

async function openEditModal(id) {
  ensureMentoriaDialogs();
  const mentoria = getMentoriaById(id);
  if (!mentoria) return;

  try {
    await ensureJovensLoaded();
  } catch {
    showListFeedback('Erro ao carregar jovens para edição.', 'error');
    return;
  }

  (mentoria.jovens || []).forEach(j => {
    const jovemId = Number(j.jovem_id ?? j.id);
    const nome = nomeJovem(j);
    if (jovemId && nome && !allJovens.some(item => Number(item.id) === jovemId)) {
      allJovens.push({ id: jovemId, nome });
    }
  });

  editingMentoriaId = Number(id);
  editingJovemIds = new Set((mentoria.jovens || []).map(j => Number(j.jovem_id ?? j.id)).filter(Boolean));

  document.getElementById('editSessionStatus').value = mentoria.status_mentoria ?? 'Realizada';
  document.getElementById('editSessionDate').value = toDateInputValue(mentoria.data_mentoria);
  document.getElementById('editSessionDuration').value = mentoria.duracao_minutos ?? '';
  document.getElementById('editSessionNotes').value = mentoria.observacao_mentoria ?? '';
  document.getElementById('editMentoriaFeedback').hidden = true;

  // Reseta a busca a cada abertura do modal
  editJovensFilter = '';
  const editSearch = document.getElementById('editJovensSearch');
  if (editSearch) editSearch.value = '';

  // Limpa o campo de novo tema
  const editNewTopic = document.getElementById('editNewTopicInput');
  if (editNewTopic) editNewTopic.value = '';

  renderEditMentees();
  renderEditJovensDropdown();
  renderEditTopics(Array.isArray(mentoria.temas) ? mentoria.temas : []);

  document.getElementById('editMentoriaModal').hidden = false;
  document.body.classList.add('modal-open');
  if (window.lucide) lucide.createIcons();
}

function closeEditModal() {
  document.getElementById('editMentoriaModal')?.setAttribute('hidden', '');
  document.body.classList.remove('modal-open');
  editingMentoriaId = null;
  editingJovemIds = new Set();
}

function setupEditForm() {
  document.getElementById('editMentoriaForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const feedback = document.getElementById('editMentoriaFeedback');
    const saveBtn = document.getElementById('saveEditMentoriaBtn');

    if (!editingJovemIds.size) {
      feedback.hidden = false;
      feedback.textContent = 'Selecione ao menos um mentorado.';
      return;
    }

    const body = {
      status_mentoria: document.getElementById('editSessionStatus').value,
      data_mentoria: document.getElementById('editSessionDate').value,
      duracao_minutos: Number(document.getElementById('editSessionDuration').value),
      jovem_ids: [...editingJovemIds],
      temas: [...document.querySelectorAll('#editTopicList .topic-chip.selected')].map(btn => btn.dataset.topic),
      observacao_mentoria: document.getElementById('editSessionNotes').value.trim() || null,
    };

    saveBtn.disabled = true;
    feedback.hidden = true;
    try {
      const updated = await window.api.put(`/mentorias/${editingMentoriaId}`, { body, auth: true });
      allMentorias = allMentorias.map(m => Number(m.id) === Number(updated.id) ? updated : m);
      closeEditModal();
      renderPage();
      showListFeedback('Mentoria atualizada com sucesso.', 'success');
    } catch (err) {
      feedback.hidden = false;
      feedback.textContent = err?.data?.message || err?.message || 'Erro ao atualizar mentoria.';
    } finally {
      saveBtn.disabled = false;
    }
  });
}

function openDeleteModal(id) {
  ensureMentoriaDialogs();
  const mentoria = getMentoriaById(id);
  if (!mentoria) return;

  editingMentoriaId = Number(id);
  const jovensNomes = (mentoria.jovens || []).map(nomeJovem).filter(Boolean).join(', ');
  document.getElementById('deleteMentoriaText').textContent =
    jovensNomes ? `Excluir a mentoria com ${jovensNomes}? Esta ação não pode ser desfeita.` : 'Esta ação não pode ser desfeita.';
  document.getElementById('deleteMentoriaModal').hidden = false;
  document.body.classList.add('modal-open');
  if (window.lucide) lucide.createIcons();
}

function closeDeleteModal() {
  document.getElementById('deleteMentoriaModal')?.setAttribute('hidden', '');
  document.body.classList.remove('modal-open');
  editingMentoriaId = null;
}

function setupDeleteConfirm() {
  document.getElementById('confirmDeleteMentoriaBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('confirmDeleteMentoriaBtn');
    btn.disabled = true;
    try {
      await window.api.delete(`/mentorias/${editingMentoriaId}`, { auth: true });
      allMentorias = allMentorias.filter(m => Number(m.id) !== Number(editingMentoriaId));
      closeDeleteModal();
      renderPage();
      showListFeedback('Mentoria excluída com sucesso.', 'success');
    } catch (err) {
      document.getElementById('deleteMentoriaText').textContent =
        err?.data?.message || err?.message || 'Erro ao excluir mentoria.';
      showListFeedback(err?.data?.message || err?.message || 'Erro ao excluir mentoria.', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

// ── Render page (filter + paginate + render) ──────────────────────────────────
function renderPage() {
  const filtered   = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start    = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  renderMentoriasList(pageItems);
  renderPagination(filtered.length, totalPages);
}

// ── Main ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  ensureMentoriaDialogs();

  // ── Filter tabs ──
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.status;
      currentPage  = 1;
      renderPage();
    });
  });

  // ── Filter: aluno search (debounced) ──
  let searchTimer;
  document.getElementById('filterAluno')?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filterAluno = e.target.value.trim();
      currentPage = 1;
      renderPage();
    }, 300);
  });

  // ── Filter: date range ──
  document.getElementById('filterFrom')?.addEventListener('change', e => {
    filterFrom  = e.target.value;
    currentPage = 1;
    renderPage();
  });
  document.getElementById('filterTo')?.addEventListener('change', e => {
    filterTo    = e.target.value;
    currentPage = 1;
    renderPage();
  });

  document.getElementById('mentoriasList')?.addEventListener('click', e => {
    const actionButton = e.target.closest('[data-action]');
    if (!actionButton) return;

    const id = actionButton.dataset.id;
    if (actionButton.dataset.action === 'edit') openEditModal(id);
    if (actionButton.dataset.action === 'delete') openDeleteModal(id);
    if (actionButton.dataset.action === 'perfil-aluno') {
      const jovem = actionButton.dataset.jovem;
      const jovemId = actionButton.dataset.jovemId;
      window.location.href = `perfilMentoradoMentor.html?jovem=${encodeURIComponent(jovem)}&jovem_id=${jovemId}`;
    }
  });

  const mentorId = window.currentUser?.id;

  // ── Load mentorias ──
  async function loadMentorias() {
    try {
      const data    = await window.api.get(`/mentorias?mentor_id=${mentorId}`, { auth: true });
      allMentorias  = Array.isArray(data) ? data : [];
      currentPage   = 1;
      renderPage();
    } catch {
      const container = document.getElementById('mentoriasList');
      if (container) container.innerHTML = '<p class="muted">Erro ao carregar mentorias.</p>';
    }
  }

  await loadMentorias();
});
