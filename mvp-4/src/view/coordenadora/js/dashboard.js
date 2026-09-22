(function (window, document) {
  let graficoJornada = null;
  let alertasAtuais = [];
  let ultimoDashboard = null;
  // Expor um getter para permitir que outros scripts (ex: exportação) obtenham os alertas atuais
  window.CoordenadoraExport = window.CoordenadoraExport || {};
  window.CoordenadoraExport.obterAlertas = () => alertasAtuais.slice();
  window.CoordenadoraExport.obterDashboard = () =>
    ultimoDashboard ? JSON.parse(JSON.stringify(ultimoDashboard)) : null;
  window.CoordenadoraExport.obterGrafico = () => {
    if (!graficoJornada || !graficoJornada.data) return null;
    try {
      return {
        labels: Array.isArray(graficoJornada.data.labels) ? graficoJornada.data.labels.slice() : [],
        datasets: (graficoJornada.data.datasets || []).map((ds) => ({
          label: ds.label,
          data: Array.isArray(ds.data) ? ds.data.slice() : [],
        })),
      };
    } catch (e) {
      return null;
    }
  };

  function getSelectTurma() {
    return document.getElementById("dashboard-filtro-turma") || document.querySelectorAll(".filtro-select")[0];
  }

  function getSelectPeriodo() {
    return document.getElementById("dashboard-filtro-periodo") || document.querySelectorAll(".filtro-select")[1];
  }

  function formatarPercentual(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR")}%`;
  }

  function getMesesPeriodo() {
    const meses = Number(getSelectPeriodo()?.value || 12);

    if (!Number.isInteger(meses) || meses <= 0) {
      return 12;
    }

    return meses;
  }

  function getPeriodoFiltro() {
    const meses = getMesesPeriodo();

    const fim = new Date();
    const inicio = new Date();

    inicio.setMonth(inicio.getMonth() - meses);

    return {
      periodo_inicio: inicio.toISOString().slice(0, 10),
      periodo_fim: fim.toISOString().slice(0, 10),
    };
  }

  function getLabelsPeriodo() {
    const meses = getMesesPeriodo();
    const formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });
    const data = new Date();

    return Array.from({ length: meses }, (_, indice) => {
      const mes = new Date(data.getFullYear(), data.getMonth() - (meses - 1 - indice), 1);
      const label = formatoMes.format(mes).replace(".", "");

      return label.charAt(0).toUpperCase() + label.slice(1);
    });
  }

  function getFiltrosDashboard() {
    const idTurma = getSelectTurma()?.value;

    return {
      ...getPeriodoFiltro(),
      id_turma: idTurma || undefined,
    };
  }

  function getFiltrosFrequencia() {
    const idTurma = getSelectTurma()?.value;

    return {
      ...getPeriodoFiltro(),
      id_turma: idTurma || undefined,
      apenas_alertas: true,
    };
  }

  function setCard(indice, valor, subtexto) {
    const card = document.querySelectorAll(".cards-indicadores .card")[indice];

    if (!card) return;

    const valorEl = card.querySelector(".card-valor");
    const subtextoEl = card.querySelector(".card-subtexto");

    if (valorEl) valorEl.textContent = valor;
    if (subtextoEl) subtextoEl.textContent = subtexto;
  }

  function atualizarCards(dashboard) {
    const indicadores = dashboard.indicadores_gerais || {};
    const empregabilidade = dashboard.empregabilidade || {};
    const frequencias = dashboard.frequencia_por_turma || [];
    const totalRisco = frequencias.reduce((total, turma) => total + Number(turma.alunos_em_risco || 0), 0);
    const mediaFrequencia = frequencias.length
      ? frequencias.reduce((total, turma) => total + Number(turma.media_presenca_percentual || 0), 0) /
        frequencias.length
      : 0;

    setCard(0, String(indicadores.total_alunos_ativos || 0), "alunos matriculados");
    setCard(1, formatarPercentual(empregabilidade.taxa_retencao_6_meses || 0), "retenção em 6 meses");
    setCard(2, formatarPercentual(mediaFrequencia.toFixed(1)), "presença média");
    setCard(3, String(totalRisco), "alunos em atenção");
  }

  function atualizarGrafico(dashboard) {
    const canvas = document.getElementById("grafico-jornada");
    const subtitulo = document.querySelector(".grafico-subtitulo");

    if (!canvas || !window.Chart) return;

    const labels = getLabelsPeriodo();
    const concluintes = Number(dashboard.concluintes_no_periodo?.total_concluintes || 0);
    const empregados = Number(dashboard.empregabilidade?.total_empregados_ativos || 0);
    const gerarSerie = (total) =>
      labels.map((_, indice) => {
        const progresso = (indice + 1) / labels.length;
        return Math.round(total * Math.pow(progresso, 1.08));
      });

    if (subtitulo) {
      subtitulo.textContent = `Formados x empregados nos últimos ${getMesesPeriodo()} meses`;
    }

    if (graficoJornada) {
      graficoJornada.destroy();
    }

    graficoJornada = new window.Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: gerarSerie(concluintes),
            label: "Formados",
            borderColor: "#003870",
            backgroundColor: "rgba(0, 56, 112, 0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
          {
            data: gerarSerie(empregados),
            label: "Empregados",
            borderColor: "#5696D6",
            backgroundColor: "rgba(86, 150, 214, 0.08)",
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  function getClasseRisco(percentual) {
    if (percentual < 70) return "pill-erro";
    return "pill-alerta";
  }

  function getTextoRisco(percentual) {
    if (percentual < 70) return "Alto";
    return "Médio";
  }

  function renderizarAlertas(alunos) {
    const corpoTabela = document.getElementById("lista-alertas");
    const contagem = document.querySelector(".alertas-contagem");

    if (!corpoTabela) return;

    // Manter a mesma referência do array para que getters externos acompanhem a mudança
    alertasAtuais.length = 0;
    if (Array.isArray(alunos) && alunos.length) alertasAtuais.push(...alunos);
    corpoTabela.innerHTML = "";

    if (contagem) {
      contagem.textContent = `${alertasAtuais.length} alunos`;
    }

    if (alertasAtuais.length === 0) {
      corpoTabela.innerHTML = '<tr><td colspan="4">Nenhum aluno em risco para os filtros selecionados.</td></tr>';
      return;
    }

    alertasAtuais.forEach((aluno) => {
      const percentual = Number(aluno.percentual_presenca || 0);
      const linha = document.createElement("tr");

      linha.dataset.nome = aluno.nome || "";
      linha.innerHTML = [
        `<td>${aluno.nome || "Aluno sem nome"}</td>`,
        `<td>${aluno.nome_turma || "-"}</td>`,
        `<td>${formatarPercentual(percentual)}</td>`,
        `<td><span class="pill ${getClasseRisco(percentual)}">${getTextoRisco(percentual)}</span></td>`,
      ].join("");
      corpoTabela.appendChild(linha);
    });

    aplicarBuscaAlertas();
    // Atualizar getter público
    window.CoordenadoraExport.obterAlertas = () => alertasAtuais.slice();
  }

  function aplicarBuscaAlertas() {
    const termo = String(document.querySelector(".busca-input")?.value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    document.querySelectorAll("#lista-alertas tr").forEach((linha) => {
      if (!linha.dataset.nome) return;

      const nome = linha.dataset.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      linha.hidden = Boolean(termo) && !nome.includes(termo);
    });
  }

  async function carregarTurmasFiltro() {
    const selectTurma = getSelectTurma();

    if (!selectTurma || !window.CoordenadoraAPI?.listarTurmas) return;

    const resposta = await window.CoordenadoraAPI.listarTurmas({ limit: 100 });
    const turmas = Array.isArray(resposta.data) ? resposta.data : [];

    selectTurma.innerHTML = '<option value="">Todas as turmas</option>';
    turmas.forEach((turma) => {
      const option = document.createElement("option");

      option.value = turma.id_turma;
      option.textContent = turma.nome_turma || `Turma ${turma.id_turma}`;
      selectTurma.appendChild(option);
    });
  }

  async function carregarDashboard() {
    const filtrosDashboard = getFiltrosDashboard();
    const filtrosFrequencia = getFiltrosFrequencia();

    try {
      const [dashboard, frequencias] = await Promise.all([
        window.CoordenadoraAPI.buscarDashboard(filtrosDashboard),
        window.CoordenadoraAPI.buscarFrequenciasDashboard(filtrosFrequencia),
      ]);

      atualizarCards(dashboard);
      atualizarGrafico(dashboard);
      // armazenar snapshot do dashboard para exportação
      ultimoDashboard = dashboard || null;
      renderizarAlertas(frequencias.alunos || []);
    } catch (error) {
      console.error("[Dashboard Coordenadora]", error);
      renderizarAlertas([]);
    }
  }

  function configurarEventos() {
    getSelectTurma()?.addEventListener("change", carregarDashboard);
    getSelectPeriodo()?.addEventListener("change", carregarDashboard);
    document.querySelector(".busca-input")?.addEventListener("input", aplicarBuscaAlertas);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    window.lucide?.createIcons();
    await carregarTurmasFiltro();
    configurarEventos();
    await carregarDashboard();
  });
})(window, document);
