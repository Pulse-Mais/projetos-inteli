/* alertaRiscoMentor.js — Integração da tela Alerta de Risco */

function initials(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

function formatCpf(cpf) {
  if (!cpf) return '—';
  const d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  if (days < 7) return `há ${days} dias`;
  if (days < 14) return 'há 1 semana';
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`;
  if (days < 60) return 'há 1 mês';
  return `há ${Math.floor(days / 30)} meses`;
}


document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const jovemId = params.get('jovem_id');
  const jovemNome = params.get('jovem') ?? '';

  // Render action buttons (independent of data load)
  document.getElementById('riskMentoringBtn')?.addEventListener('click', () => {
    const q = jovemNome
      ? `?jovem=${encodeURIComponent(jovemNome)}&jovem_id=${jovemId}`
      : jovemId ? `?jovem_id=${jovemId}` : '';
    window.location.href = `novaMetoriaMentor.html${q}`;
  });

  document.getElementById('riskProfileBtn')?.addEventListener('click', () => {
    const q = jovemNome
      ? `?jovem=${encodeURIComponent(jovemNome)}&jovem_id=${jovemId}`
      : jovemId ? `?jovem_id=${jovemId}` : '';
    window.location.href = `perfilMentoradoMentor.html${q}`;
  });

  // Escalation form — notificar coordenação
  const escalationForm    = document.getElementById('escalationForm');
  const escalationText    = document.getElementById('escalationText');
  const escalationFeedback = document.getElementById('escalationFeedback');
  const escalationCount   = document.getElementById('escalationCharCount');
  const escalationSubmit  = document.getElementById('escalationSubmitBtn');

  escalationText?.addEventListener('input', () => {
    if (escalationCount) escalationCount.textContent = escalationText.value.length;
  });

  function showEscalationFeedback(msg, type) {
    if (!escalationFeedback) return;
    escalationFeedback.hidden = false;
    escalationFeedback.className = `escalation-feedback is-${type}`;
    escalationFeedback.textContent = msg;
  }

  escalationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = escalationText?.value.trim() ?? '';
    if (!texto) {
      showEscalationFeedback('Descreva a situação antes de enviar.', 'error');
      return;
    }
    if (!jovemId) {
      showEscalationFeedback('Nenhum aluno identificado para notificação.', 'error');
      return;
    }
    if (escalationSubmit) escalationSubmit.disabled = true;
    try {
      await window.api.post('/anotacoes', {
        body: {
          jovem_id:    Number(jovemId),
          categoria:   'Mentoria',
          tipo_alerta: 'Alerta',
          texto,
          visivel_mentor: false,
        },
        auth: true,
      });
      showEscalationFeedback('Alerta enviado para a coordenação com sucesso.', 'success');
      if (escalationText) escalationText.value = '';
      if (escalationCount) escalationCount.textContent = '0';
      setTimeout(() => { if (escalationFeedback) escalationFeedback.hidden = true; }, 4000);
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erro ao enviar alerta.';
      showEscalationFeedback(msg, 'error');
    } finally {
      if (escalationSubmit) escalationSubmit.disabled = false;
    }
  });

  if (!jovemId) return;

  try {
    const [ficha, frequencias, atividades] = await Promise.all([
      window.api.get(`/jovens/${jovemId}/ficha`, { auth: true }),
      window.api.get(`/frequencias?jovem_id=${jovemId}`, { auth: true }),
      window.api.get(`/entrega-atividades?jovem_id=${jovemId}`, { auth: true }),
    ]);

    const jovem = ficha.jovem;
    const nome = jovem.nome ?? jovemNome;

    // Identity
    const avatarEl = document.getElementById('riskStudentAvatar');
    const nameEl   = document.getElementById('riskStudentName');
    const cpfEl    = document.getElementById('riskStudentCpf');
    if (avatarEl) window.avatar.render(avatarEl, jovem.foto_url, nome);
    if (nameEl)   nameEl.textContent   = nome;
    if (cpfEl)    cpfEl.textContent    = `CPF ${formatCpf(jovem.cpf)}`;

    // Frequência
    const pct = Number(ficha.frequencia?.percentual ?? 0);
    const freqBar = document.getElementById('riskFreqBar');
    const freqPct = document.getElementById('riskFreqPct');
    if (freqBar) freqBar.style.width = `${pct}%`;
    if (freqPct) freqPct.textContent  = `${pct}%`;

    // Último encontro — frequencias já vem ordenado DESC por data_aula
    const lastClassEl = document.getElementById('riskLastClass');
    if (lastClassEl) {
      const lastAula = Array.isArray(frequencias) && frequencias.length
        ? frequencias[0].data_aula
        : null;
      lastClassEl.textContent = `Último encontro: ${timeAgo(lastAula)}`;
    }

    // Atividades pendentes
    const atividadesArr = Array.isArray(atividades) ? atividades : [];
    const pendentes = atividadesArr.filter(a => a.status === 'Pendente' || a.status === 'Atrasada');
    const pendingEl = document.getElementById('riskPendingCount');
    if (pendingEl) pendingEl.textContent = pendentes.length;

    // Última entrega (data_entrega não nula, qualquer status)
    const lastActivityEl = document.getElementById('riskLastActivity');
    if (lastActivityEl) {
      const comEntrega = atividadesArr
        .filter(a => a.data_entrega)
        .sort((a, b) => new Date(b.data_entrega) - new Date(a.data_entrega));
      const lastDate = comEntrega[0]?.data_entrega ?? null;
      lastActivityEl.textContent = `Última atividade enviada: ${timeAgo(lastDate)}`;
    }


  } catch (err) {
    console.error('Erro ao carregar alerta de risco:', err);
  }
});
