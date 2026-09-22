/* dashboardMentor.js — Integração do Dashboard do Mentor com a API */

document.addEventListener('DOMContentLoaded', async () => {
  window.setPageLoading?.(true);
  try {
    const t0 = performance.now();
    const data = await window.api.get('/dashboard/mentor', { auth: true });
    console.log(`[PERF] /dashboard/mentor respondeu em ${(performance.now() - t0).toFixed(0)}ms`);

    // ── KPIs ──
    const kpiSessoes = document.getElementById('kpiSessoes');
    const kpiJovens  = document.getElementById('kpiJovens');

    if (kpiSessoes) kpiSessoes.textContent = data.mentorias_realizadas ?? 0;
    if (kpiJovens)  kpiJovens.textContent  = data.meus_jovens?.length ?? 0;

    // ── Tabela de alertas de risco ──
    const tbody = document.getElementById('riskTableBody');
    if (!tbody) return;

    const alertas = data.alertas_jovens ?? [];

    if (alertas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row"><span><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><span>Sem dados</span></span></td></tr>`;
      return;
    }

    tbody.innerHTML = alertas.map(alerta => {
      const programa = alerta.programa_nome ?? '—';
      const dias     = Number(alerta.dias_sem_interacao ?? 999);
      const ultima   = dias >= 999 ? 'Sem registro' : `há ${dias} dia${dias === 1 ? '' : 's'}`;

      return `
        <tr>
          <td class="col-name">
            <button class="risk-name-btn"
              data-jovem="${alerta.jovem_nome}"
              data-jovem-id="${alerta.jovem_id}">
              ${alerta.jovem_nome}
            </button>
          </td>
          <td class="col-prog">${programa}</td>
          <td class="col-date">${ultima}</td>
          <td class="col-status"><span class="badge badge-soft-danger">Em risco</span></td>
          <td class="col-action">
            <button class="btn btn-sm btn-secondary risk-btn"
              data-jovem="${alerta.jovem_nome}"
              data-jovem-id="${alerta.jovem_id}">
              Ver risco <i data-lucide="arrow-right" style="width:14px;height:14px"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    // Reinicializa ícones Lucide nos elementos dinâmicos
    if (window.lucide) lucide.createIcons();

    // Delegação de eventos na tabela (cobre botões dinâmicos)
    tbody.addEventListener('click', e => {
      const btn = e.target.closest('.risk-btn, .risk-name-btn');
      if (!btn) return;
      const jovem   = btn.dataset.jovem ?? 'mentorado';
      const jovemId = btn.dataset.jovemId ?? '';
      window.location.href =
        `alertaRiscoMentor.html?jovem=${encodeURIComponent(jovem)}&jovem_id=${jovemId}`;
    });

  } catch (err) {
    console.error('Erro ao carregar dashboard do mentor:', err);

    const tbody = document.getElementById('riskTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty-row"><span><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg><span>Sem dados</span></span></td></tr>`;
    }
  } finally {
    window.setPageLoading?.(false);
  }
});
