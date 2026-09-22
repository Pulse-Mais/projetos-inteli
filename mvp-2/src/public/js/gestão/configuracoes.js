/* ============================================================
   configuracoes.js — Lógica da Tela de Configurações (Gestão)
   Pulse Mais · Módulo 1AMD2
   Depende de: lucide (CDN), api.js, main.js
   ============================================================ */

const PERFIL_LABEL = {
  GestaoGeral: 'Gestão Geral',
  Coordenacao: 'Coordenação',
  Assistente:  'Assistente',
  Mentor:      'Mentor(a)',
  Aluno:       'Jovem',
};

function maskTelefone(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6)  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  return partes.length >= 2
    ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    : (partes[0]?.[0] || '?').toUpperCase();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success', durationMs = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast is-${type}`;
  toast.innerHTML = `<i data-lucide="${icons[type] ?? 'info'}" style="width:18px;height:18px;flex-shrink:0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, durationMs);
}

// ── Modal de confirmação ───────────────────────────────────────────────────────
function showConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  const backdrop  = document.getElementById('confirmBackdrop');
  const iconEl    = document.getElementById('confirmIcon');
  const titleEl   = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  const okBtn     = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');

  if (!backdrop) { if (confirm(message)) onConfirm(); else if (onCancel) onCancel(); return; }

  iconEl.className   = `confirm-icon ${danger ? 'is-danger' : 'is-warning'}`;
  iconEl.innerHTML   = danger
    ? '<i data-lucide="trash-2" style="width:24px;height:24px"></i>'
    : '<i data-lucide="log-out" style="width:24px;height:24px"></i>';
  titleEl.textContent   = title;
  messageEl.textContent = message;
  okBtn.textContent     = confirmLabel;
  okBtn.className       = danger ? 'btn btn-danger' : 'btn btn-primary';

  backdrop.hidden = false;
  if (window.lucide) lucide.createIcons();

  function close() { backdrop.hidden = true; cleanup(); }
  function handleOk() { close(); onConfirm(); }
  function handleCancel() { close(); if (onCancel) onCancel(); }
  function handleKey(e) { if (e.key === 'Escape') { close(); if (onCancel) onCancel(); } }
  function handleBackdrop(e) { if (e.target === backdrop) { close(); if (onCancel) onCancel(); } }

  function cleanup() {
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', handleCancel);
    document.removeEventListener('keydown', handleKey);
    backdrop.removeEventListener('click', handleBackdrop);
  }

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', handleCancel);
  document.addEventListener('keydown', handleKey);
  backdrop.addEventListener('click', handleBackdrop);
}

// ── Avatar: exibe imagem ou iniciais ─────────────────────────────────────────
function exibirAvatar(fotoUrl, nome) {
  const circle = document.getElementById('avatarCircle');
  if (!circle) return;
  if (fotoUrl) {
    circle.innerHTML = '';
    circle.textContent = '';
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = 'Foto de perfil';
    img.className = 'avatar-circle__img';
    circle.appendChild(img);
  } else {
    circle.innerHTML = '';
    circle.textContent = iniciais(nome);
  }
  atualizarAvatarHeader(fotoUrl);
}

function atualizarAvatarHeader(fotoUrl) {
  const headerAvatar = document.querySelector('.avatar-trigger .avatar');
  if (!headerAvatar) return;
  if (fotoUrl) {
    headerAvatar.innerHTML = `<img src="${fotoUrl}" alt="Foto" class="avatar__img" />`;
  } else {
    headerAvatar.innerHTML = '<i data-lucide="user" style="width:18px;height:18px;stroke-width:2"></i>';
    if (window.lucide) lucide.createIcons();
  }
  const usuario = window.api.getUser() || {};
  usuario.foto_url = fotoUrl || null;
  window.api.setUser(usuario);
}

// ── Preenche Conta & Perfil com dados do usuário logado ───────────────────────
async function preencherContaPerfil() {
  try {
    const me = await window.api.get('/me', { auth: true });

    const cargo = me.cargo || PERFIL_LABEL[me.perfil] || '—';

    exibirAvatar(me.foto_url, me.nome);
    document.getElementById('avatarName').textContent   = me.nome || '—';
    document.getElementById('avatarMeta').textContent   = `${cargo} · ${me.email || ''}`;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    set('nomeCompleto', me.nome);
    set('cargo', cargo);
    set('email', me.email);
    set('telefone', maskTelefone(me.telefone));
  } catch (e) {
    /* dados indisponíveis — campos ficam vazios */
  }
}

// ── Salvar Conta & Perfil ─────────────────────────────────────────────────────
function configurarSalvarPerfil() {
  const btn = document.getElementById('btnSalvarPerfil');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const dados = {
      nome:     document.getElementById('nomeCompleto').value.trim(),
      cargo:    document.getElementById('cargo').value.trim(),
      email:    document.getElementById('email').value.trim(),
      telefone: document.getElementById('telefone').value.replace(/\D/g, '') || null,
    };

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      const atualizado = await window.api.put('/me', { body: dados, auth: true });

      const nome = atualizado.nome || dados.nome;
      exibirAvatar(atualizado.foto_url, nome);
      document.getElementById('avatarName').textContent = nome;

      showToast('Perfil atualizado com sucesso!');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || `Erro ao salvar: ${err.message}`;
      showToast(msg, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}

// ── Foto de perfil ───────────────────────────────────────────────────────────
function redimensionarImagem(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
        else       { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function configurarFotoPerfil() {
  const btnTrocar  = document.getElementById('btnTrocarFoto');
  const btnRemover = document.getElementById('btnRemoverFoto');
  const inputFile  = document.getElementById('inputFotoPerfil');
  if (!btnTrocar || !inputFile) return;

  btnTrocar.addEventListener('click', () => inputFile.click());

  inputFile.addEventListener('change', async () => {
    const file = inputFile.files[0];
    inputFile.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selecione um arquivo de imagem (PNG, JPG ou WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5 MB.', 'error');
      return;
    }

    btnTrocar.disabled = true;
    btnTrocar.textContent = 'Enviando...';

    try {
      const base64 = await redimensionarImagem(file);
      const atualizado = await window.api.put('/me', { body: { foto_url: base64 }, auth: true });
      exibirAvatar(atualizado.foto_url || base64, document.getElementById('nomeCompleto').value);
      showToast('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao enviar a foto.';
      showToast(msg, 'error');
    } finally {
      btnTrocar.disabled = false;
      btnTrocar.textContent = 'Trocar foto';
    }
  });

  if (btnRemover) {
    btnRemover.addEventListener('click', async () => {
      btnRemover.disabled = true;
      btnRemover.textContent = 'Removendo...';

      try {
        await window.api.put('/me', { body: { foto_url: null }, auth: true });
        exibirAvatar(null, document.getElementById('nomeCompleto').value);
        showToast('Foto de perfil removida.');
      } catch (err) {
        const msg = err?.data?.message || err?.data?.error || 'Erro ao remover a foto.';
        showToast(msg, 'error');
      } finally {
        btnRemover.disabled = false;
        btnRemover.textContent = 'Remover';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {

  if (typeof lucide !== 'undefined') lucide.createIcons();

  preencherContaPerfil();
  configurarSalvarPerfil();
  configurarFotoPerfil();

  // ── Aparência: tema ──
  function aplicarTemaUI() {
    // Apenas o tema claro está disponível; "Escuro" e "Sistema" estão desabilitados.
    let tema = 'light';
    try { tema = localStorage.getItem('pulsar-theme') ?? 'light'; } catch {}
    const radio = document.querySelector(`input[name="tema"][value="${tema}"]:not([disabled])`);
    (radio || document.getElementById('temaClaro')).checked = true;
  }

  aplicarTemaUI();

  document.querySelectorAll('input[name="tema"]').forEach(radio => {
    radio.addEventListener('change', () => {
      try { localStorage.setItem('pulsar-theme', radio.value); } catch {}
    });
  });

  // ── Nav lateral de configurações ──
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      const section = this.dataset.section;
      document.querySelectorAll('.settings-section').forEach(s => {
        s.classList.toggle('active', s.dataset.section === section);
      });
    });
  });

  // ── Segurança: alterar senha ──
  const formSenha     = document.getElementById('formAlterarSenha');
  const btnSalvarSenha = document.getElementById('btnSalvarSenha');

  function showSenhaFeedback(msg, type) {
    const el = document.getElementById('senhaFeedback');
    if (!el) return;
    el.hidden = false;
    el.className = `settings-feedback is-${type}`;
    el.textContent = msg;
    if (type === 'success') setTimeout(() => { el.hidden = true; }, 4000);
  }

  function limparFormSenha() {
    ['senhaAtual', 'senhaNova', 'senhaConfirma'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fb = document.getElementById('senhaFeedback');
    if (fb) fb.hidden = true;
  }

  if (formSenha) {
    formSenha.addEventListener('submit', async (e) => {
      e.preventDefault();
      const atual    = document.getElementById('senhaAtual').value;
      const nova     = document.getElementById('senhaNova').value;
      const confirma = document.getElementById('senhaConfirma').value;

      if (!atual || !nova || !confirma) {
        showSenhaFeedback('Preencha todos os campos de senha.', 'error'); return;
      }
      if (nova !== confirma) {
        showSenhaFeedback('A confirmação não confere com a nova senha.', 'error'); return;
      }
      if (nova.length < 6) {
        showSenhaFeedback('A nova senha deve ter ao menos 6 caracteres.', 'error'); return;
      }

      if (btnSalvarSenha) btnSalvarSenha.disabled = true;
      try {
        await window.api.put('/me/password', {
          body: { senha_atual: atual, nova_senha: nova, confirmar_senha: confirma },
          auth: true,
        });
        showToast('Senha alterada com sucesso!');
        limparFormSenha();
      } catch (err) {
        const msg = err?.data?.message || err?.data?.error || 'Erro ao alterar senha.';
        showSenhaFeedback(msg, 'error');
      } finally {
        if (btnSalvarSenha) btnSalvarSenha.disabled = false;
      }
    });
  }

  document.getElementById('btnCancelarSenha')?.addEventListener('click', limparFormSenha);

  // ── Segurança: preencher sessão atual ──
  function preencherSessaoAtual() {
    const ua = navigator.userAgent;
    let browser = 'Navegador desconhecido';
    if      (ua.includes('Edg'))                            browser = 'Microsoft Edge';
    else if (ua.includes('Chrome') && !ua.includes('OPR')) browser = 'Google Chrome';
    else if (ua.includes('Firefox'))                        browser = 'Mozilla Firefox';
    else if (ua.includes('Safari'))                         browser = 'Safari';
    else if (ua.includes('OPR') || ua.includes('Opera'))   browser = 'Opera';

    let os = 'Dispositivo desconhecido';
    if      (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac'))     os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux'))   os = 'Linux';

    const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const browserEl = document.getElementById('sessaoAtualBrowser');
    const dataEl    = document.getElementById('sessaoAtualData');
    if (browserEl) browserEl.textContent = `${os} · ${browser}`;
    if (dataEl)    dataEl.textContent    = `Ativo agora · ${data}`;
  }

  preencherSessaoAtual();

  // ── Segurança: encerrar TODAS as sessões (também disponível na zona de risco) ──
  document.getElementById('btnEncerrarTodasSessoes')?.addEventListener('click', () => {
    showConfirmModal({
      title: 'Encerrar todas as sessões',
      message: 'Você será desconectado de todos os dispositivos, incluindo este. Precisará fazer login novamente.',
      confirmLabel: 'Sim, encerrar tudo',
      danger: false,
      onConfirm: async () => {
        try {
          await window.api.post('/auth/logout-all', { auth: true });
        } catch (err) {
          console.error('Erro ao encerrar sessões:', err);
        }
        window.api.logout();
      },
    });
  });

  // ── Equipe: gerenciamento de membros ──
  inicializarEquipe();

  // ── Programas: gerenciamento de programas ──
  inicializarProgramas();

  // ── Notificações: preferências ──
  inicializarPrefsNotificacao();

  // ── Dados & LGPD ──
  inicializarDadosLGPD();

  // ── Logs de auditoria ──
  inicializarLogs();

  // ── Zona de risco: sair de todos os dispositivos ──
  document.getElementById('btnSairDispositivos')?.addEventListener('click', () => {
    showConfirmModal({
      title: 'Sair de todos os dispositivos',
      message: 'Tem certeza? Você será desconectado de todos os dispositivos onde sua conta está ativa, incluindo este.',
      confirmLabel: 'Sim, sair de tudo',
      danger: false,
      onConfirm: async () => {
        try {
          await window.api.post('/auth/logout-all', { auth: true });
        } catch (err) {
          console.error('Erro ao invalidar sessões:', err);
        }
        window.api.logout();
      },
    });
  });

  // ── Zona de risco: excluir conta ──
  document.getElementById('btnExcluirConta')?.addEventListener('click', () => {
    showConfirmModal({
      title: 'Excluir conta',
      message: 'Essa ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos definitivamente da plataforma. Tem certeza?',
      confirmLabel: 'Excluir permanentemente',
      danger: true,
      onConfirm: async () => {
        try {
          await window.api.delete('/auth/me', { auth: true });
          window.api.logout();
        } catch (err) {
          const msg = err?.data?.message || 'Erro ao excluir conta. Tente novamente.';
          showToast(msg, 'error');
        }
      },
    });
  });

});

// ══════════════════════════════════════════════════════════
//  EQUIPE — carregamento, criação, edição e exclusão
// ══════════════════════════════════════════════════════════

const PERFIL_BADGE = {
  GestaoGeral: { label: 'Administrador', cls: 'badge-brand' },
  Coordenacao:  { label: 'Administrador', cls: 'badge-brand' },
  Assistente:   { label: 'Assistente',    cls: 'badge-info'  },
  Mentor:       { label: 'Mentor',        cls: 'badge-info'  },
  Psicologa:    { label: 'Psicóloga/o',   cls: 'badge-info'  },
};

let membrosCache = [];
let editandoMembroId = null;

// ── helpers ──────────────────────────────────────────────
function membroIniciais(nome) {
  return String(nome || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase() || '?';
}

function showMembroFeedback(msg, type) {
  const el = document.getElementById('membroFeedback');
  if (!el) return;
  el.hidden = false;
  el.className = `settings-feedback is-${type}`;
  el.textContent = msg;
}

function fecharModalMembro() {
  const backdrop = document.getElementById('membroBackdrop');
  if (backdrop) backdrop.hidden = true;
  editandoMembroId = null;
}

// ── renderizar tabela ─────────────────────────────────────
function renderEquipe(lista) {
  const tbody = document.getElementById('equipeTbody');
  if (!tbody) return;

  const meuId = window.currentUser?.id;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-text-secondary);padding:var(--spacing-xl)">Nenhum membro cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => {
    const badge   = PERFIL_BADGE[u.perfil] ?? { label: u.perfil, cls: 'badge-info' };
    const status  = u.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-warning">Inativo</span>';
    const iniciais = membroIniciais(u.nome);
    const isMe    = u.id === meuId;

    return `
      <tr>
        <td>
          <div class="member-cell">
            <div class="member-avatar">${esc(iniciais)}</div>
            <div>
              <p class="settings-row__title">${esc(u.nome)}</p>
              <p class="settings-row__desc">${esc(u.email)}</p>
            </div>
          </div>
        </td>
        <td>${esc(u.cargo || u.perfil)}</td>
        <td><span class="badge ${badge.cls}">${badge.label}</span></td>
        <td>${status}</td>
        <td>
          <div class="dots-wrap" data-id="${u.id}">
            <button class="btn-dots" aria-label="Opções" ${isMe ? 'disabled title="Não é possível editar a própria conta aqui"' : ''}>
              <i data-lucide="more-vertical"></i>
            </button>
            <div class="dots-menu" hidden>
              <button class="dots-menu-item" data-action="editar" data-id="${u.id}">
                <i data-lucide="pencil"></i> Editar
              </button>
              <button class="dots-menu-item is-danger" data-action="excluir" data-id="${u.id}" data-nome="${esc(u.nome)}">
                <i data-lucide="trash-2"></i> Excluir
              </button>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
  bindDotsMenus();
}

