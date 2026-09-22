// Escapa caracteres HTML para prevenir XSS
function sanitize(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {

  // Guard: redireciona se não autenticado ou se não for mentor
  if (!Auth.isAuthenticated()) { window.location.replace('../index.html'); return; }
  const sessao = Auth.getUsuario();
  if (!sessao || sessao.perfil !== 'mentor') { window.location.replace('../index.html'); return; }

  const nomeMentor = sessao.nome || 'Mentor';
  const sidebarNome = document.getElementById('sidebarNome');
  if (sidebarNome) sidebarNome.textContent = nomeMentor;

  // Carrega foto do mentor na sidebar (mesmo padrão das demais páginas do mentor)
  (function () {
    var foto = localStorage.getItem('fotoMentor');
    var el = document.getElementById('sidebarAvatar');
    if (foto && el) el.src = foto;
    Auth.fetch('/usuarios/' + sessao.id_usuario)
      .then(function (dados) {
        if (dados && dados.foto_url) {
          if (el) el.src = dados.foto_url;
          try { localStorage.setItem('fotoMentor', dados.foto_url); } catch (e) {}
        }
      }).catch(function () {});
  })();

  // O relatório registra uma mentoria que já ocorreu: data futura não faz sentido aqui
  const campoDataMentoria = document.getElementById('campoDataMentoria');
  if (campoDataMentoria) campoDataMentoria.max = new Date().toISOString().split('T')[0];

  const params  = new URLSearchParams(window.location.search);
  const idAluno = params.get('id');

  if (!idAluno) {
    window.location.href = 'alunosAssociados.html';
    return;
  }

  const tituloPagina    = document.getElementById('tituloPagina');
  const campoNome       = document.getElementById('campoNome');
  const campoEmail      = document.getElementById('campoEmail');
  const campoPrograma   = document.getElementById('campoPrograma');
  const campoTelefone   = document.getElementById('campoTelefone');
  const listaHistorico  = document.getElementById('listaHistorico');

  const modalNovo        = document.getElementById('modalNovoRelatorio');
  const btnNovoRelatorio = document.getElementById('btnNovoRelatorio');
  const btnFecharModal   = document.getElementById('btnFecharModal');
  const btnCancelarModal = document.getElementById('btnCancelarModal');
  const formNovo         = document.getElementById('formNovoRelatorio');
  const campoAlunoModal  = document.getElementById('campoAlunoModal');

  const modalVer          = document.getElementById('modalVerRelatorio');
  const btnFecharVerModal = document.getElementById('btnFecharVerModal');
  const btnFecharVerRel   = document.getElementById('btnFecharVerRelatorio');

  let nomeAlunoAtual = '';

  // Busca os dados do aluno selecionado via GET /alunos/:id/perfil e preenche os campos da tela
  async function carregarDadosAluno() {
    try {
      const dados = await Auth.fetch(`/alunos/${idAluno}/perfil`);

      // A API pode retornar os dados aninhados em `usuario` ou direto no objeto raiz
      const aluno = dados.usuario || dados;
      nomeAlunoAtual = aluno.nome || '—';

      if (tituloPagina)  tituloPagina.textContent  = nomeAlunoAtual;
      if (campoNome)     campoNome.textContent      = nomeAlunoAtual;
      if (campoEmail)    campoEmail.textContent     = aluno.email      || '—';
      if (campoPrograma) campoPrograma.textContent  = dados.programa_ingresso || aluno.programa || '—';
      // telefone vem no nível raiz do perfil (dados.telefone), não dentro de `usuario`;
      // mantém aluno.telefone como fallback caso a API retorne um objeto achatado
      if (campoTelefone) campoTelefone.textContent  = dados.telefone || aluno.telefone || '—';

      if (campoAlunoModal) campoAlunoModal.value = nomeAlunoAtual;

    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
      if (campoNome) campoNome.textContent = 'Não foi possível carregar os dados.';
    }
  }

  // Busca o histórico de mentorias do aluno via GET /mentorias?id_aluno=:id e renderiza a tabela
  async function carregarHistorico() {
    try {
      const endpoint = `/mentorias?id_aluno=${idAluno}`;

      const mentorias = await Auth.fetch(endpoint);
      renderizarHistorico(mentorias);

    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      renderizarHistorico([]);
    }
  }

  // Renderiza as linhas da tabela de histórico de mentorias com botão de ver relatório
  function renderizarHistorico(lista) {
    if (!lista || lista.length === 0) {
      listaHistorico.innerHTML = `
        <tr>
          <td colspan="4" class="historico-vazio">
            Nenhuma mentoria registrada ainda.
          </td>
        </tr>`;
      return;
    }

    listaHistorico.innerHTML = lista.map(m => {
      const data  = m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '—';
      const tema  = sanitize(m.tema || '—');
      const id    = m.id_mentoria;
      const realizada = m.realizada;
      // Badge de status + botões para o mentor marcar se a mentoria aconteceu
      var statusHtml;
      if (realizada === true) {
        statusHtml = '<span class="badge badge--presente">Sim</span>'
          + ' <button class="btn-acao btn-acao--sm" onclick="marcarRealizada(' + id + ', null)" title="Desfazer">↩</button>';
      } else if (realizada === false) {
        statusHtml = '<span class="badge badge--ausente">Não</span>'
          + ' <button class="btn-acao btn-acao--sm" onclick="marcarRealizada(' + id + ', null)" title="Desfazer">↩</button>';
      } else {
        statusHtml = '<button class="btn-acao btn-acao--sm" onclick="marcarRealizada(' + id + ', true)" title="Sim, aconteceu">✓</button>'
          + ' <button class="btn-acao btn-acao--sm" onclick="marcarRealizada(' + id + ', false)" title="Não aconteceu">✕</button>';
      }
      return `
        <tr>
          <td>${data}</td>
          <td>${tema}</td>
          <td><div class="td-acoes">${statusHtml}</div></td>
          <td>
            <div class="td-acoes">
              <button class="btn-acao" onclick="verRelatorio(${id})" data-id="${id}">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver Relatório
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  // Abre o modal com os detalhes de uma mentoria específica via GET /mentorias/:id
  window.verRelatorio = async function (idMentoria) {
    try {
      const m = await Auth.fetch(`/mentorias/${idMentoria}`);

      document.getElementById('verData').textContent            = m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '—';
      document.getElementById('verTema').textContent            = m.tema || '—';
      document.getElementById('verRelatorio').textContent       = m.relatorio || 'Sem relatório registrado.';
      document.getElementById('verEncaminhamentos').textContent = m.encaminhamentos || 'Nenhum encaminhamento.';

      abrirModal(modalVer);

    } catch (err) {
      console.error('Erro ao buscar relatório:', err);
      alert('Não foi possível carregar o relatório.');
    }
  };

  // Atualiza o campo "realizada" de uma mentoria (true, false ou null para resetar)
  window.marcarRealizada = async function (idMentoria, valor) {
    try {
      await Auth.fetch('/mentorias/' + idMentoria, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realizada: valor }),
      });
      // Recarrega a tabela para refletir a mudança
      carregarHistorico();
    } catch (err) {
      console.error('Erro ao marcar mentoria:', err);
      alert('Não foi possível atualizar o status da mentoria.');
    }
  };

  // Envia um novo relatório de mentoria via POST /mentorias e recarrega o histórico
  formNovo.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btnSalvar = document.getElementById('btnSalvarRelatorio');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const sessaoMentor = Auth.getUsuario();
    const idMentor = sessaoMentor ? String(sessaoMentor.id_usuario) : null;

    if (!idMentor) {
      alert('Sessão expirada. Faça login novamente.');
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
      return;
    }

    const payload = {
      id_aluno:         Number(idAluno),
      id_mentor:        Number(idMentor),
      data:             document.getElementById('campoDataMentoria').value,
      tema:             document.getElementById('campoTemaModal').value,
      relatorio:        document.getElementById('campoRelatorio').value,
      encaminhamentos:  document.getElementById('campoEncaminhamentos').value,
      formato:          'individual',
      duracao:          60,
    };

    try {
      await Auth.fetch('/mentorias', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      fecharModal(modalNovo);
      formNovo.reset();
      if (campoAlunoModal) campoAlunoModal.value = nomeAlunoAtual;
      const campoTema = document.getElementById('campoTemaModal');
      if (campoTema) campoTema.value = '';
      await carregarHistorico();

    } catch (err) {
      console.error('Erro ao salvar relatório:', err);
      alert('Não foi possível salvar o relatório. Tente novamente.');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });

  // Adiciona ou remove a classe 'aberto' no modal para controlar visibilidade
  function abrirModal(modal)  { modal.classList.add('aberto');    }
  function fecharModal(modal) { modal.classList.remove('aberto'); }

  btnNovoRelatorio.addEventListener('click',  () => abrirModal(modalNovo));
  btnFecharModal.addEventListener('click',    () => fecharModal(modalNovo));
  btnCancelarModal.addEventListener('click',  () => fecharModal(modalNovo));
  btnFecharVerModal.addEventListener('click', () => fecharModal(modalVer));
  btnFecharVerRel.addEventListener('click',   () => fecharModal(modalVer));

  // Fecha ao clicar no fundo escuro (fora do conteúdo do modal)
  [modalNovo, modalVer].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModal(modal);
    });
  });

  // Fecha qualquer modal aberto com a tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModal(modalNovo);
      fecharModal(modalVer);
    }
  });

  // ========================================================================
  // ENCONTROS DO PROGRAMA
  // Busca matriculas do aluno, cursos, aulas e frequencia para montar
  // a tabela de encontros com status de presenca.
  // ========================================================================
  async function carregarEncontros() {
    const tbody = document.getElementById('listaEncontros');
    try {
      // 1) Matriculas do aluno → programas
      const matriculas = await Auth.fetch('/matriculas/aluno/' + idAluno) || [];
      if (matriculas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="historico-vazio">Nenhuma matricula encontrada.</td></tr>';
        return;
      }

      // 2) Frequencia do aluno (mapa id_aula → status)
      let freqMap = {};
      try {
        const freq = await Auth.fetch('/frequencia?id_aluno=' + idAluno) || [];
        freq.forEach(function (r) { freqMap[r.id_aula] = r.status; });
      } catch (e) { /* tabela pode nao existir ainda */ }

      // 3) Para cada programa, buscar cursos e aulas
      const linhas = [];
      for (let i = 0; i < matriculas.length; i++) {
        const idProg = matriculas[i].id_programa;
        if (!idProg) continue;
        try {
          const cursos = await Auth.fetch('/programas/' + idProg + '/cursos') || [];
          for (let c = 0; c < cursos.length; c++) {
            try {
              const aulas = await Auth.fetch('/cursos/' + cursos[c].id_curso + '/aulas') || [];
              aulas.forEach(function (a) {
                const status = freqMap[a.id_aula] || freqMap[a.id] || '—';
                linhas.push({
                  data: a.data_aula || '',
                  curso: cursos[c].titulo || cursos[c].nome || 'Curso',
                  aula: (a.numero ? 'Aula ' + a.numero : '') + (a.titulo ? ' — ' + a.titulo : ''),
                  status: status,
                });
              });
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (linhas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="historico-vazio">Nenhum encontro registrado.</td></tr>';
        return;
      }

      // Ordena por data
      linhas.sort(function (a, b) { return (a.data || '').localeCompare(b.data || ''); });

      tbody.innerHTML = linhas.map(function (l) {
        const dataStr = l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '—';
        const badgeClass = l.status === 'presente' ? 'badge--ativo' : (l.status === 'ausente' ? 'badge--inativo' : '');
        const statusLabel = l.status === 'presente' ? 'Presente' : (l.status === 'ausente' ? 'Ausente' : '—');

        return '<tr>' +
          '<td>' + dataStr + '</td>' +
          '<td>' + sanitize(l.curso) + '</td>' +
          '<td>' + sanitize(l.aula) + '</td>' +
          '<td>' + (badgeClass ? '<span class="badge ' + badgeClass + '">' + statusLabel + '</span>' : statusLabel) + '</td>' +
          '</tr>';
      }).join('');

    } catch (err) {
      console.error('Erro ao carregar encontros:', err);
      tbody.innerHTML = '<tr><td colspan="4" class="historico-vazio">Nao foi possivel carregar os encontros.</td></tr>';
    }
  }

  carregarDadosAluno();
  carregarHistorico();
  carregarEncontros();

});

// Remove a sessão do mentor e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}
