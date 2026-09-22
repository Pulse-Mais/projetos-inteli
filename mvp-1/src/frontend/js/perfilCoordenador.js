// Escapa caracteres perigosos para inserção segura em HTML (previne XSS)
function sanitize(str) {
  const el = document.createElement('div');
  el.textContent = String(str || '');
  return el.innerHTML;
}

// Formata telefone no padrão (XX) XXXXX-XXXX conforme o usuário digita
function mascararTelefoneCoordenador(valor) {
  var d = String(valor || '').replace(/\D/g, '').substring(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2)  return '(' + d;
  if (d.length <= 6)  return '(' + d.slice(0,2) + ') ' + d.slice(2);
  if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
  return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
}

// Valida telefone: aceita vazio ou 11 dígitos completos
function telefoneCoordenadorValido(val) {
  var d = String(val || '').replace(/\D/g, '');
  return d.length === 0 || d.length === 11;
}

document.addEventListener('DOMContentLoaded', function() {

  // ── Auth guard ──────────────────────────────────────────────────────────
  if (!Auth.isAuthenticated()) {
    window.location.href = '../index.html';
    return;
  }
  const sessao = Auth.getUsuario();
  if (sessao.perfil !== 'coordenador') {
    window.location.href = '../index.html';
    return;
  }

  const coordId = sessao.id_usuario;

  // Restaura foto do cache local (exibição imediata enquanto o GET carrega)
  const fotoSalva = localStorage.getItem('fotoCoord');
  if (fotoSalva) {
    aplicarFotoCoord(fotoSalva);
    const btnRemover = document.getElementById('btnRemoverFoto');
    if (btnRemover) btnRemover.style.display = '';
  }

  let coordenador = {};
  let modoEdicao = false;

  // Busca os dados do coordenador logado via GET /usuarios/:id e preenche a tela
  async function carregarPerfil() {
    try {
      const data = await Auth.fetch('/usuarios/' + coordId);
      const c = data.coordenador || {};

      coordenador = {
        nome:     data.nome  || '',
        email:    data.email || '',
        telefone: c.telefone          || 'Não informado',
        cargo:    c.cargo             || 'Não informado',
        area:     c.area              || 'Não informado',
        admissao: c.data_admissao     || '',
        cidade:   c.cidade_nascimento || 'Não informado',
        estado:   c.estado_nascimento || 'Não informado'
      };

      // O banco é a fonte de verdade da foto: sincroniza o cache local e a tela com o que
      // está salvo no servidor (sem isso, limpar o navegador ou logar em outra máquina
      // perdia a foto, já que antes ela só existia em localStorage).
      if (data.foto_url) {
        try { localStorage.setItem('fotoCoord', data.foto_url); } catch (_) {}
        aplicarFotoCoord(data.foto_url);
      }

      preencherDados();
    } catch (error) {
      console.error('Erro ao carregar perfil do coordenador:', error);
    }
  }

  // Formata uma data ISO (YYYY-MM-DD ou com T) para o padrão DD/MM/YYYY
  function formatarData(dataStr) {
    if (!dataStr) return 'Não informada';
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length !== 3) return dataStr;
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  // Preenche todos os campos de exibição com os dados do objeto coordenador
  function preencherDados() {
    document.getElementById('coordNome').textContent     = coordenador.nome;
    document.getElementById('coordEmail').textContent    = coordenador.email;
    document.getElementById('coordTelefone').textContent = coordenador.telefone;
    document.getElementById('coordCargo').textContent    = coordenador.cargo;
    document.getElementById('coordArea').textContent     = coordenador.area;
    document.getElementById('coordAdmissao').textContent = formatarData(coordenador.admissao);
    document.getElementById('coordCidade').textContent   = coordenador.cidade;
    document.getElementById('coordEstado').textContent   = coordenador.estado;

    localStorage.setItem('nomeUsuario', coordenador.nome);
    const sidebarName = document.getElementById('nomeCoord');
    if (sidebarName) sidebarName.textContent = coordenador.nome;
  }

  const btnEditar   = document.getElementById('btnEditarCoord');
  const btnCancelar = document.getElementById('btnCancelarCoord');

  btnEditar.addEventListener('click', function() {
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
      var btnEditFoto = document.getElementById('btnEditarFoto');
      if (btnEditFoto) btnEditFoto.style.display = 'none';
      var btnRemFoto = document.getElementById('btnRemoverFoto');
      if (btnRemFoto) btnRemFoto.style.display = 'none';
      preencherDados();
    });
  }

  // Substitui os textos estáticos por inputs preenchidos com os valores atuais
  function entrarModoEdicao() {
    modoEdicao = true;
    btnEditar.textContent = 'Salvar Alterações';
    btnEditar.classList.remove('btn--outline', 'btn-verde');
    btnEditar.classList.add('btn--primary');
    if (btnCancelar) btnCancelar.style.display = '';

    var btnEditFoto = document.getElementById('btnEditarFoto');
    if (btnEditFoto) btnEditFoto.style.display = '';
    var perfilFotoEl = document.getElementById('perfilFoto');
    var btnRemFoto = document.getElementById('btnRemoverFoto');
    if (btnRemFoto && perfilFotoEl && !perfilFotoEl.src.includes('avatar')) {
      btnRemFoto.style.display = '';
    }

    const admissaoVal = coordenador.admissao ? coordenador.admissao.split('T')[0] : '';

    document.getElementById('coordNome').innerHTML     = inp('text',  'editNome',     coordenador.nome);
    document.getElementById('coordEmail').innerHTML    = inp('email', 'editEmail',    coordenador.email);
    document.getElementById('coordTelefone').innerHTML = inp('text',  'editTelefone', naoInfo(coordenador.telefone));
    document.getElementById('coordCargo').innerHTML    = inp('text',  'editCargo',    naoInfo(coordenador.cargo));
    document.getElementById('coordArea').innerHTML     = inp('text',  'editArea',     naoInfo(coordenador.area));
    document.getElementById('coordAdmissao').innerHTML = inp('date',  'editAdmissao', admissaoVal);
    document.getElementById('coordCidade').innerHTML   = inp('text',  'editCidade',   naoInfo(coordenador.cidade));
    document.getElementById('coordEstado').innerHTML   = inp('text',  'editEstado',   naoInfo(coordenador.estado));

    var nomeEl = document.getElementById('editNome');
    if (nomeEl) {
      nomeEl.addEventListener('input', function () {
        this.value = this.value
          .replace(/[0-9]/g, '')
          .replace(/(^|\s)(\S)/g, function (m, sp, c) { return sp + c.toUpperCase(); });
      });
    }

    var telEl = document.getElementById('editTelefone');
    if (telEl) {
      telEl.setAttribute('maxlength', '15');
      telEl.value = mascararTelefoneCoordenador(telEl.value);
      telEl.addEventListener('input', function () {
        this.value = mascararTelefoneCoordenador(this.value);
      });
    }

    ['editCargo', 'editArea', 'editCidade', 'editEstado'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', function () {
          this.value = this.value.replace(/[0-9]/g, '');
        });
      }
    });
  }

  // Gera a string HTML de um input genérico para uso no modo de edição.
  // Campos de data ganham max = hoje: são todos datas históricas (ex: admissão).
  function inp(type, id, value) {
    var maxAttr = type === 'date' ? ' max="' + new Date().toISOString().split('T')[0] + '"' : '';
    return '<input type="' + type + '" id="' + id + '" value="' + esc(value) + '"' + maxAttr + ' class="form-input-edit">';
  }

  // Escapa aspas duplas para uso seguro em atributos HTML
  function esc(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }

  // Retorna string vazia se o valor for um placeholder "Não informado"
  function naoInfo(val) {
    return (val === 'Não informado' || val === 'Não informada') ? '' : val;
  }

  // Coleta os dados dos inputs e envia via PUT /usuarios/:id; atualiza a tela em caso de sucesso
  async function salvarAlteracoes() {
    const dados = {
      nome:              document.getElementById('editNome').value,
      email:             document.getElementById('editEmail').value,
      telefone:          document.getElementById('editTelefone').value.trim(),
      cargo:             document.getElementById('editCargo').value,
      area:              document.getElementById('editArea').value,
      data_admissao:     document.getElementById('editAdmissao').value || null,
      cidade_nascimento: document.getElementById('editCidade').value,
      estado_nascimento: document.getElementById('editEstado').value
    };

    if (!telefoneCoordenadorValido(dados.telefone)) {
      alert('Telefone incompleto. Use (XX) XXXXX-XXXX.');
      return;
    }

    btnEditar.textContent = 'Salvando...';
    btnEditar.disabled = true;

    try {
      await Auth.fetch('/usuarios/' + coordId, {
        method: 'PUT',
        body: JSON.stringify(dados)
      });

      coordenador.nome     = dados.nome;
      coordenador.email    = dados.email;
      coordenador.telefone = dados.telefone || 'Não informado';
      coordenador.cargo    = dados.cargo    || 'Não informado';
      coordenador.area     = dados.area     || 'Não informado';
      coordenador.admissao = dados.data_admissao || '';
      coordenador.cidade   = dados.cidade_nascimento || 'Não informado';
      coordenador.estado   = dados.estado_nascimento || 'Não informado';

      modoEdicao = false;
      btnEditar.disabled = false;
      btnEditar.textContent = 'Editar Perfil';
      btnEditar.classList.remove('btn--primary');
      btnEditar.classList.add('btn-verde');
      if (btnCancelar) btnCancelar.style.display = 'none';
      var btnEditFoto = document.getElementById('btnEditarFoto');
      if (btnEditFoto) btnEditFoto.style.display = 'none';
      var btnRemFoto = document.getElementById('btnRemoverFoto');
      if (btnRemFoto) btnRemFoto.style.display = 'none';

      var sidebarAvatar = document.querySelector('.sidebar__avatar');
      var perfilFotoEl = document.getElementById('perfilFoto');
      if (sidebarAvatar && perfilFotoEl) sidebarAvatar.src = perfilFotoEl.src;

      preencherDados();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar alterações. Tente novamente.');
      btnEditar.disabled = false;
      btnEditar.textContent = 'Salvar Alterações';
    }
  }

  carregarPerfil();

});

