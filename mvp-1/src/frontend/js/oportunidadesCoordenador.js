document.addEventListener('DOMContentLoaded', function () {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  let todasOportunidades = [];

  const grid          = document.getElementById('listaOportunidadesCoord');
  const vazio          = document.getElementById('estadoVazioOportCoord');
  const contadorEl      = document.getElementById('contadorOportCoord');
  const campoBusca      = document.getElementById('campoBuscaOport');

  const TIPO_COR = {
    'Vaga':            { bg: 'rgba(0,56,112,0.08)',   cor: 'var(--color-primary)' },
    'Evento':          { bg: 'rgba(37,176,87,0.08)',  cor: 'var(--color-accent)' },
    'Estágio':         { bg: 'rgba(245,158,11,0.08)', cor: 'var(--color-warning)' },
    'Bolsa de Estudo': { bg: 'rgba(139,92,246,0.08)', cor: '#7c3aed' }
  };

  // Formata data ISO para o padrão brasileiro (ex.: "20/jun./2026")
  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Busca todas as oportunidades ativas via GET /oportunidades
  function carregarOportunidades() {
    contadorEl.textContent = 'Carregando...';
    fetch('/oportunidades')
      .then(function (res) {
        if (!res.ok) throw new Error('Erro ao carregar oportunidades');
        return res.json();
      })
      .then(function (oport) {
        todasOportunidades = oport;
        renderLista(todasOportunidades);
      })
      .catch(function (err) {
        console.error(err);
        contadorEl.textContent = 'Erro ao carregar oportunidades.';
        renderLista([]);
      });
  }

  // Renderiza os cards filtrados pelo texto digitado na busca
  function renderLista(lista) {
    grid.innerHTML = '';

    if (!lista || lista.length === 0) {
      vazio.style.display = 'flex';
      contadorEl.textContent = '0 oportunidades cadastradas';
      return;
    }

    vazio.style.display = 'none';
    contadorEl.textContent = lista.length + ' oportunidade(s) cadastrada(s)';

    grid.innerHTML = lista.map(function (o) {
      const cores = TIPO_COR[o.tipo] || TIPO_COR['Vaga'];
      return `
        <div class="oport-card card" data-id="${o.id_oportunidade}">
          <div class="oport-card__header">
            <span class="oport-card__tipo" style="background:${cores.bg};color:${cores.cor};">${o.tipo}</span>
            ${o.nivel ? `<span class="badge badge--pendente">${o.nivel}</span>` : ''}
          </div>
          <h3 class="oport-card__titulo">${o.titulo}</h3>
          <p class="oport-card__empresa">${o.empresa}</p>
          <p class="oport-card__desc">${o.descricao || 'Sem descrição.'}</p>
          <div class="oport-card__footer">
            <div class="oport-card__meta">
              <span>${o.modalidade}</span>
              ${o.cidade ? `<span>${o.cidade}</span>` : ''}
              <span>Até ${formatarData(o.prazo)}</span>
            </div>
            <div class="oport-card__acoes">
              <button class="btn btn--outline btn-editar-oport" data-id="${o.id_oportunidade}">Editar</button>
              <button class="btn btn--danger btn-excluir-oport" data-id="${o.id_oportunidade}">Excluir</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-editar-oport').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirModalEditar(Number(btn.dataset.id));
      });
    });

    grid.querySelectorAll('.btn-excluir-oport').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirModalExcluir(Number(btn.dataset.id));
      });
    });
  }

  // Filtra a lista carregada por título ou empresa, sem nova chamada à API
  campoBusca.addEventListener('input', function () {
    const termo = campoBusca.value.toLowerCase().trim();
    if (!termo) {
      renderLista(todasOportunidades);
      return;
    }
    const filtradas = todasOportunidades.filter(function (o) {
      return (o.titulo || '').toLowerCase().includes(termo) ||
             (o.empresa || '').toLowerCase().includes(termo);
    });
    renderLista(filtradas);
  });

  // ===== MODAL DE EDIÇÃO =====
  const modalEditar    = document.getElementById('modalEditarOport');
  const formEditar      = document.getElementById('formEditarOportunidade');
  const erroEditar      = document.getElementById('erroEditarOport');
  const btnSalvarEditar = document.getElementById('btnSalvarEditarOport');

  // Preenche o formulário do modal com os dados atuais da oportunidade selecionada
  function abrirModalEditar(id) {
    const oportunidade = todasOportunidades.find(function (o) { return o.id_oportunidade === id; });
    if (!oportunidade) return;

    erroEditar.style.display = 'none';
    document.getElementById('editId').value          = oportunidade.id_oportunidade;
    document.getElementById('editTitulo').value       = oportunidade.titulo || '';
    document.getElementById('editEmpresa').value      = oportunidade.empresa || '';
    document.getElementById('editTipo').value         = oportunidade.tipo || 'Vaga';
    document.getElementById('editModalidade').value   = oportunidade.modalidade || 'Presencial';
    document.getElementById('editPrazo').value        = oportunidade.prazo || '';
    document.getElementById('editCidade').value       = oportunidade.cidade || '';
    document.getElementById('editNivel').value        = oportunidade.nivel || '';
    document.getElementById('editDescricao').value    = oportunidade.descricao || '';

    modalEditar.classList.add('aberto');
  }

  function fecharModalEditar() {
    modalEditar.classList.remove('aberto');
  }

  document.getElementById('btnFecharEditarOport').addEventListener('click', fecharModalEditar);
  document.getElementById('btnCancelarEditarOport').addEventListener('click', fecharModalEditar);
  modalEditar.addEventListener('click', function (e) {
    if (e.target === modalEditar) fecharModalEditar();
  });

  // Envia as alterações via PUT /oportunidades/:id e atualiza a lista local sem recarregar a página
  formEditar.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroEditar.style.display = 'none';

    const id = Number(document.getElementById('editId').value);
    const dadosAtualizados = {
      titulo:     document.getElementById('editTitulo').value,
      empresa:    document.getElementById('editEmpresa').value,
      tipo:       document.getElementById('editTipo').value,
      modalidade: document.getElementById('editModalidade').value,
      prazo:      document.getElementById('editPrazo').value,
      cidade:     document.getElementById('editCidade').value || null,
      nivel:      document.getElementById('editNivel').value || null,
      descricao:  document.getElementById('editDescricao').value || null
    };

    btnSalvarEditar.disabled = true;
    btnSalvarEditar.textContent = 'Salvando...';

    try {
      const res = await fetch('/oportunidades/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAtualizados)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Erro ao salvar alterações');

      const idx = todasOportunidades.findIndex(function (o) { return o.id_oportunidade === id; });
      if (idx !== -1) todasOportunidades[idx] = result;

      fecharModalEditar();
      renderLista(todasOportunidades);
    } catch (err) {
      erroEditar.textContent = err.message;
      erroEditar.style.display = 'block';
    } finally {
      btnSalvarEditar.disabled = false;
      btnSalvarEditar.textContent = 'Salvar Alterações';
    }
  });

  // ===== MODAL DE EXCLUSÃO =====
  const modalExcluir       = document.getElementById('modalExcluirOport');
  const tituloExcluirEl     = document.getElementById('tituloExcluirOport');
  const btnConfirmarExcluir = document.getElementById('btnConfirmarExcluirOport');
  let idParaExcluir = null;

  function abrirModalExcluir(id) {
    const oportunidade = todasOportunidades.find(function (o) { return o.id_oportunidade === id; });
    if (!oportunidade) return;
    idParaExcluir = id;
    tituloExcluirEl.textContent = oportunidade.titulo;
    modalExcluir.classList.add('aberto');
  }

  function fecharModalExcluir() {
    modalExcluir.classList.remove('aberto');
    idParaExcluir = null;
  }

  document.getElementById('btnCancelarExcluirOport').addEventListener('click', fecharModalExcluir);
  modalExcluir.addEventListener('click', function (e) {
    if (e.target === modalExcluir) fecharModalExcluir();
  });

  // Exclui (inativação lógica no backend) via DELETE /oportunidades/:id e remove o card da lista local
  btnConfirmarExcluir.addEventListener('click', async function () {
    if (!idParaExcluir) return;

    btnConfirmarExcluir.disabled = true;
    btnConfirmarExcluir.textContent = 'Excluindo...';

    try {
      const res = await fetch('/oportunidades/' + idParaExcluir, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);

      todasOportunidades = todasOportunidades.filter(function (o) { return o.id_oportunidade !== idParaExcluir; });
      renderLista(todasOportunidades);
      fecharModalExcluir();
    } catch (err) {
      console.error('Erro ao excluir oportunidade:', err);
      alert('Não foi possível excluir a oportunidade. Tente novamente.');
    } finally {
      btnConfirmarExcluir.disabled = false;
      btnConfirmarExcluir.textContent = 'Sim, excluir';
    }
  });

  carregarOportunidades();
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
