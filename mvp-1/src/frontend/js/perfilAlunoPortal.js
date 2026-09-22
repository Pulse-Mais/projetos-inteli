// Visualização e edição do perfil no Portal do Aluno.
// Leitura:  GET /alunos/:id/portal
// Escrita:  PUT /alunos/:id/portal
// Campos editáveis: nome, email, telefone, status_profissional
// Somente-leitura:  programa_ingresso, data_ingresso (RN09)
// Depende de: auth.js, portalAluno.js (carregados antes)

document.addEventListener('DOMContentLoaded', function () {

  const btnSalvar = document.getElementById('btnSalvar');
  const btnCancel = document.getElementById('btnCancelar');
  const btnEditar = document.getElementById('btnEditarPerfil');

  const usuario = Auth.getUsuario();
  const idAluno = usuario ? usuario.id_usuario : localStorage.getItem('idAluno');

  if (!idAluno) {
    window.location.href = '../index.html';
    return;
  }

  let dadosOriginais = {};

  const inputTel = document.getElementById('portalInputTelefone');
  if (inputTel) {
    inputTel.setAttribute('maxlength', '15');
    inputTel.addEventListener('input', function () {
      this.value = mascaraTelefone(this.value);
    });
    inputTel.addEventListener('blur', function () {
      if (!telefoneValido(this.value)) {
        mostrarFeedback('erro', 'Telefone incompleto. Use (XX) XXXXX-XXXX.');
      }
    });
  }

  const inputNome = document.getElementById('portalInputNome');
  if (inputNome) {
    inputNome.addEventListener('input', function () {
      this.value = this.value
        .replace(/[0-9]/g, '')
        .replace(/(^|\s)(\S)/g, function (m, sp, c) { return sp + c.toUpperCase(); });
    });
  }

  Auth.fetch('/alunos/' + idAluno + '/portal')
    .then(function (dados) {
      if (!dados) return;
      const u = dados.usuario || {};
      const aluno = {
        nome:                u.nome                    || '',
        email:               u.email                   || '',
        telefone:            dados.telefone            || '',
        endereco:            dados.endereco            || '',
        status_profissional: dados.status_profissional || '',
        programa_ingresso:   dados.programa_ingresso   || '',
        data_ingresso:       dados.data_ingresso       || '',
      };
      dadosOriginais = Object.assign({}, aluno);
      preencherView(aluno);
      preencherFormulario(aluno);

      if (u.foto_url) {
        const foto = document.getElementById('portalFoto');
        if (foto) foto.src = u.foto_url;
        document.querySelectorAll('.sidebar__avatar').forEach(function (el) { el.src = u.foto_url; });
        const btnRemover = document.getElementById('btnRemoverFoto');
        if (btnRemover) btnRemover.style.display = '';
        try { localStorage.setItem('fotoPerfil', u.foto_url); } catch (_) {}
      }
    })
    .catch(function (err) {
      console.error('Erro ao carregar perfil:', err);
      mostrarFeedback('erro', 'Não foi possível carregar seus dados. Tente novamente.');
    });

  btnEditar.addEventListener('click', function () {
    preencherFormulario(dadosOriginais);
    entrarModoEdicao();
  });

  btnCancel.addEventListener('click', function () {
    sairModoEdicao();
    ocultarFeedbacks();
  });

  btnSalvar.addEventListener('click', function () {
    if (!validarFormulario()) return;

    const statusVal = document.getElementById('portalInputStatus').value;
    const payload = {
      nome:                document.getElementById('portalInputNome').value.trim(),
      email:               document.getElementById('portalInputEmail').value.trim(),
      telefone:            document.getElementById('portalInputTelefone').value.trim(),
      status_profissional: statusVal || undefined,
    };

    btnSalvar.textContent = 'Salvando...';
    btnSalvar.disabled = true;

    Auth.fetch('/alunos/' + idAluno + '/portal', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
      .then(function (resp) {
        if (!resp) return;
        const u = resp.usuario || resp;
        const atualizado = {
          nome:                resp.nome  || u.nome  || payload.nome,
          email:               resp.email || u.email || payload.email,
          telefone:            payload.telefone,
          endereco:            dadosOriginais.endereco,
          status_profissional: payload.status_profissional || dadosOriginais.status_profissional,
          programa_ingresso:   dadosOriginais.programa_ingresso,
          data_ingresso:       dadosOriginais.data_ingresso,
        };
        dadosOriginais = Object.assign({}, atualizado);
        preencherView(atualizado);

        const sessao = Auth.getUsuario();
        if (sessao) {
          sessao.nome = payload.nome;
          Auth.setSession(sessao);
        }

        sairModoEdicao();
        mostrarFeedback('sucesso');
      })
      .catch(function (err) {
        mostrarFeedback('erro', err.message || 'Erro ao salvar. Tente novamente.');
      })
      .finally(function () {
        btnSalvar.innerHTML =
          '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' +
          '</svg> Salvar Alterações';
        btnSalvar.disabled = false;
      });
  });

  // Volta para visualização: mostra <p>, esconde inputs e erros, troca footer
  function sairModoEdicao() {
    document.querySelectorAll('.campo-view').forEach(function (el) { el.style.display = ''; });
    document.querySelectorAll('.campo-edit').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.form-erro').forEach(function (el) { el.textContent = ''; el.style.display = 'none'; });
    show('view-footer');
    hide('edit-footer');
    var btnEf = document.getElementById('btnEditarFoto');
    if (btnEf) btnEf.style.display = 'none';
    var btnRf = document.getElementById('btnRemoverFoto');
    if (btnRf) btnRf.style.display = 'none';
  }

  // Entra em edição: esconde <p>, mostra inputs, troca footer
  function entrarModoEdicao() {
    document.querySelectorAll('.campo-view').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.campo-edit').forEach(function (el) { el.style.display = ''; });
    hide('view-footer');
    show('edit-footer');
    var btnEf = document.getElementById('btnEditarFoto');
    if (btnEf) btnEf.style.display = '';
    var fotoEl = document.getElementById('portalFoto');
    var btnRf = document.getElementById('btnRemoverFoto');
    if (btnRf && fotoEl && !fotoEl.src.includes('avatar')) btnRf.style.display = '';
  }

  // Preenche os cards de visualização com os dados do aluno
  function preencherView(aluno) {
    setText('viewNome',      aluno.nome);
    setText('viewEmail',     aluno.email);
    setText('viewTelefone',  aluno.telefone || '—');
    setText('viewEndereco',  aluno.endereco || '—');
    setText('viewStatus',    aluno.status_profissional || '—');
    setText('portalRoPrograma', aluno.programa_ingresso);
    setText('portalRoIngresso', formatarData(aluno.data_ingresso));
  }

  // Preenche os inputs do formulário de edição
  function preencherFormulario(aluno) {
    setValue('portalInputNome',     aluno.nome);
    setValue('portalInputEmail',    aluno.email);
    setValue('portalInputTelefone', aluno.telefone);
    setValue('portalInputEndereco', aluno.endereco || '');
    setSelectValue('portalInputStatus', aluno.status_profissional);
  }

  function validarFormulario() {
    let valido = true;
    const erroNome  = document.getElementById('erroNome');
    const erroEmail = document.getElementById('erroEmail');
    if (erroNome)  erroNome.textContent  = '';
    if (erroEmail) erroEmail.textContent = '';

    const nome  = document.getElementById('portalInputNome').value.trim();
    const email = document.getElementById('portalInputEmail').value.trim();
    const tel   = document.getElementById('portalInputTelefone')
      ? document.getElementById('portalInputTelefone').value : '';

    if (!nome) {
      if (erroNome) { erroNome.textContent = 'O nome é obrigatório.'; erroNome.style.display = 'block'; }
      valido = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (erroEmail) { erroEmail.textContent = 'Informe um e-mail válido.'; erroEmail.style.display = 'block'; }
      valido = false;
    }
    if (!telefoneValido(tel)) {
      mostrarFeedback('erro', 'Telefone incompleto. Use (XX) XXXXX-XXXX.');
      valido = false;
    }
    return valido;
  }

  function mostrarFeedback(tipo, msg) {
    ocultarFeedbacks();
    if (tipo === 'sucesso') {
      const el = document.getElementById('feedbackSucesso');
      if (el) {
        el.style.display = 'flex';
        setTimeout(function () { el.style.display = 'none'; }, 4000);
      }
    } else {
      const elErro = document.getElementById('feedbackErro');
      const elMsg  = document.getElementById('feedbackErroMsg');
      if (elErro) {
        if (elMsg) elMsg.textContent = msg || 'Erro ao salvar.';
        elErro.style.display = 'flex';
      }
    }
  }

  function ocultarFeedbacks() {
    ['feedbackSucesso', 'feedbackErro'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function setSelectValue(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    Array.from(el.options).forEach(opt => { opt.selected = opt.value === val; });
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  }

});

function formatarData(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function telefoneValido(val) {
  var d = String(val || '').replace(/\D/g, '');
  return d.length === 0 || d.length === 11;
}

function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').substring(0, 11);
  if (d.length === 0)  return '';
  if (d.length <= 2)   return '(' + d;
  if (d.length <= 6)   return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length <= 10)  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

function previewFoto(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const max = 300;
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * max / w); w = max; }
      else       { w = Math.round(w * max / h); h = max; }
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const foto = document.getElementById('portalFoto');
      if (foto) foto.src = dataUrl;

      document.querySelectorAll('.sidebar__avatar').forEach(function (el) {
        el.src = dataUrl;
      });

      const btnRemover = document.getElementById('btnRemoverFoto');
      if (btnRemover) btnRemover.style.display = '';

      try { localStorage.setItem('fotoPerfil', dataUrl); } catch (_) {}

      const u = Auth.getUsuario();
      const id = u ? u.id_usuario : localStorage.getItem('idAluno');
      if (id) {
        Auth.fetch('/alunos/' + id + '/portal', {
          method: 'PUT',
          body: JSON.stringify({ foto_url: dataUrl }),
        }).catch(function () {});
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function limparFotoAluno() {
  localStorage.removeItem('fotoPerfil');
  const avatar = '/assets/avatar.png';

  const foto = document.getElementById('portalFoto');
  if (foto) foto.src = avatar;

  document.querySelectorAll('.sidebar__avatar').forEach(function (el) {
    el.src = avatar;
  });

  const btnRemover = document.getElementById('btnRemoverFoto');
  if (btnRemover) btnRemover.style.display = 'none';

  const u = Auth.getUsuario();
  const id = u ? u.id_usuario : localStorage.getItem('idAluno');
  if (id) {
    Auth.fetch('/alunos/' + id + '/portal', {
      method: 'PUT',
      body: JSON.stringify({ foto_url: null }),
    }).catch(function () {});
  }
}
