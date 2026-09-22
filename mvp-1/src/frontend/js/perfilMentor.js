// Escapa caracteres HTML para prevenir XSS ao inserir dados dinamicos no DOM
function sanitize(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {

  // Guard: redireciona se nao autenticado ou se nao for mentor
  if (!Auth.isAuthenticated()) { window.location.replace('../index.html'); return; }
  const sessao = Auth.getUsuario();
  if (!sessao || sessao.perfil !== 'mentor') { window.location.replace('../index.html'); return; }

  const idUsuario = String(sessao.id_usuario);
  const sidebarNome = document.getElementById('sidebarNome');
  if (sidebarNome) sidebarNome.textContent = sessao.nome || 'Mentor';

  let mentorDados = {};
  let modoEdicao = false;

  // Busca os dados do mentor logado via GET /usuarios/:id e preenche a tela.
  // O endpoint agora retorna o objeto `mentor` com especialidade, tipo_vinculo e disponibilidade
  // alem dos dados basicos do usuario (nome, email, foto_url).
  async function carregarPerfil() {
    try {
      const data = await Auth.fetch('/usuarios/' + idUsuario);
      const m = data.mentor || {};

      mentorDados = {
        nome:             data.nome  || '',
        email:            data.email || '',
        especialidade:    m.especialidade    || 'Nao informado',
        tipo_vinculo:     m.tipo_vinculo     || 'Nao informado',
        disponibilidade:  m.disponibilidade  || 'Nao informado',
      };

      // Sincroniza foto do banco com a tela (botoes so aparecem no modo edicao)
      if (data.foto_url) {
        aplicarFotoMentor(data.foto_url);
      }

      preencherDados();
    } catch (error) {
      console.error('Erro ao carregar perfil do mentor:', error);
    }
  }

  // Preenche todos os campos de exibicao com os dados do objeto mentorDados
  function preencherDados() {
    document.getElementById('mentorNome').textContent            = mentorDados.nome;
    document.getElementById('mentorEmail').textContent           = mentorDados.email;
    document.getElementById('mentorEspecialidade').textContent   = mentorDados.especialidade;
    document.getElementById('mentorTipoVinculo').textContent     = mentorDados.tipo_vinculo;
    document.getElementById('mentorDisponibilidade').textContent = mentorDados.disponibilidade;

    if (sidebarNome) sidebarNome.textContent = mentorDados.nome;
  }

  const btnEditar   = document.getElementById('btnEditarMentor');
  const btnCancelar = document.getElementById('btnCancelarMentor');

  // Alterna entre modo de visualizacao e modo de edicao ao clicar no botao
  btnEditar.addEventListener('click', function () {
    if (!modoEdicao) {
      entrarModoEdicao();
    } else {
      salvarAlteracoes();
    }
  });

  if (btnCancelar) {
    btnCancelar.addEventListener('click', function () {
      modoEdicao = false;
      btnEditar.textContent = 'Editar Perfil';
      btnEditar.classList.remove('btn--primary');
      btnEditar.classList.add('btn-verde');
      btnCancelar.style.display = 'none';
      var btnEf = document.getElementById('btnEditarFoto');
      if (btnEf) btnEf.style.display = 'none';
      var btnRf = document.getElementById('btnRemoverFoto');
      if (btnRf) btnRf.style.display = 'none';
      preencherDados();
    });
  }

  // Substitui os textos estaticos por inputs preenchidos com os valores atuais
  function entrarModoEdicao() {
    modoEdicao = true;
    btnEditar.textContent = 'Salvar Alteracoes';
    btnEditar.classList.remove('btn-verde');
    btnEditar.classList.add('btn--primary');
    if (btnCancelar) btnCancelar.style.display = '';

    document.getElementById('mentorNome').innerHTML            = inp('text', 'editNome',            mentorDados.nome);
    document.getElementById('mentorEmail').innerHTML           = inp('email', 'editEmail',          mentorDados.email);
    document.getElementById('mentorEspecialidade').innerHTML   = inp('text', 'editEspecialidade',   naoInfo(mentorDados.especialidade));
    document.getElementById('mentorTipoVinculo').innerHTML     = sel('editTipoVinculo',
      [['interno','Interno'],['externo','Externo'],['voluntario','Voluntário']],
      naoInfo(mentorDados.tipo_vinculo));
    document.getElementById('mentorDisponibilidade').innerHTML = sel('editDisponibilidade',
      [['disponivel','Disponível'],['indisponivel','Indisponível'],['manha','Manhã']],
      naoInfo(mentorDados.disponibilidade));

    var nomeEl = document.getElementById('editNome');
    if (nomeEl) {
      nomeEl.addEventListener('input', function () {
        this.value = this.value
          .replace(/[0-9]/g, '')
          .replace(/(^|\s)(\S)/g, function (m, sp, c) { return sp + c.toUpperCase(); });
      });
    }

    var espEl = document.getElementById('editEspecialidade');
    if (espEl) {
      espEl.addEventListener('input', function () {
        this.value = this.value.replace(/[0-9]/g, '');
      });
    }

    var btnEf = document.getElementById('btnEditarFoto');
    if (btnEf) btnEf.style.display = '';
    var fotoEl = document.getElementById('perfilFoto');
    var btnRf = document.getElementById('btnRemoverFoto');
    if (btnRf && fotoEl && !fotoEl.src.includes('avatar')) btnRf.style.display = '';
  }

  // Gera a string HTML de um input generico para uso no modo de edicao
  function inp(type, id, value) {
    return '<input type="' + type + '" id="' + id + '" value="' + esc(value) + '" class="form-input-edit">';
  }

  // Gera a string HTML de um select para campos com opcoes fixas
  function sel(id, opcoes, valorAtual) {
    var html = '<select id="' + id + '" class="form-input-edit">';
    opcoes.forEach(function (op) {
      var selected = (op[0] === valorAtual) ? ' selected' : '';
      html += '<option value="' + esc(op[0]) + '"' + selected + '>' + esc(op[1]) + '</option>';
    });
    html += '</select>';
    return html;
  }

  // Escapa aspas duplas para uso seguro em atributos HTML
  function esc(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }

  // Retorna string vazia se o valor for um placeholder "Nao informado"
  function naoInfo(val) {
    return (val === 'Nao informado' || val === 'Nao informada') ? '' : val;
  }

  // Coleta os dados dos inputs e envia via PUT /usuarios/:id; atualiza a tela em caso de sucesso.
  // Os campos especialidade, tipo_vinculo e disponibilidade sao roteados pelo service
  // para a tabela `mentor` via repo.updateMentor().
  async function salvarAlteracoes() {
    const dados = {
      nome:             document.getElementById('editNome').value,
      email:            document.getElementById('editEmail').value,
      especialidade:    document.getElementById('editEspecialidade').value,
      tipo_vinculo:     document.getElementById('editTipoVinculo').value,
      disponibilidade:  document.getElementById('editDisponibilidade').value,
    };

    btnEditar.textContent = 'Salvando...';
    btnEditar.disabled = true;

    try {
      await Auth.fetch('/usuarios/' + idUsuario, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });

      mentorDados.nome            = dados.nome;
      mentorDados.email           = dados.email;
      mentorDados.especialidade   = dados.especialidade   || 'Nao informado';
      mentorDados.tipo_vinculo    = dados.tipo_vinculo    || 'Nao informado';
      mentorDados.disponibilidade = dados.disponibilidade || 'Nao informado';

      modoEdicao = false;
      btnEditar.disabled = false;
      btnEditar.textContent = 'Editar Perfil';
      btnEditar.classList.remove('btn--primary');
      btnEditar.classList.add('btn-verde');
      if (btnCancelar) btnCancelar.style.display = 'none';
      var btnEf = document.getElementById('btnEditarFoto');
      if (btnEf) btnEf.style.display = 'none';
      var btnRf = document.getElementById('btnRemoverFoto');
      if (btnRf) btnRf.style.display = 'none';

      var sidebarAvatar = document.getElementById('sidebarAvatar');
      var perfilFotoEl = document.getElementById('perfilFoto');
      if (sidebarAvatar && perfilFotoEl) sidebarAvatar.src = perfilFotoEl.src;

      preencherDados();
    } catch (error) {
      console.error('Erro ao salvar alteracoes:', error);
      alert('Erro ao salvar alteracoes. Tente novamente.');
      btnEditar.disabled = false;
      btnEditar.textContent = 'Salvar Alteracoes';
    }
  }

  // ========================================================================
  // ALUNOS ACOMPANHADOS
  // Usa GET /mentores/:id/mentorandos que busca da tabela `acompanha`
  // (juncao mentor↔aluno). Retorna todos os alunos vinculados ao mentor,
  // independente de terem sessao de mentoria agendada.
  // ========================================================================
  async function carregarMentorandos() {
    const tbody = document.getElementById('tabelaMentorandos');

    try {
      const alunos = await Auth.fetch('/mentores/' + idUsuario + '/mentorandos');

      if (!alunos || alunos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:28px; color:var(--color-text-support); font-size:13px;">Nenhum aluno vinculado ainda.</td></tr>';
        return;
      }

      tbody.innerHTML = alunos.map(function (a) {
        const nome = sanitize(a.nome || 'Aluno');
        const email = sanitize(a.email || '—');
        const programa = sanitize(a.id_programa ? 'Programa ' + a.id_programa : '—');

        const linkAluno = a.id_usuario
          ? '<a href="dadosAluno.html?id=' + a.id_usuario + '" class="nome-link">' + nome + '</a>'
          : nome;

        return '<tr>' +
          '<td>' + linkAluno + '</td>' +
          '<td>' + email + '</td>' +
          '<td>' + programa + '</td>' +
          '</tr>';
      }).join('');

    } catch (err) {
      console.error('Erro ao carregar mentorandos:', err);
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:28px; color:var(--color-text-support); font-size:13px;">Nao foi possivel carregar os alunos.</td></tr>';
    }
  }

  carregarPerfil();
  carregarMentorandos();

});

