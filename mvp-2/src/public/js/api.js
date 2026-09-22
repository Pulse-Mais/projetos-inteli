const API_BASE_URL  = '/api';
const TOKEN_KEY     = 'pulsar_token';
const USER_KEY      = 'pulsar_usuario';

const TIMEOUT_MS    = 10_000;  // aborta a request após 10s sem resposta
const MAX_RETRIES   = 2;       // até 2 tentativas extras para GETs (3 total)
const RETRY_BASE_MS = 500;     // backoff: 500ms, 1000ms entre tentativas
const SAFE_METHODS  = new Set(['GET', 'HEAD']); // únicos métodos idempotentes que podem ser refeitos

/* ── Cache de respostas GET (sessionStorage com TTL) ── */
const CACHE_PREFIX  = 'pulsar_rc_';
const CACHE_DEF_TTL = 30_000; // 30s padrão

function _cKey(endpoint, params) {
  return CACHE_PREFIX + endpoint + (params ? '\0' + new URLSearchParams(params) : '');
}
function _cRead(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const { d, e } = JSON.parse(raw);
    if (Date.now() > e) { sessionStorage.removeItem(key); return undefined; }
    return d;
  } catch { return undefined; }
}
function _cWrite(key, data, ttl) {
  try { sessionStorage.setItem(key, JSON.stringify({ d: data, e: Date.now() + ttl })); } catch {}
}
function invalidateCache(fragment) {
  for (const k of Object.keys(sessionStorage)) {
    if (k.startsWith(CACHE_PREFIX) && (!fragment || fragment === '*' || k.includes(fragment)))
      sessionStorage.removeItem(k);
  }
}

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (raw) return JSON.parse(raw);

  /* Sessões antigas (logadas antes do usuário ser salvo) caem aqui:
     extrai os dados básicos do próprio token JWT como fallback. */
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const usuario = { id: payload.id, nome: payload.nome, perfil: payload.perfil, jovem_id: payload.jovem_id };
    setUser(usuario);
    return usuario;
  } catch {
    return null;
  }
}

function setUser(usuario) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function clearUser() {
  sessionStorage.removeItem(USER_KEY);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function request(endpoint, { method = 'GET', body, params, auth = false, timeout = TIMEOUT_MS } = {}) {
  let url = `${API_BASE_URL}${endpoint}`;

  if (params && Object.keys(params).length > 0) {
    url += '?' + new URLSearchParams(params).toString();
  }

  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

  const fetchOptions = { method, headers };
  if (body !== undefined) fetchOptions.body = JSON.stringify(body);

  const isIdempotent = SAFE_METHODS.has(method.toUpperCase());
  const maxAttempts  = isIdempotent ? MAX_RETRIES + 1 : 1;

  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });

      if (response.status === 204) return null;

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 && !window.location.pathname.includes('login')) {
          clearToken();
          window.location.href = '/pages/login.html';
          return;
        }
        const err = new Error(data?.message ?? response.statusText);
        err.status = response.status;
        err.data   = data;
        throw err;
      }

      return data;

    } catch (err) {
      if (err.name === 'AbortError') {
        err.message = `Timeout: servidor não respondeu em ${timeout / 1000}s`;
        err.status  = 0;
      }

      // Erros de cliente (4xx) nunca são refeitos — a request estava errada
      const isTransient = !err.status || err.status === 503 || err.status === 504;
      if (!isTransient || !isIdempotent) throw err;

      lastErr = err;
      if (attempt < maxAttempts) await sleep(RETRY_BASE_MS * attempt); // 500ms, 1000ms

    } finally {
      clearTimeout(timerId);
    }
  }

  throw lastErr;
}

const get    = (endpoint, { cache: useCache, cacheTtl = CACHE_DEF_TTL, ...options } = {}) => {
  if (!useCache) return request(endpoint, { ...options, method: 'GET' });
  const key    = _cKey(endpoint, options.params);
  const cached = _cRead(key);
  if (cached !== undefined) return Promise.resolve(cached);
  return request(endpoint, { ...options, method: 'GET' }).then(data => {
    if (data != null) _cWrite(key, data, cacheTtl);
    return data;
  });
};
const post   = (endpoint, options = {}) => request(endpoint, { ...options, method: 'POST'   });
const put    = (endpoint, options = {}) => request(endpoint, { ...options, method: 'PUT'    });
const patch  = (endpoint, options = {}) => request(endpoint, { ...options, method: 'PATCH'  });
const del    = (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' });

async function login(email, senha) {
  const data = await post('/auth/login', { body: { email, senha } });
  setToken(data.token);
  return data;
}

function logout() {
  clearToken();
  clearUser();
  window.location.href = '/pages/aluno/login.html';
}

window.api = { getToken, setToken, clearToken, getUser, setUser, clearUser, request, get, post, put, patch, delete: del, login, logout, invalidateCache };

/* ── Avatar: foto de perfil com fallback para iniciais ──────────────────────────
   Fonte única da foto: usuarios.foto_url (do próprio usuário ou, para um jovem,
   da conta vinculada via usuarios.jovem_id). Usado por todas as telas
   (Gestão, Mentor, Aluno) para padronizar a exibição. */
function avatarInitials(nome) {
  if (!nome) return '—';
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase();
}

// Renderiza a foto (como <img>) ou as iniciais dentro de um elemento "círculo".
// Constrói o <img> via DOM (sem innerHTML de dado externo) para evitar injeção.
function renderAvatar(el, fotoUrl, nome) {
  if (!el) return;
  el.innerHTML = '';
  if (fotoUrl) {
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = nome ? `Foto de ${nome}` : 'Foto de perfil';
    img.loading = 'lazy';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block';
    el.appendChild(img);
  } else {
    el.textContent = avatarInitials(nome);
  }
}

window.avatar = { initials: avatarInitials, render: renderAvatar };
