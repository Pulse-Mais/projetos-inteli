(function (window, document) {
  const DEFAULT_RM_COORDENADORA = "1001";
  const state = {
    alunos: [],
  };

  function getRmCoordenadora() {
    const params = new URLSearchParams(window.location.search);
    const rmSalvo =
      params.get("rm") ||
      window.localStorage.getItem("rmCoordenadora") ||
      window.PULSE_COORDENADORA_RM ||
      DEFAULT_RM_COORDENADORA;

    return String(rmSalvo) === "1011" ? DEFAULT_RM_COORDENADORA : rmSalvo;
  }

  function hoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function setFeedback(id, mensagem, tipo = "info") {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.textContent = mensagem;
    elemento.className = `aviso status--${tipo}`;
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function extrairRa(valor) {
    const match = String(valor || "").match(/\d+/);
    return match ? Number(match[0]) : NaN;
  }

  function alunoPorRa(ra) {
    return state.alunos.find((aluno) => Number(aluno.ra) === Number(ra));
  }

  function preencherDatas() {
    document.querySelectorAll('input[type="date"]').forEach((campo) => {
      if (!campo.value) {
        campo.value = hoje();
      }
    });
  }

  function preencherDatalistAlunos() {
    const datalist = document.getElementById("lista-alunos-registros");

    if (!datalist) return;

    datalist.innerHTML = "";
    state.alunos.forEach((aluno) => {
      const option = document.createElement("option");
      option.value = `${aluno.ra} - ${aluno.nome}`;
      datalist.appendChild(option);
    });
  }

  function preencherSelectTurmas() {
    const select = document.querySelector('#form-registro-aulas [name="id_turma"]');

    if (!select) return;

    const idsTurmas = Array.from(
      new Set(
        state.alunos
          .map((aluno) => Number(aluno.id_turma))
          .filter((idTurma) => Number.isInteger(idTurma) && idTurma > 0),
      ),
    ).sort((a, b) => a - b);

    select.innerHTML = '<option value="">Selecione</option>';
    idsTurmas.forEach((idTurma) => {
      const option = document.createElement("option");
      option.value = String(idTurma);
      option.textContent = `Turma ${idTurma}`;
      select.appendChild(option);
    });
  }

  function alunosDaTurmaSelecionada() {
    const idTurma = Number(document.querySelector('#form-registro-aulas [name="id_turma"]')?.value);

    if (!Number.isInteger(idTurma) || idTurma <= 0) return [];

    return state.alunos.filter((aluno) => Number(aluno.id_turma) === idTurma);
  }

  function renderizarTabelaFrequencia() {
    const tbody = document.getElementById("tabela-alunos-frequencia");
    const alunos = alunosDaTurmaSelecionada();

    if (!tbody) return;

    tbody.innerHTML = "";

    if (alunos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Nenhum aluno encontrado para a turma selecionada.</td></tr>';
      return;
    }

    alunos.forEach((aluno) => {
      const tr = document.createElement("tr");
      tr.dataset.ra = aluno.ra;
      tr.innerHTML = [
        `<td>${aluno.nome || "Aluno sem nome"}</td>`,
        `<td>${aluno.ra}</td>`,
        '<td><select name="frequencia"><option value="true">Presente</option><option value="false">Ausente</option></select></td>',
        '<td><input name="observacao" placeholder="Opcional"></td>',
      ].join("");
      tbody.appendChild(tr);
    });

    setFeedback(
      "registros-aulas-feedback",
      `${alunos.length} aluno(s) carregado(s) para registro de frequência.`,
      "info",
    );
  }

  async function carregarAlunos() {
    const rm = getRmCoordenadora();

    setFeedback("registros-aulas-feedback", "Carregando alunos reais do backend...", "info");

    try {
      state.alunos = await window.CoordenadoraAPI.listarAlunos(rm);
      preencherDatalistAlunos();
      preencherSelectTurmas();
      renderizarTabelaFrequencia();
      setFeedback(
        "registros-aulas-feedback",
        "Alunos carregados. Selecione uma turma para registrar frequência.",
        "info",
      );
    } catch (error) {
      console.error("[Registros Coordenadora] carregar alunos", error);
      setFeedback("registros-aulas-feedback", error.message || "Nao foi possivel carregar alunos.", "erro");
    }
  }

  function setFormCarregando(form, carregando) {
    Array.from(form.elements).forEach((elemento) => {
      elemento.disabled = carregando;
    });
  }

  async function salvarFrequenciasAula(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const idAula = Number(form.id_aula.value);
    const data = form.data.value;
    const linhas = Array.from(document.querySelectorAll("#tabela-alunos-frequencia tr[data-ra]"));

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (linhas.length === 0) {
      setFeedback("registros-aulas-feedback", "Selecione uma turma com alunos antes de salvar.", "erro");
      return;
    }

    const ok = await window.PulseModal.confirm({
      titulo: "Salvar frequência da turma?",
      texto: `Serão enviados ${linhas.length} registro(s) para o backend.`,
      confirmar: "Salvar frequência",
    });

    if (!ok) return;

    setFormCarregando(form, true);
    setFeedback("registros-aulas-feedback", "Salvando frequência no backend...", "info");

    const resultados = await Promise.allSettled(
      linhas.map(async (linha) => {
        const ra = Number(linha.dataset.ra);
        const frequencia = linha.querySelector('[name="frequencia"]').value === "true";

        try {
          return await window.CoordenadoraAPI.registrarFrequenciaAula(ra, {
            id_aula: idAula,
            data,
            frequencia,
            id_coordenador: Number(getRmCoordenadora()),
          });
        } catch (error) {
          if (error.status === 409) {
            return window.CoordenadoraAPI.atualizarFrequencia(getRmCoordenadora(), ra, idAula, {
              frequencia,
            });
          }

          throw error;
        }
      }),
    );

    const falhas = resultados.filter((resultado) => resultado.status === "rejected");

    setFormCarregando(form, false);

    if (falhas.length > 0) {
      console.error("[Registros Coordenadora] falhas frequencia", falhas);
      setFeedback(
        "registros-aulas-feedback",
        `${falhas.length} registro(s) nao foram salvos. Verifique se o ID da aula existe.`,
        "erro",
      );
      return;
    }

    setFeedback("registros-aulas-feedback", "Frequência salva com sucesso no backend.", "sucesso");
  }

  async function salvarParticipacaoEvento(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const ra = extrairRa(form.aluno.value);
    const aluno = alunoPorRa(ra);
    const evento = form.evento.value.trim();
    const data = form.data.value;
    const frequencia = form.frequencia.value === "true";
    const observacao = form.observacao.value.trim();

    if (!form.checkValidity() || !Number.isInteger(ra) || !aluno) {
      setFeedback("registros-eventos-feedback", "Informe um aluno valido da lista.", "erro");
      return;
    }

    const ok = await window.PulseModal.confirm({
      titulo: "Salvar participação?",
      texto: "O registro será enviado para o backend e ficará na jornada do aluno.",
      confirmar: "Salvar participação",
    });

    if (!ok) return;

    setFormCarregando(form, true);
    setFeedback("registros-eventos-feedback", "Salvando participação no backend...", "info");

    try {
      await window.CoordenadoraAPI.registrarEvento(getRmCoordenadora(), {
        tema: evento,
        sede: aluno.nome || `RA ${ra}`,
        data,
        categoria: "Evento",
        descricao: [
          `Participação do aluno ${aluno.nome || ""} (RA ${ra}): ${frequencia ? "participou" : "não participou"}.`,
          observacao ? `Observação: ${observacao}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      });
      form.reset();
      preencherDatas();
      setFeedback("registros-eventos-feedback", "Participação registrada com sucesso no backend.", "sucesso");
    } catch (error) {
      console.error("[Registros Coordenadora] evento", error);
      setFeedback(
        "registros-eventos-feedback",
        error.message || "Nao foi possivel salvar o registro de evento.",
        "erro",
      );
    } finally {
      setFormCarregando(form, false);
    }
  }

  async function salvarEmpregabilidade(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const ra = extrairRa(form.aluno.value);
    const status = form.status.value;
    const statusNormalizado = normalizarTexto(status);
    const exigeEmprego = ["empregado", "estagio"].includes(statusNormalizado);

    if (!Number.isInteger(ra) || !alunoPorRa(ra)) {
      setFeedback("registros-emprego-feedback", "Informe um aluno valido da lista.", "erro");
      return;
    }

    if (exigeEmprego && (!form.empresa.value.trim() || !form.cargo.value.trim() || !form.data_inicio.value)) {
      setFeedback(
        "registros-emprego-feedback",
        "Empresa, cargo e data de inicio sao obrigatorios para emprego ou estagio.",
        "erro",
      );
      return;
    }

    const ok = await window.PulseModal.confirm({
      titulo: "Salvar empregabilidade?",
      texto: "As informações profissionais do aluno serão atualizadas no backend.",
      confirmar: "Salvar empregabilidade",
    });

    if (!ok) return;

    setFormCarregando(form, true);
    setFeedback("registros-emprego-feedback", "Salvando empregabilidade no backend...", "info");

    try {
      if (exigeEmprego) {
        try {
          await window.CoordenadoraAPI.registrarEmpregoAluno(ra, {
            empresa: form.empresa.value.trim(),
            cargo: form.cargo.value.trim(),
            data_inicio: form.data_inicio.value,
            faixa_salarial: form.faixa_salarial.value,
          });
        } catch (error) {
          if (error.status !== 409) {
            throw error;
          }

          await window.CoordenadoraAPI.atualizarAluno(ra, {
            status: "Empregado",
          });
        }
      } else {
        await window.CoordenadoraAPI.atualizarAluno(ra, {
          status,
        });
      }

      form.reset();
      preencherDatas();
      setFeedback("registros-emprego-feedback", "Empregabilidade salva com sucesso no backend.", "sucesso");
    } catch (error) {
      console.error("[Registros Coordenadora] empregabilidade", error);
      setFeedback("registros-emprego-feedback", error.message || "Nao foi possivel salvar empregabilidade.", "erro");
    } finally {
      setFormCarregando(form, false);
    }
  }

  function configurarAbas() {
    document.querySelectorAll("[data-aba]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const aba = botao.dataset.aba;

        document.querySelectorAll("[data-aba]").forEach((item) => item.classList.toggle("ativa", item === botao));
        document.querySelectorAll("[data-aba-painel]").forEach((painel) => {
          painel.hidden = painel.dataset.abaPainel !== aba;
        });
      });
    });
  }

  function configurarEventos() {
    document
      .querySelector('#form-registro-aulas [name="id_turma"]')
      ?.addEventListener("change", renderizarTabelaFrequencia);
    document.getElementById("form-registro-aulas")?.addEventListener("submit", salvarFrequenciasAula);
    document.getElementById("form-registro-evento")?.addEventListener("submit", salvarParticipacaoEvento);
    document.getElementById("form-registro-emprego")?.addEventListener("submit", salvarEmpregabilidade);
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.lucide?.createIcons();
    preencherDatas();
    configurarAbas();
    configurarEventos();
    carregarAlunos();
  });
})(window, document);
