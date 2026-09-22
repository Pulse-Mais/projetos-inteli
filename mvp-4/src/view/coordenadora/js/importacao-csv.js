(function (window, document) {
  const CABECALHO_NORMALIZADO = [
    "ra",
    "nome",
    "cpf",
    "email_primario",
    "tel_primario",
    "genero",
    "data_nasc",
    "data_ingresso",
    "categoria",
    "status",
  ];
  const TEXTO_NAO_COLETADO = "Não coletado";
  const TELEFONE_NAO_COLETADO = "#";
  const DEFAULT_RM_COORDENADORA = "1001";

  function parseLinhaCsv(linha) {
    const campos = [];
    let campoAtual = "";
    let dentroDeAspas = false;

    for (let indice = 0; indice < linha.length; indice += 1) {
      const caractere = linha[indice];
      const proximoCaractere = linha[indice + 1];

      if (caractere === '"' && dentroDeAspas && proximoCaractere === '"') {
        campoAtual += '"';
        indice += 1;
        continue;
      }

      if (caractere === '"') {
        dentroDeAspas = !dentroDeAspas;
        continue;
      }

      if (caractere === "," && !dentroDeAspas) {
        campos.push(campoAtual.trim());
        campoAtual = "";
        continue;
      }

      campoAtual += caractere;
    }

    campos.push(campoAtual.trim());
    return campos;
  }

  function escapeCampoCsv(valor) {
    const texto = String(valor ?? "");

    if (texto.includes(",") || texto.includes('"') || texto.includes("\n")) {
      return `"${texto.replace(/"/g, '""')}"`;
    }

    return texto;
  }

  function normalizarCabecalho(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
  }

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

  function indiceCabecalho(cabecalhoMap, candidatos, fallback) {
    for (let indice = 0; indice < candidatos.length; indice += 1) {
      const encontrado = cabecalhoMap.get(candidatos[indice]);
      if (encontrado !== undefined) {
        return encontrado;
      }
    }

    return fallback;
  }

  function obterCampo(campos, indice) {
    if (indice === null || indice === undefined || indice < 0) {
      return "";
    }

    return String(campos[indice] || "").trim();
  }

  function montarRegistroNormalizado(campos, mapaCabecalho, indiceRegistro) {
    const indiceRa = indiceCabecalho(mapaCabecalho, ["ra", "rm", "matricula"], null);
    const indiceNome = indiceCabecalho(mapaCabecalho, ["nome", "nome_completo", "aluno", "column_17"], 0);
    const indiceCpf = indiceCabecalho(mapaCabecalho, ["cpf", "documento"], null);
    const indiceEmail = indiceCabecalho(mapaCabecalho, ["email_primario", "email", "e_mail"], 2);
    const indiceTelefone = indiceCabecalho(mapaCabecalho, ["tel_primario", "telefone", "celular", "contato"], 1);
    const indiceGenero = indiceCabecalho(mapaCabecalho, ["genero", "sexo"], null);
    const indiceDataNasc = indiceCabecalho(mapaCabecalho, ["data_nasc", "data_nascimento", "nascimento"], null);
    const indiceDataIngresso = indiceCabecalho(mapaCabecalho, ["data_ingresso", "ingresso"], null);
    const indiceCategoria = indiceCabecalho(mapaCabecalho, ["categoria", "categoria_aluno", "status_turma"], 12);
    const indiceStatus = indiceCabecalho(mapaCabecalho, ["status", "situacao"], null);

    return {
      ra: obterCampo(campos, indiceRa),
      nome: obterCampo(campos, indiceNome) || `${TEXTO_NAO_COLETADO} ${indiceRegistro}`,
      cpf: obterCampo(campos, indiceCpf) || `#${indiceRegistro}`,
      email_primario: obterCampo(campos, indiceEmail) || `naocoletado${indiceRegistro}`,
      tel_primario: obterCampo(campos, indiceTelefone) || TELEFONE_NAO_COLETADO,
      genero: obterCampo(campos, indiceGenero) || TEXTO_NAO_COLETADO,
      data_nasc: obterCampo(campos, indiceDataNasc) || TEXTO_NAO_COLETADO,
      data_ingresso: obterCampo(campos, indiceDataIngresso),
      categoria: obterCampo(campos, indiceCategoria) || TEXTO_NAO_COLETADO,
      status: obterCampo(campos, indiceStatus),
    };
  }

  function criarChaveRegistro(registro) {
    return [registro.nome, registro.email_primario, registro.tel_primario]
      .map((valor) =>
        String(valor || "")
          .trim()
          .toLowerCase(),
      )
      .join("|");
  }

  function normalizarCsv(dados) {
    const linhas = String(dados || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0);

    if (linhas.length === 0) {
      return { registros: [], csv: CABECALHO_NORMALIZADO.join(",") };
    }

    const cabecalhoOriginal = parseLinhaCsv(linhas[0]).map(normalizarCabecalho);
    const mapaCabecalho = new Map(cabecalhoOriginal.map((campo, indice) => [campo, indice]));
    const registrosUnicos = [];
    const chaves = new Set();

    linhas.slice(1).forEach((linha, indice) => {
      const registro = montarRegistroNormalizado(parseLinhaCsv(linha), mapaCabecalho, indice + 1);
      const chave = criarChaveRegistro(registro);

      if (chaves.has(chave)) {
        return;
      }

      chaves.add(chave);
      registrosUnicos.push(registro);
    });

    const csvNormalizado = [
      CABECALHO_NORMALIZADO.join(","),
      ...registrosUnicos.map((registro) =>
        CABECALHO_NORMALIZADO.map((campo) => escapeCampoCsv(registro[campo])).join(","),
      ),
    ].join("\n");

    return { registros: registrosUnicos, csv: csvNormalizado };
  }

  function renderizarTabela(registros) {
    const corpoTabela = document.querySelector("#tabela-importacao tbody");

    if (!corpoTabela) {
      return;
    }

    corpoTabela.innerHTML = "";

    registros.forEach((registro, indice) => {
      const tr = document.createElement("tr");
      tr.dataset.status = "pronto";
      tr.innerHTML = `
        <td>${indice + 1}</td>
        <td>${registro.nome}</td>
        <td>${registro.ra_preview || ""}</td>
        <td>${registro.email_primario}</td>
        <td>${registro.tel_primario}</td>
        <td><span class="status status--sucesso">Pronto</span></td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  async function preencherRaPreview(registros) {
    try {
      const alunos = await window.CoordenadoraAPI.listarAlunos(getRmCoordenadora());
      const maiorRa = Array.isArray(alunos)
        ? alunos.reduce((maior, aluno) => Math.max(maior, Number(aluno.ra) || 0), 0)
        : 0;

      registros.forEach((registro, indice) => {
        registro.ra_preview = String(maiorRa + indice + 1);
      });
    } catch (error) {
      console.error("[Importação CSV] Não foi possível carregar RA atual.", error);
      registros.forEach((registro, indice) => {
        registro.ra_preview = String(indice + 1);
      });
    }
  }

  function atualizarResumo(totalRegistros) {
    document.querySelector(".resumo-grade .resumo-item:nth-child(1) strong").textContent = totalRegistros;
    document.querySelector(".resumo-grade .resumo-item:nth-child(2) strong").textContent = totalRegistros;
    document.querySelector(".resumo-grade .resumo-item:nth-child(3) strong").textContent = 0;
    document.querySelector(".resumo-grade .resumo-item:nth-child(4) strong").textContent = 0;
    const btnConfirmar = document.getElementById("confirmar-importacao");

    if (btnConfirmar) {
      btnConfirmar.textContent = `Confirmar ${totalRegistros} registros`;
    }
  }

  async function confirmarImportacao() {
    const csvNormalizado = sessionStorage.getItem("csvDadosNormalizados");
    const nomeArquivo = sessionStorage.getItem("csvNome") || "importacao.csv";

    if (!csvNormalizado) {
      window.alert("Nenhum CSV normalizado foi encontrado para importar.");
      return;
    }

    const ok = await window.PulseModal.confirm({
      titulo: "Confirmar importação?",
      texto: "Os dados normalizados serão enviados para importação.",
      confirmar: "Importar registros",
    });

    if (!ok) {
      return;
    }

    const btnConfirmar = document.getElementById("confirmar-importacao");

    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Importando...";
    }

    try {
      const arquivoNormalizado = new File([csvNormalizado], nomeArquivo, { type: "text/csv" });
      const resultado = await window.CoordenadoraAPI.importarHistoricoCsv(arquivoNormalizado);
      sessionStorage.removeItem("csvDados");
      sessionStorage.removeItem("csvDadosNormalizados");
      sessionStorage.removeItem("csvNome");
      window.alert(
        `Importação concluída. ${resultado.importados} importados, ${resultado.conflitos.length} conflitos e ${resultado.ignorados} ignorados.`,
      );
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("[Importação CSV]", error);
      window.alert(error.message || "Não foi possível importar o arquivo.");
      if (btnConfirmar) {
        btnConfirmar.disabled = false;
        atualizarResumo(document.querySelectorAll("#tabela-importacao tbody tr").length);
      }
    }
  }

  async function carregarDadosImportacao() {
    const dados = sessionStorage.getItem("csvDados");
    const nomeArquivo = sessionStorage.getItem("csvNome");
    const nomeArquivoEl = document.getElementById("nome-arquivo");
    const btnConfirmar = document.getElementById("confirmar-importacao");

    if (!dados) {
      console.warn("Nenhum dado CSV no sessionStorage");
      return;
    }

    if (nomeArquivoEl && nomeArquivo) {
      nomeArquivoEl.textContent = `${nomeArquivo} · CSV normalizado antes da importação`;
    }

    const { registros, csv } = normalizarCsv(dados);
    sessionStorage.setItem("csvDadosNormalizados", csv);
    await preencherRaPreview(registros);
    renderizarTabela(registros);
    atualizarResumo(registros.length);

    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", confirmarImportacao);
    }
  }

  document.addEventListener("DOMContentLoaded", carregarDadosImportacao);
})(window, document);
