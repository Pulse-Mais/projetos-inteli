// Registro de presença em eventos pelo coordenador. Fluxo: criar/selecionar um Evento,
// ver a lista de alunos ativos e marcar quem esteve presente. Quem não é marcado
// simplesmente não recebe registro em `participa_evento` — não existe estado "ausente"
// armazenado, só "presente" (linha existe) ou "sem registro" (linha não existe), o que já
// é como o restante do sistema usa essa tabela (ex: contagem de eventos no perfil do aluno).
document.addEventListener('DOMContentLoaded', function () {
  const btnAbrir  = document.getElementById('btnRegistrarEventos');
  const modal     = document.getElementById('modalEventos');
  const btnFechar = document.getElementById('btnFecharEventos');
  const titulo    = document.getElementById('tituloModalEventos');

  const vistaEventosLista = document.getElementById('vistaEventosLista');
  const vistaPresencas    = document.getElementById('vistaPresencas');

  if (!btnAbrir || !modal) return;

  let eventoAtual = null;
  let todosAlunosAtivos = [];
  let presencasExistentes = []; // ids dos alunos já com registro em participa_evento para o evento atual

  function abrirModal() {
    modal.classList.add('aberto');
    mostrarVistaEventos();
  }
  function fecharModal() { modal.classList.remove('aberto'); }
  btnAbrir.addEventListener('click', abrirModal);
  btnFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) fecharModal(); });

  function mostrarVistaEventos() {
    titulo.textContent = 'Presença em Eventos';
    vistaEventosLista.style.display = '';
    vistaPresencas.style.display = 'none';
    resetFormEvento();
    carregarEventos();
  }

  function mostrarVistaPresencas(evento) {
    eventoAtual = evento;
    titulo.textContent = 'Registrar Presença';
    document.getElementById('subtituloPresencas').textContent =
      evento.nome + ' — ' + formatarDataHora(evento.data) + ' · ' + evento.local;
    vistaEventosLista.style.display = 'none';
    vistaPresencas.style.display = '';
    document.getElementById('buscaAlunoPresenca').value = '';
    carregarPresencas();
  }
  document.getElementById('btnVoltarEventos').addEventListener('click', mostrarVistaEventos);

  function formatarDataHora(isoDateTime) {
    if (!isoDateTime) return '';
    const d = new Date(isoDateTime);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ===================== EVENTOS =====================
  const formEvento = document.getElementById('formEvento');
  const erroEvento  = document.getElementById('erroEvento');
  const btnCancelarEdicaoEvento = document.getElementById('btnCancelarEdicaoEvento');
  const btnSalvarEvento = document.getElementById('btnSalvarEvento');

  function resetFormEvento() {
    formEvento.reset();
    document.getElementById('eventoEditId').value = '';
    btnSalvarEvento.textContent = '+ Adicionar Evento';
    btnCancelarEdicaoEvento.style.display = 'none';
    erroEvento.style.display = 'none';
  }
  btnCancelarEdicaoEvento.addEventListener('click', resetFormEvento);

  async function carregarEventos() {
    const lista = document.getElementById('listaEventosGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando eventos...</p>';
    try {
      const res = await fetch('/eventos');
      if (!res.ok) throw new Error('Erro ao carregar eventos');
      renderizarEventos(await res.json());
    } catch (err) {
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os eventos.</p>';
    }
  }

  function renderizarEventos(eventos) {
    const lista = document.getElementById('listaEventosGerenciar');
    if (!eventos.length) {
      lista.innerHTML = '<p class="estado-carregando">Nenhum evento cadastrado ainda.</p>';
      return;
    }
    // Mais recentes primeiro
    eventos = eventos.slice().sort(function (a, b) { return new Date(b.data) - new Date(a.data); });

    lista.innerHTML = eventos.map(function (e) {
      return '<div class="gerenciar-item" data-id="' + e.id_evento + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">' + e.nome + '</span>' +
          '<span class="gerenciar-item__meta">' + formatarDataHora(e.data) + ' · ' + e.local + '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' +
          '<button type="button" class="btn btn--outline btn-registrar-presenca">Registrar Presença</button>' +
          '<button type="button" class="btn btn--outline btn-editar-evento">Editar</button>' +
          '<button type="button" class="btn btn--danger btn-excluir-evento">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const id = Number(item.dataset.id);
      const evento = eventos.find(function (e) { return e.id_evento === id; });
      item.querySelector('.btn-registrar-presenca').addEventListener('click', function () { mostrarVistaPresencas(evento); });
      item.querySelector('.btn-editar-evento').addEventListener('click', function () { preencherFormEvento(evento); });
      item.querySelector('.btn-excluir-evento').addEventListener('click', function () { excluirEvento(evento); });
    });
  }

  function preencherFormEvento(evento) {
    document.getElementById('eventoEditId').value = evento.id_evento;
    document.getElementById('eventoNome').value = evento.nome;
    document.getElementById('eventoLocal').value = evento.local;
    // Os campos de data e hora são separados (para usar o calendário customizado);
    // aqui quebramos o timestamp salvo em "YYYY-MM-DD" + "HH:mm" no horário local.
    const d = new Date(evento.data);
    const offsetMs = d.getTimezoneOffset() * 60000;
    const localIso = new Date(d - offsetMs).toISOString();
    document.getElementById('eventoDataDia').value = localIso.slice(0, 10);
    document.getElementById('eventoDataHora').value = localIso.slice(11, 16);
    document.getElementById('eventoDataDia').dispatchEvent(new Event('input', { bubbles: true }));
    btnSalvarEvento.textContent = 'Salvar Alterações';
    btnCancelarEdicaoEvento.style.display = '';
  }

  formEvento.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroEvento.style.display = 'none';

    const id = document.getElementById('eventoEditId').value;
    const dia = document.getElementById('eventoDataDia').value;
    const hora = document.getElementById('eventoDataHora').value;
    const dados = {
      nome: document.getElementById('eventoNome').value,
      data: dia && hora ? dia + 'T' + hora : '',
      local: document.getElementById('eventoLocal').value,
    };

    btnSalvarEvento.disabled = true;
    try {
      const url = id ? '/eventos/' + id : '/eventos';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Erro ao salvar evento');
      resetFormEvento();
      carregarEventos();
    } catch (err) {
      erroEvento.textContent = err.message;
      erroEvento.style.display = 'block';
    } finally {
      btnSalvarEvento.disabled = false;
    }
  });

  async function excluirEvento(evento) {
    if (!confirm('Excluir o evento "' + evento.nome + '"? Isso também remove os registros de presença.')) return;
    try {
      const res = await fetch('/eventos/' + evento.id_evento, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarEventos();
    } catch (err) {
      alert('Não foi possível excluir o evento: ' + err.message);
    }
  }

  // ===================== PRESENÇAS =====================
  async function carregarPresencas() {
    const lista = document.getElementById('listaPresencasGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando alunos...</p>';
    try {
      const [alunosRes, presencasRes] = await Promise.all([
        fetch('/alunos'),
        fetch('/participacoes-evento/evento/' + eventoAtual.id_evento),
      ]);
      if (!alunosRes.ok) throw new Error('Erro ao carregar alunos');
      todosAlunosAtivos = await alunosRes.json();
      const presencas = presencasRes.ok ? await presencasRes.json() : [];
      presencasExistentes = presencas.map(function (p) { return p.id_aluno; });

      renderizarPresencas(todosAlunosAtivos);
    } catch (err) {
      console.error(err);
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os alunos.</p>';
    }
  }

  function renderizarPresencas(alunos) {
    const lista = document.getElementById('listaPresencasGerenciar');
    if (!alunos.length) {
      lista.innerHTML = '<p class="estado-carregando">Nenhum aluno ativo cadastrado.</p>';
      return;
    }
    lista.innerHTML = alunos.map(function (a) {
      const nome = a.usuario ? a.usuario.nome : 'Aluno #' + a.id_usuario;
      const marcado = presencasExistentes.indexOf(a.id_usuario) !== -1;
      return '<label class="gerenciar-item" style="cursor:pointer;" data-nome="' + nome.toLowerCase() + '">' +
        '<input type="checkbox" class="checkbox-presenca" data-id-aluno="' + a.id_usuario + '" style="margin-right:12px;" ' + (marcado ? 'checked' : '') + '>' +
        '<div class="gerenciar-item__info" style="flex:1;">' +
          '<span class="gerenciar-item__titulo">' + nome + '</span>' +
        '</div>' +
      '</label>';
    }).join('');
  }

  document.getElementById('buscaAlunoPresenca').addEventListener('input', function () {
    const termo = this.value.trim().toLowerCase();
    document.querySelectorAll('#listaPresencasGerenciar .gerenciar-item').forEach(function (item) {
      item.style.display = item.dataset.nome.indexOf(termo) !== -1 ? '' : 'none';
    });
  });

  document.getElementById('btnSalvarPresencas').addEventListener('click', async function () {
    const btn = this;
    const marcadosAgora = Array.from(document.querySelectorAll('.checkbox-presenca:checked'))
      .map(function (cb) { return Number(cb.dataset.idAluno); });

    const paraAdicionar = marcadosAgora.filter(function (id) { return presencasExistentes.indexOf(id) === -1; });
    const paraRemover = presencasExistentes.filter(function (id) { return marcadosAgora.indexOf(id) === -1; });

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      await Promise.all(
        paraAdicionar.map(function (idAluno) {
          return fetch('/participacoes-evento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_evento: eventoAtual.id_evento, id_aluno: idAluno, presenca: true }),
          });
        }).concat(
          paraRemover.map(function (idAluno) {
            return fetch('/participacoes-evento/' + eventoAtual.id_evento + '/' + idAluno, { method: 'DELETE' });
          })
        )
      );
      presencasExistentes = marcadosAgora;
      alert('Presenças salvas com sucesso!');
    } catch (err) {
      alert('Não foi possível salvar todas as presenças: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar Presenças';
    }
  });
});
