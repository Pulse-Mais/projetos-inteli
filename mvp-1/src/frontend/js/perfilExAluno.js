function mascararTelefoneEx(valor) {
  var d = String(valor || '').replace(/\D/g, '').substring(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2)  return '(' + d;
  if (d.length <= 6)  return '(' + d.slice(0,2) + ') ' + d.slice(2);
  if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
  return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
}

function telefoneExValido(val) {
  var d = String(val || '').replace(/\D/g, '');
  return d.length === 0 || d.length === 11;
}

document.addEventListener('DOMContentLoaded', function () {

  // ID do ex-aluno logado (gravado no login); sem ID não há como buscar dados reais
  const idAluno = localStorage.getItem('idAluno');

  // Cache local dos campos profissionais: fallback enquanto a migration 002 não estiver aplicada,
  // para que edições já apareçam e persistam no navegador. Quando as colunas existirem,
  // o valor do banco tem precedência (ver normalizar()).
  const CACHE_KEY = 'perfilExtra_' + idAluno;

  let exAluno = {};
  let modoEdicao = false;

  const btnEditar = document.getElementById('btnEditarEx');
  const feedback  = document.getElementById('feedbackPerfil');

  if (!idAluno) {
    erro('Sessão não identificada. Faça login novamente.');
    if (btnEditar) btnEditar.disabled = true;
  } else {
    carregarPerfil();
  }

  // Busca os dados do perfil do ex-aluno via GET /alunos/:id/portal
  function carregarPerfil() {
    fetch('/alunos/' + idAluno + '/portal')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (dados) {
        exAluno = normalizar(dados);
        preencherDados();
      })
      .catch(function () {
        erro('Não foi possível carregar seus dados do servidor.');
        if (btnEditar) btnEditar.disabled = true;
      });
  }

  // Achata a resposta { ...aluno, usuario:{...} } em um objeto único de exibição.
  // Para campos profissionais, o valor do banco tem precedência; se a coluna
  // ainda não existir (migration pendente), usa o cache local.
  function normalizar(d) {
    const u = d.usuario || {};
    const cache = lerCache();
    const pick = function (dbVal, cacheVal) {
      return (dbVal !== undefined && dbVal !== null && dbVal !== '') ? dbVal : (cacheVal || '');
    };
    let disp;
    if (d.disponibilidade_mentoria === true) disp = 'Sim';
    else if (d.disponibilidade_mentoria === false) disp = 'Não';
    else disp = (cache.disponibilidade_mentoria === 'Sim' ? 'Sim' : 'Não');

    return {
      nome: u.nome || '',
      email: u.email || '',
      telefone: pick(d.telefone, cache.telefone),
      empresa_atual: pick(d.empresa_atual, cache.empresa_atual),
      cargo_atual: pick(d.cargo_atual, cache.cargo_atual),
      area_interesse: pick(d.area_interesse, cache.area_interesse),
      disponibilidade_mentoria: disp,
      data_formatura: d.data_formatura || ''
    };
  }

  // Lê o cache local de campos profissionais
  function lerCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  // Salva os campos profissionais no cache local para exibição imediata antes da migration
  function salvarCache(obj) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) { /* ignora */ }
  }

  // Preenche os campos de texto da tela com os dados do objeto exAluno
  function preencherDados() {
    setText('exNome', exAluno.nome);
    setText('exEmail', exAluno.email);
    setText('exTelefone', exAluno.telefone);
    setText('exCargo', exAluno.cargo_atual);
    setText('exEmpresa', exAluno.empresa_atual);
    setText('exArea', exAluno.area_interesse);
    setText('exMentoria', exAluno.disponibilidade_mentoria);
    setText('exFormatura', formatarData(exAluno.data_formatura));

    if (exAluno.nome) localStorage.setItem('nomeUsuario', exAluno.nome.split(' ')[0]);
  }

  // Alterna entre modo de visualização e modo de edição ao clicar no botão
  btnEditar.addEventListener('click', function () {
    if (!modoEdicao) entrarModoEdicao();
    else salvarAlteracoes();
  });

  // Substitui os textos estáticos por inputs editáveis com os valores atuais
  function entrarModoEdicao() {
    modoEdicao = true;
    limparFeedback();
    btnEditar.textContent = 'Salvar Alterações';

    setInput('exNome', 'editNome', exAluno.nome, 'text');
    setInput('exEmail', 'editEmail', exAluno.email, 'email');
    setInput('exTelefone', 'editTelefone', mascararTelefoneEx(exAluno.telefone), 'tel');
    setInput('exCargo', 'editCargo', exAluno.cargo_atual, 'text');
    setInput('exEmpresa', 'editEmpresa', exAluno.empresa_atual, 'text');
    setInput('exArea', 'editArea', exAluno.area_interesse, 'text');

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
      telEl.addEventListener('input', function () {
        this.value = mascararTelefoneEx(this.value);
      });
      telEl.addEventListener('blur', function () {
        if (!telefoneExValido(this.value)) {
          erro('Telefone incompleto. Use (XX) XXXXX-XXXX.');
        }
      });
    }

    const sel = exAluno.disponibilidade_mentoria === 'Sim' ? 'Sim' : 'Não';
    document.getElementById('exMentoria').innerHTML =
      '<select id="editMentoria" class="form-input-edit">' +
      '<option value="Sim"' + (sel === 'Sim' ? ' selected' : '') + '>Sim</option>' +
      '<option value="Não"' + (sel === 'Não' ? ' selected' : '') + '>Não</option>' +
      '</select>';

    // data_formatura permanece somente leitura (dado institucional)

    var btnEf = document.getElementById('btnEditarFoto');
    if (btnEf) btnEf.style.display = '';
    var fotoEl = document.getElementById('perfilFoto');
    var btnRf = document.getElementById('btnRemoverFoto');
    if (btnRf && fotoEl && !fotoEl.src.includes('avatar')) btnRf.style.display = '';
  }

  // Valida, envia via PUT /alunos/:id/portal e salva no cache local ao concluir
  function salvarAlteracoes() {
    const dados = {
      nome: valOf('editNome'),
      email: valOf('editEmail'),
      telefone: valOf('editTelefone'),
      cargo_atual: valOf('editCargo'),
      empresa_atual: valOf('editEmpresa'),
      area_interesse: valOf('editArea'),
      disponibilidade_mentoria: valOf('editMentoria') === 'Sim'
    };

    if (!dados.nome) { erro('O nome é obrigatório.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) { erro('Informe um e-mail válido.'); return; }
    if (!telefoneExValido(dados.telefone)) { erro('Telefone incompleto. Use (XX) XXXXX-XXXX.'); return; }

    btnEditar.disabled = true;
    btnEditar.textContent = 'Salvando...';

    fetch('/alunos/' + idAluno + '/portal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
      .then(function (r) {
        return r.json().then(function (body) { return { ok: r.ok, status: r.status, body: body }; });
      })
      .then(function (resp) {
        modoEdicao = false;
        btnEditar.textContent = 'Editar Perfil';
        var btnEf = document.getElementById('btnEditarFoto');
        if (btnEf) btnEf.style.display = 'none';
        var btnRf = document.getElementById('btnRemoverFoto');
        if (btnRf) btnRf.style.display = 'none';
        if (resp.ok) {
          // Guarda os campos profissionais no cache local como fallback antes da migration
          salvarCache({
            telefone: dados.telefone,
            empresa_atual: dados.empresa_atual,
            cargo_atual: dados.cargo_atual,
            area_interesse: dados.area_interesse,
            disponibilidade_mentoria: dados.disponibilidade_mentoria ? 'Sim' : 'Não'
          });
          carregarPerfil(); // recarrega para refletir exatamente o que foi gravado no banco
          var sidebarAvatar = document.querySelector('.sidebar__avatar');
          var perfilFotoEl = document.getElementById('perfilFoto');
          if (sidebarAvatar && perfilFotoEl) sidebarAvatar.src = perfilFotoEl.src;
          ok('Perfil atualizado com sucesso!');
        } else {
          preencherDados();
          erro(resp.body && resp.body.error ? resp.body.error : 'Erro ao salvar.');
        }
      })
      .catch(function () {
        modoEdicao = false;
        btnEditar.textContent = 'Editar Perfil';
        var btnEf = document.getElementById('btnEditarFoto');
        if (btnEf) btnEf.style.display = 'none';
        var btnRf = document.getElementById('btnRemoverFoto');
        if (btnRf) btnRf.style.display = 'none';
        preencherDados();
        erro('Erro de conexão com o servidor.');
      })
      .finally(function () {
        btnEditar.disabled = false;
      });
  }

  // Define o textContent de um elemento; exibe '—' quando o valor está vazio
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = (val === '' || val == null) ? '—' : val;
  }

  // Substitui o conteúdo de uma célula por um input com o valor atual
  function setInput(idCell, idInput, val, tipo) {
    const el = document.getElementById(idCell);
    if (el) el.innerHTML = '<input type="' + tipo + '" id="' + idInput + '" class="form-input-edit" value="' + escAttr(val || '') + '">';
  }

  // Retorna o valor trimado de um input pelo ID
  function valOf(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Escapa caracteres especiais para uso seguro em atributos HTML
  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // Exibe mensagem de sucesso em verde e a remove após 4 segundos
  function ok(msg) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = 'perfil-feedback perfil-feedback--ok';
    setTimeout(limparFeedback, 4000);
  }

  // Exibe mensagem de erro em vermelho
  function erro(msg) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = 'perfil-feedback perfil-feedback--erro';
  }

  // Remove a mensagem de feedback da tela
  function limparFeedback() {
    if (feedback) { feedback.textContent = ''; feedback.className = 'perfil-feedback'; }
  }

  // Formata data ISO para o padrão brasileiro DD/MM/YYYY
  function formatarData(isoDate) {
    if (!isoDate) return '—';
    const p = String(isoDate).split('T')[0].split('-');
    if (p.length !== 3) return isoDate;
    return p[2] + '/' + p[1] + '/' + p[0];
  }
});

