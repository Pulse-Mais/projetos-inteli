/* perfilMentoradoMentor.js — Integração da tela Perfil do Mentorado */

function initials(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

function formatCpf(cpf) {
  if (!cpf) return '—';
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
}

function formatDate(iso, full = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return full ? `${dd}/${mm}/${d.getUTCFullYear()}` : `${dd}/${mm}`;
}

function nivelBadge(nivel) {
  if (!nivel) return `<span class="badge" style="background:var(--secondary);color:var(--foreground)">—</span>`;
  const softMap = { 'Intermediário': 'badge-soft-info', 'Avançado': 'badge-soft-success' };
  const cls = softMap[nivel];
  return cls
    ? `<span class="badge ${cls}">${nivel}</span>`
    : `<span class="badge" style="background:var(--secondary);color:var(--foreground)">${nivel}</span>`;
}

function buildCompetencias(comps) {
  if (!comps.length) return '<li><span class="muted">Nenhuma competência registrada.</span></li>';
  return comps.map(c => `
    <li>
      <span>${c.nome}</span>
      ${nivelBadge(c.nivel)}
    </li>`).join('');
}

function buildAtividades(atividades) {
  if (!atividades.length) return '<li><span class="muted">Nenhuma atividade encontrada.</span></li>';
  return atividades.slice(0, 6).map(a => {
    const atrasado = a.status === 'Atrasada';
    const pendente = a.status === 'Pendente';
    const dotClass = (atrasado || pendente) ? 'is-danger' : 'is-success';
    const label = atrasado
      ? '<small class="text-danger">Atrasado</small>'
      : pendente
        ? '<small class="muted">Pendente</small>'
        : `<small class="muted">${formatDate(a.data_entrega)}</small>`;
    const nome = a.atividade_nome || `Atividade #${a.atividades_id}`;
    return `
      <li>
        <span class="state-dot ${dotClass}"></span>
        <span>${nome}</span>
        ${label}
      </li>`;
  }).join('');
}

function buildEventos(eventos) {
  if (!eventos.length) return '<li><span class="muted">Nenhum evento registrado.</span></li>';
  return eventos.slice(0, 5).map(ev => {
    const badge = ev.presente
      ? '<span class="badge badge-soft-success">Presente</span>'
      : '<span class="badge" style="background:var(--secondary);color:var(--foreground)">Ausente</span>';
    return `<li><span>${ev.evento_nome}</span>${badge}</li>`;
  }).join('');
}

function buildNotes(anotacoes) {
  if (!anotacoes.length) return '<p class="muted">Nenhuma observação registrada.</p>';
  return anotacoes.map(n => `
    <article>
      <small class="muted">Coordenação · ${formatDate(n.criado_em, true)}</small>
      <p>${n.texto}</p>
    </article>`).join('');
}

function buildHistory(mentorias) {
  if (!mentorias.length) return '<p class="muted">Nenhuma mentoria registrada.</p>';
  return mentorias.map(m => {
    const temas = Array.isArray(m.temas) ? m.temas.join(', ') : (m.temas || '—');
    const obs = m.observacao_mentoria || 'Sem observação registrada.';
    return `
      <article>
        <time>${formatDate(m.data_mentoria, true)}</time>
        <div>
          <strong>${temas}</strong>
          <p>${obs}</p>
        </div>
      </article>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const params    = new URLSearchParams(window.location.search);
  const jovemId   = params.get('jovem_id');
  const jovemNome = params.get('jovem') ?? '';

  // Botão Voltar
  const backBtn = document.getElementById('backToMenteesBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => { window.location.href = 'mentoradosMentor.html'; });
  }

  // Botão Registrar Mentoria
  const mentoringBtn = document.getElementById('mentoringBtn');
  if (mentoringBtn) {
    mentoringBtn.addEventListener('click', () => {
      const query = jovemNome
        ? `?jovem=${encodeURIComponent(jovemNome)}&jovem_id=${jovemId}`
        : '';
      window.location.href = `novaMetoriaMentor.html${query}`;
    });
  }

  if (!jovemId) return;

  try {
    const mentorId = window.currentUser?.id;

    const [ficha, anotacoes, mentorias, eventos, atividades] = await Promise.all([
      window.api.get(`/jovens/${jovemId}/ficha`, { auth: true }),
      window.api.get(`/anotacoes?jovem_id=${jovemId}`, { auth: true }),
      window.api.get(`/mentorias?jovem_id=${jovemId}${mentorId ? `&mentor_id=${mentorId}` : ''}`, { auth: true }),
      window.api.get(`/participacoes-eventos/jovem/${jovemId}`, { auth: true }),
      window.api.get(`/entrega-atividades?jovem_id=${jovemId}`, { auth: true }),
    ]);

    const jovem = ficha.jovem;
    const nome  = jovem.nome ?? jovemNome;

    // Identidade
    const avatarEl = document.getElementById('profileMenteeAvatar');
    const nameEl   = document.getElementById('profileMenteeName');
    const cpfEl    = document.getElementById('profileCpf');
    const progEl   = document.getElementById('profilePrograma');

    if (avatarEl) window.avatar.render(avatarEl, jovem.foto_url, nome);
    if (nameEl)   nameEl.textContent   = nome;
    if (cpfEl)    cpfEl.textContent    = `CPF ${formatCpf(jovem.cpf)}`;

    const matriculaAtiva = (ficha.matriculas ?? []).find(m => m.status === 'Ativo') ?? ficha.matriculas?.[0];
    if (progEl) {
      const programa = matriculaAtiva?.programa_nome ?? matriculaAtiva?.codigo;
      if (programa) {
        progEl.textContent = programa;
        progEl.hidden = false;
      } else {
        progEl.hidden = true;
      }
    }

    // Nome no histórico (primeiro nome)
    const histNome = document.getElementById('historyMenteeName');
    if (histNome) histNome.textContent = nome.split(' ')[0];

    // Frequência com cores por intervalo
    const freq    = Number(ficha.frequencia?.percentual ?? 0);
    const freqEl  = document.getElementById('profileFreqPct');
    const freqBar = document.getElementById('profileFreqBar');
    if (freqEl) freqEl.textContent = `${freq}%`;
    if (freqBar) {
      freqBar.style.width = `${freq}%`;
      freqBar.className = 'attendance-fill ' +
        (freq >= 75 ? 'is-success' : freq >= 50 ? 'is-warning' : 'is-danger');
    }

    // Banner de alerta baseado na frequência
    const riskDiv = document.getElementById('riskAlertDiv');
    if (riskDiv) {
      if (freq < 50) {
        riskDiv.hidden = false;
        riskDiv.className = 'risk-alert is-danger';
        riskDiv.innerHTML = `<i data-lucide="shield-alert" style="width:18px;height:18px"></i> Risco de evasão detectado`;
      } else if (freq < 75) {
        riskDiv.hidden = false;
        riskDiv.className = 'risk-alert is-warning';
        riskDiv.innerHTML = `<i data-lucide="triangle-alert" style="width:18px;height:18px"></i> Frequência em atenção`;
      } else {
        riskDiv.hidden = true;
      }
    }

    // Competências
    const compsList = document.getElementById('competenciasList');
    if (compsList) compsList.innerHTML = buildCompetencias(ficha.competencias ?? []);

    // Atividades
    const atBadge = document.getElementById('atividadesBadge');
    const atList  = document.getElementById('atividadesList');
    const pendentes = atividades.filter(a => a.status === 'Atrasada' || a.status === 'Pendente').length;
    if (atBadge) atBadge.textContent = pendentes > 0 ? `${pendentes} restante(s)` : 'Em dia';
    if (atList)  atList.innerHTML    = buildAtividades(atividades);

    // Eventos
    const evList = document.getElementById('eventosList');
    if (evList) evList.innerHTML = buildEventos(eventos);

    // Obs. visíveis ao mentor (o backend já filtra visivel_mentor=true para Mentor)
    const notesList = document.getElementById('notesList');
    if (notesList) notesList.innerHTML = buildNotes(anotacoes);

    // Histórico de mentorias
    const sessoesBadge = document.getElementById('historySessionCount');
    const histList     = document.getElementById('historyList');
    const count = mentorias.length;
    if (sessoesBadge) sessoesBadge.textContent = count === 1 ? '1 sessão' : `${count} sessões`;
    if (histList)     histList.innerHTML = buildHistory(mentorias);

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error('Erro ao carregar perfil do mentorado:', err);
  }
});
