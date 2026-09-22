(function (window) {
  const DEFAULT_API_BASE_URL = "";
  const JSON_CONTENT_TYPE = "application/json";

  const config = {
    baseUrl: window.PULSE_API_BASE_URL || DEFAULT_API_BASE_URL,
  };

  function setBaseUrl(baseUrl) {
    config.baseUrl = String(baseUrl || "").replace(/\/$/, "");
  }

  function buildUrl(endpoint, query) {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const params = new URLSearchParams();

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      params.append(key, value);
    });

    const queryString = params.toString();
    return `${config.baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
  }

  async function parseResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

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
      requestOptions.headers["Content-Type"] = JSON_CONTENT_TYPE;
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(buildUrl(endpoint, query), requestOptions);
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data && typeof data === "object" && data.error ? data.error : "Erro ao realizar requisicao.";
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async function postForm(endpoint, formData, headers) {
    const response = await fetch(buildUrl(endpoint), {
      method: "POST",
      body: formData,
      headers: {
        Accept: JSON_CONTENT_TYPE,
        ...(headers || {}),
      },
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data && typeof data === "object" && data.error ? data.error : "Erro ao realizar requisicao.";
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  function get(endpoint, query) {
    return request(endpoint, {
      method: "GET",
      query,
    });
  }

  function post(endpoint, body) {
    return request(endpoint, {
      method: "POST",
      body,
    });
  }

  function patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",
      body,
    });
  }

  function del(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  }

  const CoordenadoraAPI = {
    setBaseUrl,

    buscarCoordenadora(rm) {
      return get(`/coordenadora/${rm}`);
    },

    listarAlunos(rm) {
      return get(`/coordenadora/${rm}/alunos`);
    },

    filtrarAlunos(rm, filtros) {
      return get(`/coordenadora/${rm}/alunos/filtros`, filtros);
    },

    listarTurmas(query) {
      return get("/gestao/turmas", query);
    },

    buscarDashboard(filtros) {
      return get("/dashboard", filtros);
    },

    buscarFrequenciasDashboard(filtros) {
      return get("/dashboard/frequencia", filtros);
    },

    buscarAlunoPorRa(ra) {
      return get(`/alunos/${ra}`);
    },

    atualizarAluno(ra, dados) {
      return patch(`/alunos/${ra}`, dados);
    },

    registrarEmpregoAluno(ra, dados) {
      return post(`/gestao/alunos/${ra}/emprego`, dados);
    },

    buscarJornadaAluno(ra) {
      return get(`/aluno/${ra}/jornada`);
    },

    concluirModuloAluno(rm, ra, modulo, dados) {
      return post(`/coordenadora/${rm}/alunos/${ra}/modulos/${modulo}/conclusao`, dados);
    },

    desfazerConclusaoModuloAluno(rm, ra, modulo) {
      return del(`/coordenadora/${rm}/alunos/${ra}/modulos/${modulo}/conclusao`);
    },

    listarRelatorios(rm, ra) {
      return get(`/coordenadora/${rm}/alunos/${ra}/relatorios`);
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

    registrarFrequenciaAula(ra, dados) {
      return post(`/gestao/alunos/${ra}/frequencia/aulas`, dados);
    },

    registrarParticipacaoEvento(ra, dados) {
      return post(`/gestao/alunos/${ra}/frequencia/eventos`, dados);
    },

    registrarObservacao(rm, ra, dados) {
      return post(
        `/coordenadora/${rm}/alunos/${ra}/observacoes`,
        dados,
      );
    },

    registrarFrequencia(rm, ra, dados) {
      return post(`/coordenadora/${rm}/alunos/${ra}/frequencias`, dados);
    },

    atualizarFrequencia(rm, ra, idAula, dados) {
      return patch(`/coordenadora/${rm}/alunos/${ra}/frequencias/${idAula}`, dados);
    },

    listarComunicados(rm) {
      return get(`/coordenadora/${rm}/eventos`);
    },

    registrarEvento(rm, dados) {
      return post(`/coordenadora/${rm}/eventos`, dados);
    },

    excluirComunicado(rm, idComunicado) {
      return del(`/coordenadora/${rm}/eventos/${idComunicado}`);
    },

    importarHistoricoCsv(arquivo) {
      const formData = new FormData();
      formData.append("file", arquivo);
      return postForm("/gestor/importacao", formData, { "x-perfil": "coordenadora" });
    },
  };

  window.CoordenadoraAPI = CoordenadoraAPI;

  async function preencherCoordenadoraLogada() {
    const nomeEl = document.querySelector('.sidebar-user-nome');
    const cargoEl = document.querySelector('.sidebar-user-cargo');
    const rm = window.localStorage.getItem('rmCoordenadora') || window.PULSE_COORDENADORA_RM || '1001';

    if (!nomeEl && !cargoEl) {
      return;
    }

    try {
      const coordenadora = await CoordenadoraAPI.buscarCoordenadora(rm);
      const nomeCompleto = String(coordenadora?.nome || 'Coordenadora').trim();
      const cargo = String(coordenadora?.cargo || 'Coordenadora').trim();

      if (nomeEl) {
        nomeEl.textContent = `Olá, ${nomeCompleto}`;
      }

      if (cargoEl) {
        cargoEl.textContent = cargo;
      }
    } catch (error) {
      console.warn('[Coordenadora] Nao foi possivel carregar a coordenadora logada.', error);
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

      localStorage.removeItem('coordenadoraRm');
      localStorage.removeItem('perfilAcesso');
      sessionStorage.removeItem('coordenadoraRm');
      sessionStorage.removeItem('perfilAcesso');

      window.location.href = '/login.html';
    } catch (error) {
      console.error('[Coordenadora] logout', error);
      window.alert(error.message || 'Nao foi possivel encerrar a sessao.');
    } finally {
      if (botao) {
        botao.disabled = Boolean(estavaDesabilitado);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    preencherCoordenadoraLogada();
    document.getElementById('logoutButton')?.addEventListener('click', realizarLogout);
  });
})(window);