// ── 3-dot menus (equipe) ─────────────────────────────────
function bindDotsMenus() {
  const tbody = document.getElementById('equipeTbody');
  if (!tbody) return;

  tbody.querySelectorAll('.dots-wrap').forEach(wrap => {
    const btn  = wrap.querySelector('.btn-dots');
    const menu = wrap.querySelector('.dots-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !menu.hidden;
      closeAllDotsMenus();
      if (!isOpen) {
        menu.hidden = false;
        if (window.lucide) lucide.createIcons();
      }
    });

    menu.querySelectorAll('.dots-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDotsMenus();
        const id   = Number(item.dataset.id);
        const nome = item.dataset.nome || '';
        if (item.dataset.action === 'editar') abrirModalEditar(id);
        if (item.dataset.action === 'excluir') confirmarExcluirMembro(id, nome);
      });
    });
  });

  document.addEventListener('click', closeAllDotsMenus);
}

function closeAllDotsMenus() {
  document.querySelectorAll('.dots-menu').forEach(m => { m.hidden = true; });
}

// ── abrir modal: novo ────────────────────────────────────
function abrirModalNovo() {
  editandoMembroId = null;
  document.getElementById('membroModalTitle').textContent = 'Adicionar membro';
  document.getElementById('btnSalvarMembro').textContent  = 'Adicionar membro';
  document.getElementById('membroNome').value    = '';
  document.getElementById('membroCargo').value   = '';
  document.getElementById('membroEmail').value   = '';
  document.getElementById('membroSenha').value   = '';
  document.getElementById('membroPerfil').value  = 'Assistente';
  document.getElementById('senhaGroup').hidden    = false;
  document.getElementById('senhaEditInfo').hidden = true;
  document.getElementById('membroFeedback').hidden = true;
  document.getElementById('membroBackdrop').hidden = false;
  if (window.lucide) lucide.createIcons();
  document.getElementById('membroNome').focus();
}

