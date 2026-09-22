/* cadastrarMentorGestao.js */
const USE_MOCK = false;

/* ── mock ── */
async function mockCriarMentor(body) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (body.email === 'erro@teste.com') {
        const err = new Error('E-mail já cadastrado');
        err.status = 400;
        return reject(err);
      }
      resolve({ id: 99, ...body, perfil: 'Mentor' });
    }, 600);
  });
}

/* ── camada de dados ── */
async function criarMentor(body) {
  if (USE_MOCK) return mockCriarMentor(body);
  return window.api.post('/usuarios', { body, auth: true });
}

/* ── validação ── */
const REGRAS = {
  fieldNome(val) {
    if (!val.trim()) return 'Informe o nome completo.';
    if (val.trim().length < 3) return 'Nome deve ter ao menos 3 caracteres.';
    return null;
  },
  fieldEmail(val) {
    if (!val.trim()) return 'Informe o e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'E-mail inválido.';
    return null;
  },
  fieldSenha(val) {
    if (!val) return 'Informe a senha temporária.';
    if (val.length < 8) return 'A senha deve ter no mínimo 8 caracteres (RN07).';
    return null;
  },
  fieldArea() {
    return null;
  },
};

function validarCampo(id) {
  const el  = document.getElementById(id);
  const err = document.getElementById('err' + id.replace('field', ''));
  const msg = REGRAS[id]?.(el.value);

  if (msg) {
    el.classList.add('error');
    err.textContent = msg;
    err.hidden = false;
  } else {
    el.classList.remove('error');
    err.hidden = true;
  }

  return !msg;
}

function validarTudo() {
  const campos = ['fieldNome', 'fieldEmail', 'fieldSenha', 'fieldArea'];
  return campos.map(validarCampo).every(Boolean);
}

function limparErros() {
  ['fieldNome', 'fieldEmail', 'fieldSenha', 'fieldArea'].forEach(id => {
    document.getElementById(id).classList.remove('error');
  });
  ['errNome', 'errEmail', 'errSenha', 'errArea'].forEach(id => {
    const el = document.getElementById(id);
    el.hidden = true;
    el.textContent = '';
  });
}

/* ── banners ── */
function mostrarSucesso(msg) {
  const el = document.getElementById('bannerSucesso');
  document.getElementById('bannerSucessoMsg').textContent = msg;
  el.hidden = false;
  document.getElementById('bannerErro').hidden = true;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function mostrarErro(msg) {
  const el = document.getElementById('bannerErro');
  document.getElementById('bannerErroMsg').textContent = msg;
  el.hidden = false;
  document.getElementById('bannerSucesso').hidden = true;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarBanners() {
  document.getElementById('bannerSucesso').hidden = true;
  document.getElementById('bannerErro').hidden = true;
}

/* ── reset do form ── */
function resetarForm() {
  document.getElementById('formMentor').reset();
  limparErros();
  ocultarBanners();
}

/* ── toggle senha ── */
document.getElementById('btnToggleSenha').addEventListener('click', () => {
  const input  = document.getElementById('fieldSenha');
  const icone  = document.getElementById('iconeSenha');
  const visivel = input.type === 'text';
  input.type = visivel ? 'password' : 'text';
  icone.setAttribute('data-lucide', visivel ? 'eye' : 'eye-off');
  lucide.createIcons();
});

/* ── validação no blur ── */
['fieldNome', 'fieldEmail', 'fieldSenha'].forEach(id => {
  document.getElementById(id).addEventListener('blur', () => validarCampo(id));
});

/* ── limpar ── */
document.getElementById('btnLimpar').addEventListener('click', resetarForm);

/* ── submit ── */
document.getElementById('formMentor').addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarBanners();

  if (!validarTudo()) return;

  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.disabled = true;

  const body = {
    nome:   document.getElementById('fieldNome').value.trim(),
    email:  document.getElementById('fieldEmail').value.trim(),
    senha:  document.getElementById('fieldSenha').value,
    perfil: 'Mentor',
    cargo:  document.getElementById('fieldArea').value.trim() || undefined,
  };

  try {
    await criarMentor(body);
    resetarForm();
    mostrarSucesso(`Mentor "${body.nome}" cadastrado com sucesso.`);
    carregarMentores();
  } catch (err) {
    if (err.status === 403) {
      mostrarErro('Você não tem permissão para cadastrar mentores.');
    } else if (err.status === 400) {
      mostrarErro(err.message ?? 'Dados inválidos. Verifique os campos e tente novamente.');
    } else {
      mostrarErro(err.message ?? 'Erro ao cadastrar mentor. Tente novamente.');
    }
  } finally {
    btnSalvar.disabled = false;
  }
});

