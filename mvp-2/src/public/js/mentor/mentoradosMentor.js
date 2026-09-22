/* mentoradosMentor.js — Integração da tela Mentorados com a API */

function initials(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

function formatCpf(cpf) {
  if (!cpf) return null;
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatAtividades(n) {
  if (!n || n === 0) return 'Em dia';
  return `${n} em atraso`;
}

function buildCard(jovem, tipo) {
  const subtitulo = [formatCpf(jovem.cpf), jovem.programa_nome, jovem.turma]
    .filter(Boolean).join(' · ');

  return `
    <article class="mentee-card mentee-card--${tipo}">
      <div class="mentee-header">
        <span class="mentee-avatar" data-jovem-id="${jovem.id}">${initials(jovem.nome)}</span>
        <div>
          <h3>${jovem.nome}</h3>
          <p>${subtitulo || '—'}</p>
        </div>
      </div>

      <div class="mentee-metrics">
        <div class="mentee-metric">
          <span><i data-lucide="calendar-check" style="width:16px;height:16px"></i> Frequência</span>
          <strong>${jovem.frequencia_pct ?? 0}%</strong>
        </div>
        <div class="mentee-metric">
          <span><i data-lucide="clipboard-list" style="width:16px;height:16px"></i> Atividades</span>
          <strong>${formatAtividades(jovem.atividades_pendentes)}</strong>
        </div>
        <div class="mentee-metric">
          <span><i data-lucide="clock" style="width:16px;height:16px"></i> Última sessão</span>
          <strong>${formatDate(jovem.ultima_sessao)}</strong>
        </div>
      </div>

      <div class="mentee-actions">
        <button class="btn btn-secondary profile-btn"
          data-jovem="${jovem.nome}" data-jovem-id="${jovem.id}">
          <i data-lucide="user-round" style="width:16px;height:16px"></i>
          Ver Perfil
        </button>
        <button class="btn btn-primary mentoring-btn"
          data-jovem="${jovem.nome}" data-jovem-id="${jovem.id}">
          <i data-lucide="plus" style="width:16px;height:16px"></i>
          Registrar Mentoria
        </button>
      </div>
    </article>`;
}

function buildSection(titulo, tipo, jovens) {
  if (jovens.length === 0) return '';
  return `
    <section class="mentees-section mentees-section--${tipo}">
      <h2 class="status-title">
        <span class="status-dot"></span>
        ${titulo}
      </h2>
      ${jovens.map(j => buildCard(j, tipo)).join('')}
    </section>`;
}

function attachNavigation(container) {
  container.addEventListener('click', e => {
    const profileBtn   = e.target.closest('.profile-btn');
    const mentoringBtn = e.target.closest('.mentoring-btn');

    if (profileBtn) {
      const jovem   = profileBtn.dataset.jovem ?? '';
      const jovemId = profileBtn.dataset.jovemId ?? '';
      window.location.href =
        `perfilMentoradoMentor.html?jovem=${encodeURIComponent(jovem)}&jovem_id=${jovemId}`;
    }

    if (mentoringBtn) {
      const jovem   = mentoringBtn.dataset.jovem ?? '';
      const jovemId = mentoringBtn.dataset.jovemId ?? '';
      const query   = jovem ? `?jovem=${encodeURIComponent(jovem)}&jovem_id=${jovemId}` : '';
      window.location.href = `novaMetoriaMentor.html${query}`;
    }
  });
}

function buildSkeletonCards(n) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card" style="min-height:160px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
        <span class="skeleton" style="width:40px;height:40px;border-radius:50%"></span>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px">
          <span class="skeleton" style="width:55%;height:13px"></span>
          <span class="skeleton" style="width:70%;height:11px"></span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-top:8px">
        <span class="skeleton" style="width:30%;height:11px"></span>
        <span class="skeleton" style="width:30%;height:11px"></span>
        <span class="skeleton" style="width:30%;height:11px"></span>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <span class="skeleton" style="flex:1;height:34px;border-radius:6px"></span>
        <span class="skeleton" style="flex:1;height:34px;border-radius:6px"></span>
      </div>
    </div>`).join('');
}

// Classifica o jovem em 'alert' (em alerta), 'warning' (em atenção) ou 'regular'.
// riskIds = jovens com alerta explícito (anotação tipo Alerta).
// Alinhado aos helpers do backend (calcularIndicadorFrequencia / calcularRiscoEvasao):
//   frequência < 50% → crítico; < 75% → atenção; atividades em atraso ≥ 2 → fator de risco.
function classificarJovem(jovem, riskIds) {
  if (riskIds.has(jovem.id)) return 'alert';

  const freq = Number(jovem.frequencia_pct ?? 0);
  const pend = Number(jovem.atividades_pendentes ?? 0);

  if (freq < 50 || pend >= 2) return 'alert';
  if (freq < 75 || pend >= 1) return 'warning';
  return 'regular';
}

document.addEventListener('DOMContentLoaded', async () => {
  const alertSection   = document.getElementById('alertSection');
  const warningSection = document.getElementById('warningSection');
  const regularSection = document.getElementById('regularSection');
  const warningChip    = document.getElementById('warningChip');
  const riskCount      = document.getElementById('riskCount');

  alertSection.innerHTML   = buildSkeletonCards(2);
  warningSection.innerHTML = buildSkeletonCards(2);
  regularSection.innerHTML = buildSkeletonCards(3);
  window.setPageLoading?.(true);

  try {
    const data = await window.api.get('/dashboard/mentor', { auth: true, cache: true, cacheTtl: 30_000 });

    const jovens  = data.meus_jovens ?? [];
    const alertas = data.alertas_jovens ?? [];
    const riskIds = new Set(alertas.map(a => a.jovem_id));

    const emAlerta  = [];
    const emAtencao = [];
    const regulares = [];
    for (const j of jovens) {
      const tier = classificarJovem(j, riskIds);
      if (tier === 'alert') emAlerta.push(j);
      else if (tier === 'warning') emAtencao.push(j);
      else regulares.push(j);
    }

    // Warning chip
    if (emAlerta.length > 0) {
      riskCount.textContent = emAlerta.length;
      warningChip.hidden = false;
    }

    // Seções
    alertSection.innerHTML   = buildSection('Em alerta', 'alert', emAlerta);
    warningSection.innerHTML = buildSection('Em atenção', 'warning', emAtencao);
    regularSection.innerHTML = buildSection('Regulares', 'regular', regulares);

    // Foto de cada mentorado (fonte: usuarios.foto_url via conta vinculada); fallback iniciais
    const fotoPorId = new Map(jovens.map(j => [String(j.id), { foto: j.foto_url, nome: j.nome }]));
    document.querySelectorAll('.mentee-avatar[data-jovem-id]').forEach(el => {
      const dados = fotoPorId.get(el.dataset.jovemId);
      if (dados?.foto) window.avatar.render(el, dados.foto, dados.nome);
    });

    if (jovens.length === 0) {
      alertSection.innerHTML = `
        <div class="empty-state" style="display:flex;padding-top:var(--space-8)">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p>Sem dados</p>
        </div>`;
    }

    if (window.lucide) lucide.createIcons();
    attachNavigation(alertSection);
    attachNavigation(warningSection);
    attachNavigation(regularSection);

  } catch (err) {
    console.error('Erro ao carregar mentorados:', err);
    warningSection.innerHTML = '';
    regularSection.innerHTML = '';
    alertSection.innerHTML = `
      <div class="empty-state" style="display:flex;padding-top:var(--space-8)">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Sem dados</p>
      </div>`;
  } finally {
    window.setPageLoading?.(false);
  }
});
