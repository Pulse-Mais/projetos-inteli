(function (window, document) {
  const DEFAULT_RM_COORDENADORA = '1001';
  let coordenadoraLogada = null;

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

  function getRaAluno() {
    return getParams().get('ra') || window.localStorage.getItem('alunoSelecionadoRa');
  }

  function getDataHoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatarData(valor) {
    if (!valor) {
      return 'Data não informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
  }

  function getAutorRelatorio(relatorio) {
    if (relatorio.nome_autor) {
      return relatorio.nome_autor;
    }

    const nome = String(coordenadoraLogada?.nome || '').trim();
    const cargo = String(coordenadoraLogada?.cargo || 'Coordenadora').trim();

    if (!nome) {
      return cargo;
    }

    return `${nome} - ${cargo}`;
  }

  function atualizarContagem(total) {
    const contagem = document.getElementById('relatorios-contagem');

    if (!contagem) {
      return;
    }

    if (total === 1) {
      contagem.textContent = '1 registro';
      return;
    }

    contagem.textContent = `${total} registros`;
  }

  function setTextoContagem(texto) {
    const contagem = document.getElementById('relatorios-contagem');

    if (contagem) {
      contagem.textContent = texto;
    }
  }

  function criarEstado(mensagem, tipo, acao) {
    const estado = document.createElement('div');
    estado.className = `anotacao anotacao-estado${tipo ? ` anotacao-estado--${tipo}` : ''}`;

    const bolinha = document.createElement('span');
    bolinha.className = 'anotacao-bolinha';

    if (tipo === 'carregando') {
      bolinha.classList.add('anotacao-spinner');
      bolinha.setAttribute('aria-hidden', 'true');
    }

    const texto = document.createElement('span');
    texto.textContent = mensagem;

    estado.appendChild(bolinha);
    estado.appendChild(texto);

    if (acao) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'btn-anotacao-estado';
      botao.textContent = acao.rotulo;
      botao.addEventListener('click', acao.onClick);
      estado.appendChild(botao);
    }

    return estado;
  }

  function extrairPartesConteudo(conteudo) {
    const texto = String(conteudo || '').trim();
    const [resumo, ...resto] = texto.split(/\r?\n/);

    return {
      resumo: resumo || 'Anotação sem resumo disponível.',
      detalhes: resto.join('\n').trim(),
    };
  }

  function criarRelatorio(relatorio) {
    const item = document.createElement('article');
    item.className = 'anotacao relatorio-item';

    const bolinha = document.createElement('span');
    bolinha.className = 'anotacao-bolinha';

    const conteudo = document.createElement('div');
    conteudo.className = 'relatorio-conteudo';

    const autor = document.createElement('p');
    autor.className = 'relatorio-resumo';
    autor.textContent = getAutorRelatorio(relatorio);

    const partes = extrairPartesConteudo(
      relatorio.conteudo || [relatorio.info_simplificada, relatorio.observacoes].filter(Boolean).join('\n'),
    );

    const resumo = document.createElement('p');
    resumo.className = 'relatorio-resumo';
    resumo.textContent = partes.resumo;

    const observacoes = document.createElement('p');
    observacoes.className = 'relatorio-observacoes';
    observacoes.textContent = partes.detalhes || 'Sem observações completas registradas.';

    const meta = document.createElement('span');
    meta.className = 'relatorio-meta';
    meta.textContent = `Data: ${formatarData(relatorio.data)}`;

    conteudo.appendChild(autor);
    conteudo.appendChild(resumo);
    conteudo.appendChild(observacoes);
    conteudo.appendChild(meta);
    item.appendChild(bolinha);
    item.appendChild(conteudo);

    return item;
  }

  function renderizarRelatorios(relatorios) {
    const lista = document.getElementById('relatorios-lista');
    lista.innerHTML = '';

    if (!relatorios.length) {
      atualizarContagem(0);
      lista.appendChild(criarEstado('Nenhum relatório encontrado para este aluno.'));
      return;
    }

    atualizarContagem(relatorios.length);

    relatorios.forEach((relatorio) => {
      lista.appendChild(criarRelatorio(relatorio));
    });
  }

  async function carregarRelatorios() {
    const lista = document.getElementById('relatorios-lista');
    const rm = getRmCoordenadora();
    const ra = getRaAluno();

    if (!lista) {
      return;
    }

    if (!ra) {
      atualizarContagem(0);
      lista.innerHTML = '';
      lista.appendChild(criarEstado('Selecione um aluno para visualizar os relatórios.', 'erro'));
      return;
    }

    setTextoContagem('Carregando');
    lista.innerHTML = '';
    lista.appendChild(criarEstado('Carregando relatórios...', 'carregando'));

    try {
      coordenadoraLogada = await window.CoordenadoraAPI.buscarCoordenadora(rm);
      const resposta = await window.CoordenadoraAPI.listarAnotacoesAluno(ra);
      renderizarRelatorios(Array.isArray(resposta?.anotacoes) ? resposta.anotacoes : []);
    } catch (error) {
      if (error.status === 404) {
        renderizarRelatorios([]);
        return;
      }

      console.error('[Relatorios Coordenadora]', error);
      atualizarContagem(0);
      lista.innerHTML = '';
      lista.appendChild(criarEstado('Não foi possível carregar os relatórios.', 'erro', {
        rotulo: 'Tentar novamente',
        onClick: carregarRelatorios,
      }));
    }
  }

  function setFeedbackAnotacao(mensagem, tipo) {
    const feedback = document.getElementById('modal-anotacao-feedback');

    if (!feedback) return;

    feedback.textContent = mensagem || '';
    feedback.className = `modal-feedback${tipo ? ` modal-feedback--${tipo}` : ''}`;
  }

  function setAnotacaoCarregando(carregando) {
    const form = document.getElementById('form-anotacao');
    const botaoSalvar = form?.querySelector('[type="submit"]');

    if (!form) return;

    Array.from(form.elements).forEach((elemento) => {
      elemento.disabled = carregando;
    });

    if (botaoSalvar) {
      botaoSalvar.textContent = carregando ? 'Salvando...' : 'Salvar';
    }
  }

  function abrirModalAnotacao() {
    const modal = document.getElementById('modal-anotacao');
    const form = document.getElementById('form-anotacao');
    const ra = getRaAluno();

    if (!modal || !form) return;

    if (!ra) {
      setFeedbackAnotacao('Selecione um aluno para registrar uma anotacao.', 'erro');
      return;
    }

    form.reset();
    form.data.value = getDataHoje();
    setFeedbackAnotacao('');
    modal.hidden = false;
  }

  function fecharModalAnotacao() {
    const modal = document.getElementById('modal-anotacao');

    if (modal) {
      modal.hidden = true;
    }
  }

  async function registrarAnotacao(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const rm = getRmCoordenadora();
    const ra = getRaAluno();
    const infoSimplificada = form.info_simplificada.value.trim();
    const observacoes = form.observacoes.value.trim();
    const data = form.data.value;

    if (!ra) {
      setFeedbackAnotacao('Aluno nao informado para registrar anotacao.', 'erro');
      return;
    }

    if (!infoSimplificada || !data) {
      setFeedbackAnotacao('Preencha o resumo e a data da anotacao.', 'erro');
      return;
    }

    setAnotacaoCarregando(true);
    setFeedbackAnotacao('Salvando anotacao...', 'carregando');

    try {
      const nome = String(coordenadoraLogada?.nome || '').trim();
      const cargo = String(coordenadoraLogada?.cargo || 'Coordenadora').trim();

      await window.CoordenadoraAPI.criarAnotacaoAluno(ra, {
        nome_autor: nome ? `${nome} - ${cargo}` : cargo,
        data,
        conteudo: [infoSimplificada, observacoes].filter(Boolean).join('\n'),
      });

      await carregarRelatorios();
      setFeedbackAnotacao('Anotacao registrada com sucesso.', 'sucesso');
      fecharModalAnotacao();
    } catch (error) {
      console.error('[Nova Anotacao Coordenadora]', error);
      setFeedbackAnotacao(error.message || 'Nao foi possivel salvar a anotacao.', 'erro');
    } finally {
      setAnotacaoCarregando(false);
    }
  }

  function configurarModalAnotacao() {
    const btnAbrir = document.getElementById('btn-nova-anotacao');
    const btnFechar = document.getElementById('modal-anotacao-fechar');
    const btnCancelar = document.getElementById('modal-anotacao-cancelar');
    const modal = document.getElementById('modal-anotacao');
    const form = document.getElementById('form-anotacao');

    btnAbrir?.addEventListener('click', abrirModalAnotacao);
    btnFechar?.addEventListener('click', fecharModalAnotacao);
    btnCancelar?.addEventListener('click', fecharModalAnotacao);
    form?.addEventListener('submit', registrarAnotacao);

    modal?.addEventListener('click', (event) => {
      if (event.target === modal) {
        fecharModalAnotacao();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal && !modal.hidden) {
        fecharModalAnotacao();
      }
    });
  }

  window.PerfilRelatorios = {
    carregar: carregarRelatorios,
  };

  document.addEventListener('DOMContentLoaded', () => {
    configurarModalAnotacao();
    carregarRelatorios();
  });
})(window, document);