/* ══════════════════════════════════════════
   LISTAGEM DE MENTORES
   ══════════════════════════════════════════ */

let mentores    = [];
let filtroAtivo = '';

async function carregarMentores() {
  mostrarEstado('loading');
  try {
    const params = { perfil: 'Mentor' };
    if (filtroAtivo !== '') params.ativo = filtroAtivo;
    mentores = await window.api.get('/usuarios', { params, auth: true }) ?? [];
    renderMentores();
  } catch (err) {
    document.getElementById('stateErrorMsg').textContent =
      err.message ?? 'Erro ao carregar mentores.';
    mostrarEstado('error');
  }
}

function mostrarEstado(estado) {
  document.getElementById('stateLoading').hidden = estado !== 'loading';
  document.getElementById('stateError').hidden   = estado !== 'error';
  document.getElementById('stateEmpty').hidden   = estado !== 'empty';
  if (estado !== 'empty') document.getElementById('mentoresGrid').innerHTML = '';
}

function renderMentores() {
  const grid = document.getElementById('mentoresGrid');

  if (!mentores.length) {
    mostrarEstado('empty');
    atualizarContador(0);
    return;
  }

  mostrarEstado(null);
  grid.innerHTML = mentores.map(renderCard).join('');

  mentores.forEach(m => {
    const card = grid.querySelector(`[data-id="${m.id}"]`);
    if (!card) return;
    const avatarEl = card.querySelector('.mentor-avatar');
    if (avatarEl) window.avatar.render(avatarEl, m.foto_url || null, m.nome);
  });

  atualizarContador(mentores.length);
  lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
}