// ── abrir modal: editar ──────────────────────────────────
function abrirModalEditar(id) {
  const u = membrosCache.find(m => m.id === id);
  if (!u) return;

  editandoMembroId = id;
  document.getElementById('membroModalTitle').textContent = 'Editar membro';
  document.getElementById('btnSalvarMembro').textContent  = 'Salvar alterações';
  document.getElementById('membroNome').value    = u.nome  || '';
  document.getElementById('membroCargo').value   = u.cargo || '';
  document.getElementById('membroEmail').value   = u.email || '';
  document.getElementById('membroSenhaEdit').value = '';
  document.getElementById('membroPerfil').value  = u.perfil || 'Mentor';
  document.getElementById('senhaGroup').hidden    = true;
  document.getElementById('senhaEditInfo').hidden = false;
  document.getElementById('membroFeedback').hidden = true;
  document.getElementById('membroBackdrop').hidden = false;
  if (window.lucide) lucide.createIcons();
  document.getElementById('membroNome').focus();
}

// ── confirmar exclusão ────────────────────────────────────
function confirmarExcluirMembro(id, nome) {
  showConfirmModal({
    title: 'Excluir membro',
    message: `Tem certeza que deseja excluir "${nome}" permanentemente? Esta ação não pode ser desfeita.`,
    confirmLabel: 'Excluir',
    danger: true,
    onConfirm: () => excluirMembro(id),
  });
}

