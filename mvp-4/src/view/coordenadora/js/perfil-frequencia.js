(function (window, document) {
  const DEFAULT_RM_COORDENADORA = "1001";

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

  function getRaAluno() {
    return (
      getParams().get("ra") || window.localStorage.getItem("alunoSelecionadoRa") || window.PerfilAluno?.getRaAtual?.()
    );
  }

  function getDataHoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function setResumo(mensagem, tipo) {
    const resumo = document.getElementById("frequencia-resumo");

    if (!resumo) return;

    resumo.textContent = mensagem;
    resumo.className = `frequencia-resumo${tipo ? ` frequencia-resumo--${tipo}` : ""}`;
  }

  function getClassePercentual(percentual) {
    if (percentual >= 85) return "alta";
    if (percentual >= 70) return "media";

    return "baixa";
  }

  function renderizarResumoFrequencia(dados) {
    const resumo = document.getElementById("frequencia-resumo");

    if (!resumo) return;

    const frequencias = Array.isArray(dados?.frequencias) ? dados.frequencias : [];
    const totalAulas = Number(dados?.total_aulas ?? frequencias.length);
    const presencas = frequencias.filter((item) => item.frequencia === true).length;
    const faltas = Math.max(totalAulas - presencas, 0);
    const percentual = Number(
      dados?.percentual_presenca ?? (totalAulas > 0 ? ((presencas / totalAulas) * 100).toFixed(1) : 0),
    );
    const classePercentual = getClassePercentual(percentual);

    resumo.className = `frequencia-resumo frequencia-resumo--painel frequencia-resumo--${classePercentual}`;

    if (totalAulas === 0) {
      resumo.innerHTML = [
        '<div class="frequencia-percentual frequencia-percentual--vazio">0%</div>',
        '<div class="frequencia-detalhes">',
        "<strong>Nenhuma frequência registrada</strong>",
        "<span>Registre presença ou falta para começar o acompanhamento.</span>",
        "</div>",
      ].join("");
      return;
    }

    resumo.innerHTML = [
      `<div class="frequencia-percentual">${percentual.toLocaleString("pt-BR")}%</div>`,
      '<div class="frequencia-detalhes">',
      "<strong>Presença do aluno</strong>",
      `<span>${totalAulas} aulas registradas · ${presencas} presenças · ${faltas} faltas</span>`,
      "</div>",
    ].join("");
  }

  async function carregarResumoFrequencia() {
    const ra = getRaAluno();

    if (!ra) {
      setResumo("Selecione um aluno para visualizar a frequência.", "erro");
      return;
    }

    setResumo("Carregando frequência...", "carregando");

    try {
      const dados = await window.CoordenadoraAPI.buscarFrequenciaAluno(ra);
      renderizarResumoFrequencia(dados);
    } catch (error) {
      console.error("[Resumo Frequencia Coordenadora]", error);
      setResumo(error.message || "Não foi possível carregar a frequência.", "erro");
    }
  }

  function setFeedback(mensagem, tipo) {
    const feedback = document.getElementById("modal-frequencia-feedback");

    if (!feedback) return;

    feedback.textContent = mensagem || "";
    feedback.className = `modal-feedback${tipo ? ` modal-feedback--${tipo}` : ""}`;
  }

  function setCarregando(carregando) {
    const form = document.getElementById("form-frequencia");
    const botaoSalvar = form?.querySelector('[type="submit"]');

    if (!form) return;

    Array.from(form.elements).forEach((elemento) => {
      elemento.disabled = carregando;
    });

    if (botaoSalvar) {
      botaoSalvar.textContent = carregando ? "Salvando..." : "Salvar";
    }
  }

  function abrirModal() {
    const modal = document.getElementById("modal-frequencia");
    const form = document.getElementById("form-frequencia");
    const ra = getRaAluno();

    if (!modal || !form) return;

    if (!ra) {
      setResumo("Selecione um aluno antes de registrar frequência.", "erro");
      return;
    }

    form.reset();
    form.data.value = getDataHoje();
    form.frequencia.value = "true";
    form.acao.value = "registrar";
    setFeedback("");
    modal.hidden = false;
  }

  function fecharModal() {
    const modal = document.getElementById("modal-frequencia");

    if (modal) {
      modal.hidden = true;
    }
  }

  function formatarFrequencia(valor) {
    return valor ? "presente" : "falta";
  }

  async function salvarFrequencia(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const rm = getRmCoordenadora();
    const ra = getRaAluno();
    const idAula = Number(form.id_aula.value);
    const data = form.data.value;
    const frequencia = form.frequencia.value === "true";
    const acao = form.acao.value;

    if (!ra) {
      setFeedback("Aluno não informado para registrar frequência.", "erro");
      return;
    }

    if (!Number.isInteger(idAula) || idAula <= 0 || !data) {
      setFeedback("Informe uma aula válida e a data da frequência.", "erro");
      return;
    }

    setCarregando(true);
    setFeedback("Salvando frequência...", "carregando");
    setResumo("Salvando frequência...", "carregando");

    try {
      if (acao === "atualizar") {
        await window.CoordenadoraAPI.atualizarFrequencia(rm, ra, idAula, {
          frequencia,
        });
      } else {
        await window.CoordenadoraAPI.registrarFrequencia(rm, ra, {
          id_aula: idAula,
          data,
          frequencia,
        });
      }

      const verbo = acao === "atualizar" ? "atualizada" : "registrada";
      setResumo(`Frequência ${verbo}: aula ${idAula}, ${formatarFrequencia(frequencia)}, data ${data}.`, "sucesso");
      fecharModal();
      await carregarResumoFrequencia();
    } catch (error) {
      console.error("[Frequencia Coordenadora]", error);

      const mensagem =
        error.status === 404
          ? "Frequência não encontrada para atualizar. Use a ação de registrar."
          : error.message || "Não foi possível salvar a frequência.";

      setFeedback(mensagem, "erro");
      setResumo(mensagem, "erro");
    } finally {
      setCarregando(false);
    }
  }

  function configurarModal() {
    const btnAbrir = document.getElementById("btn-registrar-frequencia");
    const btnFechar = document.getElementById("modal-frequencia-fechar");
    const btnCancelar = document.getElementById("modal-frequencia-cancelar");
    const modal = document.getElementById("modal-frequencia");
    const form = document.getElementById("form-frequencia");

    btnAbrir?.addEventListener("click", abrirModal);
    btnFechar?.addEventListener("click", fecharModal);
    btnCancelar?.addEventListener("click", fecharModal);
    form?.addEventListener("submit", salvarFrequencia);

    modal?.addEventListener("click", (event) => {
      if (event.target === modal) {
        fecharModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal && !modal.hidden) {
        fecharModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    configurarModal();
    carregarResumoFrequencia();
  });
})(window, document);