function renderCard(m) {
  const area = m.cargo ? `
    <div class="mentor-card-area">
      <i data-lucide="briefcase"></i>
      <span>${esc(m.cargo)}</span>
    </div>` : '';
  const statusBadge = m.ativo !== false
    ? '<span class="badge badge-success">Ativo</span>'
    : '<span class="badge badge-error">Inativo</span>';

  return `
    <div class="mentor-card${m.ativo === false ? ' mentor-card--inativo' : ''}" data-id="${m.id}">
      <div class="mentor-card-header">
        <div class="mentor-avatar"></div>
        <div class="mentor-card-info">
          <div class="mentor-card-nome">${esc(m.nome ?? '—')}</div>
          <div class="mentor-card-email">${esc(m.email ?? '—')}</div>
        </div>
        ${statusBadge}
      </div>
      ${area}
      <div class="mentor-card-actions">
        <button class="btn btn-secondary btn-sm" data-action="editar" data-id="${m.id}" title="Editar mentor">
          <i data-lucide="pencil"></i> Editar
        </button>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   EDIÇÃO DE MENTOR
   ══════════════════════════════════════════ */
let mentorEmEdicao = null;

function abrirModal(mentor) {
  mentorEmEdicao = mentor;

  document.getElementById('editNome').value  = mentor.nome  ?? '';
  document.getElementById('editEmail').value = mentor.email ?? '';
  document.getElementById('editArea').value  = mentor.cargo ?? '';

  // ajusta botão de status
  const ativo = mentor.ativo !== false;
  document.getElementById('textoStatus').textContent    = ativo ? 'Desativar' : 'Reativar';
  document.getElementById('iconeStatus').setAttribute('data-lucide', ativo ? 'user-x' : 'user-check');
  document.getElementById('modalStatusLabel').textContent =
    `Mentor está ${ativo ? 'ativo' : 'inativo'}`;
  document.getElementById('btnAlterarStatus').className =
    `btn btn-secondary btn-status-toggle${ativo ? ' btn-status-danger' : ''}`;

  ocultarModalErro();
  document.getElementById('modalEditarMentor').classList.add('active');
  lucide.createIcons();
}

function fecharModal() {
  document.getElementById('modalEditarMentor').classList.remove('active');
  mentorEmEdicao = null;
}

function ocultarModalErro() {
  document.getElementById('modalBannerErro').hidden = true;
}

function mostrarModalErro(msg) {
  const el = document.getElementById('modalBannerErro');
  document.getElementById('modalBannerErroMsg').textContent = msg;
  el.hidden = false;
}

async function salvarEdicao() {
  if (!mentorEmEdicao) return;

  const nome  = document.getElementById('editNome').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const cargo = document.getElementById('editArea').value.trim();

  // validação mínima
  if (!nome) {
    document.getElementById('editErrNome').textContent = 'Informe o nome.';
    document.getElementById('editErrNome').hidden = false;
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('editErrEmail').textContent = 'E-mail inválido.';
    document.getElementById('editErrEmail').hidden = false;
    return;
  }
  document.getElementById('editErrNome').hidden  = true;
  document.getElementById('editErrEmail').hidden = true;

  const btnSalvar = document.getElementById('modalEditarSalvar');
  btnSalvar.disabled = true;
  ocultarModalErro();

  try {
    await window.api.put(`/usuarios/${mentorEmEdicao.id}`, {
      body: { nome, email, cargo: cargo || undefined },
      auth: true,
    });
    fecharModal();
    carregarMentores();
  } catch (err) {
    mostrarModalErro(err.message ?? 'Erro ao salvar. Tente novamente.');
  } finally {
    btnSalvar.disabled = false;
  }
}

async function alterarStatus() {
  if (!mentorEmEdicao) return;

  const ativo  = mentorEmEdicao.ativo !== false;
  const rota   = ativo ? 'desativar' : 'reativar';
  const btnAlt = document.getElementById('btnAlterarStatus');
  btnAlt.disabled = true;
  ocultarModalErro();

  try {
    await window.api.patch(`/usuarios/${mentorEmEdicao.id}/${rota}`, { auth: true });
    fecharModal();
    carregarMentores();
  } catch (err) {
    mostrarModalErro(err.message ?? 'Erro ao alterar status.');
    btnAlt.disabled = false;
  }
}

// delegation: clique no botão Editar de cada card
document.getElementById('mentoresGrid').addEventListener('click', e => {
  const btn = e.target.closest('[data-action="editar"]');
  if (!btn) return;
  const id      = Number(btn.dataset.id);
  const mentor  = mentores.find(m => m.id === id);
  if (mentor) abrirModal(mentor);
});

document.getElementById('modalEditarFechar').addEventListener('click',   fecharModal);
document.getElementById('modalEditarCancelar').addEventListener('click',  fecharModal);
document.getElementById('modalEditarSalvar').addEventListener('click',    salvarEdicao);
document.getElementById('btnAlterarStatus').addEventListener('click',     alterarStatus);

// fecha ao clicar fora
document.getElementById('modalEditarMentor').addEventListener('click', e => {
  if (e.target === e.currentTarget) fecharModal();
});

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function atualizarContador(n) {
  document.getElementById('countBadge').textContent =
    `${n} mentor${n !== 1 ? 'es' : ''}`;
}

document.getElementById('filterAtivo').addEventListener('change', e => {
  filtroAtivo = e.target.value;
  carregarMentores();
});

document.getElementById('btnTentarNovamente').addEventListener('click', carregarMentores);

/* ── init ── */
lucide.createIcons();
carregarMentores();
