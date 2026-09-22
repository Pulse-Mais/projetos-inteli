(function () {
  window.lucide?.createIcons();

  async function lerResposta(response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const texto = await response.text();
    return { error: texto && !texto.startsWith('<!DOCTYPE') ? texto : null };
  }

  const form = document.getElementById('form-login');
  const senhaToggle = document.querySelector('.login-senha-toggle');

  senhaToggle?.addEventListener('click', () => {
    const senha = form?.elements.senha;
    if (!senha) return;

    const exibir = senha.type === 'password';
    senha.type = exibir ? 'text' : 'password';
    senhaToggle.setAttribute('aria-label', exibir ? 'Ocultar senha' : 'Mostrar senha');
    senhaToggle.setAttribute('aria-pressed', String(exibir));
    senhaToggle.innerHTML = `<i data-lucide="${exibir ? 'eye' : 'eye-off'}" aria-hidden="true"></i>`;
    window.lucide?.createIcons();
  });

  form?.addEventListener('submit', async function (event) {
    event.preventDefault();

    const botao = this.querySelector('button[type="submit"]');
    const erro = document.getElementById('erro-login');

    if (!this.reportValidity()) return;

    botao.disabled = true;
    erro.textContent = '';

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          perfil: this.perfil.value,
          identificador: this.identificador.value.trim(),
          senha: this.senha.value,
        }),
      });
      const data = await lerResposta(response);

      if (!response.ok) throw new Error(data.error || 'Nao foi possivel entrar.');

      const chavesPorPerfil = { coordenadora: ['rmCoordenadora'], gestor: ['rmGestor'], psicologa: ['psicologaRm'], aluno: ['alunoRa', 'raAluno'] };
      localStorage.clear();
      sessionStorage.clear();

      [...(chavesPorPerfil[data.usuario.perfil] || []), 'perfilAcesso'].forEach((chave) => {
        const valor = chave === 'perfilAcesso' ? data.usuario.perfil : String(data.usuario.id);
        localStorage.setItem(chave, valor);
        sessionStorage.setItem(chave, valor);
      });

      window.location.href = data.destino;
    } catch (error) {
      erro.textContent = error.message || 'Credenciais invalidas.';
    } finally {
      botao.disabled = false;
    }
  });
})();
