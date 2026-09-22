/* impactoMentor.js — Integração do Painel de Impacto */

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function initials(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  if (days < 7) return `há ${days} dias`;
  if (days < 14) return 'há 1 semana';
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`;
  if (days < 60) return 'há 1 mês';
  return `há ${Math.floor(days / 30)} meses`;
}

function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const dia = DIAS_PT[d.getUTCDay()];
  const dd = d.getUTCDate();
  const mm = d.getUTCMonth() + 1;
  return `${dia}, ${dd}/${mm}`;
}

function buildStudentGrid(meus_jovens, encountersByJovem) {
  const grid = document.getElementById('studentGrid');
  if (!grid) return;

  if (!meus_jovens.length) {
    grid.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><p>Sem dados</p></div>';
    return;
  }

  grid.innerHTML = meus_jovens.map(j => {
    const encontros = encountersByJovem[j.id] ?? 0;
    const freq = j.frequencia_pct ?? 0;
    const programa = j.programa_nome ?? j.status_jornada ?? '—';
    const ultimaStr = j.ultima_sessao ? timeAgo(j.ultima_sessao) : '—';
    return `
      <article class="student-card" style="cursor:pointer" data-id="${j.id}" data-nome="${j.nome}">
        <h3>${j.nome}</h3>
        <p>${programa} · ${encontros} encontro${encontros !== 1 ? 's' : ''}</p>
        <div class="progress-track" aria-label="Frequência de ${j.nome}">
          <span style="width:${freq}%"></span>
        </div>
        <p>Último encontro: <strong>${ultimaStr}</strong></p>
      </article>`;
  }).join('');

  // Navigate to profile on click
  grid.querySelectorAll('.student-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const nome = card.dataset.nome;
      window.location.href = `perfilMentoradoMentor.html?jovem_id=${id}&jovem=${encodeURIComponent(nome)}`;
    });
  });
}

function buildDistribution(mentorias) {
  const container = document.getElementById('distributionRows');
  if (!container) return;

  // Build last 6 months map (current month inclusive)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`, label: MESES_PT[d.getMonth()], count: 0 });
  }

  mentorias
    .filter(m => m.status_mentoria === 'Realizada')
    .forEach(m => {
      if (!m.data_mentoria) return;
      const d = new Date(m.data_mentoria);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2,'0')}`;
      const slot = months.find(mo => mo.key === key);
      if (slot) slot.count++;
    });

  const maxCount = Math.max(...months.map(m => m.count), 1);

  if (months.every(m => m.count === 0)) {
    container.innerHTML = '<div class="empty-state" style="display:flex"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><p>Sem dados</p></div>';
    return;
  }

  container.innerHTML = months.map(m => `
    <div class="distribution-row">
      <span>${m.label}</span>
      <div class="distribution-track"><span style="width:${Math.round(m.count / maxCount * 100)}%"></span></div>
      <strong>${m.count}</strong>
    </div>`).join('');
}

function buildNextSessions(proximas) {
  const weekLabel = document.getElementById('weekLabel');
  const grid = document.getElementById('sessionsGrid');
  if (!grid) return;

  if (!proximas.length) {
    if (weekLabel) weekLabel.innerHTML = `<i data-lucide="calendar-days" style="width:18px;height:18px"></i> Nenhuma sessão agendada`;
    grid.innerHTML = '';
    return;
  }

  // Week range label from first and last session
  const firstDate = new Date(proximas[0].data_mentoria);
  const lastDate  = new Date(proximas[proximas.length - 1].data_mentoria);
  const isSameMonth = firstDate.getUTCMonth() === lastDate.getUTCMonth();
  const range = isSameMonth
    ? `${firstDate.getUTCDate()}–${lastDate.getUTCDate()} de ${MESES_PT[firstDate.getUTCMonth()]} ${firstDate.getUTCFullYear()}`
    : `${firstDate.getUTCDate()} ${MESES_PT[firstDate.getUTCMonth()]} – ${lastDate.getUTCDate()} ${MESES_PT[lastDate.getUTCMonth()]} ${lastDate.getUTCFullYear()}`;

  if (weekLabel) {
    weekLabel.innerHTML = `<i data-lucide="calendar-days" style="width:18px;height:18px"></i> ${range}`;
  }

  grid.innerHTML = proximas.map(m => {
    const jovensArr = m.jovens || [];
    // proximas_mentorias usa {id, nome}; GET /mentorias usa {jovem_id, jovem_nome}
    const jovensNomes = jovensArr.map(j => (j.nome ?? j.jovem_nome ?? '').split(' ')[0]).filter(Boolean).join(', ') || '—';
    const primeiroJovem = jovensArr[0];
    const pId   = primeiroJovem ? (primeiroJovem.id ?? primeiroJovem.jovem_id) : null;
    const pNome = primeiroJovem ? (primeiroJovem.nome ?? primeiroJovem.jovem_nome ?? '') : '';
    return `
      <button class="session-card"
        data-mentoria="${m.id}"
        ${pId ? `data-jovem-id="${pId}" data-jovem="${encodeURIComponent(pNome)}"` : ''}>
        <span><i data-lucide="clock" style="width:14px;height:14px"></i> ${formatDateShort(m.data_mentoria)}</span>
        <strong>${jovensNomes}</strong>
        <small>${m.duracao_minutos ?? '—'} min</small>
      </button>`;
  }).join('');

  // Navigate to mentoria registration
  grid.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => {
      const jovemId = card.dataset.jovemId;
      const jovem   = card.dataset.jovem;
      const q = jovemId ? `?jovem_id=${jovemId}&jovem=${jovem}` : '';
      window.location.href = `novaMetoriaMentor.html${q}`;
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const mentorId = window.currentUser?.id;

  document.getElementById('viewAllMenteesBtn')?.addEventListener('click', () => {
    window.location.href = 'mentoradosMentor.html';
  });

  window.setPageLoading?.(true);
  try {
    const [me, dash, mentorias] = await Promise.all([
      window.api.get('/me', { auth: true }),
      window.api.get('/dashboard/mentor', { auth: true }),
      window.api.get(`/mentorias?mentor_id=${mentorId}`, { auth: true }),
    ]);

    // ── Mentor card ──
    const avatarEl = document.getElementById('impactoMentorAvatar');
    const nomeEl   = document.getElementById('impactoMentorNome');
    const metaEl   = document.getElementById('impactoMentorMeta');
    if (avatarEl) window.avatar.render(avatarEl, me.foto_url, me.nome);
    if (nomeEl)   nomeEl.textContent   = me.nome ?? '—';
    if (metaEl) {
      const anoInicio = me.data_inicio_mentoria
        ? new Date(me.data_inicio_mentoria).getUTCFullYear()
        : null;
      metaEl.textContent = anoInicio ? `Mentor desde ${anoInicio}` : (me.cargo ?? 'Mentor');
    }

    // ── Encuentros por jovem ──
    const mentoriasArr = Array.isArray(mentorias) ? mentorias : [];
    const encountersByJovem = {};
    mentoriasArr.forEach(m => {
      (m.jovens || []).forEach(j => {
        encountersByJovem[j.jovem_id] = (encountersByJovem[j.jovem_id] ?? 0) + 1;
      });
    });

    // ── Alunos em acompanhamento ──
    buildStudentGrid(dash.meus_jovens ?? [], encountersByJovem);

    // ── Distribuição mensal ──
    buildDistribution(mentoriasArr);

    // ── Próximas sessões ──
    buildNextSessions(dash.proximas_mentorias ?? []);

    // ── Summary sidebar ──
    const sessEl   = document.getElementById('statSessions');
    const jovensEl = document.getElementById('statJovens');
    if (sessEl)   sessEl.textContent   = dash.mentorias_realizadas ?? 0;
    if (jovensEl) jovensEl.textContent = (dash.meus_jovens ?? []).length;

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error('Erro ao carregar painel de impacto:', err);
  } finally {
    window.setPageLoading?.(false);
  }
});
