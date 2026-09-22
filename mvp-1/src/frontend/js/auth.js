// Utilitário central de autenticação. Deve ser carregado antes de qualquer outro script.
// Expõe o objeto global `Auth` com métodos para gerenciar a sessão do usuário via localStorage.

const Auth = (function () {
  const USUARIO_KEY = 'pulsemais_usuario';
  const FETCH_TIMEOUT_MS = 15000;

  // Retorna o objeto do usuário autenticado parseado do localStorage
  function getUsuario() {
    try {
      return JSON.parse(localStorage.getItem(USUARIO_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  // Verifica se há sessão ativa (usuário salvo no localStorage)
  function isAuthenticated() {
    return getUsuario() !== null;
  }

  // Persiste os dados do usuário no localStorage
  function setSession(usuario) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    localStorage.setItem('nomeUsuario',   usuario.nome);
    localStorage.setItem('perfilUsuario', usuario.perfil);
    localStorage.setItem('idAluno',       String(usuario.id_usuario));
  }

  // Remove os dados do usuário e todas as chaves auxiliares do localStorage
  function clearSession() {
    [USUARIO_KEY,
     'nomeUsuario', 'perfilUsuario', 'idAluno', 'usuarioId', 'emailUsuario',
    ].forEach(k => localStorage.removeItem(k));
  }

  // fetch() centralizado: aplica timeout de 15s e retorna o JSON já parseado
  async function apiFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const headers = Object.assign({}, options.headers || {});
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    let res;
    try {
      res = await fetch(url, Object.assign({}, options, {
        headers,
        signal: controller.signal,
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('A requisição excedeu o tempo limite. Verifique sua conexão.');
      }
      throw new Error('Falha de conexão. Verifique sua rede e tente novamente.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(body.error || 'Erro ' + res.status);
    }

    return res.json();
  }

  return { getUsuario, isAuthenticated, setSession, clearSession, fetch: apiFetch };
}());
