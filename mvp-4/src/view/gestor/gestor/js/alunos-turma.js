(function (window, document) {
  const state = {
    alunos: [],
    turmas: [],
    termoBusca: '',
  };

  // Espelha a semantica de status do portal do coordenador (filtro server-side):
  // "Ativos" = ativo/true; "Inativos" = inativo/false. Outros status (formado,
  // Estavel, etc.) nao entram em nenhum dos dois. Usar o statusAtivo compartilhado
  // (que so exclui "inativo") fazia o filtro "Ativos" manter quase todos os alunos.
  const STATUS_ATIVO = ['ativo', 'ativa', 'true', 't', '1'];
  const STATUS_INATIVO = ['inativo', 'inativa', 'false', 'f', '0'];

  function casaFiltroStatus(status, filtroStatus) {
    if (!filtroStatus) {
      return true;
    }

    const statusNormalizado = window.GestorApp.normalizarTexto(status);

    if (filtroStatus === 'ativo') {
      return STATUS_ATIVO.includes(statusNormalizado);
    }

    if (filtroStatus === 'inativo') {
      return STATUS_INATIVO.includes(statusNormalizado);
    }

    return true;
  }

  function getIdTurmaInicial() {
    const params = window.GestorApp.getParams();
    const idTurma = params.get('id_turma');

    if (idTurma) {
      return idTurma;
    }

    const turma = params.get('turma') || '';
    const numeroTurma = turma.match(/\d+/);

    return numeroTurma ? numeroTurma[0] : '';
  }

  function setBreadcrumb() {
    const params = window.GestorApp.getParams();
    const breadcrumb = document.querySelector('.breadcrumb-atual');
    const turma = params.get('turma');
    const idTurma = getIdTurmaInicial();

    if (!breadcrumb) {
      return;
    }

    if (turma) {
      breadcrumb.textContent = turma;
      return;
    }

    breadcrumb.textContent = idTurma ? `Turma ${idTurma}` : 'Geral';
  }

  function preencherTurmaInicial() {
    const campoTurma = document.querySelector('[name="id_turma"]');
    const idTurma = getIdTurmaInicial();

    if (campoTurma && idTurma) {
      campoTurma.value = idTurma;
    }
  }

  function preencherOpcoesTurma() {
    const campoTurma = document.querySelector('[name="id_turma"]');
    const idTurma = getIdTurmaInicial();

    if (!campoTurma) {
      return;
    }

    campoTurma.innerHTML = '<option value="">Todas</option>';

    state.turmas.forEach((turma) => {
      const option = document.createElement('option');
      option.value = String(turma.id_turma);
      option.textContent = turma.nome_turma || `Turma ${turma.id_turma}`;
      campoTurma.appendChild(option);
    });

    if (idTurma) {
      campoTurma.value = idTurma;
    }
  }

  function setEstado(mensagem, tipo, acao) {
    const grade = document.getElementById('alunos-grade');
    grade.innerHTML = '';

    const estado = document.createElement('div');
    estado.className = `alunos-estado${tipo ? ` alunos-estado--${tipo}` : ''}`;
    estado.textContent = mensagem;

    if (acao) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn-estado';
      botao.textContent = acao.rotulo;
      botao.addEventListener('click', acao.onClick);
      estado.appendChild(botao);
    }

    grade.appendChild(estado);
  }

  function criarCardAluno(aluno) {
    const card = document.createElement('a');
    const ra = aluno.ra;
    const nome = aluno.nome || 'Aluno sem nome';

    card.className = 'aluno-card';
    card.href = `perfil-aluno.html?ra=${encodeURIComponent(ra)}&nome=${encodeURIComponent(nome)}`;

    const avatar = document.createElement('i');
    avatar.className = 'aluno-avatar';
    avatar.setAttribute('data-lucide', 'circle-user');

    const titulo = document.createElement('h3');
    titulo.className = 'aluno-nome';
    titulo.textContent = nome;

    const matricula = document.createElement('p');
    matricula.className = 'aluno-matricula';
    matricula.textContent = `RA: ${ra}`;

    const status = document.createElement('span');
    status.className = `pill ${window.GestorApp.getClasseStatus(aluno.status)}`;
    status.textContent = window.GestorApp.formatarStatus(aluno.status);

    card.appendChild(avatar);
    card.appendChild(titulo);
    card.appendChild(matricula);
    card.appendChild(status);

    return card;
  }

  function getAlunosFiltrados() {
    const termo = window.GestorApp.normalizarTexto(state.termoBusca);
    const filtroStatus = document.querySelector('[data-filtro="status"]')?.value || '';

    return state.alunos.filter((aluno) => {
      const casaBusca = !termo
        || window.GestorApp.normalizarTexto(aluno.nome).includes(termo)
        || window.GestorApp.normalizarTexto(aluno.ra).includes(termo);
      const casaStatus = casaFiltroStatus(aluno.status, filtroStatus);

      return casaBusca && casaStatus;
    });
  }

  function renderizarAlunos() {
    const grade = document.getElementById('alunos-grade');
    const alunos = getAlunosFiltrados();

    grade.innerHTML = '';

    if (!alunos.length && state.alunos.length > 0) {
      setEstado('Nenhum aluno corresponde aos filtros atuais.');
      return;
    }

    if (!alunos.length) {
      setEstado('Nenhum aluno encontrado para a turma selecionada.');
      return;
    }

    alunos.forEach((aluno) => grade.appendChild(criarCardAluno(aluno)));
    window.GestorApp.recriarIcones();
  }

  function getFiltrosApi() {
    const formulario = document.getElementById('filtros-alunos');
    const filtros = {};

    if (!formulario) {
      return filtros;
    }

    const formData = new FormData(formulario);
    const camposPermitidos = [
      'idade_min',
      'idade_max',
      'empregabilidade',
      'id_turma',
      'eventos_min',
      'eventos_max',
      'genero',
    ];

    camposPermitidos.forEach((campo) => {
      const valor = String(formData.get(campo) || '').trim();

      if (valor) {
        filtros[campo] = valor;
      }
    });

    return filtros;
  }

  async function carregarAlunos() {
    const rm = window.GestorApp.getRmGestor();
    const filtros = getFiltrosApi();
    const temFiltros = Object.keys(filtros).length > 0;

    setEstado('Carregando alunos...', 'carregando');

    try {
      const resposta = temFiltros
        ? await window.GestorAPI.filtrarAlunos(rm, filtros)
        : await window.GestorAPI.listarAlunos(rm);

      state.alunos = Array.isArray(resposta) ? resposta : [];

      if (!Array.isArray(state.alunos)) {
        throw new Error('A API retornou um formato invalido para a lista de alunos.');
      }

      renderizarAlunos();
    } catch (error) {
      if (error.status === 404) {
        state.alunos = [];
        renderizarAlunos();
        return;
      }

      console.error('[Alunos Gestor]', error);
      setEstado('Nao foi possivel carregar os alunos.', 'erro', {
        rotulo: 'Tentar novamente',
        onClick: carregarAlunos,
      });
    }
  }

  async function carregarTurmas() {
    try {
      const resposta = await window.GestorAPI.listarTurmas();
      state.turmas = Array.isArray(resposta?.data) ? resposta.data : [];
      preencherOpcoesTurma();
    } catch (error) {
      console.error('[Alunos Gestor] turmas', error);
    }
  }

  function configurarEventos() {
    const busca = document.querySelector('.busca-input');
    const filtroStatus = document.querySelector('[data-filtro="status"]');
    const formulario = document.getElementById('filtros-alunos');
    const btnLimpar = document.getElementById('btn-limpar-filtros');

    busca?.addEventListener('input', () => {
      state.termoBusca = busca.value;
      renderizarAlunos();
    });

    filtroStatus?.addEventListener('change', renderizarAlunos);

    formulario?.addEventListener('submit', (event) => {
      event.preventDefault();
      carregarAlunos();
    });

    btnLimpar?.addEventListener('click', () => {
      formulario.reset();
      if (filtroStatus) filtroStatus.value = '';
      // Restaurar id_turma da URL antes de qualquer leitura do formulário
      preencherTurmaInicial();
      // Usar setTimeout(0) garante que o DOM atualizou o valor do select
      // antes de getFiltrosApi() ler via FormData
      setTimeout(() => carregarAlunos(), 0);
    });
  }

  function aplicarBuscaInicial() {
    const params = window.GestorApp.getParams();
    const busca = params.get('busca');
    if (!busca) return;

    const input = document.querySelector('.busca-input');
    if (input) {
      input.value = busca;
      state.termoBusca = busca;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setBreadcrumb();
    carregarTurmas();
    aplicarBuscaInicial();
    configurarEventos();
    carregarAlunos();
  });
})(window, document);
