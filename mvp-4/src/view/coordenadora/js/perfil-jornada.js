(function (window, document) {
  const TEXTO_VAZIO = "Não informado";
  const DEFAULT_RM_COORDENADORA = "1001";

  function getRaAtual() {
    return (
      window.PerfilAluno?.getRaAtual?.() ||
      new URLSearchParams(window.location.search).get("ra") ||
      window.localStorage.getItem("alunoSelecionadoRa")
    );
  }

  function getRmCoordenadora() {
    const params = new URLSearchParams(window.location.search);
    const rmSalvo =
      params.get("rm") ||
      window.localStorage.getItem("rmCoordenadora") ||
      window.PULSE_COORDENADORA_RM ||
      DEFAULT_RM_COORDENADORA;

    return String(rmSalvo) === "1011" ? DEFAULT_RM_COORDENADORA : rmSalvo;
  }

  function formatarData(valor) {
    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }

  function normalizarStatus(status) {
    const texto = String(status || "").trim();

    if (!texto) return TEXTO_VAZIO;

    const textoNormalizado = texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (textoNormalizado.includes("nao conclu")) return "Não concluído";
    if (textoNormalizado.includes("conclu")) return "Concluída";
    if (textoNormalizado.includes("andamento")) return "Em andamento";
    if (textoNormalizado.includes("iniciada")) return "Não iniciada";

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function classePorStatus(status) {
    const texto = String(status || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (texto.includes("nao conclu")) return "nao-concluido";
    if (texto.includes("conclu") || texto.includes("presente")) return "concluido";
    if (texto.includes("andamento")) return "andamento";
    if (texto.includes("ausente") || texto.includes("nao iniciada")) return "pendente";

    return "andamento";
  }

  function criarItemJornada({ modulo, nome, status, detalhe }) {
    const li = document.createElement("li");
    const statusFormatado = normalizarStatus(status);
    const classeStatus = classePorStatus(statusFormatado);
    const icone = classeStatus === "concluido" ? "check" : "clock";
    const concluido = classeStatus === "concluido";

    li.className = `trilha-item trilha-item--${classeStatus}`;
    li.dataset.modulo = modulo || "";
    li.dataset.concluido = concluido ? "true" : "false";
    li.innerHTML = [
      `<span class="trilha-rail"><span class="trilha-check"><i data-lucide="${icone}"></i></span></span>`,
      '<div class="trilha-modulo">',
      '<div class="trilha-modulo-info">',
      '<span class="trilha-modulo-nome"></span>',
      '<span class="trilha-modulo-detalhe"></span>',
      "</div>",
      `<span class="pill-status pill-status--${classeStatus}"></span>`,
      '<button type="button" class="trilha-alternar"></button>',
      '<button type="button" class="trilha-remover" aria-label="Remover módulo"><i data-lucide="x"></i></button>',
      "</div>",
    ].join("");

    li.querySelector(".trilha-modulo-nome").textContent = nome || TEXTO_VAZIO;
    li.querySelector(".trilha-modulo-detalhe").textContent = detalhe || "";
    li.querySelector(".pill-status").textContent = statusFormatado;
    li.querySelector(".trilha-alternar").textContent = concluido ? "Desfazer" : "Concluir";

    return li;
  }

  function criarItemVazio(mensagem) {
    const li = document.createElement("li");

    li.className = "trilha-item trilha-item--pendente";
    li.innerHTML = [
      '<span class="trilha-rail"><span class="trilha-check"><i data-lucide="info"></i></span></span>',
      '<div class="trilha-modulo">',
      '<div class="trilha-modulo-info">',
      '<span class="trilha-modulo-nome"></span>',
      '<span class="trilha-modulo-detalhe"></span>',
      "</div>",
      '<span class="pill-status pill-status--pendente">Sem dados</span>',
      "</div>",
    ].join("");

    li.querySelector(".trilha-modulo-nome").textContent = mensagem;

    return li;
  }

  function montarItensJornada(jornada) {
    const modulosConcluidos = new Map();

    (jornada.certificados || []).forEach((certificado) => {
      const nome = String(certificado.nome || "");
      const match = nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .match(/modulo\s*([1-4])/i);

      if (!match) return;

      const numeroModulo = Number(match[1]);

      modulosConcluidos.set(numeroModulo, {
        modulo: numeroModulo,
        nome: `Módulo ${numeroModulo}`,
        status: "Concluída",
        detalhe: certificado.data ? `Concluído em ${formatarData(certificado.data)}` : "Conclusão registrada",
      });
    });

    return [1, 2, 3, 4].map(
      (numeroModulo) =>
        modulosConcluidos.get(numeroModulo) || {
          modulo: numeroModulo,
          nome: `Módulo ${numeroModulo}`,
          status: "Não concluído",
          detalhe: "Conclusão não registrada",
        },
    );
  }

  function renderizarJornada(jornada) {
    const trilha = document.getElementById("trilha-jornada");

    if (!trilha) return;

    trilha.innerHTML = "";

    const itens = montarItensJornada(jornada);

    itens.forEach((item) => {
      trilha.appendChild(criarItemJornada(item));
    });

    window.lucide?.createIcons();
  }

  async function carregarJornada() {
    const trilha = document.getElementById("trilha-jornada");
    const ra = getRaAtual();

    if (!trilha) return;

    trilha.innerHTML = "";
    trilha.appendChild(criarItemVazio("Carregando jornada acadêmica..."));
    window.lucide?.createIcons();

    if (!ra || !window.CoordenadoraAPI?.buscarJornadaAluno) {
      renderizarJornada({ turmas: [], certificados: [], aulas: [], eventos: [] });
      return;
    }

    try {
      const jornada = await window.CoordenadoraAPI.buscarJornadaAluno(ra);
      renderizarJornada(jornada);
    } catch (error) {
      console.error("[Jornada Coordenadora]", error);
      trilha.innerHTML = "";
      trilha.appendChild(criarItemVazio("Não foi possível carregar a jornada acadêmica."));
      window.lucide?.createIcons();
    }
  }

  function configurarEdicaoJornada() {
    const trilha = document.getElementById("trilha-jornada");

    if (!trilha) return;

    trilha.addEventListener("click", async (event) => {
      const botao = event.target.closest(".trilha-alternar");

      if (!botao) return;

      const item = botao.closest(".trilha-item");
      const modulo = Number(item?.dataset.modulo);
      const concluido = item?.dataset.concluido === "true";
      const rm = getRmCoordenadora();
      const ra = getRaAtual();

      if (!ra || !Number.isInteger(modulo) || modulo < 1 || modulo > 4) return;

      botao.disabled = true;
      botao.textContent = concluido ? "Removendo..." : "Salvando...";

      try {
        if (concluido) {
          await window.CoordenadoraAPI.desfazerConclusaoModuloAluno(rm, ra, modulo);
        } else {
          await window.CoordenadoraAPI.concluirModuloAluno(rm, ra, modulo, {
            data: new Date().toISOString().slice(0, 10),
          });
        }

        await carregarJornada();
      } catch (error) {
        console.error("[Atualizar Módulo Coordenadora]", error);
        botao.disabled = false;
        botao.textContent = concluido ? "Desfazer" : "Concluir";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", carregarJornada);
  document.addEventListener("DOMContentLoaded", configurarEdicaoJornada);
})(window, document);
