// Registro de entrega de atividades pelo coordenador. Fluxo: escolher um Programa,
// criar/selecionar uma Atividade do programa, e marcar a entrega de cada aluno
// matriculado. Status (Entregue/Pendente/Atrasado) é calculado a partir da existência
// de um registro em `realiza_entrega` e da data de entrega da atividade — não é uma
// coluna própria, então não exige nenhuma mudança de backend.
document.addEventListener('DOMContentLoaded', function () {
  const btnAbrir  = document.getElementById('btnRegistrarAtividades');
  const modal     = document.getElementById('modalAtividades');
  const btnFechar = document.getElementById('btnFecharAtividades');
  const titulo    = document.getElementById('tituloModalAtividades');

  const vistaAtividades = document.getElementById('vistaAtividades');
  const vistaEntregas   = document.getElementById('vistaEntregas');
  const selectPrograma  = document.getElementById('selectProgramaAtividade');
  const blocoAtividades = document.getElementById('blocoAtividadesPrograma');

  if (!btnAbrir || !modal) return;

  let atividadeAtual = null;
  let programaAtualId = null;

  function abrirModal() {
    modal.classList.add('aberto');
    mostrarVistaAtividades();
    if (selectPrograma.options.length <= 1 || selectPrograma.dataset.carregado !== '1') {
      carregarProgramas();
    }
  }
  function fecharModal() { modal.classList.remove('aberto'); }
  btnAbrir.addEventListener('click', abrirModal);
  btnFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) fecharModal(); });

  function mostrarVistaAtividades() {
    titulo.textContent = 'Atividades dos Alunos';
    vistaAtividades.style.display = '';
    vistaEntregas.style.display = 'none';
  }

  function mostrarVistaEntregas(atividade) {
    atividadeAtual = atividade;
    titulo.textContent = 'Entregas da Atividade';
    document.getElementById('subtituloEntregas').textContent =
      atividade.nome + ' — entrega até ' + formatarData(atividade.data_entrega);
    vistaAtividades.style.display = 'none';
    vistaEntregas.style.display = '';
    carregarEntregas();
  }
  document.getElementById('btnVoltarAtividades').addEventListener('click', mostrarVistaAtividades);

  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ===================== PROGRAMAS (seleção simples, não é CRUD) =====================
  async function carregarProgramas() {
    try {
      const res = await fetch('/programas');
      if (!res.ok) throw new Error('Erro ao carregar programas');
      const programas = await res.json();
      selectPrograma.innerHTML = '<option value="">Selecione um programa...</option>' +
        programas.map(function (p) { return '<option value="' + p.id_programa + '">' + p.titulo + '</option>'; }).join('');
      selectPrograma.dataset.carregado = '1';
    } catch (err) {
      selectPrograma.innerHTML = '<option value="">Erro ao carregar programas</option>';
    }
  }

  selectPrograma.addEventListener('change', function () {
    programaAtualId = this.value ? Number(this.value) : null;
    if (programaAtualId) {
      blocoAtividades.style.display = '';
      resetFormAtividade();
      carregarAtividades();
    } else {
      blocoAtividades.style.display = 'none';
    }
  });

  // ===================== ATIVIDADES =====================
  const formAtividade = document.getElementById('formAtividade');
  const erroAtividade = document.getElementById('erroAtividade');
  const btnCancelarEdicaoAtividade = document.getElementById('btnCancelarEdicaoAtividade');
  const btnSalvarAtividade = document.getElementById('btnSalvarAtividade');

  function resetFormAtividade() {
    formAtividade.reset();
    document.getElementById('atividadeEditId').value = '';
    btnSalvarAtividade.textContent = '+ Adicionar Atividade';
    btnCancelarEdicaoAtividade.style.display = 'none';
    erroAtividade.style.display = 'none';
  }
  btnCancelarEdicaoAtividade.addEventListener('click', resetFormAtividade);

  async function carregarAtividades() {
    const lista = document.getElementById('listaAtividadesGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando atividades...</p>';
    try {
      const res = await fetch('/atividades');
      if (!res.ok) throw new Error('Erro ao carregar atividades');
      const todas = await res.json();
      const doPrograma = todas.filter(function (a) { return a.id_programa === programaAtualId; });
      renderizarAtividades(doPrograma);
    } catch (err) {
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar as atividades.</p>';
    }
  }

  function renderizarAtividades(atividades) {
    const lista = document.getElementById('listaAtividadesGerenciar');
    if (!atividades.length) {
      lista.innerHTML = '<p class="estado-carregando">Nenhuma atividade cadastrada para este programa ainda.</p>';
      return;
    }
    lista.innerHTML = atividades.map(function (a) {
      return '<div class="gerenciar-item" data-id="' + a.id_atividade + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">' + a.nome + '</span>' +
          '<span class="gerenciar-item__meta">Entrega até ' + formatarData(a.data_entrega) + (a.descricao ? ' · ' + a.descricao : '') + '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' +
          '<button type="button" class="btn btn--outline btn-ver-entregas">Ver Entregas</button>' +
          '<button type="button" class="btn btn--outline btn-editar-atividade">Editar</button>' +
          '<button type="button" class="btn btn--danger btn-excluir-atividade">Excluir</button>' +
        '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const id = Number(item.dataset.id);
      const atividade = atividades.find(function (a) { return a.id_atividade === id; });
      item.querySelector('.btn-ver-entregas').addEventListener('click', function () { mostrarVistaEntregas(atividade); });
      item.querySelector('.btn-editar-atividade').addEventListener('click', function () { preencherFormAtividade(atividade); });
      item.querySelector('.btn-excluir-atividade').addEventListener('click', function () { excluirAtividade(atividade); });
    });
  }

  function preencherFormAtividade(atividade) {
    document.getElementById('atividadeEditId').value = atividade.id_atividade;
    document.getElementById('atividadeNome').value = atividade.nome;
    document.getElementById('atividadeDataEntrega').value = atividade.data_entrega ? atividade.data_entrega.split('T')[0] : '';
    document.getElementById('atividadeDescricao').value = atividade.descricao || '';
    btnSalvarAtividade.textContent = 'Salvar Alterações';
    btnCancelarEdicaoAtividade.style.display = '';
  }

  formAtividade.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroAtividade.style.display = 'none';

    const id = document.getElementById('atividadeEditId').value;
    const dados = {
      nome: document.getElementById('atividadeNome').value,
      data_entrega: document.getElementById('atividadeDataEntrega').value,
      descricao: document.getElementById('atividadeDescricao').value || null,
      id_programa: programaAtualId,
    };

    btnSalvarAtividade.disabled = true;
    try {
      const url = id ? '/atividades/' + id : '/atividades';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'Erro ao salvar atividade');
      resetFormAtividade();
      carregarAtividades();
    } catch (err) {
      erroAtividade.textContent = err.message;
      erroAtividade.style.display = 'block';
    } finally {
      btnSalvarAtividade.disabled = false;
    }
  });

  async function excluirAtividade(atividade) {
    if (!confirm('Excluir a atividade "' + atividade.nome + '"? Isso também remove os registros de entrega.')) return;
    try {
      const res = await fetch('/atividades/' + atividade.id_atividade, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarAtividades();
    } catch (err) {
      alert('Não foi possível excluir a atividade: ' + err.message);
    }
  }

  // ===================== ENTREGAS =====================
  async function carregarEntregas() {
    const lista = document.getElementById('listaEntregasGerenciar');
    lista.innerHTML = '<p class="estado-carregando">Carregando alunos...</p>';
    try {
      const [matriculasRes, alunosRes] = await Promise.all([
        fetch('/matriculas/programa/' + programaAtualId),
        fetch('/alunos'),
      ]);
      if (!matriculasRes.ok || !alunosRes.ok) throw new Error('Erro ao carregar dados');
      const matriculas = await matriculasRes.json();
      const alunos = await alunosRes.json();

      if (matriculas.length === 0) {
        lista.innerHTML = '<p class="estado-carregando">Nenhum aluno matriculado neste programa ainda.</p>';
        return;
      }

      const alunosPorId = {};
      alunos.forEach(function (a) { alunosPorId[a.id_usuario] = a; });

      const entregasPorAluno = await Promise.all(
        matriculas.map(function (m) {
          return fetch('/alunos/' + m.id_aluno + '/entregas')
            .then(function (r) { return r.ok ? r.json() : []; })
            .catch(function () { return []; });
        })
      );

      const linhas = matriculas.map(function (m, i) {
        const aluno = alunosPorId[m.id_aluno];
        const entrega = entregasPorAluno[i].find(function (e) { return e.id_atividade === atividadeAtual.id_atividade; });
        return { id_aluno: m.id_aluno, nome: aluno && aluno.usuario ? aluno.usuario.nome : 'Aluno #' + m.id_aluno, entrega: entrega || null };
      });

      renderizarEntregas(linhas);
    } catch (err) {
      console.error(err);
      lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os alunos.</p>';
    }
  }

  function calcularStatus(linha) {
    if (linha.entrega) return { label: 'Entregue em ' + formatarData(linha.entrega.data_entrega), cor: '#25B057' };
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const prazo = new Date(atividadeAtual.data_entrega + 'T00:00:00');
    if (hoje > prazo) return { label: 'Atrasado', cor: '#DC2626' };
    return { label: 'Pendente', cor: '#F59E0B' };
  }

  function renderizarEntregas(linhas) {
    const lista = document.getElementById('listaEntregasGerenciar');
    lista.innerHTML = linhas.map(function (linha) {
      const status = calcularStatus(linha);
      const acao = linha.entrega
        ? '<button type="button" class="btn btn--outline btn-desfazer-entrega">Desfazer Entrega</button>'
        : '<button type="button" class="btn btn--accent btn-marcar-entrega">Marcar como Entregue</button>';
      return '<div class="gerenciar-item" data-id-aluno="' + linha.id_aluno + '">' +
        '<div class="gerenciar-item__info">' +
          '<span class="gerenciar-item__titulo">' + linha.nome +
            '<span class="gerenciar-item__badge" style="background:' + status.cor + '22; color:' + status.cor + ';">' + status.label + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="gerenciar-item__acoes">' + acao + '</div>' +
      '</div>';
    }).join('');

    lista.querySelectorAll('.gerenciar-item').forEach(function (item) {
      const idAluno = Number(item.dataset.idAluno);
      const btnMarcar = item.querySelector('.btn-marcar-entrega');
      const btnDesfazer = item.querySelector('.btn-desfazer-entrega');
      if (btnMarcar) btnMarcar.addEventListener('click', function () { marcarEntrega(idAluno); });
      if (btnDesfazer) btnDesfazer.addEventListener('click', function () { desfazerEntrega(idAluno); });
    });
  }

  async function marcarEntrega(idAluno) {
    try {
      const res = await fetch('/alunos/' + idAluno + '/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_atividade: atividadeAtual.id_atividade, data_entrega: new Date().toISOString().split('T')[0] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(function () { return {}; });
        throw new Error(body.error || body.message || 'Erro ' + res.status);
      }
      carregarEntregas();
    } catch (err) {
      alert('Não foi possível registrar a entrega: ' + err.message);
    }
  }

  async function desfazerEntrega(idAluno) {
    try {
      const res = await fetch('/alunos/' + idAluno + '/entregas/' + atividadeAtual.id_atividade, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
      carregarEntregas();
    } catch (err) {
      alert('Não foi possível desfazer a entrega: ' + err.message);
    }
  }
});
