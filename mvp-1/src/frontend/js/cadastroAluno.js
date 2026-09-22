document.addEventListener('DOMContentLoaded', function() {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  const nomeUsuario = localStorage.getItem('nomeUsuario') || 'C';
  const nomeCoord = document.getElementById('nomeCoord');
  if (nomeCoord) nomeCoord.textContent = nomeUsuario;

  // Nascimento e ingresso são datas históricas: não faz sentido aceitar anos futuros
  const hojeIso = new Date().toISOString().split('T')[0];
  const campoDataNascimento = document.getElementById('dataNascimento');
  const campoDataIngresso   = document.getElementById('dataIngresso');
  if (campoDataNascimento) { campoDataNascimento.max = hojeIso; campoDataNascimento.min = '1900-01-01'; }
  if (campoDataIngresso)   { campoDataIngresso.max   = hojeIso; campoDataIngresso.min   = '2022-01-01'; }

  // Valida data de nascimento em tempo real — retorna mensagem de erro ou ''
  function validarDataNascimento(valor) {
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

  // Valida data de ingresso em tempo real — retorna mensagem de erro ou ''
  function validarDataIngresso(valor) {
    if (!valor) return '';
    const d = new Date(valor + 'T12:00:00');
    const hoje = new Date();
    if (d > hoje) return 'A data de ingresso não pode ser futura.';
    if (d.getFullYear() < 2022) return 'A data de ingresso não pode ser anterior a 2022.';
    return '';
  }

  // Aplica ou remove o estado de erro visualmente no campo e no wrapper do datePicker
  function aplicarErro(campo, erroEl, mensagem) {
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

  const erroDatNasc     = document.getElementById('erroDatNasc');
  const erroDataIngresso = document.getElementById('erroDataIngresso');

  if (campoDataNascimento && erroDatNasc) {
    campoDataNascimento.addEventListener('change', function () {
      const emErro = campoDataNascimento.classList.contains('input--erro');
      const erro = validarDataNascimento(this.value);
      if (emErro || erro) aplicarErro(campoDataNascimento, erroDatNasc, erro);
    });
    // datePicker só dispara 'input' (não 'change') ao apagar — limpa o erro quando vazio
    campoDataNascimento.addEventListener('input', function () {
      if (!this.value) aplicarErro(campoDataNascimento, erroDatNasc, '');
    });
  }
  if (campoDataIngresso && erroDataIngresso) {
    campoDataIngresso.addEventListener('change', function () {
      const emErro = campoDataIngresso.classList.contains('input--erro');
      const erro = validarDataIngresso(this.value);
      if (emErro || erro) aplicarErro(campoDataIngresso, erroDataIngresso, erro);
    });
  }

  // Aplica a máscara 000.000.000-00 ao CPF conforme o usuário digita
  function aplicarMascaraCpf(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    let resultado = digitos.slice(0, 3);
    if (digitos.length > 3)  resultado += '.' + digitos.slice(3, 6);
    if (digitos.length > 6)  resultado += '.' + digitos.slice(6, 9);
    if (digitos.length > 9)  resultado += '-' + digitos.slice(9, 11);
    return resultado;
  }

  // Aplica a máscara (00) 00000-0000 ao telefone (somente celular, 11 dígitos)
  function aplicarMascaraTelefone(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    if (digitos.length === 0) return '';
    if (digitos.length <= 2)  return '(' + digitos;
    if (digitos.length <= 7)  return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2);
    return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 7) + '-' + digitos.slice(7);
  }

  const campoCpf      = document.getElementById('cpf');
  const campoTelefone = document.getElementById('telefone');
  if (campoCpf)      campoCpf.addEventListener('input', function () { campoCpf.value = aplicarMascaraCpf(campoCpf.value); });
  if (campoTelefone) campoTelefone.addEventListener('input', function () { campoTelefone.value = aplicarMascaraTelefone(campoTelefone.value); });

  // Nome: sem números e inicial de cada palavra em maiúscula
  const campoNome = document.getElementById('nome');
  if (campoNome) {
    campoNome.addEventListener('input', function () {
      const s = this.selectionStart;
      const novo = this.value
        .replace(/[0-9]/g, '')
        .replace(/(^|\s)([^\s])/g, function (m, sep, c) { return sep + c.toUpperCase(); });
      if (this.value !== novo) { this.value = novo; this.setSelectionRange(s, s); }
    });
  }

  // Validação de comprimento mínimo — borda vermelha ao sair do campo incompleto
  const erroCpf      = document.getElementById('erroCpf');
  const erroTelefone = document.getElementById('erroTelefone');

  function marcarErroFormato(campo, erroEl, valido, msg) {
    if (!valido) {
      campo.classList.add('input--erro');
      if (erroEl) { erroEl.textContent = msg; erroEl.classList.add('visivel'); }
    } else {
      campo.classList.remove('input--erro');
      if (erroEl) { erroEl.textContent = ''; erroEl.classList.remove('visivel'); }
    }
  }

  if (campoCpf) {
    campoCpf.addEventListener('blur', function () {
      const d = this.value.replace(/\D/g, '');
      // Vazio deixa para o 'required' nativo; parcial → erro
      marcarErroFormato(campoCpf, erroCpf, d.length === 0 || d.length === 11, 'CPF incompleto.');
    });
    campoCpf.addEventListener('input', function () {
      if (!campoCpf.classList.contains('input--erro')) return;
      const d = this.value.replace(/\D/g, '');
      marcarErroFormato(campoCpf, erroCpf, d.length === 0 || d.length === 11, 'CPF incompleto.');
    });
  }

  function telefoneValido(val) {
    const d = (val || '').replace(/\D/g, '');
    return d.length === 0 || d.length === 11;
  }

  if (campoTelefone) {
    campoTelefone.addEventListener('blur', function () {
      if (!telefoneValido(this.value)) {
        marcarErroFormato(campoTelefone, erroTelefone, false, 'Telefone incompleto. Use (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.');
      } else {
        marcarErroFormato(campoTelefone, erroTelefone, true, '');
      }
    });
    campoTelefone.addEventListener('input', function () {
      if (!campoTelefone.classList.contains('input--erro')) return;
      if (telefoneValido(this.value)) marcarErroFormato(campoTelefone, erroTelefone, true, '');
    });
  }

  const form              = document.getElementById('formCadastro');
  const btnCadastrar      = document.getElementById('btnCadastrar');
  const inputFoto         = document.getElementById('fotoPerfil');
  const imgPreview        = document.getElementById('imgPreview');
  const placeholderIcon   = document.getElementById('placeholderIcon');
  const modalFeedback     = document.getElementById('modalFeedback');
  const feedbackIconContainer = document.getElementById('feedbackIconContainer');
  const feedbackTitle     = document.getElementById('feedbackTitle');
  const feedbackMessage   = document.getElementById('feedbackMessage');
  const btnFeedbackAction = document.getElementById('btnFeedbackAction');
  const btnRemoverFoto    = document.getElementById('btnRemoverFoto');

  let base64Foto = '';
  let sucessoNoCadastro = false;

  // Comprime a imagem selecionada (máx. 400px, JPEG 85%) e exibe a pré-visualização
  inputFoto.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        base64Foto = canvas.toDataURL('image/jpeg', 0.85);

        imgPreview.src = base64Foto;
        imgPreview.style.display = 'block';
        placeholderIcon.style.display = 'none';
        if (btnRemoverFoto) btnRemoverFoto.style.display = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Remove a foto selecionada e restaura o placeholder
  if (btnRemoverFoto) {
    btnRemoverFoto.addEventListener('click', function() {
      base64Foto = '';
      imgPreview.src = '';
      imgPreview.style.display = 'none';
      placeholderIcon.style.display = '';
      inputFoto.value = '';
      btnRemoverFoto.style.display = 'none';
    });
  }

  // ---- Programa (carregado do banco) + seção condicional de Mentoria ----
  const selectPrograma   = document.getElementById('programa');
  const secaoMentoria    = document.getElementById('secaoMentoria');
  const selectMentor     = document.getElementById('mentorVinculado');
  let mentoresCarregados = false;

  // Busca os programas cadastrados via GET /programas e popula o select.
  // Nenhuma opção fica fixa no HTML — tudo vem do banco (sem hardcode).
  async function carregarProgramas() {
    try {
      const response = await fetch('/programas');
      if (!response.ok) throw new Error('Falha ao carregar programas');
      const programas = await response.json();

      selectPrograma.innerHTML = '<option value="">Selecione...</option>' +
        programas.map(function (p) {
          return '<option value="' + p.id_programa + '" data-tipo="' + (p.tipo || 'Pulse Mais') + '">' + p.titulo + '</option>';
        }).join('');
    } catch (error) {
      console.error('Erro ao carregar programas:', error);
      selectPrograma.innerHTML = '<option value="">Erro ao carregar programas</option>';
    }
  }
  carregarProgramas();

  // Busca os mentores ativos na API e popula o select (apenas uma vez).
  async function carregarMentores() {
    if (mentoresCarregados) return;
    try {
      const response = await fetch('/mentores');
      if (!response.ok) throw new Error('Falha ao carregar mentores');
      const mentores = await response.json();

      mentores.forEach(function(mentor) {
        const option = document.createElement('option');
        option.value = mentor.id_usuario;
        option.textContent = mentor.nome || `Mentor #${mentor.id_usuario}`;
        selectMentor.appendChild(option);
      });
      mentoresCarregados = true;
    } catch (error) {
      console.error('Erro ao carregar mentores:', error);
    }
  }

  // Exibe/oculta a seção de mentor conforme o TIPO do programa selecionado
  // (não mais pelo texto do título, que agora vem dinâmico do banco).
  if (selectPrograma) {
    selectPrograma.addEventListener('change', function() {
      const opcaoSelecionada = this.options[this.selectedIndex];
      const tipoSelecionado = opcaoSelecionada ? opcaoSelecionada.dataset.tipo : '';

      if (tipoSelecionado === 'Mentoria') {
        secaoMentoria.style.display = '';
        carregarMentores();
      } else {
        secaoMentoria.style.display = 'none';
        if (selectMentor) selectMentor.value = '';
      }
    });
  }

  // ---- Cidade depende do Estado selecionado ----
  const selectEstado = document.getElementById('estado');
  const selectCidade  = document.getElementById('cidade');

  // Busca as cidades do estado escolhido via GET /localidades/cidades/:uf e popula o select
  if (selectEstado && selectCidade) {
    selectEstado.addEventListener('change', async function () {
      const uf = this.value;

      if (!uf) {
        selectCidade.innerHTML = '<option value="">Selecione o estado primeiro</option>';
        selectCidade.disabled = true;
        return;
      }

      selectCidade.disabled = true;
      selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';

      try {
        const response = await fetch('/localidades/cidades/' + uf);
        if (!response.ok) throw new Error('Falha ao carregar cidades');
        const cidades = await response.json();

        selectCidade.innerHTML = '<option value="">Selecione...</option>' +
          cidades.map(function (nome) { return '<option value="' + nome + '">' + nome + '</option>'; }).join('');
        selectCidade.disabled = false;
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        selectCidade.innerHTML = '<option value="">Erro ao carregar cidades</option>';
      }
    });
  }

  // Configura o ícone, as cores e o texto do botão do modal conforme o tipo (sucesso ou erro)
  function mostrarFeedback(tipo, titulo, mensagem) {
    sucessoNoCadastro = (tipo === 'sucesso');

    if (tipo === 'sucesso') {
      feedbackIconContainer.style.background = 'rgba(37, 176, 87, 0.1)';
      feedbackIconContainer.innerHTML = `
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
      btnFeedbackAction.className = 'btn btn--accent';
      btnFeedbackAction.textContent = 'Ir para lista de alunos';
    } else {
      feedbackIconContainer.style.background = 'rgba(220, 38, 38, 0.1)';
      feedbackIconContainer.innerHTML = `
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
      btnFeedbackAction.className = 'btn btn--danger';
      btnFeedbackAction.textContent = 'Entendido';
    }

    feedbackTitle.textContent = titulo;
    feedbackMessage.textContent = mensagem;
    modalFeedback.classList.add('aberto');
  }

  // Valida as datas, monta o payload e envia o cadastro via POST /alunos
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(form);

    // Validação: nome completo (nome e sobrenome), cada palavra com a primeira letra maiúscula
    const nomeValue = (formData.get('nome') || '').trim();
    const palavrasNome = nomeValue.split(/\s+/).filter(Boolean);
    const comecaComMaiuscula = /^\p{Lu}/u;
    if (palavrasNome.length < 2 || !palavrasNome.every(function (p) { return comecaComMaiuscula.test(p); })) {
      mostrarFeedback('erro', 'Nome Inválido', 'Informe o nome completo (nome e sobrenome), com a primeira letra de cada palavra em maiúscula. Ex: Maria Silva.');
      return;
    }

    const dataIngressoValue   = formData.get('dataIngresso');
    const dataNascimentoValue = formData.get('dataNascimento');
    const hoje = new Date();

    // Validação visual + bloqueio: data de nascimento
    const erroNasc = validarDataNascimento(dataNascimentoValue);
    if (erroNasc) {
      aplicarErro(campoDataNascimento, erroDatNasc, erroNasc);
      campoDataNascimento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validação visual + bloqueio: data de ingresso
    const erroIng = validarDataIngresso(dataIngressoValue);
    if (erroIng) {
      aplicarErro(campoDataIngresso, erroDataIngresso, erroIng);
      campoDataIngresso.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validação visual + bloqueio: CPF incompleto
    if (campoCpf) {
      const dCpf = campoCpf.value.replace(/\D/g, '');
      if (dCpf.length > 0 && dCpf.length < 11) {
        marcarErroFormato(campoCpf, erroCpf, false, 'CPF incompleto.');
        campoCpf.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Validação visual + bloqueio: telefone deve estar vazio ou com 10/11 dígitos
    if (campoTelefone && !telefoneValido(campoTelefone.value)) {
      marcarErroFormato(campoTelefone, erroTelefone, false, 'Telefone incompleto. Use (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.');
      campoTelefone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Desabilita o botão para evitar duplo envio
    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Salvando no Banco de Dados...';

    // O select de programa guarda o id_programa como value; o título (para o campo
    // de texto programa_ingresso) vem do texto da opção selecionada.
    const idProgramaSelecionado = formData.get('programa');
    const opcaoProgramaSelecionada = selectPrograma.options[selectPrograma.selectedIndex];
    const tituloPrograma = opcaoProgramaSelecionada ? opcaoProgramaSelecionada.textContent : '';

    if (!idProgramaSelecionado) {
      mostrarFeedback('erro', 'Programa Obrigatório', 'Selecione o programa atual do aluno antes de continuar.');
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = 'Cadastrar Aluno';
      return;
    }

    // Constrói o objeto conforme esperado pela API (CreateAlunoData)
    const dadosParaAPI = {
      nome:                 formData.get('nome'),
      email:                formData.get('email'),
      cpf:                  formData.get('cpf'),
      telefone:             formData.get('telefone'),
      data_nascimento:      dataNascimentoValue,
      cidade_nascimento:    formData.get('cidade'),
      estado_nascimento:    formData.get('estado'),
      programa_ingresso:    tituloPrograma,
      id_programa:          Number(idProgramaSelecionado),
      estagio_jornada:      formData.get('estagioJornada') || 'conectado',
      data_ingresso:        dataIngressoValue,
      escolaridade:         formData.get('escolaridade'),
      status_profissional:  formData.get('statusProfissional'),
      observacoes:          formData.get('observacoes'),
      foto_url:             base64Foto,
      id_mentor_vinculado:  formData.get('mentorVinculado') || null
    };

    try {
      const response = await fetch('/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaAPI)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erro desconhecido ao cadastrar');
      }

      mostrarFeedback('sucesso', 'Cadastro Realizado!', 'O aluno foi cadastrado com sucesso no banco de dados e já está disponível na lista para acompanhamento.');

    } catch (error) {
      console.error('Erro no cadastro:', error);
      mostrarFeedback('erro', 'Falha no Cadastro', `Não foi possível cadastrar o aluno. Motivo: ${error.message}`);
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = 'Cadastrar Aluno';
    }
  });

  // Fecha o modal e redireciona para a lista de alunos em caso de sucesso
  btnFeedbackAction.addEventListener('click', function() {
    modalFeedback.classList.remove('aberto');
    if (sucessoNoCadastro) {
      window.location.href = 'alunos.html';
    }
  });

});

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    localStorage.clear();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
