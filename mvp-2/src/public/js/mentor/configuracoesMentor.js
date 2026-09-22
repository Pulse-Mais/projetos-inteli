/* configuracoesMentor.js — Integração da tela Configurações */

// ── Toast de notificação ─────────────────────────────────────────────────────
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

// ── Modal de confirmação customizado ─────────────────────────────────────────
function showConfirmModal({ title, message, confirmLabel, danger = false, onConfirm }) {
  const backdrop  = document.getElementById('confirmBackdrop');
  const iconEl    = document.getElementById('confirmIcon');
  const titleEl   = document.getElementById('confirmTitle');
  const messageEl = document.getElementById('confirmMessage');
  const okBtn     = document.getElementById('confirmOkBtn');
  const cancelBtn = document.getElementById('confirmCancelBtn');

  if (!backdrop) { if (confirm(message)) onConfirm(); return; }

  iconEl.className   = `confirm-icon ${danger ? 'is-danger' : 'is-warning'}`;
  iconEl.innerHTML   = danger
    ? '<i data-lucide="trash-2" style="width:24px;height:24px"></i>'
    : '<i data-lucide="log-out" style="width:24px;height:24px"></i>';
  titleEl.textContent   = title;
  messageEl.textContent = message;
  okBtn.textContent     = confirmLabel;
  okBtn.className       = danger ? 'btn danger-btn' : 'btn btn-primary';

  backdrop.hidden = false;
  if (window.lucide) lucide.createIcons();

  function close() { backdrop.hidden = true; cleanup(); }

  function handleOk() { close(); onConfirm(); }

  function handleKey(e) { if (e.key === 'Escape') close(); }

  function cleanup() {
    okBtn.removeEventListener('click', handleOk);
    cancelBtn.removeEventListener('click', close);
    document.removeEventListener('keydown', handleKey);
    backdrop.removeEventListener('click', handleBackdrop);
  }

  function handleBackdrop(e) { if (e.target === backdrop) close(); }

  okBtn.addEventListener('click', handleOk);
  cancelBtn.addEventListener('click', close);
  document.addEventListener('keydown', handleKey);
  backdrop.addEventListener('click', handleBackdrop);
}

function initials(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

function showFeedback(msg, type) {
  const el = document.getElementById('settingsFeedback');
  if (!el) return;
  el.hidden = false;
  el.className = `settings-feedback is-${type}`;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => { el.hidden = true; }, 4000);
}

// ── Panel switching ──────────────────────────────────────────────────────────
function switchPanel(key) {
  document.querySelectorAll('.settings-menu-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.settingsSection === key);
  });
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.hidden = panel.dataset.panel !== key;
  });

  if (key === 'security') {
    dismissSecurityAlert();
    populateSessionInfo();
  }
  if (key === 'appearance') {
    applyThemeUI();
    if (window.lucide) lucide.createIcons();
  }
  if (key === 'privacy' || key === 'profile') {
    if (window.lucide) lucide.createIcons();
  }
}

// ── Security alert badge ─────────────────────────────────────────────────────
function dismissSecurityAlert() {
  try { localStorage.setItem('pulsar-security-seen', '1'); } catch {}
  const badge = document.getElementById('securityAlert');
  if (badge) badge.style.display = 'none';
}

// ── Session browser info ─────────────────────────────────────────────────────
function populateSessionInfo() {
  const el = document.getElementById('sessionBrowser');
  if (!el) return;
  const ua = navigator.userAgent;
  let browser = 'Navegador desconhecido';
  if      (ua.includes('Edg'))                            browser = 'Microsoft Edge';
  else if (ua.includes('Chrome') && !ua.includes('OPR')) browser = 'Google Chrome';
  else if (ua.includes('Firefox'))                        browser = 'Mozilla Firefox';
  else if (ua.includes('Safari'))                         browser = 'Safari';
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  el.textContent = `${browser} · ${date}`;
}

// ── Theme ────────────────────────────────────────────────────────────────────
function getTheme() {
  try { return localStorage.getItem('pulsar-theme') ?? 'light'; } catch { return 'light'; }
}

