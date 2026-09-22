/* novaMetoriaMentor.js — Página dedicada de registro de nova mentoria */

let selectedJovemIds = new Set();
let allJovens        = [];
let jovensFilter     = '';

function showFeedback(msg, type) {
  const el = document.getElementById('formFeedback');
  if (!el) return;
  el.hidden = false;
  el.className = `form-feedback is-${type}`;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => { el.hidden = true; }, 4000);
}

function renderJovensDropdown() {
  const list = document.getElementById('jovensList');
  if (!list) return;
  if (!allJovens.length) {
    list.innerHTML = '<p class="muted" style="padding:var(--space-3)">Nenhum jovem disponível.</p>';
    return;
  }
  const termo = jovensFilter.trim().toLowerCase();
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
    <button type="button" class="jovem-chip ${selectedJovemIds.has(j.id) ? 'selected' : ''}"
      data-id="${j.id}" data-nome="${j.nome}">${j.nome}</button>`).join('');
}

function updateSelectedMentees() {
  const container = document.getElementById('selectedMentees');
  if (!container) return;
  const selected = allJovens.filter(j => selectedJovemIds.has(j.id));
  if (!selected.length) {
    container.innerHTML = '<span class="muted" id="menteeplaceholder">Selecionar mentorados…</span>';
    return;
  }
  container.innerHTML = selected.map(j => `
    <span class="mentee-chip" data-id="${j.id}">
      ${j.nome}
      <button type="button" class="remove-mentee" data-id="${j.id}" title="Remover">×</button>
    </span>`).join('');
  container.querySelectorAll('.remove-mentee').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedJovemIds.delete(Number(btn.dataset.id));
      renderJovensDropdown();
      updateSelectedMentees();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const params       = new URLSearchParams(window.location.search);
  const urlJovemId   = params.get('jovem_id') ? Number(params.get('jovem_id')) : null;
  const urlJovemNome = params.get('jovem') ?? '';

  // Data padrão: hoje
  const dateInput = document.getElementById('sessionDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

  // Voltar
  const back = () => { window.location.href = 'registrarMentoriaMentor.html'; };
  document.getElementById('backBtn')?.addEventListener('click', back);
  document.getElementById('cancelMentoringBtn')?.addEventListener('click', back);

  // Mentee selector ↔ dropdown
  const menteeSelector = document.getElementById('menteeSelector');
  const jovensDropdown = document.getElementById('jovensDropdown');
  const jovensSearch   = document.getElementById('jovensSearch');
  if (menteeSelector && jovensDropdown) {
    const setDropdown = (open) => {
      jovensDropdown.hidden = !open;
      menteeSelector.classList.toggle('is-open', open);
      if (open) jovensSearch?.focus();
    };

    // Clicar no seletor (incluindo a seta) abre/fecha o dropdown
    menteeSelector.addEventListener('click', () => setDropdown(jovensDropdown.hidden));

    // Busca incremental: filtra a lista conforme o usuário digita
    jovensSearch?.addEventListener('input', (e) => {
      jovensFilter = e.target.value;
      renderJovensDropdown();
    });
    // Evita que cliques/foco no campo de busca fechem o dropdown
    jovensSearch?.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', (e) => {
      if (!menteeSelector.contains(e.target) && !jovensDropdown.contains(e.target)) {
        setDropdown(false);
      }
    });
    jovensDropdown.addEventListener('click', (e) => {
      const chip = e.target.closest('.jovem-chip');
      if (!chip) return;
      const id = Number(chip.dataset.id);
      if (selectedJovemIds.has(id)) {
        selectedJovemIds.delete(id);
        chip.classList.remove('selected');
      } else {
        selectedJovemIds.add(id);
        chip.classList.add('selected');
      }
      updateSelectedMentees();
    });
  }

  // Adicionar tema personalizado
  const topicList     = document.getElementById('topicList');
  const newTopicInput = document.getElementById('newTopicInput');
  const addTopicBtn   = document.getElementById('addTopicBtn');

  function addTopic() {
    const nome = (newTopicInput?.value ?? '').trim();
    if (!nome) return;

    // Evita duplicar um tema já existente (ignora maiúsc./minúsc.)
    const existente = [...topicList.querySelectorAll('.topic-chip')]
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
      topicList.appendChild(chip);
    }

    newTopicInput.value = '';
    newTopicInput.focus();
  }

  addTopicBtn?.addEventListener('click', addTopic);
  newTopicInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTopic(); }
  });

  // Form submit
  const form      = document.getElementById('mentoringForm');
  const submitBtn = document.getElementById('submitBtn');
  const mentorId  = window.currentUser?.id;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedJovemIds.size) {
      showFeedback('Selecione ao menos um mentorado.', 'error');
      return;
    }
    const status = document.getElementById('sessionStatus').value;
    const data   = document.getElementById('sessionDate').value;

    // Uma mentoria "Agendada" não pode ter data no passado.
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    if (status === 'Agendada' && data && data < hojeStr) {
      showFeedback('Uma mentoria agendada não pode ter data no passado.', 'error');
      return;
    }

    const temas = [...document.querySelectorAll('.topic-chip.selected')].map(c => c.dataset.topic);
    if (!temas.length) {
      showFeedback('Selecione ao menos um tema abordado.', 'error');
      return;
    }

    const obs   = document.getElementById('sessionNotes')?.value.trim() ?? '';
    const body  = {
      mentor_id:       mentorId,
      status_mentoria: status,
      data_mentoria:   data,
      duracao_minutos: Number(document.getElementById('sessionDuration').value),
      jovem_ids:       [...selectedJovemIds],
      temas,
    };
    if (obs) body.observacao_mentoria = obs;

    if (submitBtn) submitBtn.disabled = true;
    try {
      await window.api.post('/mentorias', { body, auth: true });
      showFeedback('Mentoria registrada com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'registrarMentoriaMentor.html'; }, 1200);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erro ao registrar mentoria.';
      showFeedback(msg, 'error');
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Load jovens
  try {
    const data = await window.api.get('/jovens?ativo=true', { auth: true });
    allJovens  = Array.isArray(data) ? data : (data.jovens ?? []);
  } catch {
    try {
      const dash = await window.api.get('/dashboard/mentor', { auth: true });
      allJovens  = dash.meus_jovens ?? [];
    } catch {
      allJovens  = [];
    }
  }

  // Pre-select jovem from URL
  if (urlJovemId) {
    selectedJovemIds.add(urlJovemId);
    if (!allJovens.find(j => j.id === urlJovemId)) {
      allJovens.unshift({ id: urlJovemId, nome: urlJovemNome || `Jovem #${urlJovemId}` });
    }
  }

  renderJovensDropdown();
  updateSelectedMentees();
  if (window.lucide) lucide.createIcons();
});