// Aplica a foto informada ao avatar do perfil e da sidebar
function aplicarFotoMentor(src) {
  const perfilFoto = document.getElementById('perfilFoto');
  if (perfilFoto) perfilFoto.src = src;
  const sidebarAvatar = document.getElementById('sidebarAvatar');
  if (sidebarAvatar) sidebarAvatar.src = src;
  if (!src.includes('avatar')) {
    try { localStorage.setItem('fotoMentor', src); } catch (e) {}
  } else {
    localStorage.removeItem('fotoMentor');
  }
}

// Persiste a foto (ou remocao) do mentor via PUT /usuarios/:id usando Auth.fetch
function salvarFotoMentorNoServidor(fotoUrl) {
  Auth.fetch('/usuarios/' + Auth.getUsuario().id_usuario, {
    method: 'PUT',
    body: JSON.stringify({ foto_url: fotoUrl }),
  }).catch(function () {
    alert('A foto foi atualizada na tela, mas nao foi possivel salva-la no servidor. Tente novamente.');
  });
}

// Comprime a imagem selecionada (max. 300px, JPEG 85%), aplica na tela e persiste no banco
function previewFotoMentor(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var MAX = 300;
      var ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      var canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      var compressed = canvas.toDataURL('image/jpeg', 0.85);

      aplicarFotoMentor(compressed);
      var btnRemover = document.getElementById('btnRemoverFoto');
      if (btnRemover) btnRemover.style.display = '';

      salvarFotoMentorNoServidor(compressed);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

// Remove a foto do mentor, restaura o avatar padrao e persiste a remocao no banco
function limparFotoMentor() {
  var perfilFoto = document.getElementById('perfilFoto');
  if (perfilFoto) perfilFoto.src = '../assets/avatar.png';
  var btnRemover = document.getElementById('btnRemoverFoto');
  if (btnRemover) btnRemover.style.display = 'none';

  salvarFotoMentorNoServidor(null);
}

// Remove a sessao do mentor e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}
