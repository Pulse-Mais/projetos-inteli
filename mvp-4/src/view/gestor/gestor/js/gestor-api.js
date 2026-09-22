(function (window) {
  const JSON_CONTENT_TYPE = 'application/json';

  function getBaseUrlInicial() {
    if (window.PULSE_API_BASE_URL) {
      return String(window.PULSE_API_BASE_URL).replace(/\/$/, '');
    }

    const hostLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (hostLocal && window.location.port !== '3000') {
      return 'http://localhost:3000';
    }

    return '';
  }

  const config = {
    baseUrl: getBaseUrlInicial(),
  };

  function setBaseUrl(baseUrl) {
    config.baseUrl = String(baseUrl || '').replace(/\/$/, '');
  }

  function buildUrl(endpoint, query) {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const params = new URLSearchParams();

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      params.append(key, value);
    });

    const queryString = params.toString();
    return `${config.baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  }

  async function parseResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes(JSON_CONTENT_TYPE)) {
      return response.json();
    }

    return response.text();
  }

  async function request(endpoint, options) {
    const { query, body, headers, ...fetchOptions } = options || {};
    const requestOptions = {
      ...fetchOptions,
      headers: {
        Accept: JSON_CONTENT_TYPE,
        ...headers,
      },
    };

    if (body !== undefined) {
      requestOptions.headers['Content-Type'] = JSON_CONTENT_TYPE;
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(endpoint, query), requestOptions);
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data && typeof data === 'object' && data.error
        ? data.error
        : 'Erro ao realizar requisicao.';
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function get(endpoint, query) {
    return request(endpoint, { method: 'GET', query });
  }

  function post(endpoint, body, headers) {
    return request(endpoint, { method: 'POST', body, headers });
  }

  function del(endpoint, headers) {
    return request(endpoint, { method: 'DELETE', headers });
  }

  async function postForm(endpoint, formData, headers) {
    const response = await fetch(buildUrl(endpoint), {
      method: 'POST',
      headers: {
        Accept: JSON_CONTENT_TYPE,
        ...headers,
      },
      body: formData,
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data && typeof data === 'object' && data.error
        ? data.error
        : 'Erro ao realizar requisicao.';
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  window.GestorAPI = {
    setBaseUrl,

    buscarGestor(rm) {
      return get(`/gestor/${rm}`);
    },

    listarAlunos(rm) {
      return get(`/gestor/${rm}/alunos`);
    },

    filtrarAlunos(rm, filtros) {
      return get(`/gestor/${rm}/alunos/filtros`, filtros);
    },

    buscarAlunoPorRa(rm, ra) {
      return get(`/gestor/${rm}/alunos/${ra}`);
    },

    listarAnotacoesAluno(ra) {
      return get(`/alunos/${ra}/anotacoes`);
    },

    criarAnotacaoAluno(ra, dados) {
      return post(`/alunos/${ra}/anotacoes`, dados);
    },

    buscarFrequenciaAluno(ra) {
      return get(`/gestao/alunos/${ra}/frequencia/aulas`);
    },

    listarTurmas() {
      return get('/gestao/turmas', { page: 1, limit: 100 });
    },

    enviarComunicado(dados) {
      return post('/gestor/comunicados', dados, { 'x-perfil': 'gestor' });
    },

    listarComunicados() {
      return get('/gestor/comunicados');
    },

    excluirComunicado(idComunicado) {
      return del(`/gestor/comunicados/${idComunicado}`, { 'x-perfil': 'gestor' });
    },

    importarHistoricoCsv(arquivo) {
      const formData = new FormData();
      formData.append('file', arquivo);
      return postForm('/gestor/importacao', formData, { 'x-perfil': 'gestor' });
    },
  };
})(window);
