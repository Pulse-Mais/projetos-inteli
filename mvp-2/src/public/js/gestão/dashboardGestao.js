/* ── Inicializa ícones Lucide ── */
lucide.createIcons();

/* ── Sidebar: ativa item clicado ── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ── Ver perfil: navega ao prontuário do jovem ── */
document.querySelectorAll('.btn-ver-perfil').forEach(btn => {
  btn.addEventListener('click', function () {
    const id = this.dataset.id;
    window.location.href = id ? `perfilAlunoGestao.html?id=${id}` : 'perfilAlunoGestao.html';
  });
});

const DONUT_COLORS = ['#003D82', '#16A34A', '#EAB308', '#D1D5DB', '#8B5CF6', '#F97316'];

/* Instâncias dos gráficos — precisam ser destruídas antes de recriar,
   senão o Chart.js lança "Canvas is already in use" ao trocar o filtro. */
let donutChartInstance = null;
let lineChartInstance = null;

/* ──────────────────────────────────────────────────────────
   KPIs
────────────────────────────────────────────────────────── */
function renderKpis(kpis) {
  document.getElementById('kpiJovens').textContent = kpis.jovens_ativos ?? '—';
  document.getElementById('kpiFrequencia').textContent =
    kpis.media_frequencia != null ? `${kpis.media_frequencia}%` : '—';
  document.getElementById('kpiMentorias').textContent = kpis.mentorias_realizadas ?? '—';
}

/* ──────────────────────────────────────────────────────────
   GRÁFICO DE BARRAS — Jornada dos jovens (Conectado/Capacitado/Transformado)
────────────────────────────────────────────────────────── */
function renderJornada(jornada) {
  const region = document.getElementById('regionLine');
  region.classList.remove('is-empty');

  if (lineChartInstance) {
    lineChartInstance.destroy();
    lineChartInstance = null;
  }

  if (!jornada || (jornada.conectado === 0 && jornada.capacitado === 0 && jornada.transformado === 0)) {
    region.classList.add('is-empty');
    return;
  }

  const ctx = document.getElementById('lineChart').getContext('2d');
  lineChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Conectado', 'Capacitado', 'Transformado'],
      datasets: [{
        data: [jornada.conectado, jornada.capacitado, jornada.transformado],
        backgroundColor: ['#003D82', '#16A34A', '#EAB308'],
        borderRadius: 6,
        maxBarThickness: 64,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          callbacks: { label: c => ` ${c.parsed.y} jovem(ns)` }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

/* ──────────────────────────────────────────────────────────
   GRÁFICO DONUT — Distribuição por programa
────────────────────────────────────────────────────────── */
function renderDonut(distribuicao, tipo) {
  const region = document.getElementById('regionDonut');
  const legend = document.querySelector('.donut-legend');
  const titleEl = document.getElementById('donutTitle');

  titleEl.innerHTML = tipo === 'turma' ? 'Distribuição por<br>turma' : 'Distribuição por<br>programa';

  region.classList.remove('is-empty');
  if (donutChartInstance) {
    donutChartInstance.destroy();
    donutChartInstance = null;
  }

  if (!Array.isArray(distribuicao) || distribuicao.length === 0) {
    region.classList.add('is-empty');
    return;
  }

  const total = distribuicao.reduce((acc, d) => acc + (d.total_jovens || 0), 0);
  if (total === 0) {
    region.classList.add('is-empty');
    return;
  }

  const colors = distribuicao.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]);

  legend.innerHTML = distribuicao.map((d, i) => {
    const pct = Math.round((d.total_jovens / total) * 100);
    return `
      <div class="donut-legend__item">
        <div class="donut-legend__left">
          <span class="donut-legend__dot" style="background:${colors[i]};"></span>
          <span class="donut-legend__label" title="${d.nome}">${d.nome}</span>
        </div>
        <span class="donut-legend__pct">${pct}%</span>
      </div>`;
  }).join('');

  const ctx = document.getElementById('donutChart').getContext('2d');
  donutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: distribuicao.map(d => d.nome),
      datasets: [{
        data: distribuicao.map(d => d.total_jovens),
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: '#fff',
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1a1a',
          callbacks: { label: c => ` ${c.label}: ${c.parsed}` }
        }
      }
    }
  });
}

