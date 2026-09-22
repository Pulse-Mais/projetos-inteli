// Gestão de Programas, Cursos e Aulas pelo coordenador — modal com navegação em
// "drill-down": Programas -> Cursos do programa selecionado -> Aulas do curso selecionado.
document.addEventListener('DOMContentLoaded', function () {
  const btnAbrir   = document.getElementById('btnGerenciarProgramas');
  const modal      = document.getElementById('modalGerenciarProgramas');
  const btnFechar  = document.getElementById('btnFecharGerenciar');
  const titulo     = document.getElementById('tituloModalGerenciar');

  const vistaProgramas = document.getElementById('vistaProgramas');
  const vistaCursos    = document.getElementById('vistaCursos');
  const vistaAulas     = document.getElementById('vistaAulas');

  let programaAtual = null;
  let cursoAtual    = null;

  // Formata data ISO para o padrão brasileiro (ex.: "20 jun. 2026")
  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function abrirModal() {
    modal.classList.add('aberto');
    mostrarVistaProgramas();
  }
  function fecharModal() {
    modal.classList.remove('aberto');
  }
  if (btnAbrir)  btnAbrir.addEventListener('click', abrirModal);
  if (btnFechar) btnFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) fecharModal(); });

  function mostrarVistaProgramas() {
    titulo.textContent = 'Gerenciar Programas';
    vistaProgramas.style.display = '';
    vistaCursos.style.display = 'none';
    vistaAulas.style.display = 'none';
    resetFormPrograma();
    carregarProgramas();
  }

  function mostrarVistaCursos(programa) {
    programaAtual = programa;
    titulo.textContent = 'Gerenciar Cursos';
    document.getElementById('subtituloCursos').textContent = 'Programa: ' + programa.titulo;
    vistaProgramas.style.display = 'none';
    vistaCursos.style.display = '';
    vistaAulas.style.display = 'none';
    resetFormCurso();
    carregarCursos();
  }

  function mostrarVistaAulas(curso) {
    cursoAtual = curso;
    titulo.textContent = 'Gerenciar Aulas';
    document.getElementById('subtituloAulas').textContent = 'Curso: ' + curso.titulo;
    vistaProgramas.style.display = 'none';
    vistaCursos.style.display = 'none';
    vistaAulas.style.display = '';
    resetFormAula();
    carregarAulas();
  }

  document.getElementById('btnVoltarProgramas').addEventListener('click', mostrarVistaProgramas);
  document.getElementById('btnVoltarCursos').addEventListener('click', function () { mostrarVistaCursos(programaAtual); });

  // ===================== PROGRAMAS =====================
  const formPrograma = document.getElementById('formPrograma');
  const erroPrograma  = document.getElementById('erroPrograma');
  const btnCancelarEdicaoPrograma = document.getElementById('btnCancelarEdicaoPrograma');
  const btnSalvarPrograma = document.getElementById('btnSalvarPrograma');

  async function carregarProgramas() {
    const lista = document.getElementById('listaProgramasGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando programas...</p>';
    try {
      const res = await fetch('/programas');
      if (!res.ok) throw new Error('Erro ao carregar programas');
      renderizarProgramas(await res.json());
    } catch (err) {
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os programas.</p>';
    }
  }

  function renderizarProgramas(programas) {
    const lista = document.getElementById('listaProgramasGerenciar');
    if (!programas || programas.length === 0) {
      lista.innerHTML = '<p class="estado-carregando">Nenhum programa cadastrado ainda. Use o formulário acima para criar o primeiro.</p>';
      return;
    }

    lista.innerHTML = programas.map(function (p) {
      return '<div class="gerenciar-item" data-id="' + p.id_programa + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">' + p.titulo + '<span class="gerenciar-item__badge">' + (p.tipo || 'Pulse Mais') + '</span></span>' +
          '<span class="gerenciar-item__meta">' + formatarData(p.inicio) + ' até ' + formatarData(p.fim) + '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' +
          '<button type="button" class="btn btn--outline btn-ver-cursos">Ver Cursos</button>' +
          '<button type="button" class="btn btn--outline btn-editar-programa">Editar</button>' +
          '<button type="button" class="btn btn--danger btn-excluir-programa">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const id = Number(item.dataset.id);
      const programa = programas.find(function (p) { return p.id_programa === id; });
      item.querySelector('.btn-ver-cursos').addEventListener('click', function () { mostrarVistaCursos(programa); });
      item.querySelector('.btn-editar-programa').addEventListener('click', function () { preencherFormPrograma(programa); });
      item.querySelector('.btn-excluir-programa').addEventListener('click', function () { excluirPrograma(programa); });
    });
  }

  function preencherFormPrograma(programa) {
    document.getElementById('programaEditId').value = programa.id_programa;
    document.getElementById('programaTitulo').value = programa.titulo;
    document.getElementById('programaTipo').value    = programa.tipo || 'Pulse Mais';
    document.getElementById('programaInicio').value  = programa.inicio;
    document.getElementById('programaFim').value     = programa.fim;
    btnSalvarPrograma.textContent = 'Salvar Alterações';
    btnCancelarEdicaoPrograma.style.display = '';
    erroPrograma.style.display = 'none';
  }

  function resetFormPrograma() {
    formPrograma.reset();
    document.getElementById('programaEditId').value = '';
    btnSalvarPrograma.textContent = '+ Adicionar Programa';
    btnCancelarEdicaoPrograma.style.display = 'none';
    erroPrograma.style.display = 'none';
  }

  btnCancelarEdicaoPrograma.addEventListener('click', resetFormPrograma);

  formPrograma.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroPrograma.style.display = 'none';

    const id = document.getElementById('programaEditId').value;
    const dados = {
      titulo: document.getElementById('programaTitulo').value,
      tipo:   document.getElementById('programaTipo').value,
      inicio: document.getElementById('programaInicio').value,
      fim:    document.getElementById('programaFim').value,
    };

    btnSalvarPrograma.disabled = true;
    try {
      const url    = id ? '/programas/' + id : '/programas';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Erro ao salvar programa');
      resetFormPrograma();
      carregarProgramas();
    } catch (err) {
      erroPrograma.textContent = err.message;
      erroPrograma.style.display = 'block';
    } finally {
      btnSalvarPrograma.disabled = false;
    }
  });

  async function excluirPrograma(programa) {
    if (!confirm('Excluir o programa "' + programa.titulo + '"? Isso também remove seus cursos e aulas.')) return;
    try {
      const res = await fetch('/programas/' + programa.id_programa, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarProgramas();
    } catch (err) {
      alert('Não foi possível excluir o programa: ' + err.message);
    }
  }

  // ===================== CURSOS =====================
  const formCurso = document.getElementById('formCurso');
  const erroCurso  = document.getElementById('erroCurso');
  const btnCancelarEdicaoCurso = document.getElementById('btnCancelarEdicaoCurso');
  const btnSalvarCurso = document.getElementById('btnSalvarCurso');

  function resetFormCurso() {
    formCurso.reset();
    document.getElementById('cursoEditId').value = '';
    document.getElementById('cursoOrdem').value = '1';
    btnSalvarCurso.textContent = '+ Adicionar Curso';
    btnCancelarEdicaoCurso.style.display = 'none';
    erroCurso.style.display = 'none';
  }

  btnCancelarEdicaoCurso.addEventListener('click', resetFormCurso);

  async function carregarCursos() {
    const lista = document.getElementById('listaCursosGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando cursos...</p>';
    try {
      const res = await fetch('/programas/' + programaAtual.id_programa + '/cursos');
      if (!res.ok) throw new Error('Erro ao carregar cursos');
      renderizarCursos(await res.json());
    } catch (err) {
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os cursos.</p>';
    }
  }

  function renderizarCursos(cursos) {
    const lista = document.getElementById('listaCursosGerenciar');
    if (!cursos || cursos.length === 0) {
      lista.innerHTML = '<p class="estado-carregando">Nenhum curso cadastrado neste programa ainda.</p>';
      return;
    }

    lista.innerHTML = cursos.map(function (c) {
      return '<div class="gerenciar-item" data-id="' + c.id_curso + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">' + c.titulo + '</span>' +
          '<span class="gerenciar-item__meta">Ordem: ' + c.ordem + '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' +
          '<button type="button" class="btn btn--outline btn-ver-aulas">Ver Aulas</button>' +
          '<button type="button" class="btn btn--outline btn-editar-curso">Editar</button>' +
          '<button type="button" class="btn btn--danger btn-excluir-curso">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const id = Number(item.dataset.id);
      const curso = cursos.find(function (c) { return c.id_curso === id; });
      item.querySelector('.btn-ver-aulas').addEventListener('click', function () { mostrarVistaAulas(curso); });
      item.querySelector('.btn-editar-curso').addEventListener('click', function () { preencherFormCurso(curso); });
      item.querySelector('.btn-excluir-curso').addEventListener('click', function () { excluirCurso(curso); });
    });
  }

  function preencherFormCurso(curso) {
    document.getElementById('cursoEditId').value = curso.id_curso;
    document.getElementById('cursoTitulo').value = curso.titulo;
    document.getElementById('cursoOrdem').value  = curso.ordem;
    btnSalvarCurso.textContent = 'Salvar Alterações';
    btnCancelarEdicaoCurso.style.display = '';
    erroCurso.style.display = 'none';
  }

  formCurso.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroCurso.style.display = 'none';

    const id = document.getElementById('cursoEditId').value;
    const dados = {
      titulo: document.getElementById('cursoTitulo').value,
      ordem:  Number(document.getElementById('cursoOrdem').value) || 1,
    };

    btnSalvarCurso.disabled = true;
    try {
      const url    = id ? '/cursos/' + id : '/programas/' + programaAtual.id_programa + '/cursos';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Erro ao salvar curso');
      resetFormCurso();
      carregarCursos();
    } catch (err) {
      erroCurso.textContent = err.message;
      erroCurso.style.display = 'block';
    } finally {
      btnSalvarCurso.disabled = false;
    }
  });

  async function excluirCurso(curso) {
    if (!confirm('Excluir o curso "' + curso.titulo + '"? Isso também remove suas aulas.')) return;
    try {
      const res = await fetch('/cursos/' + curso.id_curso, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarCursos();
    } catch (err) {
      alert('Não foi possível excluir o curso: ' + err.message);
    }
  }

  // ===================== AULAS =====================
  const formAula = document.getElementById('formAula');
  const erroAula  = document.getElementById('erroAula');
  const btnCancelarEdicaoAula = document.getElementById('btnCancelarEdicaoAula');
  const btnSalvarAula = document.getElementById('btnSalvarAula');

  function resetFormAula() {
    formAula.reset();
    document.getElementById('aulaEditId').value = '';
    btnSalvarAula.textContent = '+ Adicionar Aula';
    btnCancelarEdicaoAula.style.display = 'none';
    erroAula.style.display = 'none';
  }

  btnCancelarEdicaoAula.addEventListener('click', resetFormAula);

  async function carregarAulas() {
    const lista = document.getElementById('listaAulasGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando aulas...</p>';
    try {
      const res = await fetch('/cursos/' + cursoAtual.id_curso + '/aulas');
      if (!res.ok) throw new Error('Erro ao carregar aulas');
      renderizarAulas(await res.json());
    } catch (err) {
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar as aulas.</p>';
    }
  }

  function renderizarAulas(aulas) {
    const lista = document.getElementById('listaAulasGerenciar');
    if (!aulas || aulas.length === 0) {
      lista.innerHTML = '<p class="estado-carregando">Nenhuma aula cadastrada neste curso ainda.</p>';
      return;
    }

    lista.innerHTML = aulas.map(function (a) {
      return '<div class="gerenciar-item" data-id="' + a.id_aula + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">Aula ' + a.numero + ' — ' + a.titulo + '</span>' +
          '<span class="gerenciar-item__meta">' + (a.data_aula ? formatarData(a.data_aula) : 'Sem data definida') + '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' +
          '<button type="button" class="btn btn--outline btn-editar-aula">Editar</button>' +
          '<button type="button" class="btn btn--danger btn-excluir-aula">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const id = Number(item.dataset.id);
      const aula = aulas.find(function (a) { return a.id_aula === id; });
      item.querySelector('.btn-editar-aula').addEventListener('click', function () { preencherFormAula(aula); });
      item.querySelector('.btn-excluir-aula').addEventListener('click', function () { excluirAula(aula); });
    });
  }

  function preencherFormAula(aula) {
    document.getElementById('aulaEditId').value = aula.id_aula;
    document.getElementById('aulaNumero').value = aula.numero;
    document.getElementById('aulaTitulo').value  = aula.titulo;
    document.getElementById('aulaData').value    = aula.data_aula || '';
    btnSalvarAula.textContent = 'Salvar Alterações';
    btnCancelarEdicaoAula.style.display = '';
    erroAula.style.display = 'none';
  }

  formAula.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroAula.style.display = 'none';

    const id = document.getElementById('aulaEditId').value;
    const dados = {
      numero:    Number(document.getElementById('aulaNumero').value),
      titulo:    document.getElementById('aulaTitulo').value,
      data_aula: document.getElementById('aulaData').value || null,
    };

    btnSalvarAula.disabled = true;
    try {
      const url    = id ? '/aulas/' + id : '/cursos/' + cursoAtual.id_curso + '/aulas';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Erro ao salvar aula');
      resetFormAula();
      carregarAulas();
    } catch (err) {
      erroAula.textContent = err.message;
      erroAula.style.display = 'block';
    } finally {
      btnSalvarAula.disabled = false;
    }
  });

  async function excluirAula(aula) {
    if (!confirm('Excluir a aula "' + aula.titulo + '"?')) return;
    try {
      const res = await fetch('/aulas/' + aula.id_aula, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarAulas();
    } catch (err) {
      alert('Não foi possível excluir a aula: ' + err.message);
    }
  }
});
