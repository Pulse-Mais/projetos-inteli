document.addEventListener('DOMContentLoaded', function() {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  const campoBusca   = document.getElementById('campoBusca');
  const filterToggle = document.getElementById('filterToggle');
  const filterMenu   = document.getElementById('filterMenu');
  const listaAlunos  = document.getElementById('listaAlunos');
  const contador     = document.getElementById('contador');
  const filterItems  = document.querySelectorAll('.filter-dropdown__item');
  const tabAtivos    = document.getElementById('tabAlunosAtivos');
  const tabExAlunos  = document.getElementById('tabExAlunos');
  const filterDropdownWrapper = document.getElementById('filterDropdownWrapper');
  const btnNovoAluno = document.getElementById('btnNovoAluno');

  let alunos = [];
  let categoriaFiltro = 'todas';
  let anoFiltro = 'todos';
  let statusAtual = 'ativos'; // 'ativos' | 'exalunos'

  let todosAlunosRaw = []; // cópia original da resposta da API para verificar se o banco está vazio

  // Busca alunos via GET /alunos?ativo=, normaliza os dados e popula o filtro de ano
  async function carregarAlunos() {
    try {
      contador.textContent = 'Carregando alunos...';
      const ativoParam = statusAtual === 'exalunos' ? 'false' : 'true';
      const response = await fetch('/alunos?ativo=' + ativoParam);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', response.status, errorText);
        throw new Error(`Erro ${response.status}: Falha ao buscar alunos no servidor.`);
      }

      const data = await response.json();
      console.log('Dados carregados:', data); // log para debug no console do navegador
      todosAlunosRaw = data;

      alunos = data.map(item => {
        const nome = item.usuario ? item.usuario.nome : 'Sem Nome';
        const programa = item.programa_ingresso || 'Não informado';
        const anoIngresso = item.data_ingresso
          ? new Date(item.data_ingresso).getFullYear()
          : null;

        return {
          id: item.id_usuario,
          nome: nome,
          programa: programa,
          inicial: nome.charAt(0).toUpperCase(),
          categoria: programa.toLowerCase(),
          foto: item.usuario ? item.usuario.foto_url : null,
          anoIngresso: anoIngresso,
        };
      });

      popularAnosFiltro();
      filtrarAlunos();
    } catch (error) {
      console.error('Erro detalhado:', error);
      contador.textContent = 'Erro ao carregar alunos.';
      listaAlunos.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 40px;">
          <p style="color: var(--color-danger); font-weight: 600; margin-bottom: 12px;">Não foi possível carregar a lista de alunos.</p>
          <p style="font-size: 13px; color: var(--color-text-support);">Certifique-se de que o servidor backend está rodando e conectado ao banco de dados.</p>
          <button class="btn btn--outline" onclick="location.reload()" style="margin-top: 20px;">Tentar novamente</button>
        </div>
      `;
    }
  }

  // Renderiza os cards de alunos; distingue banco vazio de resultado vazio por filtro
  function renderizarAlunos(lista) {
    listaAlunos.innerHTML = '';
    const estadoVazio = document.getElementById('estadoVazio');
    const msgVazia   = document.getElementById('estadoVazioMensagem');
    const btnVazio   = document.getElementById('btnEstadoVazio');

    const ehExAlunos = statusAtual === 'exalunos';

    // Banco de dados sem nenhum aluno/ex-aluno cadastrado nesta aba
    if (todosAlunosRaw.length === 0) {
      estadoVazio.style.display = 'flex';
      msgVazia.textContent = ehExAlunos
        ? 'Nenhum ex-aluno encontrado. Alunos inativados pelo coordenador aparecem aqui automaticamente.'
        : 'Não há alunos a ser carregados ainda. Que tal cadastrar o primeiro e começar a gerenciar sua turma?';
      btnVazio.style.display = ehExAlunos ? 'none' : 'inline-flex';
      contador.textContent = ehExAlunos ? '0 ex-alunos no sistema' : '0 alunos no sistema';
      return;
    }

    // Filtro aplicado não encontrou nenhum resultado
    if (lista.length === 0) {
      estadoVazio.style.display = 'flex';
      msgVazia.textContent = ehExAlunos
        ? 'Nenhum ex-aluno encontrado para os critérios de busca selecionados.'
        : 'Nenhum aluno encontrado para os critérios de busca selecionados.';
      btnVazio.style.display = 'none';
      contador.textContent = ehExAlunos ? '0 ex-alunos encontrados' : '0 alunos encontrados';
      return;
    }

    estadoVazio.style.display = 'none';
    contador.textContent = ehExAlunos
      ? `${lista.length} ex-aluno(s) encontrado(s)`
      : `${lista.length} aluno(s) encontrado(s)`;

    lista.forEach(aluno => {
      const card = document.createElement('a');
      card.href = ehExAlunos
        ? `perfilExAlunoCoordenador.html?id=${aluno.id}`
        : `perfilAluno.html?id=${aluno.id}`;
      card.className = 'aluno-card';

      const conteudoFoto = aluno.foto
        ? `<img src="${aluno.foto}" alt="Avatar de ${aluno.nome}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`
        : `<svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="color: var(--color-accent); opacity: 0.8;">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>`;

      // Todo ex-aluno é considerado "transformado" (RN02): a tag não mostra o
      // programa de ingresso, já que o ex-aluno não está mais associado a nenhum.
      const textoTag = ehExAlunos ? 'Transformado' : aluno.programa;

      card.innerHTML = `
        <div class="aluno-card__foto">
          ${conteudoFoto}
        </div>
        <div class="aluno-card__info">
          <h3 class="aluno-card__nome">${aluno.nome}</h3>
          <p class="aluno-card__programa">${textoTag}</p>
        </div>
      `;
      listaAlunos.appendChild(card);
    });
  }

  // Popula dinamicamente os botões de filtro por ano com os anos únicos de ingresso dos alunos
  function popularAnosFiltro() {
    const anos = [...new Set(alunos.map(a => a.anoIngresso).filter(Boolean))].sort((a, b) => b - a);
    const container = document.getElementById('anoFiltroContainer');
    if (!container) return;

    container.innerHTML = '';

    const criarBtn = (valor, texto, ativo) => {
      const btn = document.createElement('button');
      btn.className = 'filter-dropdown__item' + (ativo ? ' active' : '');
      btn.dataset.ano = valor;
      btn.innerHTML = `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>${texto}`;
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-ano]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        anoFiltro = this.dataset.ano;
        filtrarAlunos();
      });
      return btn;
    };

    container.appendChild(criarBtn('todos', 'Todos os anos', true));
    anos.forEach(ano => container.appendChild(criarBtn(String(ano), String(ano), false)));
  }

  // Filtra os alunos em memória combinando busca por texto, categoria e ano de ingresso
  function filtrarAlunos() {
    const termo = campoBusca.value.toLowerCase();

    const filtrados = alunos.filter(aluno => {
      const matchTermo = aluno.nome.toLowerCase().includes(termo) ||
                         aluno.programa.toLowerCase().includes(termo);

      let matchCategoria = true;
      if (categoriaFiltro !== 'todas') {
        matchCategoria = aluno.categoria.includes(categoriaFiltro);
      }

      let matchAno = true;
      if (anoFiltro !== 'todos') {
        matchAno = aluno.anoIngresso === Number(anoFiltro);
      }

      return matchTermo && matchCategoria && matchAno;
    });

    renderizarAlunos(filtrados);
  }

  // Executa o filtro a cada caractere digitado no campo de busca
  campoBusca.addEventListener('input', filtrarAlunos);

  // Abre e fecha o menu dropdown de filtros
  filterToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    filterMenu.classList.toggle('active');
  });

  // Fecha o dropdown ao clicar fora dele
  document.addEventListener('click', () => filterMenu.classList.remove('active'));

  // Atualiza a categoria selecionada ao clicar em um item do dropdown de filtro
  filterItems.forEach(item => {
    item.addEventListener('click', function() {
      filterItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      categoriaFiltro = this.dataset.category;
      filtrarAlunos();
    });
  });

  // Alterna entre as abas "Alunos Ativos" e "Ex-Alunos", recarregando a lista do status escolhido
  function selecionarAba(status) {
    if (statusAtual === status) return;
    statusAtual = status;

    if (tabAtivos) tabAtivos.classList.toggle('ativo', status === 'ativos');
    if (tabExAlunos) tabExAlunos.classList.toggle('ativo', status === 'exalunos');

    // Filtro por categoria de programa e botão de cadastro não se aplicam a ex-alunos
    if (filterDropdownWrapper) filterDropdownWrapper.style.display = status === 'exalunos' ? 'none' : '';
    if (btnNovoAluno) btnNovoAluno.style.display = status === 'exalunos' ? 'none' : '';

    categoriaFiltro = 'todas';
    anoFiltro = 'todos';
    campoBusca.value = '';

    carregarAlunos();
  }

  if (tabAtivos)   tabAtivos.addEventListener('click', function () { selecionarAba('ativos'); });
  if (tabExAlunos) tabExAlunos.addEventListener('click', function () { selecionarAba('exalunos'); });

  carregarAlunos();

});

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    localStorage.clear();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
