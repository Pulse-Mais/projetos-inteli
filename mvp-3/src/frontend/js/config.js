(function () {
  'use strict';

  const DEV_API_BASE_URL = 'http://localhost:3000/api';

  function resolveApiBaseUrl() {
    // Permite sobrescrever manualmente a URL da API.
    if (window.PULSE_API_BASE) {
      return String(window.PULSE_API_BASE).trim();
    }

    const host = window.location.hostname;

    // Acesso local na própria máquina.
    const isLocalhost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '';

    if (isLocalhost) {
      return DEV_API_BASE_URL;
    }

    // Quando acessado externamente pelo Cloudflare Tunnel,
    // a API fica no mesmo host do frontend.
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    if (hostname) {
      return `${protocol}//${hostname}/api`;
    }

    console.error(
      '[PulseConfig] URL da API não configurada.'
    );

    return '';
  }

  window.PulseConfig = {
    apiBaseUrl: resolveApiBaseUrl()
  };

  window.PULSE_API_BASE = window.PulseConfig.apiBaseUrl;

  console.log(
    '[PulseConfig] API:',
    window.PULSE_API_BASE
  );
})();