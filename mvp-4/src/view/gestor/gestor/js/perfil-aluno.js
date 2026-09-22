(function (window, document) {
  let gestorLogado = null;

  function getRaAluno() {
    return window.GestorApp.getParams().get('ra');
  }

  function getDataHoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatarData(valor) {
    if (!valor) {
      return 'Data nao informada';
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  function atualizarContagem(total) {
    const contagem = document.getElementById('anotacoes-contagem');
    if (!contagem) return;
    contagem.textContent = total === 1 ? '1 registro' : `${total} registros`;
  }

  function criarEstadoAnotacao(mensagem) {
    const item = document.createElement('div');
    item.className = 'anotacao';
    item.innerHTML = `<span class="anotacao-bolinha"></span> ${mensagem}`;
    return item;
  }

  function extrairPartesConteudo(conteudo) {
    const texto = String(conteudo || '').trim();
    const [resumo, ...resto] = texto.split(/\r?\n/);
    return {
      resumo: resumo || 'Sem resumo',
      detalhes: resto.join('\n').trim(),
    };
  }

  function criarAnotacao(anotacao) {
    const item = document.createElement('article');
    item.className = 'anotacao relatorio-item';

    const partes = extrairPartesConteudo(anotacao.conteudo);
    const autor = anotacao.nome_autor || 'Autor nao informado';
    const autorFormatado = autor.replace(/^Gestor:\s*/i, '').trim();

    item.innerHTML = `
      <span class="anotacao-bolinha"></span>
      <div class="relatorio-conteudo">
        <p class="relatorio-autor">${autorFormatado} - Gestor</p>
        <p class="relatorio-resumo">${partes.resumo}</p>
        ${partes.detalhes ? `<p class="relatorio-observacoes">${partes.detalhes}</p>` : ''}
        <span class="relatorio-meta">Data: ${formatarData(anotacao.data)}</span>
      </div>
    `;

    return item;
  }

  function renderizarAnotacoes(anotacoes) {
    const lista = document.getElementById('anotacoes-lista');
    if (!lista) return;

    lista.innerHTML = '';

    if (!anotacoes.length) {
      atualizarContagem(0);
      lista.appendChild(criarEstadoAnotacao('Nenhuma anotacao encontrada.'));
      return;
    }

    atualizarContagem(anotacoes.length);
    anotacoes.forEach((anotacao) => lista.appendChild(criarAnotacao(anotacao)));
  }

  async function carregarAnotacoes() {
    const lista = document.getElementById('anotacoes-lista');
    const ra = getRaAluno();

    if (!lista || !ra) {
      return;
    }

    lista.innerHTML = '';
    lista.appendChild(criarEstadoAnotacao('Carregando anotacoes...'));

    try {
      const resposta = await window.GestorAPI.listarAnotacoesAluno(ra);
      renderizarAnotacoes(Array.isArray(resposta?.anotacoes) ? resposta.anotacoes : []);
    } catch (error) {
      if (error.status === 404) {
        renderizarAnotacoes([]);
        return;
      }

      lista.innerHTML = '';
      lista.appendChild(criarEstadoAnotacao('Nao foi possivel carregar as anotacoes.'));
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
    if (!modal || !form) return;
    form.reset();
    form.data.value = getDataHoje();
    setFeedbackAnotacao('');
    modal.hidden = false;
  }

  function fecharModalAnotacao() {
    const modal = document.getElementById('modal-anotacao');
    if (modal) modal.hidden = true;
  }

  async function registrarAnotacao(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const ra = getRaAluno();
    const resumo = form.info_simplificada.value.trim();
    const observacoes = form.observacoes.value.trim();
    const data = form.data.value;
    const nomeGestor = String(gestorLogado?.nome || 'Gestor').trim();
    const nomeAutor = `Gestor: ${nomeGestor}`;
    const conteudo = [resumo, observacoes].filter(Boolean).join('\n');

    if (!ra || !resumo || !data) {
      setFeedbackAnotacao('Preencha resumo e data.', 'erro');
      return;
    }

    setAnotacaoCarregando(true);
    setFeedbackAnotacao('Salvando anotacao...', 'carregando');

    try {
      await window.GestorAPI.criarAnotacaoAluno(ra, {
        nome_autor: nomeAutor,
        data,
        conteudo,
      });

      fecharModalAnotacao();
      await carregarAnotacoes();
    } catch (error) {
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
      if (event.target === modal) fecharModalAnotacao();
    });
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value || '-';
    }
  }

  function setCampo(id, valor) {
    setText(`[data-campo="${id}"]`, valor);
  }

  function renderizarAluno(aluno) {
    const empregabilidade = aluno.empregabilidade || {};

    setText('.perfil-nome', aluno.nome || 'Aluno sem nome');
    setText('.perfil-ra', `RA: ${aluno.ra}`);
    setText('[data-perfil="turma"]', aluno.idTurma ? `Turma ${aluno.idTurma}` : 'Sem turma');
    setText('[data-perfil="status"]', window.GestorApp.formatarStatus(aluno.status));
    setCampo('email_primario', aluno.email_primario);
    setCampo('email_secundario', aluno.email_secundario || '-');
    setCampo('tel_primario', aluno.tel_primario);
    setCampo('tel_secundario', aluno.tel_secundario || '-');
    setCampo('turma', aluno.idTurma || '-');
    setCampo('genero', aluno.genero);
    setCampo('renda_familiar', aluno.renda_familiar || '-');
    setCampo('endereco', aluno.endereco || aluno.cep || '-');
    setText('[data-emp="status"]', empregabilidade.cargo ? 'Empregado' : 'Sem emprego registrado');
    setText('[data-emp="programas"]', aluno.status || '-');
    setText('[data-emp="formacao"]', empregabilidade.nivel_formacao || '-');
    setText('[data-emp="engajamento"]', empregabilidade.empresa || '-');

    window.GestorApp.recriarIcones();
  }

  function setResumoFrequencia(mensagem, tipo) {
    const resumo = document.getElementById('frequencia-resumo');

    if (!resumo) return;

    resumo.textContent = mensagem;
    resumo.className = `frequencia-resumo${tipo ? ` frequencia-resumo--${tipo}` : ''}`;
  }

  function getClassePercentual(percentual) {
    if (percentual >= 85) return 'alta';
    if (percentual >= 70) return 'media';

    return 'baixa';
  }

  function renderizarResumoFrequencia(dados) {
    const resumo = document.getElementById('frequencia-resumo');

    if (!resumo) return;

    const frequencias = Array.isArray(dados?.frequencias) ? dados.frequencias : [];
    const totalAulas = Number(dados?.total_aulas ?? frequencias.length);
    const presencas = frequencias.filter((item) => item.frequencia === true).length;
    const faltas = Math.max(totalAulas - presencas, 0);
    const percentual = Number(dados?.percentual_presenca ?? (
      totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : 0
    ));

    if (totalAulas === 0) {
      resumo.className = 'frequencia-resumo frequencia-resumo--painel frequencia-resumo--baixa';
      resumo.innerHTML = [
        '<div class="frequencia-percentual frequencia-percentual--vazio">0%</div>',
        '<div class="frequencia-detalhes">',
        '<strong>Nenhuma frequencia registrada</strong>',
        '<span>Ainda nao ha presencas ou faltas registradas para este aluno.</span>',
        '</div>',
      ].join('');
      return;
    }

    resumo.className = `frequencia-resumo frequencia-resumo--painel frequencia-resumo--${getClassePercentual(percentual)}`;
    resumo.innerHTML = [
      `<div class="frequencia-percentual">${percentual.toLocaleString('pt-BR')}%</div>`,
      '<div class="frequencia-detalhes">',
      '<strong>Presenca do aluno</strong>',
      `<span>${totalAulas} aulas registradas &middot; ${presencas} presencas &middot; ${faltas} faltas</span>`,
      '</div>',
    ].join('');
  }

  async function carregarResumoFrequencia() {
    const ra = getRaAluno();

    if (!ra) return;

    setResumoFrequencia('Carregando frequencia...', 'carregando');

    try {
      const dados = await window.GestorAPI.buscarFrequenciaAluno(ra);
      renderizarResumoFrequencia(dados);
    } catch (error) {
      console.error('[Frequencia Gestor]', error);
      setResumoFrequencia(
        error.status === 404
          ? 'Frequencia nao encontrada para este aluno.'
          : 'Nao foi possivel carregar a frequencia.',
        'erro',
      );
    }
  }

  function renderizarErro(mensagem) {
    const conteudo = document.querySelector('.pagina-perfil-aluno');
    const erro = document.createElement('div');
    erro.className = 'gestor-estado gestor-estado--erro';
    erro.textContent = mensagem;
    conteudo.prepend(erro);
  }

  async function carregarPerfil() {
    const ra = getRaAluno();
    const nomeUrl = window.GestorApp.getParams().get('nome');

    if (nomeUrl) {
      setText('.perfil-nome', nomeUrl);
    }

    if (!ra) {
      renderizarErro('Selecione um aluno para visualizar o perfil.');
      return;
    }

    try {
      gestorLogado = await window.GestorAPI.buscarGestor(window.GestorApp.getRmGestor());
      const aluno = await window.GestorAPI.buscarAlunoPorRa(window.GestorApp.getRmGestor(), ra);
      renderizarAluno(aluno);
      carregarAnotacoes();
      carregarResumoFrequencia();
    } catch (error) {
      console.error('[Perfil Gestor]', error);
      renderizarErro(error.status === 404
        ? 'Aluno nao encontrado para este gestor.'
        : 'Nao foi possivel carregar os dados do aluno.');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    configurarModalAnotacao();
    carregarPerfil();
  });
})(window, document);