/* ──────────────────────────────────────────────────────────
   TABELA — Jovens que precisam de atenção
────────────────────────────────────────────────────────── */
const RISCO_LABEL = { alto: 'Risco alto', medio: 'Risco médio' };

function renderRiskTable(jovens) {
  const region = document.getElementById('regionTable');
  const tbody = document.querySelector('#regionTable .risk-table tbody');
  region.classList.remove('is-empty');

  if (!Array.isArray(jovens) || jovens.length === 0) {
    region.classList.add('is-empty');
    return;
  }

  tbody.innerHTML = jovens.map(j => `
    <tr>
      <td class="col-name"><button type="button" class="link-perfil" data-id="${j.id}">${esc(j.nome)}</button></td>
      <td class="col-prog">${j.programa ? esc(j.programa) : '—'}</td>
      <td class="col-date">${j.dias_sem_interacao != null ? `há ${j.dias_sem_interacao} dia${j.dias_sem_interacao === 1 ? '' : 's'}` : '—'}</td>
      <td class="col-status"><span class="badge-risk">${esc(RISCO_LABEL[j.risco?.nivel] || 'Em risco')}</span></td>
      <td class="col-action">
        <button class="btn-ver-perfil" data-id="${j.id}">Ver perfil</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-ver-perfil, .link-perfil').forEach(btn => {
    btn.addEventListener('click', function () {
      window.location.href = `perfilAlunoGestao.html?id=${this.dataset.id}`;
    });
  });
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ──────────────────────────────────────────────────────────
   EVENTOS DO MÊS
────────────────────────────────────────────────────────── */
async function loadEventosDoMes() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const toISO = d => d.toISOString().slice(0, 10);

  try {
    const t0 = performance.now();
    const eventos = await window.api.get('/eventos', {
      params: { data_inicio: toISO(inicio), data_fim: toISO(fim) },
      auth: true,
    });
    console.log(`[PERF] /eventos respondeu em ${(performance.now() - t0).toFixed(0)}ms`);
    document.getElementById('kpiEventos').textContent = Array.isArray(eventos) ? eventos.length : '—';
  } catch (e) {
    document.getElementById('kpiEventos').textContent = '—';
  }
}

/* ──────────────────────────────────────────────────────────
   FILTRO POR PROGRAMA
────────────────────────────────────────────────────────── */
async function loadProgramaFilter() {
  const select = document.getElementById('programaFilter');
  try {
    const programas = await window.api.get('/programas', { params: { ativo: true }, auth: true });
    (Array.isArray(programas) ? programas : []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = p.nome;
      select.appendChild(opt);
    });
  } catch (e) {
    // Filtro fica só com "Todos os programas" se a lista falhar — não bloqueia o dashboard.
  }
  select.addEventListener('change', () => loadDashboard(select.value || null));
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
async function loadDashboard(programaId = null) {
  const t0 = performance.now();
  const params = programaId ? { programa_id: programaId } : undefined;

  window.setPageLoading?.(true);
  try {
    const [kpisResult, riscoResult] = await Promise.allSettled([
      window.api.get('/dashboard', { params, auth: true }),
      window.api.get('/dashboard/jovens-em-risco', { params, auth: true }),
      loadEventosDoMes(),
    ]);

    if (kpisResult.status === 'fulfilled') {
      renderKpis(kpisResult.value);
      renderDonut(kpisResult.value.distribuicao_por_programa, kpisResult.value.distribuicao_tipo);
      renderJornada(kpisResult.value.jornada_jovens);
    } else {
      document.getElementById('regionDonut').classList.add('is-empty');
      document.getElementById('regionLine').classList.add('is-empty');
    }

    if (riscoResult.status === 'fulfilled') {
      renderRiskTable(riscoResult.value);
    } else {
      document.getElementById('regionTable').classList.add('is-empty');
    }

    console.log(`[PERF] Dashboard Gestão carregado em ${(performance.now() - t0).toFixed(0)}ms`);
    lucide.createIcons();
  } finally {
    window.setPageLoading?.(false);
  }
}

loadProgramaFilter();
loadDashboard();
