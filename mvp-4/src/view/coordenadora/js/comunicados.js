(function (window, document) {
  const DEFAULT_RM_COORDENADORA = "1001";
  const classePorTipo = {
    Informativo: "info",
    Eventos: "evento",
    Aviso: "aviso",
  };
  const tipoPorClasse = {
    info: "Informativo",
    evento: "Eventos",
    aviso: "Aviso",
  };
  const emojis = ["🙂", "😀", "😊", "👏", "🙌", "💙", "⭐", "✅", "⚠️", "📌", "📅", "🎉", "🚀", "💡", "📚", "🏆"];
  let comunicadoParaExcluir = null;

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getRmCoordenadora() {
    const params = getParams();
    const rmSalvo =
      params.get("rm") ||
      window.localStorage.getItem("rmCoordenadora") ||
      window.PULSE_COORDENADORA_RM ||
      DEFAULT_RM_COORDENADORA;

    return String(rmSalvo) === "1011" ? DEFAULT_RM_COORDENADORA : rmSalvo;
  }

  function formatarData(valor) {
    if (!valor) return new Date().toLocaleDateString("pt-BR");

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function setFeedback(mensagem, tipo) {
    const feedback = document.getElementById("com-feedback");

    if (!feedback) return;

    feedback.textContent = mensagem || "";
    feedback.className = `com-feedback${tipo ? ` com-feedback--${tipo}` : ""}`;
  }

  function setCarregando(carregando) {
    const form = document.getElementById("form-comunicado");
    const botao = form?.querySelector('[type="submit"]');

    if (!form) return;

    Array.from(form.elements).forEach((elemento) => {
      elemento.disabled = carregando;
    });

    if (botao) {
      botao.textContent = carregando ? "Publicando..." : "Publicar comunicado";
    }
  }

  function getCampoConteudo() {
    return document.querySelector('#form-comunicado [name="conteudo"]');
  }

  function getEditorConteudo() {
    return document.getElementById("com-editor-area");
  }

  function getTextoConteudo() {
    return getEditorConteudo()?.textContent.trim() || "";
  }

  function sanitizarConteudo(html) {
    const template = document.createElement("template");
    const tagsPermitidas = new Set([
      "A",
      "B",
      "BR",
      "DIV",
      "EM",
      "I",
      "IMG",
      "LI",
      "OL",
      "P",
      "SPAN",
      "STRONG",
      "U",
      "UL",
    ]);

    template.innerHTML = html;

    template.content.querySelectorAll("*").forEach((elemento) => {
      if (!tagsPermitidas.has(elemento.tagName)) {
        elemento.replaceWith(...Array.from(elemento.childNodes));
        return;
      }

      Array.from(elemento.attributes).forEach((atributo) => {
        const manterHref = elemento.tagName === "A" && atributo.name === "href";
        const manterSrc = elemento.tagName === "IMG" && atributo.name === "src";
        const manterAlt = elemento.tagName === "IMG" && atributo.name === "alt";

        if (!manterHref && !manterSrc && !manterAlt) {
          elemento.removeAttribute(atributo.name);
        }
      });

      if (elemento.tagName === "A") {
        const href = elemento.getAttribute("href") || "";

        if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
          elemento.removeAttribute("href");
        } else {
          elemento.setAttribute("target", "_blank");
          elemento.setAttribute("rel", "noopener noreferrer");
        }
      }

      if (elemento.tagName === "IMG") {
        const src = elemento.getAttribute("src") || "";

        if (!/^data:image\//i.test(src) && !/^https?:\/\//i.test(src)) {
          elemento.remove();
        }
      }
    });

    return template.innerHTML.trim();
  }

  function escaparHtml(valor) {
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sincronizarConteudo() {
    const campo = getCampoConteudo();
    const editor = getEditorConteudo();

    if (!campo || !editor) return "";

    const conteudo = sanitizarConteudo(editor.innerHTML);

    campo.value = conteudo;
    return conteudo;
  }

  function focarEditor() {
    getEditorConteudo()?.focus();
  }

  function executarComando(comando, valor) {
    focarEditor();
    document.execCommand(comando, false, valor);
    sincronizarConteudo();
    atualizarEstadoToolbar();
  }

  function aplicarAcaoEditor(acao) {
    const acoes = {
      negrito: () => executarComando("bold"),
      italico: () => executarComando("italic"),
      sublinhado: () => executarComando("underline"),
      lista: () => executarComando("insertUnorderedList"),
      link: inserirLink,
      emoji: alternarMenuEmojis,
      anexo: () => document.getElementById("com-anexo-input")?.click(),
      imagem: () => document.getElementById("com-imagem-input")?.click(),
    };

    acoes[acao]?.();
  }

  function inserirTextoEditor(texto) {
    executarComando("insertText", texto);
  }

  function inserirLink() {
    const url = window.prompt("Cole o link:");

    if (!url) return;

    const link = url.trim();
    const urlFinal = /^https?:\/\//i.test(link) || /^mailto:/i.test(link) ? link : `https://${link}`;
    const selecao = window.getSelection();

    if (!selecao || selecao.isCollapsed) {
      executarComando(
        "insertHTML",
        `<a href="${escaparHtml(urlFinal)}" target="_blank" rel="noopener noreferrer">${escaparHtml(link)}</a>`,
      );
      return;
    }

    executarComando("createLink", urlFinal);
  }

  function configurarToolbar() {
    const toolbar = document.querySelector(".com-toolbar");
    const inputAnexo = document.getElementById("com-anexo-input");
    const inputImagem = document.getElementById("com-imagem-input");
    const editor = getEditorConteudo();

    toolbar?.addEventListener("click", (event) => {
      const botao = event.target.closest("[data-acao-editor]");

      if (!botao) return;

      aplicarAcaoEditor(botao.dataset.acaoEditor);
    });

    editor?.addEventListener("input", () => {
      sincronizarConteudo();
      atualizarEstadoToolbar();
    });
    editor?.addEventListener("keyup", atualizarEstadoToolbar);
    editor?.addEventListener("mouseup", atualizarEstadoToolbar);
    editor?.addEventListener("focus", atualizarEstadoToolbar);
    editor?.addEventListener("paste", () => {
      window.setTimeout(() => {
        sincronizarConteudo();
        atualizarEstadoToolbar();
      }, 0);
    });

    inputAnexo?.addEventListener("change", () => {
      const arquivo = inputAnexo.files?.[0];

      if (!arquivo) return;

      executarComando("insertHTML", `<p><strong>Anexo:</strong> ${arquivo.name}</p>`);
      setFeedback(`Anexo "${arquivo.name}" adicionado ao comunicado.`, "sucesso");
    });

    inputImagem?.addEventListener("change", () => {
      const arquivo = inputImagem.files?.[0];

      if (!arquivo) return;

      const leitor = new FileReader();

      leitor.addEventListener("load", () => {
        executarComando(
          "insertHTML",
          `<p><img src="${escaparHtml(leitor.result)}" alt="${escaparHtml(arquivo.name)}"></p>`,
        );
        setFeedback(`Imagem "${arquivo.name}" adicionada ao comunicado.`, "sucesso");
        inputImagem.value = "";
      });

      leitor.readAsDataURL(arquivo);
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".com-emoji-menu") && !event.target.closest('[data-acao-editor="emoji"]')) {
        fecharMenuEmojis();
      }
    });
  }

  function alternarMenuEmojis() {
    const menu = obterMenuEmojis();

    menu.hidden = !menu.hidden;
  }

  function fecharMenuEmojis() {
    const menu = document.getElementById("com-emoji-menu");

    if (menu) {
      menu.hidden = true;
    }
  }

  function obterMenuEmojis() {
    let menu = document.getElementById("com-emoji-menu");

    if (menu) return menu;

    menu = document.createElement("div");
    menu.id = "com-emoji-menu";
    menu.className = "com-emoji-menu";
    menu.hidden = true;

    emojis.forEach((emoji) => {
      const botao = document.createElement("button");

      botao.type = "button";
      botao.textContent = emoji;
      botao.setAttribute("aria-label", `Inserir emoji ${emoji}`);
      botao.addEventListener("click", () => {
        inserirTextoEditor(emoji);
        fecharMenuEmojis();
      });
      menu.appendChild(botao);
    });

    document.querySelector(".com-toolbar")?.appendChild(menu);

    return menu;
  }

  function atualizarEstadoToolbar() {
    const estados = {
      negrito: document.queryCommandState("bold"),
      italico: document.queryCommandState("italic"),
      sublinhado: document.queryCommandState("underline"),
      lista: document.queryCommandState("insertUnorderedList"),
    };

    document.querySelectorAll("[data-acao-editor]").forEach((botao) => {
      const ativo = Boolean(estados[botao.dataset.acaoEditor]);

      botao.classList.toggle("ativo", ativo);
      botao.setAttribute("aria-pressed", ativo ? "true" : "false");
    });
  }

  function criarCard({ id, titulo, tipo, destinatario, conteudo, data }) {
    const tipoNormalizado = normalizarTipo(tipo);
    const classe = classePorTipo[tipoNormalizado] || "info";
    const dataFormatada = formatarData(data);
    const card = document.createElement("article");
    const textoPreview = removerHtml(conteudo);

    card.className = `com-card com-card--${classe}`;
    card.dataset.tipo = classe;
    card.dataset.tag = tipoNormalizado;
    card.dataset.data = dataFormatada;
    card.dataset.titulo = titulo;
    card.dataset.dest = destinatario;
    card.dataset.conteudo = conteudo;
    card.dataset.textoBusca = textoPreview;
    card.dataset.local = destinatario;
    card.dataset.eventoData = dataFormatada;
    card.dataset.idComunicado = id || "";

    card.innerHTML = [
      '<button type="button" class="com-card-menu-btn" aria-label="Opcoes do comunicado"><i data-lucide="ellipsis-vertical"></i></button>',
      '<div class="com-card-menu">',
      '<button type="button" class="com-card-menu-item com-card-menu-item--excluir"><i data-lucide="trash-2"></i> Excluir</button>',
      "</div>",
      '<div class="com-card-topo">',
      '<span class="com-tag"></span>',
      '<span class="com-data"></span>',
      "</div>",
      '<h3 class="com-card-titulo"></h3>',
      '<p class="com-card-texto"></p>',
      '<div class="com-card-rodape"><i data-lucide="users"></i> <span class="com-dest"></span></div>',
    ].join("");

    card.querySelector(".com-tag").textContent = tipoNormalizado;
    card.querySelector(".com-data").textContent = dataFormatada;
    card.querySelector(".com-card-titulo").textContent = titulo;
    card.querySelector(".com-card-texto").textContent = textoPreview;
    card.querySelector(".com-dest").textContent = destinatario;

    return card;
  }

  function normalizarTipo(tipo) {
    if (classePorTipo[tipo]) return tipo;

    const tipoNormalizado = normalizarTexto(tipo);
    const classe = Object.values(classePorTipo).find((valor) => valor === tipoNormalizado);

    return tipoPorClasse[classe] || "Informativo";
  }

  function removerHtml(html) {
    const div = document.createElement("div");

    div.innerHTML = html || "";
    return div.textContent.trim();
  }

  async function publicarComunicado(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const historico = document.getElementById("com-historico");
    const rm = getRmCoordenadora();
    const titulo = form.titulo.value.trim();
    const tipo = form.tipo.value;
    const destinatario = form.destinatario.value;
    const data = form.data.value;
    const conteudo = sincronizarConteudo();
    const textoConteudo = getTextoConteudo();

    if (!titulo || !textoConteudo || !data) {
      setFeedback("Preencha título, data e conteúdo do comunicado.", "erro");
      return;
    }

    setCarregando(true);
    setFeedback("Publicando comunicado...", "carregando");

    try {
      await window.CoordenadoraAPI.registrarEvento(rm, {
        tema: titulo,
        sede: destinatario,
        data,
        categoria: tipo,
        descricao: conteudo,
      });

      form.reset();
      getEditorConteudo().innerHTML = "";
      sincronizarConteudo();
      preencherDataPadrao();
      setFeedback("Comunicado publicado e registrado no backend.", "sucesso");
      await carregarComunicados();
    } catch (error) {
      console.error("[Comunicados Coordenadora]", error);
      setFeedback(error.message || "Não foi possível publicar o comunicado.", "erro");
    } finally {
      setCarregando(false);
    }
  }

  function fecharMenus() {
    document
      .querySelectorAll("#com-historico .com-card-menu.aberto")
      .forEach((menu) => menu.classList.remove("aberto"));
  }

  function abrirModalComunicado(card) {
    const modal = document.getElementById("com-modal");
    const modalTag = document.getElementById("com-modal-tag");
    const modalData = document.getElementById("com-modal-data");
    const modalTitulo = document.getElementById("com-modal-titulo");
    const modalDest = document.getElementById("com-modal-dest");
    const modalConteudo = document.getElementById("com-modal-conteudo");
    const modalEvento = document.getElementById("com-modal-evento");
    const modalLocalItem = document.getElementById("com-modal-local-item");
    const modalQuandoItem = document.getElementById("com-modal-quando-item");
    const modalLocal = document.getElementById("com-modal-local");
    const modalQuando = document.getElementById("com-modal-quando");
    const tipo = card.dataset.tipo || "info";
    const local = card.dataset.local;
    const quando = card.dataset.eventoData;

    modalTag.textContent = card.dataset.tag || "";
    modalTag.className = `com-tag com-tag--${tipo}`;
    modalData.textContent = card.dataset.data || "";
    modalTitulo.textContent = card.dataset.titulo || "";
    modalDest.textContent = card.dataset.dest || "";
    modalConteudo.innerHTML = sanitizarConteudo(card.dataset.conteudo || "");
    modalLocal.textContent = local || "";
    modalQuando.textContent = quando || "";
    modalLocalItem.hidden = !local;
    modalQuandoItem.hidden = !quando;
    modalEvento.hidden = !(local || quando);
    modal.hidden = false;
    window.lucide?.createIcons();
  }

  function abrirModalExclusao(card) {
    const modal = document.getElementById("com-confirmar-exclusao");
    const idComunicado = card?.dataset.idComunicado;

    if (!modal || !card || !idComunicado) return;

    comunicadoParaExcluir = {
      card,
      idComunicado,
    };

    fecharMenus();
    modal.hidden = false;
    window.lucide?.createIcons();
    modal.querySelector("[data-confirmar-exclusao]")?.focus();
  }

  function fecharModalExclusao() {
    const modal = document.getElementById("com-confirmar-exclusao");
    const botaoConfirmar = modal?.querySelector("[data-confirmar-exclusao]");

    if (botaoConfirmar) {
      botaoConfirmar.disabled = false;
      botaoConfirmar.textContent = "Excluir comunicado";
    }

    if (modal) {
      modal.hidden = true;
    }

    comunicadoParaExcluir = null;
  }

  async function confirmarExclusaoComunicado() {
    const modal = document.getElementById("com-confirmar-exclusao");
    const botaoConfirmar = modal?.querySelector("[data-confirmar-exclusao]");

    if (!comunicadoParaExcluir) return;

    if (botaoConfirmar) {
      botaoConfirmar.disabled = true;
      botaoConfirmar.textContent = "Excluindo...";
    }

    setFeedback("Excluindo comunicado...", "carregando");

    try {
      await window.CoordenadoraAPI.excluirComunicado(getRmCoordenadora(), comunicadoParaExcluir.idComunicado);
      comunicadoParaExcluir.card.remove();
      fecharModalExclusao();
      aplicarFiltros();
      setFeedback("Comunicado excluído com sucesso.", "sucesso");
    } catch (error) {
      console.error("[Excluir Comunicado Coordenadora]", error);

      if (botaoConfirmar) {
        botaoConfirmar.disabled = false;
        botaoConfirmar.textContent = "Excluir comunicado";
      }

      setFeedback(error.message || "Não foi possível excluir o comunicado.", "erro");
    }
  }

  function configurarHistorico() {
    const historico = document.getElementById("com-historico");

    historico.addEventListener("click", async (event) => {
      const btnMenu = event.target.closest(".com-card-menu-btn");
      const btnExcluir = event.target.closest(".com-card-menu-item--excluir");
      const dentroMenu = event.target.closest(".com-card-menu");

      if (btnMenu) {
        event.stopPropagation();
        const menu = btnMenu.parentElement.querySelector(".com-card-menu");
        const jaAberto = menu.classList.contains("aberto");
        fecharMenus();
        if (!jaAberto) menu.classList.add("aberto");
        return;
      }

      if (btnExcluir) {
        event.stopPropagation();
        const card = btnExcluir.closest(".com-card");
        const idComunicado = card?.dataset.idComunicado;

        if (!idComunicado) {
          setFeedback("Recarregue os comunicados antes de excluir este item.", "erro");
          return;
        }

        abrirModalExclusao(card);
        return;
      }

      if (dentroMenu) return;

      const card = event.target.closest(".com-card");
      if (card) abrirModalComunicado(card);
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".com-card-menu-btn") && !event.target.closest(".com-card-menu")) {
        fecharMenus();
      }
    });
  }

  function fecharModalComunicado() {
    const modal = document.getElementById("com-modal");

    if (modal) {
      modal.hidden = true;
    }
  }

  function configurarModal() {
    const modal = document.getElementById("com-modal");

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-fechar]")) {
        fecharModalComunicado();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        fecharModalComunicado();
      }
    });
  }

  function configurarModalExclusao() {
    const modal = document.getElementById("com-confirmar-exclusao");

    if (!modal) return;

    modal.addEventListener("click", async (event) => {
      if (event.target.closest("[data-cancelar-exclusao]")) {
        fecharModalExclusao();
        return;
      }

      if (event.target.closest("[data-confirmar-exclusao]")) {
        await confirmarExclusaoComunicado();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        fecharModalExclusao();
      }
    });
  }

  function aplicarFiltros() {
    const busca = normalizarTexto(document.querySelector(".busca-input")?.value);
    const filtro = document.querySelector(".filtro-select")?.value || "";
    const cards = document.querySelectorAll("#com-historico .com-card");
    let totalVisiveis = 0;

    cards.forEach((card) => {
      const texto = normalizarTexto(
        [
          card.dataset.titulo,
          card.dataset.textoBusca || removerHtml(card.dataset.conteudo),
          card.dataset.dest,
          card.dataset.tag,
        ].join(" "),
      );
      const passaBusca = !busca || texto.includes(busca);
      const passaTipo = !filtro || card.dataset.tipo === filtro;
      const visivel = passaBusca && passaTipo;

      card.hidden = !visivel;

      if (visivel) {
        totalVisiveis += 1;
      }
    });

    atualizarEstadoVazio(totalVisiveis);
  }

  function atualizarEstadoVazio(totalVisiveis) {
    const historico = document.getElementById("com-historico");
    let estado = document.getElementById("com-estado-vazio");

    if (!historico) return;

    if (totalVisiveis > 0) {
      estado?.remove();
      return;
    }

    if (!estado) {
      estado = document.createElement("div");
      estado.id = "com-estado-vazio";
      estado.className = "com-estado-vazio";
      estado.textContent = "Nenhum comunicado encontrado para os filtros aplicados.";
      historico.appendChild(estado);
    }
  }

  function configurarFiltros() {
    document.querySelector(".busca-input")?.addEventListener("input", aplicarFiltros);
    document.querySelector(".filtro-select")?.addEventListener("change", aplicarFiltros);
  }

  function preencherDataPadrao() {
    const campoData = document.querySelector('#form-comunicado [name="data"]');

    if (campoData && !campoData.value) {
      campoData.value = new Date().toISOString().slice(0, 10);
    }
  }

  function configurarFormulario() {
    const form = document.getElementById("form-comunicado");

    preencherDataPadrao();
    form.addEventListener("submit", publicarComunicado);
  }

  async function carregarComunicados() {
    const historico = document.getElementById("com-historico");
    const rm = getRmCoordenadora();

    if (!historico || !window.CoordenadoraAPI?.listarComunicados) return;

    try {
      const comunicados = await window.CoordenadoraAPI.listarComunicados(rm);

      historico.querySelectorAll(".com-card").forEach((card) => card.remove());

      comunicados.forEach((comunicado) => {
        historico.appendChild(
          criarCard({
            id: comunicado.id_comunicado,
            titulo: comunicado.tema,
            tipo: comunicado.tipo,
            destinatario: comunicado.sede,
            conteudo: comunicado.descricao || "",
            data: comunicado.data,
          }),
        );
      });

      window.lucide?.createIcons();
      aplicarFiltros();
    } catch (error) {
      console.error("[Listar Comunicados Coordenadora]", error);
      setFeedback("Não foi possível carregar os comunicados salvos.", "erro");
      aplicarFiltros();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.lucide?.createIcons();
    configurarFormulario();
    configurarHistorico();
    configurarModal();
    configurarModalExclusao();
    configurarFiltros();
    configurarToolbar();
    carregarComunicados();
  });
})(window, document);