// Aplica a foto informada ao avatar do perfil e da sidebar
function aplicarFotoCoord(src) {
  const perfilFoto = document.getElementById('perfilFoto');
  if (perfilFoto) perfilFoto.src = src;
  const sidebarAvatar = document.querySelector('.sidebar__avatar');
  if (sidebarAvatar) sidebarAvatar.src = src;
}

// Persiste a foto (ou remoção) do coordenador via PUT /usuarios/:id, sem exigir
// que o usuário entre no modo de edição e clique em "Salvar Alterações".
function salvarFotoCoordNoServidor(fotoUrl) {
  if (!Auth.isAuthenticated()) return;
  const coordId = Auth.getUsuario().id_usuario;
  Auth.fetch('/usuarios/' + coordId, {
    method: 'PUT',
    body: JSON.stringify({ foto_url: fotoUrl })
  }).catch(function () {
    alert('A foto foi atualizada na tela, mas não foi possível salvá-la no servidor. Tente novamente.');
  });
}

// Comprime a imagem selecionada (máx. 300px, JPEG 85%), aplica na tela, salva em
// localStorage (cache rápido entre páginas) e persiste no banco via PUT /usuarios/:id.
function previewFotoCoord(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const MAX = 300;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.85);

      try { localStorage.setItem('fotoCoord', compressed); } catch (_) {}
      aplicarFotoCoord(compressed);
      const btnRemover = document.getElementById('btnRemoverFoto');
      if (btnRemover) btnRemover.style.display = '';

      salvarFotoCoordNoServidor(compressed);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

// Remove a foto do coordenador do localStorage, restaura o avatar padrão e
// persiste a remoção no banco (foto_url = null) via PUT /usuarios/:id.
function limparFotoCoord() {
  localStorage.removeItem('fotoCoord');
  const perfilFoto = document.getElementById('perfilFoto');
  if (perfilFoto) perfilFoto.src = '../assets/avatar.png';
  const btnRemover = document.getElementById('btnRemoverFoto');
  if (btnRemover) btnRemover.style.display = 'none';

  salvarFotoCoordNoServidor(null);
}

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    Auth.clearSession();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
