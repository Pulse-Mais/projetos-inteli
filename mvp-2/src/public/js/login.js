/* login.js — Login + Cadastro multi-etapas (unificado)
   Pulsar · Pulse Mais
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ── Login ── */
  const loginPanel = document.getElementById('login-panel');
  const form       = document.getElementById('login-form');
  const inputUser  = document.getElementById('login-user');
  const inputPwd   = document.getElementById('login-pwd');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = inputUser.value.trim();
      const senha = inputPwd.value;

      if (!email || !senha) {
        showLoginError('Preencha o login e a senha.');
        return;
      }

      const btn = form.querySelector('.login-submit');
      btn.disabled = true;
      btn.textContent = 'Entrando…';

      try {
        const data = await window.api.post('/auth/login', { body: { email, senha } });

        window.api.setToken(data.token);

        const rotas = {
          Aluno:       '/pages/aluno/dashboard.html',
          Mentor:      '/pages/mentor/dashboardMentor.html',
          GestaoGeral: '/pages/gest%C3%A3o/dashboardGestao.html',
          Coordenacao: '/pages/gest%C3%A3o/dashboardGestao.html',
          Assistente:  '/pages/gest%C3%A3o/dashboardGestao.html',
        };

        window.location.href = rotas[data.usuario?.perfil ?? data.perfil] ?? '/pages/aluno/dashboard.html';

      } catch (err) {
        const status = err?.status;
        const msg = status === 401 || status === 400
          ? 'Login ou senha incorretos.'
          : 'Erro ao conectar. Tente novamente.';
        showLoginError(msg);
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    });
  }

  function showLoginError(msg) {
    let el = form.querySelector('.login-error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'login-error';
      el.style.cssText = 'margin:0;font-size:var(--text-sm);color:var(--destructive);font-weight:var(--font-weight-medium)';
      form.insertBefore(el, form.querySelector('.login-submit'));
    }
    el.textContent = msg;
  }

  /* ── Troca Login ↔ Cadastro ── */
  const cadastroPanel = document.getElementById('cadastro-panel');

  document.getElementById('btn-ir-cadastro')?.addEventListener('click', (e) => {
    e.preventDefault();
    loginPanel.hidden    = true;
    cadastroPanel.hidden = false;
    irParaEtapa(1);
  });

  document.getElementById('btn-voltar-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    cadastroPanel.hidden = true;
    loginPanel.hidden    = false;
    irParaEtapa(1);
    limparFormCadastro();
  });

  /* ── Máscara CPF: 000.000.000-00 ── */
  document.getElementById('reg-cpf')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    e.target.value = v;
  });

  /* ── Máscara Telefone: (00) 00000-0000 ── */
  document.getElementById('reg-telefone')?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 6)  v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2)  v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    else if (v.length > 0)  v = v.replace(/(\d{0,2})/, '($1');
    e.target.value = v;
  });

  /* ── Stepper ── */
  const TOTAL_ETAPAS = 4;
  let etapaAtual = 1;

  function irParaEtapa(n) {
    for (let i = 1; i <= TOTAL_ETAPAS; i++) {
      const step = document.getElementById(`reg-step-${i}`);
      if (step) step.classList.toggle('is-visible', i === n);
    }

    document.querySelectorAll('.step-item').forEach((item) => {
      const s = parseInt(item.dataset.step);
      item.classList.toggle('is-active', s === n);
      item.classList.toggle('is-done',   s < n);
    });

    const btnBack   = document.getElementById('reg-btn-back');
    const btnNext   = document.getElementById('reg-btn-next');
    const btnSubmit = document.getElementById('reg-btn-submit');

    if (btnBack)   btnBack.hidden   = n === 1;
    if (btnNext)   btnNext.hidden   = n === TOTAL_ETAPAS;
    if (btnSubmit) btnSubmit.hidden = n !== TOTAL_ETAPAS;

    etapaAtual = n;
    esconderErro();
  }

  function mostrarErro(msg) {
    const el = document.getElementById('cadastro-error');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function esconderErro() {
    const el = document.getElementById('cadastro-error');
    if (el) el.hidden = true;
  }

  /* ── Validação por etapa ── */
  function validarEtapa(n) {
    if (n === 1) {
      const email  = document.getElementById('reg-email').value.trim();
      const senha  = document.getElementById('reg-senha').value;
      const senha2 = document.getElementById('reg-senha2').value;

      if (!email) { mostrarErro('Informe o e-mail.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarErro('E-mail inválido.'); return false; }
      if (!senha) { mostrarErro('Informe a senha.'); return false; }
      if (senha.length < 8) { mostrarErro('A senha deve ter pelo menos 8 caracteres.'); return false; }
      if (senha !== senha2) { mostrarErro('As senhas não coincidem.'); return false; }
    }

    if (n === 2) {
      const nome       = document.getElementById('reg-nome').value.trim();
      const cpf        = document.getElementById('reg-cpf').value.replace(/\D/g, '');
      const nascimento = document.getElementById('reg-nascimento').value;

      if (!nome)             { mostrarErro('Informe o nome completo.'); return false; }
      if (cpf.length !== 11) { mostrarErro('CPF inválido. Digite os 11 dígitos.'); return false; }
      if (!nascimento)       { mostrarErro('Informe a data de nascimento.'); return false; }
    }

    if (n === 4) {
      if (!document.getElementById('reg-lgpd').checked) {
        mostrarErro('É necessário aceitar os termos de privacidade para continuar.');
        return false;
      }
    }

    return true;
  }

  /* ── Navegação ── */
  document.getElementById('reg-btn-next')?.addEventListener('click', () => {
    if (!validarEtapa(etapaAtual)) return;
    if (etapaAtual < TOTAL_ETAPAS) irParaEtapa(etapaAtual + 1);
  });

  document.getElementById('reg-btn-back')?.addEventListener('click', () => {
    if (etapaAtual > 1) irParaEtapa(etapaAtual - 1);
  });

  /* ── Envio final ── */
  document.getElementById('reg-btn-submit')?.addEventListener('click', async () => {
    if (!validarEtapa(etapaAtual)) return;

    const btnSubmit = document.getElementById('reg-btn-submit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando…';

    const cpfDigitos = document.getElementById('reg-cpf').value.replace(/\D/g, '');

    const payload = {
      email:                document.getElementById('reg-email').value.trim(),
      senha:                document.getElementById('reg-senha').value,
      nome:                 document.getElementById('reg-nome').value.trim(),
      cpf:                  cpfDigitos,
      telefone:             document.getElementById('reg-telefone').value.trim() || undefined,
      data_nascimento:      document.getElementById('reg-nascimento').value || undefined,
      genero:               document.getElementById('reg-genero').value     || undefined,
      autodeclaracao_racial: document.getElementById('reg-raca').value      || undefined,
      renda_familiar:       document.getElementById('reg-renda').value      || undefined,
      pcd:                  document.getElementById('reg-pcd').checked,
      tipo_moradia:         document.getElementById('reg-moradia').value    || undefined,
      bairro:               document.getElementById('reg-bairro').value.trim() || undefined,
      cidade:               document.getElementById('reg-cidade').value.trim() || undefined,
      estado:               document.getElementById('reg-estado').value     || undefined,
      consentimento_lgpd:   true,
    };

    try {
      await window.api.post('/auth/cadastro', { body: payload });

      document.getElementById('cadastro-stepper').style.display = 'none';
      document.querySelector('.cadastro-header').style.display  = 'none';
      document.querySelector('.cadastro-nav').style.display     = 'none';
      for (let i = 1; i <= TOTAL_ETAPAS; i++) {
        const s = document.getElementById(`reg-step-${i}`);
        if (s) s.classList.remove('is-visible');
      }
      document.getElementById('cadastro-error').hidden = true;

      const successEl = document.getElementById('cadastro-success');
      successEl.style.display = 'flex';

      let segundos = 5;
      const countdownEl = document.getElementById('cadastro-countdown');
      const tick = setInterval(() => {
        segundos--;
        if (countdownEl) countdownEl.textContent = segundos;
        if (segundos <= 0) {
          clearInterval(tick);

          successEl.style.display = 'none';
          document.getElementById('cadastro-stepper').style.display = '';
          document.querySelector('.cadastro-header').style.display  = '';
          document.querySelector('.cadastro-nav').style.display     = '';

          const btnSubmit = document.getElementById('reg-btn-submit');
          if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Finalizar cadastro'; }

          limparFormCadastro();
          irParaEtapa(1);

          cadastroPanel.hidden = true;
          loginPanel.hidden    = false;
        }
      }, 1000);

    } catch (err) {
      const msg = err?.data?.mensagem ?? err?.message ?? 'Erro ao cadastrar. Tente novamente.';
      mostrarErro(msg);
      btnSubmit.disabled    = false;
      btnSubmit.textContent = 'Finalizar cadastro';
    }
  });

  /* ── Helpers ── */
  function limparFormCadastro() {
    ['reg-email','reg-senha','reg-senha2','reg-nome','reg-cpf','reg-telefone',
     'reg-nascimento','reg-bairro','reg-cidade'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    ['reg-genero','reg-raca','reg-renda','reg-moradia','reg-estado'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const pcd  = document.getElementById('reg-pcd');
    const lgpd = document.getElementById('reg-lgpd');
    if (pcd)  pcd.checked  = false;
    if (lgpd) lgpd.checked = false;
  }

});
