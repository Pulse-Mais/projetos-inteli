(function (window, document) {
  const state = {
    comunicados: [],
  };

  function setFeedback(mensagem, tipo) {
    const feedback = document.getElementById('com-feedback');
    if (!feedback) return;
    feedback.textContent = mensagem || '';
    feedback.className = `com-feedback${tipo ? ` com-feedback--${tipo}` : ''}`;
  }
  const classePorTipo = { Eventos: 'evento', Informativo: 'info', Aviso: 'aviso' };
  const rotuloDestinatario = {
    todos: 'Todos os alunos',
    ativos: 'Alunos ativos',
    'ex-alunos': 'Ex-alunos',
  };

  function getHistorico() {
    return document.getElementById('com-historico');
  }

  function getEditor() {
    return document.getElementById('com-editor-area');
  }

  function sanitizarHtml(html) {
    const template = document.createElement('template');
    const tagsPermitidas = new Set([
      'A', 'B', 'BR', 'DIV', 'EM', 'I', 'IMG', 'LI', 'OL', 'P', 'SPAN',
      'STRONG', 'U', 'UL',
    ]);
    const tagsRemovidas = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED']);

    template.innerHTML = String(html || '');

    Array.from(template.content.querySelectorAll('*')).forEach((elemento) => {
      if (tagsRemovidas.has(elemento.tagName)) {
        elemento.remove();
        return;
      }

      if (!tagsPermitidas.has(elemento.tagName)) {
        elemento.replaceWith(...elemento.childNodes);
        return;
      }

      Array.from(elemento.attributes).forEach((atributo) => {
        const permitido =
          (elemento.tagName === 'A' && ['href', 'target', 'rel', 'download', 'class'].includes(atributo.name))
          || (elemento.tagName === 'IMG' && ['src', 'alt'].includes(atributo.name))
          || (elemento.tagName === 'SPAN' && atributo.name === 'class');

        if (!permitido) elemento.removeAttribute(atributo.name);
      });

      if (elemento.tagName === 'A') {
        const href = elemento.getAttribute('href') || '';
        const urlPermitida = /^(https?:|mailto:|data:)/i.test(href);

        if (!urlPermitida) elemento.removeAttribute('href');
        if (/^https?:/i.test(href)) {
          elemento.setAttribute('target', '_blank');
          elemento.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (elemento.tagName === 'IMG') {
        const src = elemento.getAttribute('src') || '';
        if (!/^(https?:|data:image\/)/i.test(src)) elemento.remove();
      }
    });

    return template.innerHTML;
  }

  function extrairTexto(html) {
    const elemento = document.createElement('div');
    elemento.innerHTML = sanitizarHtml(html);
    return (elemento.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function normalizarTipo(tipo) {
    const valor = window.GestorApp.normalizarTexto(tipo);

    if (valor === 'evento' || valor === 'eventos') return 'Eventos';
    if (valor === 'aviso') return 'Aviso';
    return 'Informativo';
  }

  function formatarData(valor) {
    if (!valor) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(valor));
  }

  function setEstadoHistorico(mensagem, tipo) {
    const historico = getHistorico();
    historico.innerHTML = '';

    const estado = document.createElement('div');
    estado.className = `com-estado${tipo ? ` com-estado--${tipo}` : ''}`;
    estado.textContent = mensagem;
    historico.appendChild(estado);
  }

  function aplicarFiltro() {
    const historico = getHistorico();
    const termo = window.GestorApp.normalizarTexto(document.querySelector('.busca-input')?.value || '');
    const tipo = document.querySelector('.filtro-select')?.value || '';

    historico.querySelectorAll('.com-card').forEach((card) => {
      const titulo = window.GestorApp.normalizarTexto(card.dataset.titulo);
      const tag = card.dataset.tag || '';
      const casaBusca = titulo.includes(termo);
      const casaTipo = !tipo || tag === tipo;
      card.style.display = casaBusca && casaTipo ? '' : 'none';
    });
  }

  function criarCardComunicado(comunicado) {
    const {
      id_comunicado: idComunicado,
      titulo,
      destinatarios,
      conteudo,
      data_envio: dataEnvio,
      total_destinatarios: totalDestinatarios,
    } = comunicado;
    const tipo = normalizarTipo(comunicado.tipo);
    const data = formatarData(dataEnvio);
    const classe = classePorTipo[tipo] || 'info';
    const card = document.createElement('article');
    card.className = `com-card com-card--${classe}`;
    card.dataset.id = idComunicado;
    card.dataset.tipo = classe;
    card.dataset.tag = tipo;
    card.dataset.data = data;
    card.dataset.titulo = titulo;
    card.dataset.dest = rotuloDestinatario[destinatarios] || destinatarios || 'Todos os alunos';
    card.dataset.conteudo = sanitizarHtml(conteudo);
    card.innerHTML = `
      <button type="button" class="com-card-menu-btn" aria-label="Opcoes do comunicado"><i data-lucide="ellipsis-vertical"></i></button>
      <div class="com-card-menu">
        <button type="button" class="com-card-menu-item com-card-menu-item--excluir"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
      <div class="com-card-topo">
        <span class="com-tag"></span>
        <span class="com-data"></span>
      </div>
      <h3 class="com-card-titulo"></h3>
      <p class="com-card-texto"></p>
      <div class="com-card-rodape"><i data-lucide="users"></i> <span class="com-dest"></span></div>`;

    card.querySelector('.com-tag').textContent = tipo;
    card.querySelector('.com-data').textContent = data;
    card.querySelector('.com-card-titulo').textContent = titulo;
    card.querySelector('.com-card-texto').textContent = extrairTexto(conteudo);
    card.querySelector('.com-dest').textContent = totalDestinatarios > 0
      ? `${card.dataset.dest} (${totalDestinatarios})`
      : card.dataset.dest;
    return card;
  }

  function renderizarHistorico() {
    const historico = getHistorico();
    historico.innerHTML = '';

    if (!state.comunicados.length) {
      setEstadoHistorico('Nenhum comunicado cadastrado.');
      return;
    }

    state.comunicados.forEach((comunicado) => {
      historico.appendChild(criarCardComunicado(comunicado));
    });
    aplicarFiltro();
    window.GestorApp.recriarIcones();
  }

  async function carregarComunicados() {
    setEstadoHistorico('Carregando comunicados...', 'carregando');

    try {
      const comunicados = await window.GestorAPI.listarComunicados();
      state.comunicados = Array.isArray(comunicados) ? comunicados : [];
      renderizarHistorico();
    } catch (error) {
      console.error('[Comunicados Gestor]', error);
      setEstadoHistorico('Nao foi possivel carregar os comunicados.', 'erro');
    }
  }

  function fecharMenusCom() {
    getHistorico().querySelectorAll('.com-card-menu.aberto')
      .forEach((menu) => menu.classList.remove('aberto'));
  }

  function abrirModalComunicado(card) {
    const modal = document.getElementById('com-modal');
    const tipo = card.dataset.tipo || 'info';

    document.getElementById('com-modal-tag').textContent = card.dataset.tag || '';
    document.getElementById('com-modal-tag').className = `com-tag com-tag--${tipo}`;
    document.getElementById('com-modal-data').textContent = card.dataset.data || '';
    document.getElementById('com-modal-titulo').textContent = card.dataset.titulo || '';
    document.getElementById('com-modal-dest').textContent = card.dataset.dest || '';
    document.getElementById('com-modal-conteudo').innerHTML =
      sanitizarHtml(card.dataset.conteudo || '');
    document.getElementById('com-modal-evento').hidden = true;
    modal.hidden = false;
    window.GestorApp.recriarIcones();
  }

  async function publicarComunicado(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const editor = getEditor();
    const campoConteudo = document.getElementById('com-conteudo');
    const titulo = form.titulo.value.trim();
    const tipo = form.tipo.value;
    const destinatarios = form.destinatarios.value;
    const conteudo = sanitizarHtml(editor.innerHTML).trim();
    const botao = form.querySelector('.btn-publicar');

    if (!titulo || !extrairTexto(conteudo) || !destinatarios) {
      setFeedback('Preencha titulo, destinatarios e conteudo do comunicado.', 'erro');
      return;
    }

    campoConteudo.value = conteudo;
    botao.disabled = true;
    botao.textContent = 'Publicando...';
    setFeedback('Publicando comunicado...', 'carregando');

    try {
      const resposta = await window.GestorAPI.enviarComunicado({
        titulo,
        tipo,
        conteudo,
        destinatarios,
        enviado_por: Number(window.GestorApp.getRmGestor()),
      });

      if (resposta.comunicado) {
        state.comunicados.unshift(resposta.comunicado);
        renderizarHistorico();
      } else {
        await carregarComunicados();
      }
      form.reset();
      editor.innerHTML = '';
      setFeedback('Comunicado publicado e registrado com sucesso.', 'sucesso');
    } catch (error) {
      console.error('[Comunicados Gestor]', error);
      setFeedback(error.message || 'Nao foi possivel enviar o comunicado.', 'erro');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Publicar comunicado';
    }
  }

  async function importarCsv(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const arquivo = form.elements.file.files[0];
    const resultado = document.getElementById('importacao-resultado');
    const botao = form.querySelector('button[type="submit"]');

    if (!arquivo) {
      resultado.textContent = 'Selecione um arquivo CSV para importar.';
      return;
    }

    botao.disabled = true;
    resultado.textContent = 'Importando arquivo...';

    try {
      const resumo = await window.GestorAPI.importarHistoricoCsv(arquivo);
      resultado.textContent =
        `Importados: ${resumo.importados}. Conflitos: ${resumo.conflitos.length}. Ignorados: ${resumo.ignorados}.`;
      form.reset();
    } catch (error) {
      console.error('[Importacao Gestor]', error);
      resultado.textContent = error.message || 'Nao foi possivel importar o arquivo.';
    } finally {
      botao.disabled = false;
    }
  }

  function configurarEditor() {
    const editor = getEditor();
    const toolbar = document.querySelector('.com-toolbar');
    const menuEmoji = document.getElementById('com-emoji-menu');
    const inputAnexo = document.getElementById('com-anexo-input');
    const inputImagem = document.getElementById('com-imagem-input');
    let selecaoSalva = null;

    function salvarSelecao() {
      const selecao = window.getSelection();

      if (selecao.rangeCount && editor.contains(selecao.anchorNode)) {
        selecaoSalva = selecao.getRangeAt(0).cloneRange();
      }
    }

    function restaurarSelecao() {
      editor.focus();
      if (!selecaoSalva) return;

      const selecao = window.getSelection();
      selecao.removeAllRanges();
      selecao.addRange(selecaoSalva);
    }

    function executarComando(comando, valor) {
      restaurarSelecao();
      document.execCommand(comando, false, valor);
      salvarSelecao();
      atualizarBotoes();
    }

    function inserirHtml(html) {
      executarComando('insertHTML', sanitizarHtml(html));
    }

    function atualizarBotoes() {
      toolbar.querySelectorAll('[data-comando]').forEach((botao) => {
        botao.classList.toggle('ativo', document.queryCommandState(botao.dataset.comando));
      });
    }

    function lerArquivo(arquivo, callback) {
      const limite = 2 * 1024 * 1024;

      if (arquivo.size > limite) {
        alert('O arquivo deve ter no maximo 2 MB.');
        return;
      }

      const leitor = new FileReader();
      leitor.addEventListener('load', () => callback(String(leitor.result || '')));
      leitor.readAsDataURL(arquivo);
    }

    toolbar.addEventListener('mousedown', (event) => {
      if (event.target.closest('button')) event.preventDefault();
    });

    toolbar.addEventListener('click', (event) => {
      const botao = event.target.closest('button');
      if (!botao) return;

      const comando = botao.dataset.comando;
      const acao = botao.dataset.acaoEditor;

      if (comando) {
        executarComando(comando);
        return;
      }

      if (acao === 'link') {
        restaurarSelecao();
        const selecao = window.getSelection();
        const textoSelecionado = selecao.toString().trim();
        const urlInformada = window.prompt('Informe o endereco do link:');

        if (!urlInformada) return;

        const url = /^(https?:|mailto:)/i.test(urlInformada)
          ? urlInformada
          : `https://${urlInformada}`;

        if (textoSelecionado) {
          executarComando('createLink', url);
        } else {
          inserirHtml(`<a href="${url}">${url}</a>`);
        }
        return;
      }

      if (acao === 'anexo') inputAnexo.click();
      if (acao === 'imagem') inputImagem.click();
      if (acao === 'emoji') menuEmoji.hidden = !menuEmoji.hidden;
    });

    menuEmoji.addEventListener('click', (event) => {
      const botao = event.target.closest('[data-emoji]');
      if (!botao) return;
      inserirHtml(botao.dataset.emoji);
      menuEmoji.hidden = true;
    });

    inputImagem.addEventListener('change', () => {
      const arquivo = inputImagem.files[0];
      if (!arquivo) return;

      lerArquivo(arquivo, (src) => {
        inserirHtml(`<img src="${src}" alt="${arquivo.name}">`);
        inputImagem.value = '';
      });
    });

    inputAnexo.addEventListener('change', () => {
      const arquivo = inputAnexo.files[0];
      if (!arquivo) return;

      lerArquivo(arquivo, (href) => {
        inserirHtml(
          `<a class="com-anexo" href="${href}" download="${arquivo.name}">📎 ${arquivo.name}</a>`,
        );
        inputAnexo.value = '';
      });
    });

    ['keyup', 'mouseup', 'input', 'focus'].forEach((evento) => {
      editor.addEventListener(evento, () => {
        salvarSelecao();
        atualizarBotoes();
      });
    });

    editor.addEventListener('paste', (event) => {
      event.preventDefault();
      const texto = event.clipboardData.getData('text/plain');
      executarComando('insertText', texto);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-acao-editor="emoji"]') && !event.target.closest('#com-emoji-menu')) {
        menuEmoji.hidden = true;
      }
    });
  }

  function configurarEventos() {
    const historico = getHistorico();

    document.querySelector('.busca-input')?.addEventListener('input', aplicarFiltro);
    document.querySelector('.filtro-select')?.addEventListener('change', aplicarFiltro);
    document.getElementById('form-comunicado')?.addEventListener('submit', publicarComunicado);
    document.getElementById('form-importacao')?.addEventListener('submit', importarCsv);

    historico.addEventListener('click', (event) => {
      const btnMenu = event.target.closest('.com-card-menu-btn');
      const btnExcluir = event.target.closest('.com-card-menu-item--excluir');
      const dentroMenu = event.target.closest('.com-card-menu');

      if (btnMenu) {
        event.stopPropagation();
        const menu = btnMenu.parentElement.querySelector('.com-card-menu');
        const jaAberto = menu.classList.contains('aberto');
        fecharMenusCom();
        if (!jaAberto) menu.classList.add('aberto');
        return;
      }

      if (btnExcluir) {
        event.stopPropagation();
        const card = btnExcluir.closest('.com-card');
        const idComunicado = Number(card.dataset.id);

        if (!idComunicado) return;

        btnExcluir.disabled = true;
        window.GestorAPI.excluirComunicado(idComunicado)
          .then(() => {
            state.comunicados = state.comunicados
              .filter((comunicado) => comunicado.id_comunicado !== idComunicado);
            renderizarHistorico();
            setFeedback('Comunicado excluido com sucesso.', 'sucesso');
          })
          .catch((error) => {
            console.error('[Comunicados Gestor]', error);
            setFeedback(error.message || 'Nao foi possivel excluir o comunicado.', 'erro');
            btnExcluir.disabled = false;
          });
        return;
      }

      if (dentroMenu) return;

      const card = event.target.closest('.com-card');
      if (card) abrirModalComunicado(card);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.com-card-menu-btn') && !event.target.closest('.com-card-menu')) {
        fecharMenusCom();
      }
    });

    document.getElementById('com-modal').addEventListener('click', (event) => {
      if (event.target.closest('[data-fechar]')) {
        document.getElementById('com-modal').hidden = true;
      }
    });

    document.addEventListener('keydown', (event) => {
      const modal = document.getElementById('com-modal');
      if (event.key === 'Escape' && !modal.hidden) {
        modal.hidden = true;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    configurarEditor();
    carregarComunicados();
  });
})(window, document);
