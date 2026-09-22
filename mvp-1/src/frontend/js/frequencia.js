// Fluxo Programa -> Curso -> Aula -> Frequência: o curso é escolhido entre os do
// programa em que o aluno está matriculado (via tabela matricula), e as aulas vêm
// do curso selecionado. Nenhuma aula é fixa no código — tudo vem do banco.
let aulas = [];
let registrosSalvos = []; // frequência já gravada no banco, carregada uma vez no início

const listaAulas       = document.getElementById('listaAulas');
const percentualFreq   = document.getElementById('percentualFreq');
const barraFreq        = document.getElementById('barraFreq');
const totalRegistradas = document.getElementById('totalRegistradas');
const totalAulas       = document.getElementById('totalAulas');
const selectCurso      = document.getElementById('selectCurso');

// Lê o ID do aluno da URL (?id=X) para carregar e salvar frequências corretas
const urlParams = new URLSearchParams(window.location.search);
const idAluno   = urlParams.get('id');

// Recalcula e exibe o percentual de presença com base nos status atuais das aulas
function atualizarPercentual() {
  const registradas = aulas.filter(function (a) { return a.status !== null; }).length;
  const presentes   = aulas.filter(function (a) { return a.status === 'presente'; }).length;
  const percentual  = registradas > 0 ? Math.round((presentes / registradas) * 100) : 0;

  if (percentualFreq)   percentualFreq.textContent   = percentual + '%';
  if (barraFreq)        barraFreq.style.width         = percentual + '%';
  if (totalRegistradas) totalRegistradas.textContent  = registradas;
  if (totalAulas)       totalAulas.textContent        = aulas.length;

  if (barraFreq) {
    if (percentual >= 75)      barraFreq.style.background = '#25B057';
    else if (percentual >= 50) barraFreq.style.background = '#F59E0B';
    else                       barraFreq.style.background = '#DC2626';
  }
}