// Comprime a foto selecionada (máx. 400px, JPEG 85%), aplica o preview local (via
// localStorage + avatarShared.js) e persiste no banco via PUT /alunos/:id/portal.
// Sem o PUT, a foto nunca refletia na listagem de ex-alunos do coordenador — ficava
// só no localStorage deste navegador.
function previewFoto(input) {
  if (!input.files || !input.files[0]) return;

  const idAluno = localStorage.getItem('idAluno');
  const feedback = document.getElementById('feedbackPerfil');
  const reader = new FileReader();

  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const MAX = 400;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64Foto = canvas.toDataURL('image/jpeg', 0.85);

      try { localStorage.setItem('fotoUsuario', base64Foto); } catch (err) { /* ignora */ }
      if (typeof window.aplicarFotoUsuario === 'function') {
        window.aplicarFotoUsuario();
      } else {
        const foto = document.getElementById('perfilFoto');
        if (foto) foto.src = base64Foto;
      }

      if (!idAluno) return;

      fetch('/alunos/' + idAluno + '/portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_url: base64Foto })
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || b.message || 'Erro ao salvar foto'); });
        })
        .then(function () {
          if (!feedback) return;
          feedback.textContent = 'Foto atualizada com sucesso!';
          feedback.className = 'perfil-feedback perfil-feedback--ok';
          setTimeout(function () { feedback.textContent = ''; feedback.className = 'perfil-feedback'; }, 4000);
        })
        .catch(function (err) {
          if (!feedback) return;
          feedback.textContent = 'A foto foi pré-visualizada, mas não foi salva no servidor: ' + err.message;
          feedback.className = 'perfil-feedback perfil-feedback--erro';
        });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

