(function (window, document) {
  const DEFAULT_RM_COORDENADORA = '1001';

  const state = {
    alunos: [],
    turmas: [],
    termoBusca: '',
    categoriaJovem: '',
    carregando: false,
  };

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getRmCoordenadora() {
    const params = getParams();
    const rmSalvo = params.get('rm')
      || window.localStorage.getItem('rmCoordenadora')
      || window.PULSE_COORDENADORA_RM
      || DEFAULT_RM_COORDENADORA;

    return String(rmSalvo) === '1011' ? DEFAULT_RM_COORDENADORA : rmSalvo;
  }

  function getIdTurmaInicial() {
    const params = getParams();
    const idTurma = params.get('id_turma');

    if (idTurma) {
      return idTurma;
    }

    const turma = params.get('turma') || '';
    const numeroTurma = turma.match(/\d+/);

    return numeroTurma ? numeroTurma[0] : '';
  }

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function formatarStatus(status) {
    if (typeof status === 'boolean') {
      return status ? 'Ativo' : 'Inativo';
    }

    const statusNormalizado = normalizarTexto(status);

    if (
      statusNormalizado === 'formado'
      || statusNormalizado === 'capacitado'
      || statusNormalizado === 'concluido'
      || statusNormalizado === 'concluida'
      || statusNormalizado === 'egresso'
    ) {
      return 'Formado';
    }

    if (statusNormalizado === 'true') {
      return 'Ativo';
    }

    if (statusNormalizado === 'false') {
      return 'Inativo';
    }

    const texto = String(status || '').trim();

    if (!texto) {
      return 'Sem status';
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function obterCategoriaFallback(aluno) {
    const categorias = [
      'Jovens Conectados',
      'Jovens Capacitados',
      'Jovens Transformados',
    ];
    const raNumerico = Number(aluno?.ra) || 0;

    return categorias[Math.abs(raNumerico) % categorias.length];
  }

  function categoriaJovemValida(categoria) {
    const categoriaNormalizada = normalizarTexto(categoria);

    return (
      categoriaNormalizada === 'jovens conectados'
      || categoriaNormalizada === 'jovens capacitados'
      || categoriaNormalizada === 'jovens transformados'
      || categoriaNormalizada === 'conectado'
      || categoriaNormalizada === 'capacitado'
      || categoriaNormalizada === 'transformado'
    );
  }

  function obterCategoriaExibicao(aluno) {
    const categoria = String(aluno?.categoria || '').trim();

    if (categoria && categoriaJovemValida(categoria)) {
      return categoria;
    }

    return obterCategoriaFallback(aluno);
  }

  function getClasseCategoriaJovem(aluno) {
    const categoriaNormalizada = normalizarTexto(obterCategoriaExibicao(aluno));

    if (categoriaNormalizada === 'conectado' || categoriaNormalizada === 'jovens conectados' || categoriaNormalizada === 'aprendiz') {
      return 'pill-jovem-conectado';
    }

    if (categoriaNormalizada === 'capacitado' || categoriaNormalizada === 'jovens capacitados') {
      return 'pill-jovem-capacitado';
    }

    if (categoriaNormalizada === 'transformado' || categoriaNormalizada === 'jovens transformados' || categoriaNormalizada === 'empregado') {
      return 'pill-jovem-transformado';
    }

    return getClasseStatus(aluno?.status);
  }

  function formatarCategoriaCard(aluno) {
    const categoriaNormalizada = normalizarTexto(obterCategoriaExibicao(aluno));

    if (categoriaNormalizada === 'conectado' || categoriaNormalizada === 'jovens conectados' || categoriaNormalizada === 'aprendiz') {
      return 'JOVENS CONECTADOS';
    }

    if (categoriaNormalizada === 'capacitado' || categoriaNormalizada === 'jovens capacitados') {
      return 'JOVENS CAPACITADOS';
    }

    if (categoriaNormalizada === 'transformado' || categoriaNormalizada === 'jovens transformados' || categoriaNormalizada === 'empregado') {
      return 'JOVENS TRANSFORMADOS';
    }

    return obterCategoriaExibicao(aluno).toUpperCase();
  }

  function getClasseStatus(status) {
    const statusNormalizado = normalizarTexto(status);

    if (
      status === true
      || statusNormalizado === 'true'
      || statusNormalizado === 'ativo'
      || statusNormalizado === 'ativa'
    ) {
      return 'pill-ativo';
    }

    if (
      status === false
      || statusNormalizado === 'false'
      || statusNormalizado === 'inativo'
      || statusNormalizado === 'inativa'
      || statusNormalizado === 'evadido'
      || statusNormalizado === 'desligado'
    ) {
      return 'pill-inativo';
    }

    if (
      statusNormalizado === 'formado'
      || statusNormalizado === 'capacitado'
      || statusNormalizado === 'concluido'
      || statusNormalizado === 'concluida'
      || statusNormalizado === 'egresso'
    ) {
      return 'pill-neutro';
    }

    return 'pill-neutro';
  }

  function setBreadcrumb() {
    const params = getParams();
    const breadcrumb = document.querySelector('.breadcrumb-atual');
    const turma = params.get('turma');
    const idTurma = params.get('id_turma');

    if (!breadcrumb) {
      return;
    }

    if (turma) {
      breadcrumb.textContent = turma;
      return;
    }

    if (idTurma) {
      breadcrumb.textContent = `Turma ${idTurma}`;
    }
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
    const idTurmaSelecionada = getIdTurmaInicial();

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

    if (idTurmaSelecionada) {
      campoTurma.value = idTurmaSelecionada;
    }
  }

  function setEstado(mensagem, tipo, acao) {
    const grade = document.getElementById('alunos-grade');
    grade.innerHTML = '';

    const estado = document.createElement('div');
    estado.className = `alunos-estado${tipo ? ` alunos-estado--${tipo}` : ''}`;

    if (tipo === 'carregando') {
      const spinner = document.createElement('span');
      spinner.className = 'estado-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      estado.appendChild(spinner);
    }

    const texto = document.createElement('span');
    texto.textContent = mensagem;
    estado.appendChild(texto);

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

  function setControlesCarregando(carregando) {
    const formulario = document.getElementById('filtros-alunos');

    state.carregando = carregando;

    if (formulario) {
      Array.from(formulario.elements).forEach((elemento) => {
        elemento.disabled = carregando;
      });
    }
  }

  function criarCardAluno(aluno) {
    const card = document.createElement('a');
    const ra = aluno.ra;
    const nome = aluno.nome || 'Aluno sem nome';

    card.className = 'aluno-card';
    card.href = `perfil.html?rm=${encodeURIComponent(getRmCoordenadora())}&ra=${encodeURIComponent(ra)}&nome=${encodeURIComponent(nome)}`;

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
    status.className = `pill ${getClasseCategoriaJovem(aluno)}`;
    status.textContent = formatarCategoriaCard(aluno);

    card.appendChild(avatar);
    card.appendChild(titulo);
    card.appendChild(matricula);
    card.appendChild(status);

    return card;
  }

  function getAlunosFiltradosPorBusca() {
    const termo = normalizarTexto(state.termoBusca);
    const categoriaJovem = normalizarTexto(state.categoriaJovem);

    return state.alunos.filter((aluno) => {
      const nome = normalizarTexto(aluno.nome);
      const ra = normalizarTexto(aluno.ra);
      const categoriaAluno = normalizarTexto(formatarCategoriaCard(aluno));
      const casaBusca = !termo || nome.includes(termo) || ra.includes(termo);
      const casaCategoria = !categoriaJovem || categoriaAluno === categoriaJovem;

      return casaBusca && casaCategoria;
    });
  }

  function renderizarAlunos() {
    const grade = document.getElementById('alunos-grade');
    const alunos = getAlunosFiltradosPorBusca();

    grade.innerHTML = '';

    if (alunos.length === 0 && state.alunos.length > 0) {
      setEstado('Nenhum aluno corresponde a busca atual.');
      return;
    }

    if (alunos.length === 0) {
      setEstado('Nenhum aluno encontrado para os filtros aplicados.');
      return;
    }

    alunos.forEach((aluno) => {
      grade.appendChild(criarCardAluno(aluno));
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
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
      'localizacao',
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
    const rm = getRmCoordenadora();
    const filtros = getFiltrosApi();
    const temFiltros = Object.keys(filtros).length > 0;

    setControlesCarregando(true);
    setEstado('Carregando alunos...', 'carregando');

    try {
      state.alunos = temFiltros
        ? await window.CoordenadoraAPI.filtrarAlunos(rm, filtros)
        : await window.CoordenadoraAPI.listarAlunos(rm);
      renderizarAlunos();
    } catch (error) {
      if (error.status === 404) {
        state.alunos = [];
        renderizarAlunos();
        return;
      }

      console.error('[Alunos Coordenadora]', error);
      setEstado('Nao foi possivel carregar os alunos.', 'erro', {
        rotulo: 'Tentar novamente',
        onClick: carregarAlunos,
      });
    } finally {
      setControlesCarregando(false);
    }
  }

  async function carregarTurmas() {
    try {
      const resposta = await window.CoordenadoraAPI.listarTurmas({ limit: 100 });
      state.turmas = Array.isArray(resposta?.data) ? resposta.data : [];
      preencherOpcoesTurma();
    } catch (error) {
      console.error('[Alunos Coordenadora] turmas', error);
    }
  }

  function configurarEventos() {
    const busca = document.querySelector('.busca-input');
    const filtroCategoriaJovem = document.getElementById('filtro-categoria-jovem');
    const formulario = document.getElementById('filtros-alunos');
    const btnLimpar = document.getElementById('btn-limpar-filtros');

    if (busca) {
      busca.addEventListener('input', () => {
        state.termoBusca = busca.value;
        renderizarAlunos();
      });
    }

    if (filtroCategoriaJovem) {
      filtroCategoriaJovem.addEventListener('change', () => {
        state.categoriaJovem = filtroCategoriaJovem.value;
        renderizarAlunos();
      });
    }

    if (formulario) {
      formulario.addEventListener('submit', (event) => {
        event.preventDefault();
        carregarAlunos();
      });
    }

    if (btnLimpar && formulario) {
      btnLimpar.addEventListener('click', () => {
        formulario.reset();
        if (filtroCategoriaJovem) {
          filtroCategoriaJovem.value = '';
        }
        state.termoBusca = '';
        state.categoriaJovem = '';
        if (busca) {
          busca.value = '';
        }
        preencherTurmaInicial();
        carregarAlunos();
      });
    }

    const botaoDropdown = document.getElementById('btn-adicionar-alunos');
    const menuDropdown = document.getElementById('menu-adicionar-alunos');
    const btnImportarCsv = document.getElementById('btn-importar-csv');
    const inputCsv = document.getElementById('input-csv-alunos');
    const dropdownContainer = document.getElementById('btn-dropdown-alunos');

    if (botaoDropdown && menuDropdown) {
      botaoDropdown.addEventListener('click', () => {
        const aberto = menuDropdown.hasAttribute('hidden');
        menuDropdown.toggleAttribute('hidden', !aberto);
      });
    }

    if (btnImportarCsv && inputCsv) {
      btnImportarCsv.addEventListener('click', () => inputCsv.click());
      inputCsv.addEventListener('change', function () {
        const arquivo = this.files[0];
        if (!arquivo) {
          return;
        }

        const leitor = new FileReader();
        leitor.onload = (evento) => {
          const conteudo = evento.target.result;
          sessionStorage.setItem('csvDados', conteudo);
          sessionStorage.setItem('csvNome', arquivo.name);
          window.location.href = 'importacao-csv.html';
        };
        leitor.onerror = () => {
          alert('Erro ao ler o arquivo. Tente novamente.');
        };
        leitor.readAsText(arquivo);
      });
    }

    document.addEventListener('click', (event) => {
      if (!dropdownContainer || !menuDropdown || !botaoDropdown) {
        return;
      }

      const alvo = event.target;
      if (dropdownContainer.contains(alvo)) {
        return;
      }

      menuDropdown.setAttribute('hidden', '');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setBreadcrumb();
    carregarTurmas();
    configurarEventos();
    carregarAlunos();
  });
})(window, document);
