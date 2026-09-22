document.addEventListener("DOMContentLoaded", function () {
  const fotoCoord = localStorage.getItem("fotoCoord");
  if (fotoCoord) {
    const av = document.querySelector(".sidebar__avatar");
    if (av) av.src = fotoCoord;
  }

  // Lê o ID do aluno da URL (?id=X) — obrigatório para carregar os dados corretos
  const urlParams = new URLSearchParams(window.location.search);
  const alunoId = urlParams.get("id");

  if (!alunoId) {
    alert("ID do aluno não informado");
    window.location.href = "alunos.html";
    return;
  }

  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'C';
  const nomeCoord = document.getElementById('nomeCoord');
  if (nomeCoord) nomeCoord.textContent = nomeUsuario;

  let aluna = {};
  let modoEdicao = false;
  let fotoAlterada = false;
  let novaFotoBase64 = undefined; // undefined = não tocada; null = removida; string = nova foto

  const hojeIso = new Date().toISOString().split('T')[0];

  function validarDataNasc(valor) {
    if (!valor) return '';
    const d = new Date(valor + 'T12:00:00');
    const hoje = new Date();
    if (d > hoje) return 'A data de nascimento não pode ser futura.';
    if (d.getFullYear() < 1900) return 'Ano de nascimento impossível (anterior a 1900).';
    let idade = hoje.getFullYear() - d.getFullYear();
    const m = hoje.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
    if (idade < 15) return 'O aluno deve ter no mínimo 15 anos.';
    if (idade >= 26) return 'O aluno deve ter menos de 26 anos.';
    return '';
  }

  function validarDataIng(valor) {
    if (!valor) return '';
    const d = new Date(valor + 'T12:00:00');
    const hoje = new Date();
    if (d > hoje) return 'A data de ingresso não pode ser futura.';
    if (d.getFullYear() < 2022) return 'A data de ingresso não pode ser anterior a 2022.';
    return '';
  }

  function aplicarErroEdit(campo, erroEl, mensagem) {
    if (!campo || !erroEl) return;
    const wrapper = campo.closest('.date-picker-wrapper');
    const trigger = wrapper && wrapper.querySelector('.date-picker-trigger');
    if (mensagem) {
      campo.classList.add('input--erro');
      if (trigger) trigger.classList.add('date-picker-trigger--erro');
      erroEl.textContent = mensagem;
      erroEl.classList.add('visivel');
    } else {
      campo.classList.remove('input--erro');
      if (trigger) trigger.classList.remove('date-picker-trigger--erro');
      erroEl.textContent = '';
      erroEl.classList.remove('visivel');
    }
  }

  // Busca o perfil completo do aluno, suas frequências e sua matrícula atual em paralelo via API
  async function carregarPerfil() {
    try {
      const [perfilRes, freqRes, matriculasRes] = await Promise.all([
        fetch("/alunos/" + alunoId + "/perfil"),
        fetch("/frequencia?id_aluno=" + alunoId),
        fetch("/matriculas/aluno/" + alunoId),
      ]);

      if (!perfilRes.ok) throw new Error("Aluno não encontrado");

      const data = await perfilRes.json();
      const frequencias = freqRes.ok ? await freqRes.json() : [];
      const matriculas = matriculasRes.ok ? await matriculasRes.json() : [];
      // A mais recente (ordenada por data_ingresso DESC pela API) é o programa atual
      const matriculaAtual = matriculas.length > 0 ? matriculas[0] : null;

      // Normaliza a resposta para o objeto interno de exibição
      aluna = {
        id: data.id_usuario,
        nome: data.usuario ? data.usuario.nome : "",
        email: data.usuario ? data.usuario.email : "",
        cpf: data.usuario ? data.usuario.cpf : "",
        foto_url: data.usuario ? data.usuario.foto_url : null,
        telefone: data.telefone || "Não informado",
        dataNascimento: data.data_nascimento || "",
        cidade: data.cidade_nascimento || "",
        estado: data.estado_nascimento || "",
        programa: data.programa_ingresso || "Não informado",
        idPrograma: matriculaAtual ? matriculaAtual.id_programa : null,
        estagioJornada: data.estagio_jornada || "conectado",
        dataIngresso: data.data_ingresso || "",
        escolaridade: data.escolaridade || "Não informado",
        statusProfissional: data.status_profissional || "Não informado",
        observacoes: data.observacoes || "Nenhuma observação registrada.",
      };

      preencherDados();
      preencherIndicadores(data, frequencias);
      preencherHistorico(data);

      // Corrige o href do botão "Registrar Frequência" com o ID real
      const btnFrequencia = document.getElementById("btnFrequencia");
      if (btnFrequencia) btnFrequencia.href = "frequencia.html?id=" + alunoId;

      carregarMentorVinculado(alunoId);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar perfil do aluno");
      window.location.href = "alunos.html";
    }
  }

  // Calcula o percentual de frequência e atualiza os indicadores de eventos
  function preencherIndicadores(data, frequencias) {
    const elFrequencia = document.getElementById("indFrequencia");
    const elEventos = document.getElementById("indEventos");

    if (elFrequencia) {
      const registros = Array.isArray(frequencias) ? frequencias : [];
      if (registros.length === 0) {
        elFrequencia.textContent = "—";
      } else {
        const presentes = registros.filter(function (r) {
          return r.status === "presente";
        }).length;
        elFrequencia.textContent =
          Math.round((presentes / registros.length) * 100) + "%";
      }
    }

    if (elEventos) elEventos.textContent = (data.eventos || []).length;
  }

  // Mostra o estado "sem mentor" no card de exibição (modo leitura)
  function exibirSemMentor() {
    const elNome = document.getElementById("mentorPerfilNome");
    const elDetalhes = document.getElementById("mentorPerfilDetalhes");
    const elDispLinha = document.getElementById("mentorPerfilDispLinha");
    const elFoto = document.getElementById("mentorPerfilFoto");
    if (elNome) elNome.textContent = "Nenhum mentor vinculado";
    if (elDetalhes) elDetalhes.style.display = "none";
    if (elDispLinha) elDispLinha.style.display = "none";
    if (elFoto) elFoto.src = "/assets/avatar.png";
  }

  function isPulseMais() {
    return (aluna.programa || '').toLowerCase().includes('pulse mais');
  }

  function mascararCpf(v) {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
    return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9, 11);
  }

  function mascararTelefone(v) {
    const d = (v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2)  return '(' + d;
    if (d.length <= 7)  return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7, 11);
  }

  function telefoneValido(val) {
    const d = (val || '').replace(/\D/g, '');
    return d.length === 0 || d.length === 11;
  }

  // Mostra ou oculta a seção de mentor de acordo com o programa atualmente selecionado
  // no select de edição. Cria o select de mentor se ele ainda não existir.
  function atualizarSecaoMentor(select) {
    const sel = select.options[select.selectedIndex];
    const texto = (sel ? sel.textContent : '').toLowerCase();
    const ehPulseMaisAgora = texto.includes('pulse mais');
    const secao = document.getElementById('secaoMentorPerfil');

    if (ehPulseMaisAgora) {
      if (secao) secao.style.display = 'none';
    } else if (sel && sel.value) {
      if (secao) secao.style.display = '';
      const cardMentor = document.getElementById('mentorPerfilCard');
      if (cardMentor && !document.getElementById('editMentor')) {
        cardMentor.innerHTML =
          '<select id="editMentor" class="form-input-edit combo-busca" style="width:100%;"><option value="">Carregando mentores...</option></select>';
        carregarMentoresParaEdicao();
      }
    }
  }

  // Encadeia GET /acompanha/aluno/:id → GET /mentores/:id → GET /usuarios/:id para
  // exibir o mentor vinculado ao aluno. Guarda o id em aluna.idMentor para uso na edição.
  // Se não houver vínculo, exibe o estado vazio (a seção continua sempre visível).
  async function carregarMentorVinculado(id) {
    const secao = document.getElementById("secaoMentorPerfil");
    if (!secao) return;

    // Alunos do Pulse Mais não têm modelo de mentoria individual
    if (isPulseMais()) {
      secao.style.display = 'none';
      return;
    }

    try {
      const acompanhaRes = await fetch("/acompanha/aluno/" + id);
      const vinculos = acompanhaRes.ok ? await acompanhaRes.json() : [];
      const idMentor = Array.isArray(vinculos) && vinculos.length > 0 ? vinculos[0].id_mentor : null;
      aluna.idMentor = idMentor || null;

      if (!idMentor) {
        exibirSemMentor();
        return;
      }

      // Mentor (especialidade, disponibilidade) e usuário (nome, foto) em paralelo
      const [mentorRes, usuarioRes] = await Promise.all([
        fetch("/mentores/" + idMentor),
        fetch("/usuarios/" + idMentor),
      ]);

      if (!mentorRes.ok || !usuarioRes.ok) {
        exibirSemMentor();
        return;
      }

      const mentor = await mentorRes.json();
      const usuario = await usuarioRes.json();

      const elNome = document.getElementById("mentorPerfilNome");
      const elEsp = document.getElementById("mentorPerfilEspecialidade");
      const elDisp = document.getElementById("mentorPerfilDisponibilidade");
      const elFoto = document.getElementById("mentorPerfilFoto");
      const elDetalhes = document.getElementById("mentorPerfilDetalhes");
      const elDispLinha = document.getElementById("mentorPerfilDispLinha");

      if (elNome) elNome.textContent = usuario.nome || "Não informado";
      if (elEsp) elEsp.textContent = mentor.especialidade || "Não informada";
      if (elDisp) elDisp.textContent = mentor.disponibilidade || "Não informada";
      if (elDetalhes) elDetalhes.style.display = "";
      if (elDispLinha) elDispLinha.style.display = "";
      if (elFoto) elFoto.src = usuario.foto_url || "/assets/avatar.png";
    } catch (error) {
      console.error("Erro ao carregar mentor vinculado:", error);
      exibirSemMentor();
    }
  }

  // Renderiza a lista de programas e eventos do histórico do aluno com badges de status
  function preencherHistorico(data) {
    const container = document.getElementById("historicoLista");
    if (!container) return;

    const programas = data.programas || [];
    const eventos = data.eventos || [];

    if (programas.length === 0 && eventos.length === 0) {
      container.innerHTML =
        '<p style="color:var(--color-text-support);padding:16px 0;font-size:14px;">Nenhum programa ou evento registrado.</p>';
      return;
    }

    const items = [];

    programas.forEach(function (prog) {
      const badge =
        prog.status_conclusao === 1
          ? '<span class="badge badge--ativo">Concluído</span>'
          : '<span class="badge badge--pendente">Em andamento</span>';

      let datas = "";
      if (prog.inicio && prog.fim) {
        datas = formatarMes(prog.inicio) + " — " + formatarMes(prog.fim);
      }

      items.push(
        '<div class="historico-item">' +
          "<div>" +
          '<p class="historico-item__nome">' +
          escapeHtml(prog.nome || "—") +
          "</p>" +
          (datas ? '<p class="historico-item__data">' + datas + "</p>" : "") +
          "</div>" +
          badge +
          "</div>",
      );
    });

    eventos.forEach(function (ev) {
      const dataStr = ev.data ? formatarMes(ev.data) : "";
      items.push(
        '<div class="historico-item">' +
          "<div>" +
          '<p class="historico-item__nome">' +
          escapeHtml(ev.nome || "—") +
          "</p>" +
          (dataStr
            ? '<p class="historico-item__data">' + dataStr + "</p>"
            : "") +
          "</div>" +
          '<span class="badge badge--ativo">Participou</span>' +
          "</div>",
      );
    });

    container.innerHTML = items.join("");
  }

  // Formata data ISO para "mês abreviado ano" (ex.: "jan. 2025")
  function formatarMes(isoDate) {
    if (!isoDate) return "";
    const str = String(isoDate).slice(0, 10);
    const d = new Date(str + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  }

  // Escapa caracteres HTML antes de inserir em innerHTML para prevenir XSS
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Formata data ISO ou YYYY-MM-DD para o padrão brasileiro DD/MM/YYYY
  function formatarData(dataStr) {
    if (!dataStr) return "Não informada";
    const partes = dataStr.split("T")[0].split("-"); // Lida com formatos ISO e YYYY-MM-DD
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // Preenche todos os campos de texto com os dados do objeto aluna
  function preencherDados() {
    document.getElementById("perfilNome").textContent = aluna.nome;
    document.getElementById("perfilCpf").textContent = mascararCpf(aluna.cpf);
    document.getElementById("perfilEmail").textContent = aluna.email;
    document.getElementById("perfilTelefone").textContent = mascararTelefone(aluna.telefone);
    document.getElementById("perfilDataNascimento").textContent = formatarData(
      aluna.dataNascimento,
    );
    document.getElementById("perfilCidade").textContent = aluna.cidade;
    document.getElementById("perfilEstado").textContent = aluna.estado;
    const natRow = document.getElementById("perfilCidade").parentElement;
    if (natRow) natRow.classList.remove("naturalidade-edit");

    // A tag verde representa o ESTÁGIO DA JORNADA do aluno (não o programa)
    const ROTULOS_ESTAGIO = { conectado: "Conectado", capacitado: "Capacitado", transformado: "Transformado", mentor: "Mentor" };
    document.getElementById("perfilPrograma").textContent =
      ROTULOS_ESTAGIO[aluna.estagioJornada] || "Conectado";
    const elProgramaAtual = document.getElementById("perfilProgramaAtual");
    if (elProgramaAtual) elProgramaAtual.textContent = aluna.programa;
    document.getElementById("perfilDataIngresso").textContent = formatarData(
      aluna.dataIngresso,
    );
    document.getElementById("perfilEscolaridade").textContent =
      aluna.escolaridade;
    document.getElementById("perfilStatusProfissional").textContent =
      aluna.statusProfissional;

    document.getElementById("perfilObservacoes").textContent =
      aluna.observacoes;
    document.getElementById("nomeExcluir").textContent = aluna.nome;
    document.getElementById("nomeExcluirPermanente").textContent = aluna.nome;

    if (aluna.foto_url) {
      const img = document.getElementById("perfilFoto");
      if (img) {
        img.src = aluna.foto_url;
        img.style.objectFit = "cover";
      }
    }
  }

  // =============================================
  // LÓGICA DE EDIÇÃO
  // =============================================
  const btnEditar = document.getElementById("btnEditar");

  btnEditar.addEventListener("click", function () {
    if (!modoEdicao) {
      entrarModoEdicao();
    } else {
      salvarAlteracoes();
    }
  });

  // =============================================
  // EDIÇÃO DE FOTO
  // =============================================
  const fotoEditAcoes = document.getElementById("fotoEditAcoes");
  const inputFotoPerfil = document.getElementById("inputFotoPerfil");
  const btnRemoverFoto = document.getElementById("btnRemoverFotoPerfil");

  // Comprime a nova foto selecionada (máx. 400px, JPEG 85%) e pré-visualiza na tela
  if (inputFotoPerfil) {
    inputFotoPerfil.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const MAX = 400;
          const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          canvas
            .getContext("2d")
            .drawImage(img, 0, 0, canvas.width, canvas.height);
          novaFotoBase64 = canvas.toDataURL("image/jpeg", 0.85);
          fotoAlterada = true;
          const perfilFoto = document.getElementById("perfilFoto");
          if (perfilFoto) {
            perfilFoto.src = novaFotoBase64;
            perfilFoto.style.objectFit = "cover";
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Marca a foto para remoção e exibe o avatar padrão imediatamente
  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener("click", function () {
      novaFotoBase64 = null;
      fotoAlterada = true;
      const perfilFoto = document.getElementById("perfilFoto");
      if (perfilFoto) {
        perfilFoto.src = "/assets/avatar.png";
        perfilFoto.style.objectFit = "";
      }
      if (inputFotoPerfil) inputFotoPerfil.value = "";
    });
  }

  // Substitui os textos estáticos por inputs editáveis com os valores atuais do aluno
  function entrarModoEdicao() {
    modoEdicao = true;
    fotoAlterada = false;
    novaFotoBase64 = undefined;
    btnEditar.textContent = "Salvar Alterações";
    btnEditar.classList.remove("btn--outline");
    btnEditar.classList.add("btn--accent");
    if (fotoEditAcoes) fotoEditAcoes.style.display = "flex";

    // Transforma campos em inputs (somente os editáveis pela API de Aluno)
    document.getElementById("perfilNome").innerHTML =
      `<input type="text" id="editNome" value="${aluna.nome}" class="form-input-edit">`;
    document.getElementById("perfilTelefone").innerHTML =
      `<input type="text" id="editTelefone" value="${mascararTelefone(aluna.telefone)}" maxlength="15" class="form-input-edit"><small class="campo-erro" id="erroTelEdit"></small>`;
    document.getElementById("perfilDataNascimento").innerHTML =
      `<input type="date" id="editDataNascimento" value="${aluna.dataNascimento ? aluna.dataNascimento.split("T")[0] : ""}" min="1900-01-01" max="${hojeIso}" class="form-input-edit"><small class="campo-erro" id="erroDatNascEdit"></small>`;
    document.getElementById("perfilCidade").innerHTML =
      `<input type="text" id="editCidade" value="${aluna.cidade}" class="form-input-edit">`;
    document.getElementById("perfilEstado").innerHTML =
      `<input type="text" id="editEstado" value="${aluna.estado}" class="form-input-edit">`;
    const natRow = document.getElementById("perfilCidade").parentElement;
    if (natRow && natRow.tagName === "P") natRow.classList.add("naturalidade-edit");

    // A tag verde edita o ESTÁGIO DA JORNADA (não mais o nome do programa,
    // que agora vem da matrícula e é exibido apenas como leitura em "Programa Atual")
    document.getElementById("perfilPrograma").innerHTML =
      '<select id="editEstagio" class="form-input-edit">' +
      '<option value="conectado"' + (aluna.estagioJornada === "conectado" ? " selected" : "") + ">Conectado</option>" +
      '<option value="capacitado"' + (aluna.estagioJornada === "capacitado" ? " selected" : "") + ">Capacitado</option>" +
      '<option value="transformado"' + (aluna.estagioJornada === "transformado" ? " selected" : "") + ">Transformado</option>" +
      '<option value="mentor"' + (aluna.estagioJornada === "mentor" ? " selected" : "") + ">Mentor</option>" +
      "</select>";

    // "Programa atual" passa a ser um select com os programas existentes no banco
    document.getElementById("perfilProgramaAtual").innerHTML =
      '<select id="editProgramaAtual" class="form-input-edit combo-busca"><option value="">Carregando programas...</option></select>';
    carregarProgramasParaEdicao();

    document.getElementById("perfilDataIngresso").innerHTML =
      `<input type="date" id="editDataIngresso" value="${aluna.dataIngresso ? aluna.dataIngresso.split("T")[0] : ""}" min="2022-01-01" max="${hojeIso}" class="form-input-edit"><small class="campo-erro" id="erroDataIngressoEdit"></small><small class="campo-hint">A data de ingresso deve ser a partir de 01/01/2022.</small>`;
    const _escOpts = ['Ensino Fundamental Incompleto','Ensino Fundamental Completo','Ensino Médio Incompleto','Ensino Médio Completo','Ensino Superior Incompleto','Ensino Superior Completo','Pós-graduação'];
    document.getElementById("perfilEscolaridade").innerHTML =
      '<select id="editEscolaridade" class="form-input-edit"><option value="">Selecione...</option>' +
      _escOpts.map(function(v){ return '<option value="' + v + '"' + (aluna.escolaridade === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
      '</select>';

    const _statusOpts = ['Estudante','Estagiário(a)','CLT','Freelancer','Desempregado(a)'];
    document.getElementById("perfilStatusProfissional").innerHTML =
      '<select id="editStatusProfissional" class="form-input-edit"><option value="">Selecione...</option>' +
      _statusOpts.map(function(v){ return '<option value="' + v + '"' + (aluna.statusProfissional === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') +
      '</select>';

    document.getElementById("perfilObservacoes").innerHTML =
      `<textarea id="editObservacoes" class="form-input-edit" style="height:200px;">${aluna.observacoes}</textarea>`;

    // Card do mentor vinculado: só disponível para programas que usam mentoria individual
    const cardMentor = document.getElementById("mentorPerfilCard");
    if (cardMentor && !isPulseMais()) {
      cardMentor.innerHTML =
        '<select id="editMentor" class="form-input-edit combo-busca" style="width:100%;"><option value="">Carregando mentores...</option></select>';
      carregarMentoresParaEdicao();
    }

    // Validação em tempo real nos campos de data
    const editDatNasc = document.getElementById('editDataNascimento');
    const editDatIng  = document.getElementById('editDataIngresso');
    const erroDatNascEdit    = document.getElementById('erroDatNascEdit');
    const erroDataIngressoEdit = document.getElementById('erroDataIngressoEdit');
    if (editDatNasc) {
      editDatNasc.addEventListener('change', function () {
        const emErro = editDatNasc.classList.contains('input--erro');
        const erro = validarDataNasc(this.value);
        if (emErro || erro) aplicarErroEdit(editDatNasc, erroDatNascEdit, erro);
      });
      editDatNasc.addEventListener('input', function () {
        if (!this.value) aplicarErroEdit(editDatNasc, erroDatNascEdit, '');
      });
    }
    if (editDatIng) {
      editDatIng.addEventListener('change', function () {
        const emErro = editDatIng.classList.contains('input--erro');
        const erro = validarDataIng(this.value);
        if (emErro || erro) aplicarErroEdit(editDatIng, erroDataIngressoEdit, erro);
      });
      editDatIng.addEventListener('input', function () {
        if (!this.value) aplicarErroEdit(editDatIng, erroDataIngressoEdit, '');
      });
    }

    // Nome: sem números e inicial de cada palavra em maiúscula
    const editNome = document.getElementById('editNome');
    if (editNome) {
      editNome.addEventListener('input', function () {
        const s = this.selectionStart;
        const novo = this.value
          .replace(/[0-9]/g, '')
          .replace(/(^|\s)([^\s])/g, function (m, sep, c) { return sep + c.toUpperCase(); });
        if (this.value !== novo) {
          this.value = novo;
          this.setSelectionRange(s, s);
        }
      });
    }

    // Telefone: máscara progressiva + validação de comprimento (somente celular, 11 dígitos)
    const editTelefoneEl = document.getElementById('editTelefone');
    const erroTelEdit    = document.getElementById('erroTelEdit');
    if (editTelefoneEl) {
      editTelefoneEl.addEventListener('input', function () {
        this.value = mascararTelefone(this.value);
        if (erroTelEdit && telefoneValido(this.value)) {
          this.classList.remove('input--erro');
          erroTelEdit.textContent = '';
          erroTelEdit.classList.remove('visivel');
        }
      });
      editTelefoneEl.addEventListener('blur', function () {
        if (!erroTelEdit) return;
        if (!telefoneValido(this.value)) {
          this.classList.add('input--erro');
          erroTelEdit.textContent = 'Telefone incompleto. Use (XX) XXXXX-XXXX.';
          erroTelEdit.classList.add('visivel');
        } else {
          this.classList.remove('input--erro');
          erroTelEdit.textContent = '';
          erroTelEdit.classList.remove('visivel');
        }
      });
    }

    // Campos de texto que não aceitam dígitos
    ['editCidade', 'editEstado'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        const s = this.selectionStart;
        const novo = this.value.replace(/[0-9]/g, '');
        if (this.value !== novo) { this.value = novo; this.setSelectionRange(s, s); }
      });
    });
  }

  // Busca os programas cadastrados via GET /programas e popula o select de "Programa atual",
  // pré-selecionando o programa em que o aluno já está matriculado.
  // Após carregar as opções, aplica o estado inicial da seção de mentor e registra
  // o listener de troca de programa — feito aqui (após o await) para garantir que
  // o elemento já existe e as opções estão disponíveis quando o handler roda.
  async function carregarProgramasParaEdicao() {
    const select = document.getElementById("editProgramaAtual");
    if (!select) return;
    try {
      const response = await fetch("/programas");
      if (!response.ok) throw new Error("Falha ao carregar programas");
      const programas = await response.json();

      select.innerHTML = '<option value="">Selecione...</option>' +
        programas.map(function (p) {
          const selecionado = aluna.idPrograma === p.id_programa ? " selected" : "";
          return '<option value="' + p.id_programa + '"' + selecionado + ">" + p.titulo + "</option>";
        }).join("");

      // Estado inicial: oculta ou exibe mentor conforme o programa pré-selecionado
      atualizarSecaoMentor(select);

      // Reage a qualquer troca de programa feita pelo coordenador
      select.addEventListener('change', function () { atualizarSecaoMentor(this); });
    } catch (error) {
      console.error("Erro ao carregar programas:", error);
      select.innerHTML = '<option value="">Erro ao carregar programas</option>';
    }
  }

  // Busca os mentores ativos via GET /mentores e popula o select de "Mentor vinculado",
  // pré-selecionando o mentor atual do aluno (aluna.idMentor, já carregado por carregarMentorVinculado).
  async function carregarMentoresParaEdicao() {
    const select = document.getElementById("editMentor");
    if (!select) return;
    try {
      const response = await fetch("/mentores");
      if (!response.ok) throw new Error("Falha ao carregar mentores");
      const mentores = await response.json();

      select.innerHTML = '<option value="">Nenhum mentor vinculado</option>' +
        mentores.map(function (m) {
          const selecionado = aluna.idMentor === m.id_usuario ? " selected" : "";
          return '<option value="' + m.id_usuario + '"' + selecionado + ">" + m.nome + "</option>";
        }).join("");
    } catch (error) {
      console.error("Erro ao carregar mentores:", error);
      select.innerHTML = '<option value="">Erro ao carregar mentores</option>';
    }
  }

  // Reconstrói o card de mentor no estado de exibição (some quando a edição troca por um <select>)
  function restaurarCardMentor() {
    const cardMentor = document.getElementById("mentorPerfilCard");
    if (!cardMentor) return;
    cardMentor.innerHTML =
      '<img id="mentorPerfilFoto" src="/assets/avatar.png" alt="Foto do mentor" style="width:64px; height:64px; border-radius:50%; object-fit:cover; flex-shrink:0;">' +
      '<div>' +
        '<p id="mentorPerfilNome" style="font-weight:600; margin:0;">Nenhum mentor vinculado</p>' +
        '<p id="mentorPerfilDetalhes" style="margin:4px 0 0; font-size:13px; color:var(--color-text-support);">Especialidade: <span id="mentorPerfilEspecialidade"></span></p>' +
        '<p id="mentorPerfilDispLinha" style="margin:2px 0 0; font-size:13px; color:var(--color-text-support);">Disponibilidade: <span id="mentorPerfilDisponibilidade"></span></p>' +
      '</div>';
  }

  // Coleta os dados dos inputs e envia via PUT /alunos/:id; atualiza a tela em caso de sucesso
  async function salvarAlteracoes() {
    // Validação de datas antes de salvar
    const editDatNasc = document.getElementById('editDataNascimento');
    const editDatIng  = document.getElementById('editDataIngresso');
    const erroDatNascEdit    = document.getElementById('erroDatNascEdit');
    const erroDataIngressoEdit = document.getElementById('erroDataIngressoEdit');
    const erroNasc = validarDataNasc(editDatNasc ? editDatNasc.value : '');
    const erroIng  = validarDataIng(editDatIng  ? editDatIng.value  : '');
    if (erroNasc) { aplicarErroEdit(editDatNasc, erroDatNascEdit, erroNasc); editDatNasc.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (erroIng)  { aplicarErroEdit(editDatIng,  erroDataIngressoEdit, erroIng);  editDatIng.scrollIntoView({  behavior: 'smooth', block: 'center' }); return; }

    // Validação: telefone deve estar vazio ou ter 11 dígitos (celular)
    const editTelSave   = document.getElementById('editTelefone');
    const erroTelSave   = document.getElementById('erroTelEdit');
    if (editTelSave && !telefoneValido(editTelSave.value)) {
      editTelSave.classList.add('input--erro');
      if (erroTelSave) { erroTelSave.textContent = 'Telefone incompleto. Use (XX) XXXXX-XXXX.'; erroTelSave.classList.add('visivel'); }
      editTelSave.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Snapshot do programa ANTES de qualquer alteração — necessário para remover
    // corretamente o vínculo de mentor antigo, cuja chave usa o programa em que foi criado.
    const idProgramaAntigo = aluna.idPrograma;
    const idMentorAntigo = aluna.idMentor;

    const selectProgramaAtual = document.getElementById("editProgramaAtual");
    const idProgramaSelecionado = selectProgramaAtual ? selectProgramaAtual.value : "";
    const tituloProgramaSelecionado = selectProgramaAtual && selectProgramaAtual.selectedIndex >= 0
      ? selectProgramaAtual.options[selectProgramaAtual.selectedIndex].textContent
      : aluna.programa;

    const dadosAtualizados = {
      nome: document.getElementById("editNome").value,
      telefone: document.getElementById("editTelefone").value,
      data_nascimento: document.getElementById("editDataNascimento").value,
      cidade_nascimento: document.getElementById("editCidade").value,
      estado_nascimento: document.getElementById("editEstado").value,
      estagio_jornada: document.getElementById("editEstagio")
        ? document.getElementById("editEstagio").value
        : aluna.estagioJornada,
      data_ingresso: document.getElementById("editDataIngresso").value,
      escolaridade: document.getElementById("editEscolaridade").value,
      status_profissional: document.getElementById("editStatusProfissional")
        .value,
      observacoes: document.getElementById("editObservacoes").value,
    };

    // Inclui o programa apenas se um foi selecionado (cria/garante a matrícula no backend)
    if (idProgramaSelecionado) {
      dadosAtualizados.id_programa = Number(idProgramaSelecionado);
      dadosAtualizados.programa_ingresso = tituloProgramaSelecionado;
    }

    // Inclui foto_url apenas se foi alterada (null = remover, string = nova foto)
    if (fotoAlterada) {
      dadosAtualizados.foto_url = novaFotoBase64;
    }

    btnEditar.textContent = "Salvando no Banco...";
    btnEditar.disabled = true;

    try {
      const response = await fetch(`/alunos/${alunoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados),
      });

      if (!response.ok) throw new Error("Erro ao atualizar dados");

      // Atualiza o objeto local e re-preenche a tela sem nova requisição
      Object.assign(aluna, {
        nome: dadosAtualizados.nome,
        telefone: dadosAtualizados.telefone,
        dataNascimento: dadosAtualizados.data_nascimento,
        cidade: dadosAtualizados.cidade_nascimento,
        estado: dadosAtualizados.estado_nascimento,
        estagioJornada: dadosAtualizados.estagio_jornada,
        dataIngresso: dadosAtualizados.data_ingresso,
        escolaridade: dadosAtualizados.escolaridade,
        statusProfissional: dadosAtualizados.status_profissional,
        observacoes: dadosAtualizados.observacoes,
      });

      if (idProgramaSelecionado) {
        aluna.idPrograma = Number(idProgramaSelecionado);
        aluna.programa = tituloProgramaSelecionado;
      }

      if (fotoAlterada) aluna.foto_url = novaFotoBase64;

      // Atualiza o vínculo de mentor (tabela acompanha) conforme o programa escolhido
      const ehPulseMaisAgora = tituloProgramaSelecionado.toLowerCase().includes('pulse mais');
      const idProgramaNovo = dadosAtualizados.id_programa || idProgramaAntigo;

      if (ehPulseMaisAgora) {
        // Pulse Mais não usa mentor individual — remove o vínculo existente, se houver
        if (idMentorAntigo) {
          try {
            await fetch(`/acompanha/mentor/${idMentorAntigo}/aluno/${alunoId}/programa/${idProgramaAntigo}`, { method: "DELETE" });
            aluna.idMentor = null;
          } catch (mentorErr) {
            console.error("Erro ao remover mentor vinculado:", mentorErr);
          }
        }
      } else {
        // Programa com mentoria individual — aplica a seleção do select de mentor
        const selectMentor = document.getElementById("editMentor");
        if (selectMentor) {
          const novoIdMentor = selectMentor.value ? Number(selectMentor.value) : null;

          if (novoIdMentor !== idMentorAntigo) {
            if (novoIdMentor && !idProgramaNovo) {
              alert("Não foi possível vincular o mentor: defina primeiro o programa do aluno.");
            } else {
              try {
                if (idMentorAntigo) {
                  await fetch(`/acompanha/mentor/${idMentorAntigo}/aluno/${alunoId}/programa/${idProgramaAntigo}`, { method: "DELETE" });
                }
                if (novoIdMentor) {
                  await fetch("/acompanha", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id_mentor: novoIdMentor, id_aluno: Number(alunoId), id_programa: idProgramaNovo }),
                  });
                }
                aluna.idMentor = novoIdMentor;
              } catch (mentorErr) {
                console.error("Erro ao atualizar mentor vinculado:", mentorErr);
                alert("Dados do aluno salvos, mas houve um erro ao atualizar o mentor vinculado.");
              }
            }
          }
        }
      }

      modoEdicao = false;
      fotoAlterada = false;
      novaFotoBase64 = undefined;
      btnEditar.disabled = false;
      btnEditar.textContent = "Editar Dados";
      btnEditar.classList.remove("btn--accent");
      btnEditar.classList.add("btn--outline");
      if (fotoEditAcoes) fotoEditAcoes.style.display = "none";

      preencherDados();
      restaurarCardMentor();
      carregarMentorVinculado(alunoId);
      alert("Alterações sincronizadas com o banco de dados!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar no banco de dados. Tente novamente.");
      btnEditar.disabled = false;
      btnEditar.textContent = "Salvar Alterações";
    }
  }

  const modal              = document.getElementById('modalExclusao');
  const modalPermanente    = document.getElementById('modalExclusaoPermanente');
  const modalFeedback      = document.getElementById('modalFeedbackExclusao');
  const btnTornarExAluno   = document.getElementById('btnTornarExAluno');
  const btnCancelar        = document.getElementById('btnCancelarExclusao');
  const btnConfirmar       = document.getElementById('btnConfirmarExclusao');
  const btnExcluir         = document.getElementById('btnExcluir');
  const btnCancelarPermanente  = document.getElementById('btnCancelarExclusaoPermanente');
  const btnConfirmarPermanente = document.getElementById('btnConfirmarExclusaoPermanente');

  // Abre e fecha o modal de confirmação de "Tornar Ex-Aluno" (soft delete)
  btnTornarExAluno.addEventListener('click', function () { modal.classList.add('aberto'); });
  btnCancelar.addEventListener('click', function () { modal.classList.remove('aberto'); });

  // Executa a transição para ex-aluno via PATCH /alunos/:id/tornar-ex-aluno e exibe o feedback
  btnConfirmar.addEventListener('click', async function () {
    btnConfirmar.textContent = 'Processando...';
    btnConfirmar.disabled = true;

    try {
      const response = await fetch("/alunos/" + alunoId + "/tornar-ex-aluno", { method: "PATCH" });
      if (!response.ok) throw new Error("Erro " + response.status);

      modal.classList.remove("aberto");
      mostrarFeedbackExclusao(
        "sucesso",
        "Aluno tornou-se ex-aluno!",
        aluna.nome +
          " foi desvinculado(a) de todos os programas e mentores e agora está na lista de ex-alunos.",
      );
    } catch (error) {
      console.error(error);
      modal.classList.remove("aberto");
      mostrarFeedbackExclusao(
        "erro",
        "Falha na operação",
        "Não foi possível tornar o aluno ex-aluno. Tente novamente ou contate o suporte.",
      );
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Sim, tornar ex-aluno";
    }
  });

  // Abre e fecha o modal de confirmação de exclusão permanente (hard delete)
  btnExcluir.addEventListener('click', function () { modalPermanente.classList.add('aberto'); });
  btnCancelarPermanente.addEventListener('click', function () { modalPermanente.classList.remove('aberto'); });

  // Executa o delete real via DELETE /alunos/:id e exibe o modal de feedback com o resultado
  btnConfirmarPermanente.addEventListener('click', async function () {
    btnConfirmarPermanente.textContent = 'Excluindo...';
    btnConfirmarPermanente.disabled = true;

    try {
      const response = await fetch("/alunos/" + alunoId, { method: "DELETE" });
      if (!response.ok) throw new Error("Erro " + response.status);

      modalPermanente.classList.remove("aberto");
      mostrarFeedbackExclusao(
        "sucesso",
        "Perfil excluído!",
        "O perfil de " +
          aluna.nome +
          " foi excluído permanentemente do banco de dados.",
      );
    } catch (error) {
      console.error(error);
      modalPermanente.classList.remove("aberto");
      mostrarFeedbackExclusao(
        "erro",
        "Falha na exclusão",
        "Não foi possível excluir o perfil. Tente novamente ou contate o suporte.",
      );
      btnConfirmarPermanente.disabled = false;
      btnConfirmarPermanente.textContent = "Sim, excluir permanentemente";
    }
  });

  // Configura e exibe o modal de feedback após tentativa de exclusão (sucesso ou erro)
  function mostrarFeedbackExclusao(tipo, titulo, mensagem) {
    const iconEl = document.getElementById("excFeedbackIcon");
    const titleEl = document.getElementById("excFeedbackTitle");
    const msgEl = document.getElementById("excFeedbackMessage");
    const btnEl = document.getElementById("btnFeedbackExclusao");

    if (tipo === "sucesso") {
      iconEl.style.background = "rgba(37, 176, 87, 0.1)";
      iconEl.innerHTML =
        '<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" stroke-width="3">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' +
        "</svg>";
      btnEl.className = "btn btn--accent";
      btnEl.textContent = "Ir para lista de alunos";
      btnEl.onclick = function () {
        window.location.href = "alunos.html";
      };
    } else {
      iconEl.style.background = "rgba(220, 38, 38, 0.1)";
      iconEl.innerHTML =
        '<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" stroke-width="2.5">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>' +
        "</svg>";
      btnEl.className = "btn btn--danger";
      btnEl.textContent = "Entendido";
      btnEl.onclick = function () {
        modalFeedback.classList.remove("aberto");
      };
    }

    titleEl.textContent = titulo;
    msgEl.textContent = mensagem;
    modalFeedback.classList.add("aberto");
  }

  carregarPerfil();
});

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm("Deseja realmente sair?")) {
    const foto = localStorage.getItem("fotoCoord");
    localStorage.clear();
    if (foto) localStorage.setItem("fotoCoord", foto);
    window.location.href = "../index.html";
  }
}
