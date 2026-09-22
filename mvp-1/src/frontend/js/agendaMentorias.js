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

  const hoje = new Date();
  let mesAtual  = hoje.getMonth();      // 0-11
  let anoAtual  = hoje.getFullYear();

  const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  let mentoriasDoMes = [];
  let mentorandosLista = [];
  let idAlunoSelecionado = null;
  let tipoBuscaAtivo = 'nome';

  const idMentor = String(sessao.id_usuario);
  const nomeMentor = sessao.nome || 'Mentor';

  const sidebarNome = document.getElementById('sidebarNome');
  if (sidebarNome) sidebarNome.textContent = nomeMentor;

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

  const tituloMesEl    = document.getElementById('tituloMes');
  const calendarioGrid = document.getElementById('calendarioGrid');
  const btnAnterior    = document.getElementById('btnMesAnterior');
  const btnProximo     = document.getElementById('btnProximoMes');
  const btnAgendar     = document.getElementById('btnAgendar');

  const modalAgendar       = document.getElementById('modalAgendar');
  const btnFecharAgendar   = document.getElementById('btnFecharAgendar');
  const btnCancelarAgendar = document.getElementById('btnCancelarAgendar');
  const formAgendar        = document.getElementById('formAgendar');
  const campoBuscaAluno    = document.getElementById('campoBuscaAluno');
  const resultadosBusca    = document.getElementById('resultadosBusca');
  const alunoSelecionadoInfo = document.getElementById('alunoSelecionadoInfo');

  // Renderiza o grid do calendário para o mês atual marcando os dias com mentorias
  function renderizarCalendario() {
    tituloMesEl.textContent = `${MESES_PT[mesAtual]} ${anoAtual}`;

    // Remove todas as células existentes, mantendo os 7 cabeçalhos
    const cabecalhos = calendarioGrid.querySelectorAll('.calendario-dia-semana');
    calendarioGrid.innerHTML = '';
    cabecalhos.forEach(c => calendarioGrid.appendChild(c));

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();  // 0=Dom
    const totalDias   = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const diasMesAnt  = new Date(anoAtual, mesAtual, 0).getDate();

    let celulas = [];

    // Dias do mês anterior para preencher o início da grade
    for (let i = primeiroDia - 1; i >= 0; i--) {
      celulas.push({ dia: diasMesAnt - i, outroMes: true });
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDias; d++) {
      celulas.push({ dia: d, outroMes: false });
    }

    // Dias do próximo mês para completar a última linha
    const resto = celulas.length % 7;
    if (resto !== 0) {
      for (let d = 1; d <= (7 - resto); d++) {
        celulas.push({ dia: d, outroMes: true, proximo: true });
      }
    }

    const totalLinhas = celulas.length / 7;

    celulas.forEach((celula, idx) => {
      const div = document.createElement('div');
      div.className = 'calendario-celula';

      const linhaAtual = Math.floor(idx / 7);
      if (linhaAtual === totalLinhas - 1) {
        div.classList.add('calendario-celula--ultima-linha');
      }

      if (celula.outroMes) {
        div.classList.add('calendario-celula--outro-mes');
      }

      // Verifica se há mentoria agendada neste dia específico
      const evento = !celula.outroMes
        ? mentoriasDoMes.find(m => {
            const dataM = new Date(m.data);
            return dataM.getDate() === celula.dia
              && dataM.getMonth() === mesAtual
              && dataM.getFullYear() === anoAtual;
          })
        : null;

      if (evento) {
        div.classList.add('calendario-celula--evento');
        const nomeAluno = sanitize(evento.nome_aluno || evento.aluno || '');
        div.innerHTML = `
          <span class="calendario-celula__dia">${celula.dia}</span>
          <span class="evento-label">Mentoria</span>
          ${nomeAluno ? `<span class="evento-aluno">${nomeAluno}</span>` : ''}
        `;
      } else {
        div.innerHTML = `<span class="calendario-celula__dia">${celula.dia}</span>`;
      }

      calendarioGrid.appendChild(div);
    });
  }

  // Busca as mentorias do mês atual do mentor logado via GET /mentores/:id/mentorias?mes=YYYY-MM
  async function buscarMentoriasMes() {
    try {
      const mesParam = String(mesAtual + 1).padStart(2, '0');
      if (!idMentor) {
        console.warn('idMentor nao encontrado no localStorage');
        mentoriasDoMes = [];
        renderizarCalendario();
        return;
      }
      const endpoint = `/mentores/${idMentor}/mentorias?mes=${anoAtual}-${mesParam}`;

      mentoriasDoMes = await Auth.fetch(endpoint);

    } catch (err) {
      console.error('Erro ao buscar mentorias do mês:', err);
      mentoriasDoMes = [];
    }

    renderizarCalendario();
  }

  // Busca os mentorandos associados ao mentor logado para popular a busca no modal
  async function carregarMentorandos() {
    try {
      if (!idMentor) {
        mentorandosLista = [];
        return;
      }
      const endpoint = `/mentores/${idMentor}/mentorandos`;
      mentorandosLista = await Auth.fetch(endpoint);
    } catch (err) {
      console.error('Erro ao carregar mentorandos para busca:', err);
      mentorandosLista = [];
    }
  }

  // Filtra os mentorandos pelo termo digitado e exibe os resultados abaixo do campo
  function filtrarMentorandos(termo) {
    if (!termo.trim()) {
      resultadosBusca.classList.remove('visivel');
      resultadosBusca.innerHTML = '';
      return;
    }

    const termoLower = termo.toLowerCase();
    const filtrados = mentorandosLista.filter(a => {
      if (tipoBuscaAtivo === 'nome') {
        return (a.nome || '').toLowerCase().includes(termoLower);
      }
      if (tipoBuscaAtivo === 'email') {
        return (a.email || '').toLowerCase().includes(termoLower);
      }
      return false;
    });

    if (filtrados.length === 0) {
      resultadosBusca.innerHTML = `
        <div class="resultado-item" style="color:var(--color-text-support); cursor:default;">
          Nenhum aluno encontrado.
        </div>`;
    } else {
      resultadosBusca.innerHTML = filtrados.map(a => `
        <div class="resultado-item" data-id="${a.id_usuario}" data-nome="${sanitize(a.nome || '')}">
          <span class="resultado-item__nome">${sanitize(a.nome || '—')}</span>
          <span class="resultado-item__detalhe">${sanitize(a.email || '')}</span>
        </div>
      `).join('');

      resultadosBusca.querySelectorAll('.resultado-item[data-id]').forEach(item => {
        item.addEventListener('click', () => selecionarAluno(item.dataset.id, item.dataset.nome));
      });
    }

    resultadosBusca.classList.add('visivel');
  }

  // Confirma a seleção de um aluno no modal e exibe o nome escolhido abaixo do campo de busca
  function selecionarAluno(id, nome) {
    idAlunoSelecionado = id;
    campoBuscaAluno.value = nome;
    resultadosBusca.classList.remove('visivel');
    alunoSelecionadoInfo.textContent = `Aluno selecionado: ${nome}`;
    alunoSelecionadoInfo.classList.add('visivel');
  }

  // Envia o agendamento de mentoria via POST /mentorias e atualiza o calendário ao concluir
  formAgendar.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!idAlunoSelecionado) {
      alert('Selecione um aluno antes de agendar.');
      return;
    }

    const btnConfirmar = document.getElementById('btnConfirmarAgendar');
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Agendando...';

    const data    = document.getElementById('campoData').value;
    const horario = document.getElementById('campoHorario').value;
    const tema    = document.getElementById('campoTema').value;
    const obs     = document.getElementById('campoObservacoes').value;

    if (!idMentor) {
      alert('Sessao expirada. Faca login novamente.');
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Agendar';
      return;
    }

    const payload = {
      id_aluno:    Number(idAlunoSelecionado),
      id_mentor:   Number(idMentor),
      data:        `${data}T${horario}:00`,
      tema:        tema,
      duracao:     60,
      formato:     'individual',
      observacoes: obs || undefined,
    };

    try {
      await Auth.fetch('/mentorias', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      fecharModal(modalAgendar);
      formAgendar.reset();
      idAlunoSelecionado = null;
      alunoSelecionadoInfo.classList.remove('visivel');
      await buscarMentoriasMes();

    } catch (err) {
      console.error('Erro ao agendar mentoria:', err);
      alert('Não foi possível agendar a mentoria. Tente novamente.');
    } finally {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Agendar';
    }
  });

  // Adiciona ou remove a classe 'aberto' no modal para controlar visibilidade
  function abrirModal(modal)  { modal.classList.add('aberto');    }
  function fecharModal(modal) { modal.classList.remove('aberto'); }

  btnAgendar.addEventListener('click', () => abrirModal(modalAgendar));
  btnFecharAgendar.addEventListener('click',   () => fecharModal(modalAgendar));
  btnCancelarAgendar.addEventListener('click', () => fecharModal(modalAgendar));

  // Fecha o modal ao clicar no fundo escuro (fora do conteúdo)
  modalAgendar.addEventListener('click', (e) => {
    if (e.target === modalAgendar) fecharModal(modalAgendar);
  });

  // Fecha o modal com a tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModal(modalAgendar);
  });

  // Navega para o mês anterior e recarrega as mentorias
  btnAnterior.addEventListener('click', () => {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    buscarMentoriasMes();
  });

  // Navega para o próximo mês e recarrega as mentorias
  btnProximo.addEventListener('click', () => {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    buscarMentoriasMes();
  });

  // Alterna o tipo de busca (nome/email) e reexecuta o filtro com o valor atual do campo
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('ativo'));
      this.classList.add('ativo');
      tipoBuscaAtivo = this.dataset.tipo;
      campoBuscaAluno.placeholder = tipoBuscaAtivo === 'email'
        ? 'Escreva o e-mail do aluno'
        : 'Escreva o nome do aluno';
      filtrarMentorandos(campoBuscaAluno.value);
    });
  });

  // Executa o filtro de mentorandos a cada caractere digitado no campo de busca do modal
  campoBuscaAluno.addEventListener('input', function () {
    idAlunoSelecionado = null;
    alunoSelecionadoInfo.classList.remove('visivel');
    filtrarMentorandos(this.value);
  });

  carregarMentorandos();
  buscarMentoriasMes();

});

// Remove a sessão do mentor e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}
