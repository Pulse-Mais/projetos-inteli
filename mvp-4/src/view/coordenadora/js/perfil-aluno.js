(function (window, document) {
  const TEXTO_VAZIO = "Nao informado";
  let alunoAtual = null;

  function getParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      ra: params.get("ra") || window.localStorage.getItem("alunoSelecionadoRa"),
    };
  }

  function setTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor || TEXTO_VAZIO;
    }
  }

  function formatarData(valor) {
    if (!valor) return TEXTO_VAZIO;

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleDateString("pt-BR");
  }

  function formatarAno(valor) {
    if (!valor) return TEXTO_VAZIO;

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return String(valor);
    }

    return String(data.getFullYear());
  }

  function normalizarStatus(status) {
    if (!status) return TEXTO_VAZIO;

    return String(status).charAt(0).toUpperCase() + String(status).slice(1);
  }

  function obterCategoriaFallback(aluno) {
    const categorias = [
      "Jovens Conectados",
      "Jovens Capacitados",
      "Jovens Transformados",
    ];
    const raNumerico = Number(aluno?.ra) || 0;

    return categorias[Math.abs(raNumerico) % categorias.length];
  }

  function categoriaJovemValida(categoria) {
    const categoriaNormalizada = String(categoria || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return (
      categoriaNormalizada === "jovens conectados"
      || categoriaNormalizada === "jovens capacitados"
      || categoriaNormalizada === "jovens transformados"
      || categoriaNormalizada === "conectado"
      || categoriaNormalizada === "capacitado"
      || categoriaNormalizada === "transformado"
    );
  }

  function setEstadoCarregando() {
    setTexto("perfil-nome", "Carregando aluno...");
    setTexto("perfil-status-texto", "Carregando");
    setTexto("perfil-ra", "RA: --");
    setTexto("perfil-turma-tag", "Turma");
    setTexto("perfil-ingresso-tag", "Ingresso");
    setTexto("perfil-categoria-texto", "Tipo de jovem");
  }

  function setEstadoErro(mensagem) {
    setTexto("perfil-nome", mensagem);
    setTexto("perfil-status-texto", "Erro");
    setTexto("perfil-ra", "RA: --");
    setTexto("perfil-turma-tag", "Nao carregado");
    setTexto("perfil-ingresso-tag", "Nao carregado");
    setTexto("perfil-categoria-texto", "Nao carregado");
  }

  function preencherAluno(aluno) {
    alunoAtual = aluno;
    const turma = aluno.id_turma ? `Turma ${aluno.id_turma}` : TEXTO_VAZIO;
    const ingresso = aluno.data_ingresso ? `Ingresso: ${formatarAno(aluno.data_ingresso)}` : "Ingresso nao informado";
    const categoriaBruta = String(aluno.categoria || "").trim();
    const categoriaExibicao = categoriaJovemValida(categoriaBruta)
      ? categoriaBruta
      : obterCategoriaFallback(aluno);

    document.title = `${aluno.nome || "Aluno"} - Coordenadora | Pulse Mais`;

    setTexto("perfil-nome", aluno.nome);
    setTexto("perfil-ra", aluno.ra ? `RA: ${aluno.ra}` : "RA: --");
    setTexto("perfil-status-texto", normalizarStatus(aluno.status));
    setTexto("perfil-turma-tag", turma);
    setTexto("perfil-ingresso-tag", ingresso);
    setTexto("perfil-categoria-texto", categoriaExibicao);

    setTexto("contato-email-primario", aluno.email_primario);
    setTexto("contato-email-secundario", aluno.email_secundario);
    setTexto("contato-telefone-primario", aluno.tel_primario);
    setTexto("contato-telefone-secundario", aluno.tel_secundario);

    setTexto("dp-turma", aluno.id_turma ? String(aluno.id_turma) : TEXTO_VAZIO);
    setTexto("dp-genero", aluno.genero);
    setTexto("dp-formacao", aluno.nivel_formacao);
    setTexto("dp-renda", aluno.renda_familiar);
    setTexto("dp-endereco", aluno.endereco);
    setTexto("jornada-tipo-jovem", categoriaExibicao);

    const selectTipoJovem = document.getElementById("jornada-tipo-jovem-select");
    if (selectTipoJovem) {
      const categoriaAtual = categoriaExibicao;
      const existeOpcao = Array.from(selectTipoJovem.options).some((option) => option.value === categoriaAtual);

      if (categoriaAtual && !existeOpcao) {
        const option = document.createElement("option");
        option.value = categoriaAtual;
        option.textContent = categoriaAtual;
        selectTipoJovem.appendChild(option);
      }

      selectTipoJovem.value = categoriaAtual;
    }

    window.localStorage.setItem("alunoSelecionadoRa", String(aluno.ra));
  }

  async function carregarAluno() {
    const { ra } = getParams();

    if (!ra) {
      setEstadoErro("Aluno nao informado");
      return;
    }

    setEstadoCarregando();

    try {
      const aluno = await window.CoordenadoraAPI.buscarAlunoPorRa(ra);
      preencherAluno(aluno);
    } catch (error) {
      console.error("[Perfil Aluno Coordenadora]", error);
      setEstadoErro("Nao foi possivel carregar o aluno");
    }
  }

  window.PerfilAluno = {
    carregar: carregarAluno,
    getAlunoAtual() {
      return alunoAtual;
    },
    getRaAtual() {
      return alunoAtual?.ra || getParams().ra;
    },
  };

  document.addEventListener("DOMContentLoaded", carregarAluno);
})(window, document);