function applyThemeUI() {
  const theme = getTheme();
  const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  // Temas indisponíveis (escuro/sistema) estão bloqueados — sempre cai para "Claro".
  if (radio && !radio.disabled) {
    radio.checked = true;
  } else {
    const light = document.querySelector('input[name="theme"][value="light"]');
    if (light) light.checked = true;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Dismiss badge if already seen
  try {
    if (localStorage.getItem('pulsar-security-seen')) {
      const badge = document.getElementById('securityAlert');
      if (badge) badge.style.display = 'none';
    }
  } catch {}

  // Apply saved theme selection on load
  applyThemeUI();

  // ── Menu navigation ──
  document.querySelectorAll('.settings-menu-item').forEach(btn => {
    btn.addEventListener('click', () => switchPanel(btn.dataset.settingsSection));
  });

  // ── Theme change ──
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', () => {
      try { localStorage.setItem('pulsar-theme', radio.value); } catch {}
    });
  });

  let originalNome  = '';
  let originalEmail = '';
  let fotoAtual     = null;

  // ── Load profile data ──
  try {
    const me = await window.api.get('/me', { auth: true });

    originalNome  = me.nome  ?? '';
    originalEmail = me.email ?? '';
    fotoAtual     = me.foto_url || null;

    const nameEl   = document.getElementById('profileSummaryName');
    const metaEl   = document.getElementById('profileSummaryMeta');
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) window.avatar.render(avatarEl, me.foto_url, me.nome);
    if (nameEl)   nameEl.textContent   = me.nome  ?? '—';
    if (metaEl)   metaEl.textContent   = [me.perfil, me.email].filter(Boolean).join(' · ');

    const nomeEl   = document.getElementById('fieldNome');
    const cargoEl  = document.getElementById('fieldCargo');
    const emailEl  = document.getElementById('fieldEmail');
    const perfilEl = document.getElementById('fieldPerfil');
    if (nomeEl)   nomeEl.value   = me.nome   ?? '';
    if (emailEl)  emailEl.value  = me.email  ?? '';
    if (cargoEl)  cargoEl.value  = me.cargo  ?? '';
    if (perfilEl) perfilEl.value = me.perfil ?? '';

  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    showFeedback('Não foi possível carregar os dados do perfil.', 'error');
  }

  // ── Save profile ──
  const form    = document.getElementById('profileForm');
  const saveBtn = document.getElementById('saveSettingsBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome  = document.getElementById('fieldNome')?.value.trim()  ?? '';
      const email = document.getElementById('fieldEmail')?.value.trim() ?? '';

      if (!nome && !email) {
        showFeedback('Informe ao menos um campo para salvar.', 'error');
        return;
      }

      const body = {};
      if (nome)  body.nome  = nome;
      if (email) body.email = email;

      if (saveBtn) saveBtn.disabled = true;
      try {
        const updated = await window.api.put('/me', { body, auth: true });

        originalNome  = updated.nome  ?? nome;
        originalEmail = updated.email ?? email;

        const nameEl   = document.getElementById('profileSummaryName');
        const metaEl   = document.getElementById('profileSummaryMeta');
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) window.avatar.render(avatarEl, fotoAtual, originalNome);
        if (nameEl)   nameEl.textContent   = originalNome;
        if (metaEl) {
          const perfil = document.getElementById('fieldPerfil')?.value ?? '';
          metaEl.textContent = [perfil, originalEmail].filter(Boolean).join(' · ');
        }

        showFeedback('Perfil atualizado com sucesso!', 'success');
      } catch (err) {
        const msg = err?.data?.message || err?.message || 'Erro ao salvar perfil.';
        showFeedback(msg, 'error');
      } finally {
        if (saveBtn) saveBtn.disabled = false;
      }
    });
  }

  // ── Cancel (profile) ──
  document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => {
    const nomeEl  = document.getElementById('fieldNome');
    const emailEl = document.getElementById('fieldEmail');
    if (nomeEl)  nomeEl.value  = originalNome;
    if (emailEl) emailEl.value = originalEmail;
    const feedback = document.getElementById('settingsFeedback');
    if (feedback) feedback.hidden = true;
  });

  // ── Foto de perfil ──
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

  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const inputFoto      = document.getElementById('inputFotoPerfilMentor');

  changePhotoBtn?.addEventListener('click', () => inputFoto?.click());

  inputFoto?.addEventListener('change', async () => {
    const file = inputFoto.files[0];
    inputFoto.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFeedback('Selecione um arquivo de imagem (PNG, JPG ou WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('A imagem deve ter no máximo 5 MB.', 'error');
      return;
    }
    if (changePhotoBtn) changePhotoBtn.disabled = true;
    try {
      const base64 = await redimensionarImagem(file);
      const atualizado = await window.api.put('/me', { body: { foto_url: base64 }, auth: true });
      fotoAtual = atualizado.foto_url || base64;
      window.avatar.render(document.getElementById('profileAvatar'), fotoAtual, originalNome);
      const usuario = window.api.getUser() || {};
      usuario.foto_url = fotoAtual;
      window.api.setUser(usuario);
      window.avatar.render(document.querySelector('.avatar-trigger .avatar'), fotoAtual, originalNome);
      showFeedback('Foto atualizada com sucesso!', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erro ao enviar a foto.';
      showFeedback(msg, 'error');
    } finally {
      if (changePhotoBtn) changePhotoBtn.disabled = false;
    }
  });

  removePhotoBtn?.addEventListener('click', async () => {
    if (!fotoAtual) return;
    if (removePhotoBtn) removePhotoBtn.disabled = true;
    try {
      await window.api.put('/me', { body: { foto_url: null }, auth: true });
      fotoAtual = null;
      window.avatar.render(document.getElementById('profileAvatar'), null, originalNome);
      const usuario = window.api.getUser() || {};
      usuario.foto_url = null;
      window.api.setUser(usuario);
      window.avatar.render(document.querySelector('.avatar-trigger .avatar'), null, originalNome);
      showFeedback('Foto removida.', 'success');
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erro ao remover a foto.';
      showFeedback(msg, 'error');
    } finally {
      if (removePhotoBtn) removePhotoBtn.disabled = false;
    }
  });

  // ── Alterar senha ──
  const passwordForm = document.getElementById('passwordForm');
  const savePasswordBtn = document.getElementById('savePasswordBtn');

  function showPasswordFeedback(msg, type) {
    const el = document.getElementById('passwordFeedback');
    if (!el) return;
    el.hidden = false;
    el.className = `settings-feedback is-${type}`;
    el.textContent = msg;
    if (type === 'success') setTimeout(() => { el.hidden = true; }, 4000);
  }

  function clearPasswordForm() {
    ['fieldSenhaAtual', 'fieldNovaSenha', 'fieldConfirmarSenha'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fb = document.getElementById('passwordFeedback');
    if (fb) fb.hidden = true;
  }

  passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const senha_atual     = document.getElementById('fieldSenhaAtual')?.value ?? '';
    const nova_senha      = document.getElementById('fieldNovaSenha')?.value ?? '';
    const confirmar_senha = document.getElementById('fieldConfirmarSenha')?.value ?? '';

    if (!senha_atual || !nova_senha || !confirmar_senha) {
      showPasswordFeedback('Preencha todos os campos de senha.', 'error');
      return;
    }
    if (nova_senha !== confirmar_senha) {
      showPasswordFeedback('A confirmação não confere com a nova senha.', 'error');
      return;
    }
    if (nova_senha.length < 6) {
      showPasswordFeedback('A nova senha deve ter ao menos 6 caracteres.', 'error');
      return;
    }

    if (savePasswordBtn) savePasswordBtn.disabled = true;
    try {
      await window.api.put('/me/password', {
        body: { senha_atual, nova_senha, confirmar_senha },
        auth: true,
      });
      showToast('Senha alterada com sucesso!', 'success');
      clearPasswordForm();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Erro ao alterar senha.';
      showPasswordFeedback(msg, 'error');
    } finally {
      if (savePasswordBtn) savePasswordBtn.disabled = false;
    }
  });

  document.getElementById('cancelPasswordBtn')?.addEventListener('click', clearPasswordForm);

  // ── Logout all (profile + security panels) ──
  const logoutHandler = () => {
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
  };
  document.getElementById('logoutAllBtn')?.addEventListener('click', logoutHandler);
  document.getElementById('securityLogoutAllBtn')?.addEventListener('click', logoutHandler);

  // ── Delete account (profile + privacy panels) ──
  const deleteHandler = () => {
    showConfirmModal({
      title: 'Excluir conta',
      message: 'Essa ação é permanente e não pode ser desfeita. Todos os seus dados — mentorias, histórico e configurações — serão removidos definitivamente da plataforma. Tem certeza que deseja continuar?',
      confirmLabel: 'Excluir permanentemente',
      danger: true,
      onConfirm: async () => {
        try {
          await window.api.delete('/auth/me', { auth: true });
          window.api.logout();
        } catch (err) {
          const msg = err?.data?.message || 'Erro ao excluir conta. Tente novamente.';
          alert(msg);
        }
      },
    });
  };
  document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteHandler);
  document.getElementById('lgpdDeleteAccountBtn')?.addEventListener('click', deleteHandler);

  // ── Request data (LGPD) ──
  document.getElementById('requestDataBtn')?.addEventListener('click', () => {
    alert('Para solicitar uma cópia dos seus dados pessoais, entre em contato com a equipe de gestão da Pulsar informando seu nome e e-mail cadastrado.');
  });
});
