(function (window, document) {
  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function getRmGestor() {
    return window.localStorage.getItem('rmGestor') || '';
  }

  function normalizarTexto(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function formatarStatus(status) {
    if (typeof status === 'boolean') {
      return status ? 'Ativo' : 'Inativo';
    }

    const statusNormalizado = normalizarTexto(status);

    if (
      statusNormalizado === 'formado'
      || statusNormalizado === 'capacitado'
      || statusNormalizado === 'concluido'
      || statusNormalizado === 'concluida'
      || statusNormalizado === 'egresso'
    ) {
      return 'Formado';
    }

    if (statusNormalizado === 'true') {
      return 'Ativo';
    }

    if (statusNormalizado === 'false') {
      return 'Inativo';
    }

    const texto = String(status || '').trim();

    if (!texto) {
      return 'Sem status';
    }

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function getClasseStatus(status) {
    if (typeof status === 'boolean') {
      return status ? 'pill-ativo' : 'pill-inativo';
    }

    const statusNormalizado = normalizarTexto(status);

    if (
      statusNormalizado === 'true' ||
      statusNormalizado === 'ativo'
      || statusNormalizado === 'ativa'
      || statusNormalizado === 'capacitado'
      || statusNormalizado === 'em andamento'
    ) {
      return 'pill-ativo';
    }

    if (
      statusNormalizado === 'false' ||
      statusNormalizado === 'inativo'
      || statusNormalizado === 'inativa'
      || statusNormalizado === 'evadido'
      || statusNormalizado === 'desligado'
    ) {
      return 'pill-inativo';
    }

    if (
      statusNormalizado === 'formado'
      || statusNormalizado === 'capacitado'
      || statusNormalizado === 'concluido'
      || statusNormalizado === 'concluida'
      || statusNormalizado === 'egresso'
    ) {
      return 'pill-neutro';
    }

    return 'pill-neutro';
  }

  const STATUS_ATIVO_LISTA = ['ativo', 'ativa', 'true', 't', '1'];

  function statusAtivo(status) {
    const normalizado = normalizarTexto(status);
    return STATUS_ATIVO_LISTA.includes(normalizado);
  }

  function recriarIcones() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async function preencherGestorLogado() {
    const card = document.querySelector('.manager-card p');

    if (!card || !window.GestorAPI) {
      return;
    }

    try {
      const gestor = await window.GestorAPI.buscarGestor(getRmGestor());
      const nomeCompleto = String(gestor.nome || 'Gestor').trim();
      card.innerHTML = `Ola, ${nomeCompleto}<br>Gestor`;
    } catch (error) {
      if (error && error.status === 404) {
        window.localStorage.removeItem('rmGestor');
      }
      console.warn('[Gestor] Nao foi possivel carregar o gestor logado.', error);
    }
  }

  async function realizarLogout() {
    const botao = document.getElementById('logoutButton');
    const estavaDesabilitado = botao?.disabled;

    if (botao) {
      botao.disabled = true;
    }

    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Nao foi possivel encerrar a sessao.');
      }

      localStorage.removeItem('rmGestor');
      localStorage.removeItem('perfilAcesso');
      sessionStorage.removeItem('rmGestor');
      sessionStorage.removeItem('perfilAcesso');

      window.location.href = '/login.html';
    } catch (error) {
      console.error('[Gestor] logout', error);
      window.alert(error.message || 'Nao foi possivel encerrar a sessao.');
    } finally {
      if (botao) {
        botao.disabled = Boolean(estavaDesabilitado);
      }
    }
  }

  window.GestorApp = {
    getParams,
    getRmGestor,
    normalizarTexto,
    formatarStatus,
    getClasseStatus,
    statusAtivo,
    recriarIcones,
    preencherGestorLogado,
  };

  document.addEventListener('DOMContentLoaded', () => {
    preencherGestorLogado();
    recriarIcones();
    document.getElementById('logoutButton')?.addEventListener('click', realizarLogout);
  });
})(window, document);
