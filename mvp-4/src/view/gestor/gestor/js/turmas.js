(function (window, document) {
  const state = {
    turmas: [],
    termoBusca: '',
  };

  function getClasseMarca(turma) {
    const nome = window.GestorApp.normalizarTexto(turma.nome);

    if (nome.includes('alpha') || nome.includes('epsilon')) {
      return 'turma-marca--verde';
    }

    if (nome.includes('beta') || nome.includes('backend')) {
      return 'turma-marca--azul';
    }

    if (nome.includes('delta')) {
      return 'turma-marca--azul-escuro';
    }

    if (nome.includes('gamma')) {
      return 'turma-marca--amarelo';
    }

    return 'turma-marca--azul';
  }

  function setEstado(mensagem, tipo, acao) {
    const lista = document.querySelector('.lista-turmas');
    lista.innerHTML = '';

    const estado = document.createElement('div');
    estado.className = `gestor-estado${tipo ? ` gestor-estado--${tipo}` : ''}`;
    estado.textContent = mensagem;

    if (acao) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn-estado';
      botao.textContent = acao.rotulo;
      botao.addEventListener('click', acao.onClick);
      estado.appendChild(botao);
    }

    lista.appendChild(estado);
  }

  function montarTurmas(turmasBanco, alunos) {
    return turmasBanco.map((turmaBanco) => {
      const alunosTurma = alunos.filter((aluno) => aluno.idTurma === turmaBanco.id_turma);
      const ano = new Date(turmaBanco.data_inicio).getUTCFullYear();

      return {
        idTurma: turmaBanco.id_turma,
        nome: turmaBanco.nome_turma,
        ano: Number.isInteger(ano) ? ano : '',
        alunos: alunosTurma.length,
        ativos: alunosTurma.filter((aluno) => window.GestorApp.statusAtivo(aluno.status)).length,
      };
    });
  }

  function criarLinhaGeral(totalAlunos, totalTurmas) {
    const linha = document.createElement('a');
    linha.href = './alunos-turma.html';
    linha.className = 'turma-linha';
    linha.dataset.fixo = '1';
    linha.dataset.alunos = totalAlunos;
    linha.innerHTML = `
      <div class="turma-marca turma-marca--azul-escuro">G</div>
      <div class="turma-detalhes">
        <h3 class="turma-nome">GERAL</h3>
        <p class="turma-info">
          <span><i data-lucide="users"></i> ${totalAlunos} Alunos</span>
          <span class="turma-info-separador">&middot;</span>
          <span><i data-lucide="folder"></i> ${totalTurmas} Turmas</span>
        </p>
      </div>`;
    return linha;
  }

  function criarLinhaTurma(turma) {
    const linha = document.createElement('a');
    const sigla = turma.ano ? `T${turma.ano}` : 'T';
    const classeMarca = getClasseMarca(turma);

    linha.href = `./alunos-turma.html?id_turma=${encodeURIComponent(turma.idTurma)}&turma=${encodeURIComponent(turma.nome)}`;
    linha.className = 'turma-linha';
    linha.dataset.status = turma.ativos > 0 ? 'ativa' : 'inativa';
    linha.dataset.alunos = turma.alunos;
    linha.innerHTML = `
      <div class="turma-marca ${classeMarca}">${sigla}</div>
      <div class="turma-detalhes">
        <h3 class="turma-nome">${turma.nome.toUpperCase()}</h3>
        <p class="turma-info">
          <span><i data-lucide="users"></i> ${turma.alunos} Alunos</span>
          <span class="turma-info-separador">&middot;</span>
          <span><i data-lucide="user-check"></i> ${turma.ativos} Ativos</span>
        </p>
      </div>`;
    return linha;
  }

  function getTurmasFiltradas() {
    const busca = window.GestorApp.normalizarTexto(state.termoBusca);
    const status = document.querySelector('[data-filtro="status"]')?.value || '';
    const ordem = document.querySelector('[data-filtro="ordem"]')?.value || 'az';

    return state.turmas
      .filter((turma) => {
        const casaBusca = window.GestorApp.normalizarTexto(turma.nome).includes(busca);
        const turmaStatus = turma.ativos > 0 ? 'ativas' : 'inativas';
        const casaStatus = !status || status === turmaStatus;
        return casaBusca && casaStatus;
      })
      .sort((a, b) => {
        if (ordem === 'za') return b.nome.localeCompare(a.nome, 'pt-BR');
        if (ordem === 'mais-alunos') return b.alunos - a.alunos;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }

  function renderizarTurmas() {
    const lista = document.querySelector('.lista-turmas');
    const turmas = getTurmasFiltradas();
    const totalAlunos = state.turmas.reduce((total, turma) => total + turma.alunos, 0);

    lista.innerHTML = '';
    lista.appendChild(criarLinhaGeral(totalAlunos, state.turmas.length));

    if (!turmas.length && state.turmas.length > 0) {
      const vazio = document.createElement('div');
      vazio.className = 'gestor-estado';
      vazio.textContent = 'Nenhuma turma corresponde aos filtros.';
      lista.appendChild(vazio);
      return;
    }

    turmas.forEach((turma) => lista.appendChild(criarLinhaTurma(turma)));
    window.GestorApp.recriarIcones();
  }

  async function carregarTurmas() {
    setEstado('Carregando turmas...', 'carregando');

    try {
      const [alunos, respostaTurmas] = await Promise.all([
        window.GestorAPI.listarAlunos(window.GestorApp.getRmGestor()),
        window.GestorAPI.listarTurmas(),
      ]);
      const turmasBanco = Array.isArray(respostaTurmas?.data) ? respostaTurmas.data : [];

      state.turmas = montarTurmas(turmasBanco, alunos);
      document.querySelector('.pagina-subtitulo').textContent =
        `Acompanhe o progresso de ${state.turmas.length} turmas - ${alunos.length} alunos no total`;
      renderizarTurmas();
    } catch (error) {
      if (error.status === 404) {
        state.turmas = [];
        renderizarTurmas();
        return;
      }

      console.error('[Turmas Gestor]', error);
      setEstado('Nao foi possivel carregar as turmas.', 'erro', {
        rotulo: 'Tentar novamente',
        onClick: carregarTurmas,
      });
    }
  }

  function configurarEventos() {
    const busca = document.querySelector('.busca-input');

    busca?.addEventListener('input', () => {
      state.termoBusca = busca.value;
      renderizarTurmas();
    });

    document.querySelectorAll('[data-filtro]').forEach((select) => {
      select.addEventListener('change', renderizarTurmas);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    carregarTurmas();
  });
})(window, document);
