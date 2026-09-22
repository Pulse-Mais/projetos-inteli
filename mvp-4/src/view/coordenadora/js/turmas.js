(function (window, document) {
  const coresMarca = ["turma-marca--verde", "turma-marca--azul", "turma-marca--amarelo", "turma-marca--azul-escuro"];

  let turmas = [];

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function formatarStatus(turma) {
    const hoje = new Date();
    const inicio = turma.data_inicio ? new Date(turma.data_inicio) : null;
    const fim = turma.data_fim ? new Date(turma.data_fim) : null;

    if (inicio && hoje < inicio) return "inativa";
    if (fim && hoje > fim) return "inativa";

    return "ativa";
  }

  function getSigla(turma) {
    const nome = String(turma.nome_turma || `Turma ${turma.id_turma}`);
    const numero = nome.match(/\d+/)?.[0] || turma.id_turma;

    return `T${numero}`;
  }

  function criarLinhaGeral(totalAlunos, totalTurmas) {
    const linha = document.createElement("a");

    linha.href = "alunos.html";
    linha.className = "turma-linha";
    linha.dataset.fixo = "1";
    linha.innerHTML = [
      '<div class="turma-marca turma-marca--azul-escuro">G</div>',
      '<div class="turma-detalhes">',
      '<h3 class="turma-nome">GERAL</h3>',
      '<p class="turma-info">',
      `<span><i data-lucide="users"></i> ${totalAlunos} Alunos</span>`,
      '<span class="turma-info-separador">·</span>',
      `<span><i data-lucide="folder"></i> ${totalTurmas} Turmas</span>`,
      "</p>",
      "</div>",
    ].join("");

    return linha;
  }

  function criarLinhaTurma(turma, indice) {
    const linha = document.createElement("a");
    const status = formatarStatus(turma);
    const nome = turma.nome_turma || `Turma ${turma.id_turma}`;
    const totalAlunos = Number(turma.total_alunos || 0);
    const classeCor = coresMarca[indice % coresMarca.length];

    linha.href = `alunos.html?id_turma=${encodeURIComponent(turma.id_turma)}&turma=${encodeURIComponent(nome)}`;
    linha.className = "turma-linha";
    linha.dataset.status = status;
    linha.dataset.alunos = String(totalAlunos);
    linha.dataset.nome = nome;
    linha.innerHTML = [
      `<div class="turma-marca ${classeCor}">${getSigla(turma)}</div>`,
      '<div class="turma-detalhes">',
      `<h3 class="turma-nome">${nome}</h3>`,
      '<p class="turma-info">',
      `<span><i data-lucide="users"></i> ${totalAlunos} Alunos</span>`,
      '<span class="turma-info-separador">·</span>',
      `<span><i data-lucide="activity"></i> ${status === "ativa" ? "Ativa" : "Inativa"}</span>`,
      "</p>",
      "</div>",
    ].join("");

    return linha;
  }

  function atualizarSubtitulo(totalAlunos, totalTurmas) {
    const subtitulo = document.querySelector(".pagina-subtitulo");

    if (!subtitulo) return;

    subtitulo.textContent = `Acompanhe o progresso de ${totalTurmas} turmas · ${totalAlunos} alunos no total`;
  }

  function renderizarTurmas(lista, totalAlunosGeral) {
    const listaTurmas = document.querySelector(".lista-turmas");

    if (!listaTurmas) return;

    listaTurmas.innerHTML = "";

    const totalAlunos =
      totalAlunosGeral !== undefined && totalAlunosGeral !== null
        ? Number(totalAlunosGeral || 0)
        : lista.reduce((total, turma) => total + Number(turma.total_alunos || 0), 0);
    const totalTurmas = lista.length;

    listaTurmas.appendChild(criarLinhaGeral(totalAlunos, totalTurmas));
    lista.forEach((turma, indice) => {
      listaTurmas.appendChild(criarLinhaTurma(turma, indice));
    });

    atualizarSubtitulo(totalAlunos, totalTurmas);
    window.lucide?.createIcons();
    aplicarTurmas();
  }

  function renderizarEstado(mensagem) {
    const listaTurmas = document.querySelector(".lista-turmas");

    if (!listaTurmas) return;

    listaTurmas.innerHTML = `<div class="turmas-estado">${mensagem}</div>`;
  }

  function aplicarTurmas() {
    const listaTurmas = document.querySelector(".lista-turmas");
    const inputBusca = document.querySelector(".busca-input");
    const selects = document.querySelectorAll(".filtro-select");
    const selectStatus = selects[0];
    const selectOrdem = selects[1];

    if (!listaTurmas || !inputBusca || !selectStatus || !selectOrdem) return;

    const termo = normalizarTexto(inputBusca.value);
    const status = selectStatus.value;
    const ordem = selectOrdem.value;
    const linhas = Array.from(listaTurmas.querySelectorAll(".turma-linha"));
    const geral = linhas.filter((linha) => linha.dataset.fixo === "1");
    const demais = linhas.filter((linha) => linha.dataset.fixo !== "1");

    geral.forEach((linha) => {
      linha.hidden = false;
    });

    demais.forEach((linha) => {
      const nome = normalizarTexto(linha.dataset.nome || linha.querySelector(".turma-nome")?.textContent);
      const casaBusca = !termo || nome.includes(termo);
      const casaStatus =
        !status ||
        (status === "ativas" && linha.dataset.status === "ativa") ||
        (status === "inativas" && linha.dataset.status === "inativa");

      linha.hidden = !(casaBusca && casaStatus);
    });

    demais.sort((a, b) => {
      const nomeA = a.dataset.nome || "";
      const nomeB = b.dataset.nome || "";
      const alunosA = Number(a.dataset.alunos || 0);
      const alunosB = Number(b.dataset.alunos || 0);

      if (ordem === "za") return nomeB.localeCompare(nomeA, "pt-BR");
      if (ordem === "mais-alunos") return alunosB - alunosA;

      return nomeA.localeCompare(nomeB, "pt-BR");
    });

    geral.forEach((linha) => listaTurmas.appendChild(linha));
    demais.forEach((linha) => listaTurmas.appendChild(linha));
  }

  async function carregarTurmas() {
    renderizarEstado("Carregando turmas...");

    try {
      const resposta = await window.CoordenadoraAPI.listarTurmas({ limit: 100 });
      turmas = Array.isArray(resposta.data) ? resposta.data : [];

      if (turmas.length === 0) {
        renderizarEstado("Nenhuma turma encontrada.");
        atualizarSubtitulo(0, 0);
        return;
      }

      renderizarTurmas(turmas, resposta?.summary?.total_alunos_geral);
    } catch (error) {
      console.error("[Turmas Coordenadora]", error);
      renderizarEstado("Não foi possível carregar as turmas.");
    }
  }

  function configurarFiltros() {
    document.querySelector(".busca-input")?.addEventListener("input", aplicarTurmas);
    document.querySelectorAll(".filtro-select").forEach((select) => {
      select.addEventListener("change", aplicarTurmas);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.lucide?.createIcons();
    configurarFiltros();
    carregarTurmas();
  });
})(window, document);
