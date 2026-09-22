(function (window, document) {
  const state = {
    alunos: [],
  };

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function percentual(parte, total) {
    if (!total) {
      return 0;
    }

    return Math.round((parte / total) * 100);
  }

  function calcularIndicadores(alunos) {
    const total = alunos.length;
    const ativos = alunos.filter((aluno) => window.GestorApp.statusAtivo(aluno.status)).length;
    const empregados = alunos.filter((aluno) => aluno.empregabilidade).length;
    const frequentes = alunos.filter((aluno) => aluno.frequencia === true).length;
    const risco = alunos.filter((aluno) => aluno.frequencia === false).length;

    return {
      total,
      ativos,
      empregados,
      naoEmpregados: Math.max(total - empregados, 0),
      frequenciaMedia: percentual(frequentes, total),
      engajamento: percentual(empregados, total),
      risco,
    };
  }

  function atualizarBarras(indicadores) {
    const maiorValor = Math.max(indicadores.empregados, indicadores.naoEmpregados, 1);
    const empregadosAltura = Math.max(percentual(indicadores.empregados, maiorValor) * 2.2, 8);
    const naoEmpregadosAltura = Math.max(percentual(indicadores.naoEmpregados, maiorValor) * 2.2, 8);

    const empregadosBarra = document.querySelector('.employed-bar .bar');
    const naoEmpregadosBarra = document.querySelector('.unemployed-bar .bar');
    const empregadosGrupo = document.querySelector('.employed-bar');
    const naoEmpregadosGrupo = document.querySelector('.unemployed-bar');

    if (empregadosGrupo) empregadosGrupo.style.setProperty('--bar-height', `${empregadosAltura}px`);
    if (naoEmpregadosGrupo) naoEmpregadosGrupo.style.setProperty('--bar-height', `${naoEmpregadosAltura}px`);
    if (empregadosBarra) empregadosBarra.style.height = `${empregadosAltura}px`;
    if (naoEmpregadosBarra) naoEmpregadosBarra.style.height = `${naoEmpregadosAltura}px`;

    setText('.employed-bar .bar-value', indicadores.empregados);
    setText('.unemployed-bar .bar-value', indicadores.naoEmpregados);
  }

  function renderizarDashboard() {
    const indicadores = calcularIndicadores(state.alunos);
    const percentualEmpregados = percentual(indicadores.empregados, indicadores.total);
    const percentualNaoEmpregados = percentual(indicadores.naoEmpregados, indicadores.total);
    const atualizacao = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setText('[data-dashboard="atualizacao"]', `Visao geral - Atualizado as ${atualizacao}`);
    setText('[data-metric="alunos-ativos"] strong', indicadores.ativos);
    setText('[data-metric="alunos-ativos"] p', `${indicadores.total} alunos vinculados ao gestor`);
    setText('[data-metric="engajamento"] strong', `${indicadores.engajamento}%`);
    setText('[data-metric="engajamento"] p', `${indicadores.empregados} alunos com empregabilidade registrada`);
    setText('[data-metric="frequencia"] strong', `${indicadores.frequenciaMedia}%`);
    setText('[data-metric="frequencia"] p', `${indicadores.total - indicadores.risco} alunos com frequencia positiva`);
    setText('[data-metric="evasao"] strong', indicadores.risco);
    setText('[data-metric="evasao"] p', 'Alunos sem frequencia marcada');

    setText('.month-pill', `Base atual - ${indicadores.total}`);
    setText('.pie-label.employed', `Empregados: ${indicadores.empregados}\n(${percentualEmpregados}%)`);
    setText('.pie-label.unemployed', `Nao empregados:\n${indicadores.naoEmpregados} (${percentualNaoEmpregados}%)`);
    setText('.chart-caption', `Distribuicao atual (Total: ${indicadores.total})`);

    const pizza = document.querySelector('.pie-chart');
    if (pizza) {
      pizza.style.background = `conic-gradient(var(--cor-secundaria) 0 ${percentualNaoEmpregados}%, var(--sucesso) ${percentualNaoEmpregados}% 100%)`;
      pizza.setAttribute(
        'aria-label',
        `Empregados ${indicadores.empregados}, ${percentualEmpregados} por cento; nao empregados ${indicadores.naoEmpregados}, ${percentualNaoEmpregados} por cento.`,
      );
    }

    atualizarBarras(indicadores);
  }

  async function carregarDashboard() {
    try {
      state.alunos = await window.GestorAPI.listarAlunos(window.GestorApp.getRmGestor());
      renderizarDashboard();
    } catch (error) {
      if (error.status === 404) {
        state.alunos = [];
        renderizarDashboard();
        return;
      }

      console.error('[Dashboard Gestor]', error);
      setText('[data-dashboard="atualizacao"]', 'Nao foi possivel carregar os indicadores.');
    }
  }

  function configurarBuscaDashboard() {
    const input = document.querySelector('.search-field input[type="search"]');
    const form = document.querySelector('.toolbar');

    if (!input) return;

    const redirecionar = () => {
      const termo = input.value.trim();
      if (termo) {
        window.location.href = `./alunos-turma.html?busca=${encodeURIComponent(termo)}`;
      }
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        redirecionar();
      }
    });

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        redirecionar();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    carregarDashboard();
    configurarBuscaDashboard();
  });
})(window, document);