// Remove a foto de perfil: limpa o cache local, restaura o avatar padrão em todas
// as telas (sidebar + card) e persiste a remoção no banco via PUT /alunos/:id/portal.
function limparFotoExAluno() {
  if (!confirm('Remover sua foto de perfil?')) return;

  const idAluno = localStorage.getItem('idAluno');
  const feedback = document.getElementById('feedbackPerfil');
  const avatarPadrao = '/assets/images/avatar.png';

  localStorage.removeItem('fotoUsuario');
  var perfilFotoEl = document.getElementById('perfilFoto');
  if (perfilFotoEl) perfilFotoEl.src = avatarPadrao;

  if (!idAluno) return;

  fetch('/alunos/' + idAluno + '/portal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foto_url: null })
  })
    .then(function (r) {
      if (!r.ok) return r.json().then(function (b) { throw new Error(b.error || b.message || 'Erro ao remover foto'); });
    })
    .then(function () {
      if (!feedback) return;
      feedback.textContent = 'Foto removida com sucesso!';
      feedback.className = 'perfil-feedback perfil-feedback--ok';
      setTimeout(function () { feedback.textContent = ''; feedback.className = 'perfil-feedback'; }, 4000);
    })
    .catch(function (err) {
      if (!feedback) return;
      feedback.textContent = 'A foto foi removida na tela, mas não foi removida no servidor: ' + err.message;
      feedback.className = 'perfil-feedback perfil-feedback--erro';
    });
}

// Remove a sessão do usuário e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    ['pulsemais_token', 'pulsemais_usuario', 'nomeUsuario', 'perfilUsuario', 'idAluno', 'usuarioId', 'emailUsuario']
      .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = '../index.html';
  }
}