// Formata data ISO para o padrão brasileiro
function formatarData(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Renderiza a lista de aulas do curso selecionado
function renderizarAulas() {
  if (!listaAulas) return;

  if (aulas.length === 0) {
    listaAulas.innerHTML = '<p class="estado-carregando">Este curso ainda não tem aulas cadastradas. Peça ao coordenador para adicioná-las no Dashboard.</p>';
    atualizarPercentual();
    return;
  }

  listaAulas.innerHTML = '';

  aulas.forEach(function (aula) {
    const item = document.createElement('div');
    item.className = 'aula-item' + (aula.status ? ' aula-item--' + aula.status : '');
    item.id = 'aula-' + aula.id;

    item.innerHTML =
      '<div class="aula-info">' +
        '<p class="aula-info__nome">' + aula.nome + '</p>' +
        '<p class="aula-info__data">' + formatarData(aula.data) + '</p>' +
      '</div>' +
      '<div class="aula-botoes">' +
        '<button class="btn-presenca ' + (aula.status === 'presente' ? 'ativo' : '') + '" ' +
          'onclick="registrar(' + aula.id + ', \'presente\')">✓ Presente</button>' +
        '<button class="btn-ausencia ' + (aula.status === 'ausente' ? 'ativo' : '') + '" ' +
          'onclick="registrar(' + aula.id + ', \'ausente\')">✗ Ausente</button>' +
      '</div>';

    listaAulas.appendChild(item);
  });

  atualizarPercentual();
}

// Alterna o status de presença de uma aula; clicar no mesmo botão novamente limpa o status
function registrar(idAula, novoStatus) {
  const aula = aulas.find(function (a) { return a.id === idAula; });
  if (!aula) return;
  aula.status = (aula.status === novoStatus) ? null : novoStatus;
  renderizarAulas();
}

// Busca as aulas do curso selecionado via GET /cursos/:id/aulas e aplica a
// frequência já salva no banco (registrosSalvos, carregada uma única vez)
async function carregarAulasDoCurso(idCurso) {
  listaAulas.innerHTML = '<p class="estado-carregando">Carregando aulas...</p>';
  try {
    const res = await fetch('/cursos/' + idCurso + '/aulas');
    if (!res.ok) throw new Error('Erro ao carregar aulas');
    const dados = await res.json();
    aulas = dados.map(function (a) {
      const registro = registrosSalvos.find(function (r) { return r.id_aula === a.id_aula; });
      return {
        id: a.id_aula,
        nome: 'Aula ' + a.numero + ' — ' + a.titulo,
        data: a.data_aula || '',
        status: registro ? registro.status : null,
      };
    });
  } catch (err) {
    console.error('Erro ao carregar aulas do curso:', err);
    aulas = [];
    listaAulas.innerHTML = '<p class="estado-carregando">Não foi possível carregar as aulas deste curso.</p>';
    return;
  }
  renderizarAulas();
}

// Busca os cursos do programa em que o aluno está matriculado e popula o seletor
async function carregarCursosDoPrograma(idPrograma) {
  selectCurso.disabled = true;
  selectCurso.innerHTML = '<option value="">Carregando cursos...</option>';

  try {
    const res = await fetch('/programas/' + idPrograma + '/cursos');
    if (!res.ok) throw new Error('Erro ao carregar cursos');
    const cursos = await res.json();

    if (cursos.length === 0) {
      selectCurso.innerHTML = '<option value="">Nenhum curso cadastrado neste programa</option>';
      listaAulas.innerHTML = '<p class="estado-carregando">O programa deste aluno ainda não tem cursos cadastrados. Cadastre-os no Dashboard.</p>';
      return;
    }

    selectCurso.innerHTML = '<option value="">Selecione...</option>' +
      cursos.map(function (c) { return '<option value="' + c.id_curso + '">' + c.titulo + '</option>'; }).join('');
    selectCurso.disabled = false;
  } catch (err) {
    console.error('Erro ao carregar cursos do programa:', err);
    selectCurso.innerHTML = '<option value="">Erro ao carregar cursos</option>';
  }
}

selectCurso.addEventListener('change', function () {
  if (this.value) carregarAulasDoCurso(Number(this.value));
  else {
    aulas = [];
    listaAulas.innerHTML = '<p class="estado-carregando">Selecione um curso para ver as aulas.</p>';
    atualizarPercentual();
  }
});

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function () {

  // Sidebar
  const nome = localStorage.getItem('nomeUsuario') || 'C';
  const nomeCoord = document.getElementById('nomeCoord');
  if (nomeCoord) nomeCoord.textContent = nome;

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  // Corrige link "Voltar ao Perfil" com o ID real do aluno
  const linkVoltar = document.getElementById('linkVoltarPerfil');
  if (linkVoltar && idAluno) {
    linkVoltar.href = 'perfilAluno.html?id=' + idAluno;
  }

  configurarBtnSalvar();

  if (!idAluno) {
    selectCurso.innerHTML = '<option value="">Aluno não identificado</option>';
    listaAulas.innerHTML = '<p class="estado-carregando">Acesse esta página a partir do perfil do aluno.</p>';
    return;
  }

  // Carrega nome/programa do aluno, matrícula (-> programa) e frequência já salva, em paralelo
  Promise.all([
    fetch('/alunos/' + idAluno + '/portal').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch('/matriculas/aluno/' + idAluno).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
    fetch('/frequencia?id_aluno=' + idAluno).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
  ]).then(function (resultados) {
    const dadosAluno = resultados[0];
    const matriculas = resultados[1];
    registrosSalvos  = resultados[2];

    const subtitulo = document.getElementById('subtituloFrequencia');
    if (subtitulo && dadosAluno) {
      const nomeAluno = dadosAluno.usuario ? dadosAluno.usuario.nome : 'Aluno(a)';
      const prog = dadosAluno.programa_ingresso ? ' — ' + dadosAluno.programa_ingresso : '';
      subtitulo.textContent = 'Aluno(a): ' + nomeAluno + prog;
    }

    // Matrícula mais recente define o programa cujos cursos aparecem no seletor
    const matriculaAtual = matriculas && matriculas.length > 0 ? matriculas[0] : null;
    if (!matriculaAtual) {
      selectCurso.innerHTML = '<option value="">Aluno sem programa vinculado</option>';
      listaAulas.innerHTML = '<p class="estado-carregando">Este aluno não está matriculado em nenhum programa. Vincule-o a um programa no cadastro para registrar frequência.</p>';
      return;
    }

    carregarCursosDoPrograma(matriculaAtual.id_programa);
  });
});

// Configura o botão "Salvar Frequência" para persistir os registros no banco via API
function configurarBtnSalvar() {
  const btn = document.getElementById('btnSalvar');
  if (!btn) return;

  btn.addEventListener('click', function () {
    if (!idAluno) {
      alert('Não foi possível identificar o aluno. Acesse esta página a partir do perfil do aluno.');
      return;
    }

    const registros = aulas
      .filter(function (a) { return a.status !== null; })
      .map(function (a) { return { id: a.id, status: a.status }; });

    if (registros.length === 0) {
      alert('Marque pelo menos uma aula antes de salvar.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    fetch('/frequencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_aluno: Number(idAluno), registros: registros })
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (body) {
            throw new Error(body.error || body.message || 'Erro ' + r.status);
          });
        }
        alert('Frequência salva com sucesso!');
      })
      .catch(function (err) {
        alert('Não foi possível salvar a frequência: ' + err.message);
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Salvar Frequência';
      });
  });
}

function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    localStorage.clear();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
