/* perfilDoAluno.js — Integração da tela Perfil do Aluno
   Pulsar · Pulse Mais
*/

let _historico     = [];
let _certificados  = [];
let _fotoAtual     = null;

document.addEventListener('DOMContentLoaded', async () => {
  const jovem_id = window.currentUser?.jovem_id;

  window.setPageLoading?.(true);
  try {
    await Promise.all([
      carregarPerfil(jovem_id),
      carregarCertificados(jovem_id),
      carregarHistorico(jovem_id),
    ]);
  } finally {
    window.setPageLoading?.(false);
  }

  iniciarEdicao();
  iniciarAlteracaoSenha();
  iniciarVisualizacao();
  iniciarFotoPerfil();
});

/* ── Foto de perfil do aluno (RN17: o próprio aluno edita a sua) ── */
function iniciarFotoPerfil() {
  const btnTrocar  = document.getElementById('btn-trocar-foto');
  const btnRemover = document.getElementById('btn-remover-foto');
  const inputFoto  = document.getElementById('input-foto-aluno');
  if (!btnTrocar || !inputFoto) return;

  function redimensionar(file, maxSize = 200) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
          else       { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
          canvas.width = w; canvas.height = h;
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

  function renderFoto() {
    const nome = document.getElementById('perfil-nome')?.textContent ?? '';
    window.avatar.render(document.getElementById('perfil-initials'), _fotoAtual, nome);
    window.avatar.render(document.querySelector('.avatar-trigger .avatar'), _fotoAtual, nome);
    const usuario = window.api.getUser() || {};
    usuario.foto_url = _fotoAtual;
    window.api.setUser(usuario);
  }

  btnTrocar.addEventListener('click', () => inputFoto.click());

  inputFoto.addEventListener('change', async () => {
    const file = inputFoto.files[0];
    inputFoto.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecione uma imagem (PNG, JPG ou WebP).'); return; }
    if (file.size > 5 * 1024 * 1024)     { alert('A imagem deve ter no máximo 5 MB.'); return; }

    btnTrocar.disabled = true;
    try {
      const base64 = await redimensionar(file);
      const atualizado = await window.api.put('/me', { body: { foto_url: base64 }, auth: true });
      _fotoAtual = atualizado.foto_url || base64;
      renderFoto();
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Erro ao enviar a foto.');
    } finally {
      btnTrocar.disabled = false;
    }
  });

  btnRemover?.addEventListener('click', async () => {
    if (!_fotoAtual) return;
    btnRemover.disabled = true;
    try {
      await window.api.put('/me', { body: { foto_url: null }, auth: true });
      _fotoAtual = null;
      renderFoto();
    } catch (err) {
      alert(err?.data?.message || err?.message || 'Erro ao remover a foto.');
    } finally {
      btnRemover.disabled = false;
    }
  });
}

/* ── Perfil: dados básicos do usuário e do jovem ── */
async function carregarPerfil(jovem_id) {
  try {
    const me = await window.api.get('/me', { auth: true });

    setText('perfil-nome',  me.nome  ?? '—');
    setText('perfil-email', me.email ?? '—');

    _fotoAtual = me.foto_url || null;
    window.avatar.render(document.getElementById('perfil-initials'), _fotoAtual, me.nome);
    window.avatar.render(document.querySelector('.avatar-trigger .avatar'), _fotoAtual, me.nome);

    // Atualiza topbar com nome real
    setText('.avatar-name', me.nome, true);

    // CPF e status vêm do registro do jovem
    if (jovem_id) {
      const jovem = await window.api.get(`/jovens/${jovem_id}`, { auth: true });
      setText('perfil-cpf', formatarCpf(jovem.cpf) ?? '—');

      const statusEl = document.getElementById('perfil-status');
      if (statusEl && jovem.status) {
        statusEl.textContent = jovem.status;
        statusEl.className = jovem.status === 'Ativo'
          ? 'pbadge is-soft-success pbadge-dot'
          : 'pbadge is-soft-warning pbadge-dot';
      }
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }
}

/* ── Certificados ── */
async function carregarCertificados(jovem_id) {
  const container = document.getElementById('certificados-body');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/certificados', { auth: true, params });

    if (!lista?.length) {
      container.innerHTML = '<p class="panel-empty">Nenhum certificado encontrado.</p>';
      return;
    }

    _certificados = lista;

    container.innerHTML = lista.map(c => `
      <div class="panel-row">
        <span class="panel-row-title">${c.nome ?? c.titulo ?? '—'}</span>
        <span class="panel-row-meta">${c.instituicao ?? ''}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="panel-empty">Erro ao carregar certificados.</p>';
    console.error('Erro ao carregar certificados:', err);
  }
}

/* ── Disciplinas (disciplinas do jovem) ── */
async function carregarHistorico(jovem_id) {
  const container = document.getElementById('historico-body');
  if (!container) return;

  try {
    const params = jovem_id ? { jovem_id } : {};
    const lista  = await window.api.get('/disciplinas', { auth: true, params });

    if (!lista?.length) {
      container.innerHTML = '<p class="panel-empty">Nenhum histórico encontrado.</p>';
      return;
    }

    _historico = lista;

    container.innerHTML = lista.map(d => `
      <div class="panel-row">
        <span class="panel-row-title">${d.nome ?? '—'}</span>
        <span class="panel-row-meta">${d.status ?? ''}</span>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="panel-empty">Erro ao carregar histórico.</p>';
    console.error('Erro ao carregar histórico:', err);
  }
}

/* ── Edição de perfil ── */
function iniciarEdicao() {
  const btnEditar   = document.getElementById('btn-editar');
  const btnCancelar = document.getElementById('btn-cancelar');
  const btnSalvar   = document.getElementById('btn-salvar');
  const form        = document.getElementById('perfil-form');
  const view        = document.getElementById('perfil-view');
  const erroEl      = document.getElementById('perfil-erro');

  if (!btnEditar) return;

  // Máscara CPF: formata enquanto digita (somente dígitos, máx 11)
  document.getElementById('input-cpf')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    e.target.value = v;
  });

  btnEditar.addEventListener('click', () => {
    const nomeAtual  = document.getElementById('perfil-nome')?.textContent ?? '';
    const emailAtual = document.getElementById('perfil-email')?.textContent ?? '';
    const cpfAtual   = document.getElementById('perfil-cpf')?.textContent ?? '';

    document.getElementById('input-nome').value  = nomeAtual  !== '—' ? nomeAtual  : '';
    document.getElementById('input-email').value = emailAtual !== '—' ? emailAtual : '';
    document.getElementById('input-cpf').value   = cpfAtual   !== '—' ? cpfAtual   : '';

    view.hidden = true;
    form.hidden = false;
    btnEditar.hidden = true;
    erroEl.hidden = true;
  });

  btnCancelar.addEventListener('click', () => {
    view.hidden = false;
    form.hidden = true;
    btnEditar.hidden = false;
    erroEl.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroEl.hidden = true;

    const nome  = document.getElementById('input-nome').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const cpf   = document.getElementById('input-cpf').value.trim();

    if (!nome && !email && !cpf) {
      mostrarErro(erroEl, 'Informe ao menos um campo para atualizar.');
      return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';

    try {
      const body = {
        ...(nome  && { nome }),
        ...(email && { email }),
        ...(cpf   && { cpf }),
      };
      const resultado = await window.api.put('/me', { body, auth: true });

      setText('perfil-nome',  resultado.nome  ?? '—');
      setText('perfil-email', resultado.email ?? '—');
      setText('.avatar-name', resultado.nome  ?? '', true);
      window.avatar.render(document.getElementById('perfil-initials'), _fotoAtual, resultado.nome);
      window.avatar.render(document.querySelector('.avatar-trigger .avatar'), _fotoAtual, resultado.nome);
      if (cpf) setText('perfil-cpf', formatarCpf(cpf.replace(/\D/g, '')) ?? cpf);

      view.hidden = false;
      form.hidden = true;
      btnEditar.hidden = false;
    } catch (err) {
      mostrarErro(erroEl, err.message ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar';
    }
  });
}

/* ── Alterar senha ── */
function iniciarAlteracaoSenha() {
  const form = document.getElementById('formAlterarSenha');
  const btnSalvar = document.getElementById('btnSalvarSenha');
  const feedbackEl = document.getElementById('senhaFeedback');
  if (!form) return;

  function showFeedback(msg, type) {
    feedbackEl.textContent = msg;
    feedbackEl.hidden = false;
    feedbackEl.style.color = type === 'success' ? 'var(--success, #16a34a)' : 'var(--danger, #e53e3e)';
    if (type === 'success') setTimeout(() => { feedbackEl.hidden = true; }, 4000);
  }

  function limpar() {
    ['senhaAtual', 'senhaNova', 'senhaConfirma'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    feedbackEl.hidden = true;
  }

  document.getElementById('btnCancelarSenha')?.addEventListener('click', limpar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const atual    = document.getElementById('senhaAtual').value;
    const nova     = document.getElementById('senhaNova').value;
    const confirma = document.getElementById('senhaConfirma').value;

    if (!atual || !nova || !confirma) {
      showFeedback('Preencha todos os campos de senha.', 'error'); return;
    }
    if (nova !== confirma) {
      showFeedback('A confirmação não confere com a nova senha.', 'error'); return;
    }
    if (nova.length < 8) {
      showFeedback('A nova senha deve ter ao menos 8 caracteres.', 'error'); return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando…';
    try {
      await window.api.put('/me/password', {
        body: { senha_atual: atual, nova_senha: nova, confirmar_senha: confirma },
        auth: true,
      });
      showFeedback('Senha alterada com sucesso!', 'success');
      limpar();
    } catch (err) {
      const msg = err?.data?.message || err?.data?.error || 'Erro ao alterar senha.';
      showFeedback(msg, 'error');
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar nova senha';
    }
  });
}

/* ── Visualização em modal ── */
function iniciarVisualizacao() {
  const overlay  = document.getElementById('perfil-modal');
  const btnClose = document.getElementById('perfil-modal-close');
  const titulo   = document.getElementById('perfil-modal-titulo');
  const body     = document.getElementById('perfil-modal-body');
  if (!overlay) return;

  const abrir  = () => { overlay.classList.add('is-visible');    document.body.style.overflow = 'hidden'; };
  const fechar = () => { overlay.classList.remove('is-visible'); document.body.style.overflow = ''; };

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  document.getElementById('btn-ver-historico')?.addEventListener('click', () => {
    titulo.textContent = 'Disciplinas';

    if (!_historico.length) {
      body.innerHTML = '<p class="modal-empty">Nenhuma disciplina registrada.</p>';
    } else {
      body.innerHTML = `
        <table class="modal-table">
          <thead>
            <tr>
              <th>Disciplina</th>
              <th>Status</th>
              <th>Período</th>
            </tr>
          </thead>
          <tbody>
            ${_historico.map(d => {
              const status = d.status ?? '—';
              const cls = status === 'Aprovado' ? 'is-success'
                        : (status === 'Reprovado' || status === 'Trancado') ? 'is-danger'
                        : 'is-warning';
              return `
                <tr>
                  <td class="modal-table-name">${d.nome ?? '—'}</td>
                  <td><span class="modal-badge ${cls}">${status}</span></td>
                  <td>${d.periodo ?? d.semestre ?? '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
    abrir();
    lucide.createIcons();
  });

  document.getElementById('btn-ver-certificados')?.addEventListener('click', () => {
    titulo.textContent = 'Certificados';

    if (!_certificados.length) {
      body.innerHTML = '<p class="modal-empty">Nenhum certificado registrado.</p>';
    } else {
      body.innerHTML = _certificados.map(c => `
        <div class="modal-cert-card">
          <div class="modal-cert-icon">
            <i data-lucide="award"></i>
          </div>
          <div class="modal-cert-body">
            <span class="modal-cert-title">${c.nome ?? c.titulo ?? '—'}</span>
            ${c.instituicao ? `<span class="modal-cert-inst">${c.instituicao}</span>` : ''}
            ${c.data_conclusao ? `<span class="modal-cert-date"><i data-lucide="calendar"></i> ${formatarData(c.data_conclusao)}</span>` : ''}
          </div>
          ${c.link_documento ? `<a class="btn btn-primary btn-sm modal-cert-link" href="${c.link_documento}" target="_blank" rel="noopener">Abrir</a>` : ''}
        </div>
      `).join('');
    }
    abrir();
    lucide.createIcons();
  });
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function mostrarErro(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

/* ── Helpers ── */
function setText(selectorOrId, value, isSelector = false) {
  const el = isSelector
    ? document.querySelector(selectorOrId)
    : document.getElementById(selectorOrId);
  if (el) el.textContent = value;
}

function gerarIniciais(nome) {
  if (!nome) return '--';
  const partes = nome.trim().split(' ');
  const a = partes[0]?.[0] ?? '';
  const b = partes[partes.length - 1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function formatarCpf(cpf) {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