// ── excluir ───────────────────────────────────────────────
async function excluirMembro(id) {
  try {
    await window.api.delete(`/usuarios/${id}`, { auth: true });
    membrosCache = membrosCache.filter(m => m.id !== id);
    renderEquipe(membrosCache);
    showToast('Membro excluído com sucesso.');
  } catch (err) {
    const msg = err?.data?.message || 'Erro ao excluir membro.';
    showToast(msg, 'error');
  }
}

// ── carregar equipe ───────────────────────────────────────
async function carregarEquipe() {
  try {
    const todos = await window.api.get('/usuarios', { auth: true });
    membrosCache = (todos || []).filter(u => u.perfil !== 'Aluno');
    renderEquipe(membrosCache);
  } catch (err) {
    const tbody = document.getElementById('equipeTbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-error);padding:var(--spacing-xl)">Erro ao carregar equipe.</td></tr>`;
  }
}

// ── inicializar (chamado pelo DOMContentLoaded) ───────────
function inicializarEquipe() {
  // Botão adicionar
  document.getElementById('btnAdicionarMembro')?.addEventListener('click', abrirModalNovo);

  // Fechar modal
  document.getElementById('btnFecharModalMembro')?.addEventListener('click', fecharModalMembro);
  document.getElementById('btnCancelarMembro')?.addEventListener('click', fecharModalMembro);
  document.getElementById('membroBackdrop')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) fecharModalMembro();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('membroBackdrop')?.hidden) fecharModalMembro();
  });

  // Submit do form
  document.getElementById('formMembro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('btnSalvarMembro');
    const nome  = document.getElementById('membroNome').value.trim();
    const cargo = document.getElementById('membroCargo').value.trim();
    const email = document.getElementById('membroEmail').value.trim();
    const perfil = document.getElementById('membroPerfil').value;

    if (!nome)  { showMembroFeedback('Informe o nome completo.', 'error'); return; }
    if (!email) { showMembroFeedback('Informe o e-mail.', 'error'); return; }

    const isEdit  = editandoMembroId !== null;
    const senhaEl = isEdit
      ? document.getElementById('membroSenhaEdit')
      : document.getElementById('membroSenha');
    const senha = senhaEl?.value || '';

    if (!isEdit && !senha) { showMembroFeedback('Informe uma senha.', 'error'); return; }
    if (senha && senha.length < 8) { showMembroFeedback('A senha deve ter ao menos 8 caracteres.', 'error'); return; }

    btn.disabled = true;
    try {
      if (isEdit) {
        const body = { nome, cargo: cargo || null, email, perfil };
        if (senha) body.senha = senha;
        const atualizado = await window.api.put(`/usuarios/${editandoMembroId}`, { body, auth: true });
        membrosCache = membrosCache.map(m => m.id === editandoMembroId ? { ...m, ...atualizado } : m);
        renderEquipe(membrosCache);
        fecharModalMembro();
        showToast('Membro atualizado com sucesso!');
      } else {
        const criado = await window.api.post('/usuarios', {
          body: { nome, cargo: cargo || null, email, senha, perfil, ativo: true },
          auth: true,
        });
        membrosCache.push(criado);
        renderEquipe(membrosCache);
        fecharModalMembro();
        showToast('Membro adicionado com sucesso!');
      }
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao salvar membro.';
      showMembroFeedback(msg, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Carregar dados
  carregarEquipe();
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ══════════════════════════════════════════════════════════
//  PREFERÊNCIAS DE NOTIFICAÇÃO
// ══════════════════════════════════════════════════════════

const NOTIF_PREFS_KEY = 'pulsar-notif-prefs';

function lerPrefsNotificacao() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? JSON.parse(raw) : { Jovem: true, Alerta: true };
  } catch {
    return { Jovem: true, Alerta: true };
  }
}

function salvarPrefsNotificacao(prefs) {
  try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

function inicializarPrefsNotificacao() {
  const prefs       = lerPrefsNotificacao();
  const toggleJovem = document.getElementById('prefJovem');
  const toggleAlert = document.getElementById('prefAlerta');

  if (toggleJovem) {
    toggleJovem.checked = prefs.Jovem !== false;
    toggleJovem.addEventListener('change', () => {
      const p = lerPrefsNotificacao();
      p.Jovem = toggleJovem.checked;
      salvarPrefsNotificacao(p);
      showToast(
        toggleJovem.checked
          ? 'Notificações de novos jovens ativadas.'
          : 'Notificações de novos jovens desativadas.',
        'info'
      );
    });
  }

  if (toggleAlert) {
    toggleAlert.checked = prefs.Alerta !== false;
    toggleAlert.addEventListener('change', () => {
      const p = lerPrefsNotificacao();
      p.Alerta = toggleAlert.checked;
      salvarPrefsNotificacao(p);
      showToast(
        toggleAlert.checked
          ? 'Alertas de risco ativados.'
          : 'Alertas de risco desativados.',
        'info'
      );
    });
  }
}

// ══════════════════════════════════════════════════════════
//  DADOS & LGPD
// ══════════════════════════════════════════════════════════

const LGPD_PREFS_KEY = 'pulsar-lgpd-prefs';

function lerPrefsLGPD() {
  try {
    const raw = localStorage.getItem(LGPD_PREFS_KEY);
    return raw ? JSON.parse(raw) : { compartilhamentoMentores: true, retencaoDados: '24' };
  } catch {
    return { compartilhamentoMentores: true, retencaoDados: '24' };
  }
}

function salvarPrefsLGPD(prefs) {
  try { localStorage.setItem(LGPD_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

function inicializarDadosLGPD() {
  const prefs = lerPrefsLGPD();

  // Exportar CSV
  const btnExportar = document.getElementById('btnExportarDados');
  if (btnExportar) {
    btnExportar.addEventListener('click', async () => {
      const original = btnExportar.innerHTML;
      btnExportar.disabled = true;
      btnExportar.innerHTML = '<i data-lucide="loader-2"></i> Exportando...';
      if (typeof lucide !== 'undefined') lucide.createIcons();

      try {
        const token = window.api.getToken();
        const resp = await fetch('/api/jovens/exportar', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) throw new Error(`Erro ${resp.status}`);

        const blob = await resp.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const hoje = new Date().toISOString().slice(0, 10);
        a.href     = url;
        a.download = `jovens-pulsar-${hoje}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Arquivo CSV exportado com sucesso!');
      } catch (err) {
        showToast('Erro ao exportar dados. Tente novamente.', 'error');
      } finally {
        btnExportar.disabled  = false;
        btnExportar.innerHTML = original;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  }

  // Toggle: compartilhamento com mentores
  const toggleCompart = document.getElementById('toggleCompartilhamento');
  if (toggleCompart) {
    toggleCompart.checked = prefs.compartilhamentoMentores !== false;
    toggleCompart.addEventListener('change', () => {
      const p = lerPrefsLGPD();
      p.compartilhamentoMentores = toggleCompart.checked;
      salvarPrefsLGPD(p);
      showToast(
        toggleCompart.checked
          ? 'Compartilhamento com mentores ativado.'
          : 'Compartilhamento com mentores desativado.',
        'info'
      );
    });
  }

  // Select: retenção de dados
  const selRetencao = document.getElementById('retencaoDados');
  if (selRetencao) {
    selRetencao.value = prefs.retencaoDados || '24';
    selRetencao.addEventListener('change', () => {
      const p = lerPrefsLGPD();
      p.retencaoDados = selRetencao.value;
      salvarPrefsLGPD(p);
      const label = selRetencao.options[selRetencao.selectedIndex]?.text || selRetencao.value;
      showToast(`Retenção de dados definida para ${label}.`, 'info');
    });
  }
}

// ══════════════════════════════════════════════════════════
//  LOGS DE AUDITORIA
// ══════════════════════════════════════════════════════════

const LOG_DETALHES = {
  'CREATE:jovens':       'Cadastrou novo jovem',
  'UPDATE:jovens':       'Atualizou dados de jovem',
  'DELETE:jovens':       'Removeu jovem',
  'CREATE:usuarios':     'Adicionou membro à equipe',
  'UPDATE:usuarios':     'Atualizou dados de membro',
  'DELETE:usuarios':     'Removeu membro da equipe',
  'CREATE:programas':    'Criou novo programa',
  'UPDATE:programas':    'Atualizou programa',
  'DELETE:programas':    'Removeu programa',
  'CREATE:matriculas':   'Realizou matrícula de jovem',
  'DELETE:matriculas':   'Cancelou matrícula',
  'CREATE:anotacoes':    'Adicionou anotação',
  'UPDATE:anotacoes':    'Editou anotação',
  'DELETE:anotacoes':    'Removeu anotação',
  'CREATE:eventos':      'Criou evento',
  'UPDATE:eventos':      'Atualizou evento',
  'DELETE:eventos':      'Removeu evento',
  'CREATE:frequencias':  'Registrou frequência',
  'UPDATE:frequencias':  'Atualizou frequência',
  'CREATE:notificacoes': 'Criou notificação',
  'UPDATE:notificacoes': 'Atualizou notificação',
};

const LOG_BADGE = {
  CREATE: { label: 'Criação',  cls: 'badge-success' },
  UPDATE: { label: 'Edição',   cls: 'badge-info'    },
  DELETE: { label: 'Exclusão', cls: 'badge-error'   },
};

let logsCarregados = false;

function inicializarLogs() {
  const logsNavItem = document.querySelector('.settings-nav-item[data-section="logs"]');
  if (!logsNavItem) return;
  logsNavItem.addEventListener('click', () => {
    if (!logsCarregados) {
      logsCarregados = true;
      carregarLogs();
    }
  });
}

async function carregarLogs() {
  const tbody = document.getElementById('logsTbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="logs-placeholder">Carregando...</td></tr>`;

  try {
    const logs = await window.api.get('/log-auditoria', { auth: true });

    if (!Array.isArray(logs) || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="logs-placeholder">Nenhum log registrado ainda.</td></tr>`;
      return;
    }

    const userMap = new Map();
    (membrosCache || []).forEach(m => userMap.set(m.id, m.nome));

    tbody.innerHTML = logs.map(log => {
      const data    = new Date(log.criado_em);
      const dataStr = data.toLocaleDateString('pt-BR') + ' ' +
                      data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const usuario = log.usuario_id
        ? (userMap.get(log.usuario_id) || `#${log.usuario_id}`)
        : 'Sistema';

      const badge    = LOG_BADGE[log.operacao] || { label: log.operacao || '—', cls: 'badge-info' };
      const chave    = `${log.operacao}:${log.entidade}`;
      const detalhes = LOG_DETALHES[chave]
        || `${badge.label} em ${log.entidade || 'registro'}${log.entidade_id ? ` #${log.entidade_id}` : ''}`;

      return `
        <tr>
          <td>${esc(dataStr)}</td>
          <td>${esc(usuario)}</td>
          <td><span class="badge ${esc(badge.cls)}">${esc(badge.label)}</span></td>
          <td>${esc(detalhes)}</td>
        </tr>`;
    }).join('');

  } catch {
    tbody.innerHTML = `<tr><td colspan="4" class="logs-placeholder" style="color:var(--color-danger)">Erro ao carregar logs. Tente novamente.</td></tr>`;
  }
}

// ══════════════════════════════════════════════════════════
//  PROGRAMAS — carregamento, criação, edição e toggle
// ══════════════════════════════════════════════════════════

const TIPO_LABEL = {
  Curso:            'Curso',
  Mentoria:         'Mentoria',
  Projeto:          'Projeto',
  Evento_Recorrente:'Evento Recorrente',
};

const TIPO_BADGE_CLS = {
  Curso:            'badge-brand',
  Mentoria:         'badge-info',
  Projeto:          'badge-success',
  Evento_Recorrente:'badge-warning',
};

let programasCache       = [];
let editandoProgramaId   = null;
let estudantesSelecionados = [];
let searchDebounceTimer  = null;

function renderProgramas(lista) {
  const container = document.getElementById('programasList');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `<p style="text-align:center;color:var(--color-text-secondary);padding:var(--spacing-xl)">Nenhum programa cadastrado.</p>`;
    return;
  }

  container.innerHTML = lista.map(p => {
    const tipoCls   = TIPO_BADGE_CLS[p.tipo] ?? 'badge-info';
    const tipoLabel = TIPO_LABEL[p.tipo] ?? esc(p.tipo);
    const statusBadge = p.ativo
      ? '<span class="badge badge-success">Ativo</span>'
      : '<span class="badge badge-warning">Inativo</span>';
    const meta = [
      p.ano,
      p.carga_horaria ? p.carga_horaria + 'h' : null,
      p.coorte ? 'Coorte ' + esc(p.coorte) : null,
    ].filter(Boolean).join(' · ');

    return `
      <div class="settings-row" data-id="${p.id}">
        <div>
          <p class="settings-row__title">
            ${esc(p.nome)}
            <span class="badge ${tipoCls}">${tipoLabel}</span>
            ${statusBadge}
          </p>
          <p class="settings-row__desc">${meta}</p>
        </div>
        <div style="display:flex;align-items:center;gap:var(--spacing-md);flex-shrink:0">
          <label class="toggle-switch" title="${p.ativo ? 'Desativar' : 'Ativar'} programa">
            <input type="checkbox" class="programa-toggle" data-id="${p.id}" data-ativo="${p.ativo}"
              ${p.ativo ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
          <div class="dots-wrap prog-dots" data-id="${p.id}">
            <button class="btn-dots" aria-label="Opções">
              <i data-lucide="more-vertical"></i>
            </button>
            <div class="dots-menu" hidden>
              <button class="dots-menu-item" data-action="editar" data-id="${p.id}">
                <i data-lucide="pencil"></i> Editar
              </button>
              <button class="dots-menu-item is-danger" data-action="arquivar" data-id="${p.id}" data-nome="${esc(p.nome)}">
                <i data-lucide="archive"></i> Arquivar
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');

  if (window.lucide) lucide.createIcons();
  bindProgramaDotsMenus();
  bindProgramaToggles();
}

function bindProgramaDotsMenus() {
  const list = document.getElementById('programasList');
  if (!list) return;

  list.querySelectorAll('.prog-dots').forEach(wrap => {
    const btn  = wrap.querySelector('.btn-dots');
    const menu = wrap.querySelector('.dots-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !menu.hidden;
      closeAllDotsMenus();
      if (!isOpen) {
        menu.hidden = false;
        if (window.lucide) lucide.createIcons();
      }
    });

    menu.querySelectorAll('.dots-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDotsMenus();
        const id   = Number(item.dataset.id);
        const nome = item.dataset.nome || '';
        if (item.dataset.action === 'editar')  abrirModalEditarPrograma(id);
        if (item.dataset.action === 'arquivar') confirmarArquivarPrograma(id, nome);
      });
    });
  });

  document.addEventListener('click', closeAllDotsMenus);
}

function bindProgramaToggles() {
  const list = document.getElementById('programasList');
  if (!list) return;

  list.querySelectorAll('.programa-toggle').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const id      = Number(toggle.dataset.id);
      const ativo   = toggle.dataset.ativo === 'true';
      const novoAtivo = !ativo;

      toggle.checked  = ativo;
      toggle.disabled = true;

      const prog  = programasCache.find(p => p.id === id);
      const acao  = novoAtivo ? 'Ativar' : 'Desativar';
      const nomeP = prog?.nome ?? '';

      showConfirmModal({
        title: `${acao} programa`,
        message: novoAtivo
          ? `Deseja reativar "${nomeP}"? Ele voltará a aparecer nos filtros do dashboard e de frequência.`
          : `Deseja desativar "${nomeP}"? Ele deixará de aparecer nos filtros do dashboard e de frequência.`,
        confirmLabel: acao,
        danger: !novoAtivo,
        onConfirm: async () => {
          try {
            const atualizado = await window.api.put(`/programas/${id}`, {
              body: { ativo: novoAtivo },
              auth: true,
            });
            programasCache = programasCache.map(p =>
              p.id === id ? { ...p, ativo: atualizado.ativo } : p
            );
            renderProgramas(programasCache);
            showToast(`Programa ${novoAtivo ? 'ativado' : 'desativado'} com sucesso.`);
          } catch (err) {
            const msg = err?.data?.message || `Erro ao ${acao.toLowerCase()} programa.`;
            showToast(msg, 'error');
            toggle.disabled = false;
          }
        },
        onCancel: () => {
          toggle.checked  = ativo;
          toggle.disabled = false;
        },
      });
    });
  });
}

async function carregarProgramas() {
  const container = document.getElementById('programasList');
  if (container) container.innerHTML = `<p style="text-align:center;color:var(--color-text-secondary);padding:var(--spacing-xl)">Carregando...</p>`;

  try {
    const [ativos, inativos] = await Promise.all([
      window.api.get('/programas', { params: { ativo: 'true'  }, auth: true }),
      window.api.get('/programas', { params: { ativo: 'false' }, auth: true }),
    ]);
    programasCache = [...(ativos || []), ...(inativos || [])];
    programasCache.sort((a, b) => {
      if (a.ativo !== b.ativo) return b.ativo ? 1 : -1;
      if (b.ano !== a.ano) return b.ano - a.ano;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    renderProgramas(programasCache);
  } catch {
    if (container) container.innerHTML = `<p style="text-align:center;color:var(--color-error);padding:var(--spacing-xl)">Erro ao carregar programas.</p>`;
  }
}

function fecharModalPrograma() {
  const backdrop = document.getElementById('programaBackdrop');
  if (backdrop) backdrop.hidden = true;
  editandoProgramaId     = null;
  estudantesSelecionados = [];
  clearTimeout(searchDebounceTimer);
  const dropdown = document.getElementById('alunoDropdown');
  if (dropdown) dropdown.hidden = true;
  const chips   = document.getElementById('alunoChips');
  if (chips) chips.innerHTML = '';
  const section = document.getElementById('alunosSelecionados');
  if (section) section.hidden = true;
  const busca   = document.getElementById('programaBuscaAluno');
  if (busca) busca.value = '';
}

function showProgramaFeedback(msg, type) {
  const el = document.getElementById('programaFeedback');
  if (!el) return;
  el.hidden    = false;
  el.className = `settings-feedback is-${type}`;
  el.textContent = msg;
}

function abrirModalNovoPrograma() {
  editandoProgramaId     = null;
  estudantesSelecionados = [];

  document.getElementById('programaModalTitle').textContent = 'Novo programa';
  document.getElementById('btnSalvarPrograma').textContent  = 'Criar programa';

  ['programaNome','programaTipo','programaDataInicio','programaDataFim',
   'programaCargaHoraria','programaCoorte','programaDescricao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('programaAno').value       = new Date().getFullYear();
  document.getElementById('programaFeedback').hidden      = true;
  document.getElementById('programaAlunosGroup').hidden   = false;
  document.getElementById('alunoChips').innerHTML         = '';
  document.getElementById('alunosSelecionados').hidden    = true;
  document.getElementById('programaBuscaAluno').value     = '';
  document.getElementById('alunoDropdown').hidden         = true;
  document.getElementById('programaBackdrop').hidden      = false;
  if (window.lucide) lucide.createIcons();
  document.getElementById('programaNome').focus();
}

function abrirModalEditarPrograma(id) {
  const p = programasCache.find(x => x.id === id);
  if (!p) return;

  editandoProgramaId     = id;
  estudantesSelecionados = [];

  document.getElementById('programaModalTitle').textContent = 'Editar programa';
  document.getElementById('btnSalvarPrograma').textContent  = 'Salvar alterações';

  const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
  set('programaNome', p.nome);
  set('programaTipo', p.tipo);
  set('programaAno', p.ano);
  set('programaDataInicio', p.data_inicio ? String(p.data_inicio).slice(0, 10) : '');
  set('programaDataFim',    p.data_fim    ? String(p.data_fim).slice(0, 10)    : '');
  set('programaCargaHoraria', p.carga_horaria ?? '');
  set('programaCoorte',    p.coorte ?? '');
  set('programaDescricao', p.descricao ?? '');
  document.getElementById('programaFeedback').hidden     = true;
  document.getElementById('programaAlunosGroup').hidden  = true;
  document.getElementById('programaBackdrop').hidden     = false;
  if (window.lucide) lucide.createIcons();
  document.getElementById('programaNome').focus();
}

function confirmarArquivarPrograma(id, nome) {
  showConfirmModal({
    title: 'Arquivar programa',
    message: `Tem certeza que deseja arquivar "${nome}"? Ele será desativado e removido dos filtros ativos.`,
    confirmLabel: 'Arquivar',
    danger: true,
    onConfirm: () => arquivarPrograma(id),
  });
}

async function arquivarPrograma(id) {
  try {
    await window.api.patch(`/programas/${id}/arquivar`, { auth: true });
    programasCache = programasCache.map(p => p.id === id ? { ...p, ativo: false } : p);
    renderProgramas(programasCache);
    showToast('Programa arquivado com sucesso.');
  } catch (err) {
    const msg = err?.data?.message || 'Erro ao arquivar programa.';
    showToast(msg, 'error');
  }
}

function renderAlunoChips() {
  const container = document.getElementById('alunoChips');
  const section   = document.getElementById('alunosSelecionados');
  const countEl   = document.getElementById('alunosCount');
  if (!container) return;

  if (section) section.hidden = !estudantesSelecionados.length;
  if (countEl) countEl.textContent = estudantesSelecionados.length;
  if (!estudantesSelecionados.length) { container.innerHTML = ''; return; }

  container.innerHTML = estudantesSelecionados.map(a => {
    const ini = membroIniciais(a.nome);
    return `
      <div class="enroll-student-row">
        <div class="enroll-student-avatar" data-id="${a.id}">${esc(ini)}</div>
        <span class="enroll-student-name">${esc(a.nome)}</span>
        <div class="enroll-turma-wrap">
          <select class="enroll-turma-select" data-id="${a.id}">
            <option value="Turma 1"      ${a.turma === 'Turma 1'      ? 'selected' : ''}>Turma 1</option>
            <option value="Turma 2"      ${a.turma === 'Turma 2'      ? 'selected' : ''}>Turma 2</option>
            <option value="Turma Remota" ${a.turma === 'Turma Remota' ? 'selected' : ''}>Turma Remota</option>
          </select>
          <span class="enroll-turma-icon">
            <i data-lucide="chevron-down" style="width:13px;height:13px"></i>
          </span>
        </div>
        <button type="button" class="enroll-student-remove" data-id="${a.id}" aria-label="Remover">
          <i data-lucide="x" style="width:14px;height:14px"></i>
        </button>
      </div>`;
  }).join('');

  // Foto de cada jovem selecionado (fonte: usuarios.foto_url); fallback iniciais
  const fotoSelById = new Map(estudantesSelecionados.map(a => [String(a.id), a]));
  container.querySelectorAll('.enroll-student-avatar[data-id]').forEach(el => {
    const a = fotoSelById.get(el.dataset.id);
    if (a?.foto) window.avatar.render(el, a.foto, a.nome);
  });

  if (window.lucide) lucide.createIcons();

  container.querySelectorAll('.enroll-turma-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = Number(sel.dataset.id);
      const aluno = estudantesSelecionados.find(a => a.id === id);
      if (aluno) aluno.turma = sel.value;
    });
  });

  container.querySelectorAll('.enroll-student-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const remId = Number(btn.dataset.id);
      estudantesSelecionados = estudantesSelecionados.filter(a => a.id !== remId);
      renderAlunoChips();
    });
  });
}

function configurarAutocompletAlunos() {
  const input    = document.getElementById('programaBuscaAluno');
  const dropdown = document.getElementById('alunoDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    clearTimeout(searchDebounceTimer);
    if (val.length < 2) { dropdown.hidden = true; return; }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const result = await window.api.get('/jovens', { params: { nome: val }, auth: true });
        const jovens = (Array.isArray(result) ? result : [])
          .filter(j => !estudantesSelecionados.some(s => s.id === j.id))
          .slice(0, 8);

        if (!jovens.length) {
          dropdown.innerHTML = `
            <div class="enroll-dropdown-empty">
              Nenhum jovem encontrado para "<strong>${esc(val)}</strong>"
            </div>`;
          dropdown.hidden = false;
          return;
        }

        dropdown.innerHTML = jovens.map(j => {
          const ini  = membroIniciais(j.nome);
          const meta = [j.email, j.cidade].filter(Boolean).join(' · ');
          return `
            <button type="button" class="enroll-result-item" data-id="${j.id}" data-nome="${esc(j.nome)}">
              <div class="enroll-result-avatar">${esc(ini)}</div>
              <div class="enroll-result-info">
                <p class="enroll-result-name">${esc(j.nome)}</p>
                <p class="enroll-result-meta">${esc(meta || '—')}</p>
              </div>
              <span class="enroll-result-add">
                <i data-lucide="user-plus" style="width:16px;height:16px"></i>
              </span>
            </button>`;
        }).join('');
        dropdown.hidden = false;
        if (window.lucide) lucide.createIcons();

        // Foto de cada jovem no resultado (fonte: usuarios.foto_url); fallback iniciais
        const fotoPorId = new Map(jovens.map(j => [String(j.id), { foto: j.foto_url, nome: j.nome }]));
        dropdown.querySelectorAll('.enroll-result-item[data-id]').forEach(item => {
          const dados = fotoPorId.get(item.dataset.id);
          if (dados?.foto) window.avatar.render(item.querySelector('.enroll-result-avatar'), dados.foto, dados.nome);
        });

        dropdown.querySelectorAll('.enroll-result-item').forEach(btn => {
          btn.addEventListener('click', () => {
            const selId   = Number(btn.dataset.id);
            const selNome = btn.dataset.nome;
            if (!estudantesSelecionados.some(s => s.id === selId)) {
              const selFoto = jovens.find(j => j.id === selId)?.foto_url || null;
              estudantesSelecionados.push({ id: selId, nome: selNome, foto: selFoto, turma: 'Turma 1' });
              renderAlunoChips();
            }
            input.value     = '';
            dropdown.hidden = true;
          });
        });
      } catch {
        dropdown.hidden = true;
      }
    }, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.hidden = true;
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
    }
  });
}

function inicializarProgramas() {
  document.getElementById('btnNovoPrograma')?.addEventListener('click', abrirModalNovoPrograma);
  document.getElementById('btnFecharModalPrograma')?.addEventListener('click', fecharModalPrograma);
  document.getElementById('btnCancelarPrograma')?.addEventListener('click', fecharModalPrograma);
  document.getElementById('programaBackdrop')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) fecharModalPrograma();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('programaBackdrop')?.hidden) fecharModalPrograma();
  });

  configurarAutocompletAlunos();

  document.getElementById('formPrograma')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('btnSalvarPrograma');
    const nome = document.getElementById('programaNome').value.trim();
    const tipo = document.getElementById('programaTipo').value;
    const ano  = Number(document.getElementById('programaAno').value);

    if (!nome) { showProgramaFeedback('Informe o nome do programa.', 'error'); return; }
    if (!tipo) { showProgramaFeedback('Selecione o tipo do programa.', 'error'); return; }
    if (!ano || ano < 2000) { showProgramaFeedback('Informe um ano válido (a partir de 2000).', 'error'); return; }

    const body = {
      nome,
      tipo,
      ano,
      carga_horaria: document.getElementById('programaCargaHoraria').value
        ? Number(document.getElementById('programaCargaHoraria').value) : null,
      coorte:      document.getElementById('programaCoorte').value.trim()    || null,
      data_inicio: document.getElementById('programaDataInicio').value       || null,
      data_fim:    document.getElementById('programaDataFim').value          || null,
      descricao:   document.getElementById('programaDescricao').value.trim() || null,
    };

    btn.disabled = true;
    const isEdit = editandoProgramaId !== null;

    try {
      if (isEdit) {
        const atualizado = await window.api.put(`/programas/${editandoProgramaId}`, { body, auth: true });
        programasCache = programasCache.map(p =>
          p.id === editandoProgramaId ? { ...p, ...atualizado } : p
        );
        renderProgramas(programasCache);
        fecharModalPrograma();
        showToast('Programa atualizado com sucesso!');
      } else {
        const criado = await window.api.post('/programas', { body, auth: true });
        programasCache.unshift(criado);

        const erros = [];
        for (const aluno of estudantesSelecionados) {
          try {
            await window.api.post('/matriculas', {
              body: { jovem_id: aluno.id, programa_id: criado.id, turma: aluno.turma },
              auth: true,
            });
          } catch {
            erros.push(aluno.nome);
          }
        }

        renderProgramas(programasCache);
        fecharModalPrograma();

        if (erros.length) {
          showToast(`Programa criado! Falha ao matricular: ${erros.join(', ')}`, 'info', 6000);
        } else if (estudantesSelecionados.length) {
          showToast(`Programa criado com ${estudantesSelecionados.length} jovem(ns) matriculado(s)!`);
        } else {
          showToast('Programa criado com sucesso!');
        }
      }
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao salvar programa.';
      showProgramaFeedback(msg, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  carregarProgramas();
}
