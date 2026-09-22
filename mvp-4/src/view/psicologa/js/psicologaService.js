(function () {
  const LIVE_SERVER_PORTS = ['5500', '5501'];
  const API_BASE_URL = window.PULSE_API_BASE_URL
    || (LIVE_SERVER_PORTS.includes(window.location.port) ? 'http://localhost:3000' : '');

  function montarQueryString(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        query.append(chave, valor);
      }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
  }

  async function request(endpoint, options = {}) {
    const { params, headers, ...fetchOptions } = options;
    const url = `${API_BASE_URL}${endpoint}${montarQueryString(params)}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...fetchOptions,
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const mensagem = data?.error || data?.message || 'Erro ao comunicar com o backend.';
      throw new Error(mensagem);
    }

    return data;
  }

  function buscarPsicologaPorRm(rm) {
    return request(`/psicologa/${rm}`);
  }

  function listarAlunosAtendidos(rm, filtros = {}) {
    return request(`/psicologa/${rm}/alunos`, {
      params: filtros,
    });
  }

  async function listarTurmas() {
    const limit = 100;
    let page = 1;
    let todasAsTurmas = [];
    let total = 0;

    do {
      const resposta = await request('/gestao/turmas', {
        params: { page, limit },
      });

      const turmas = Array.isArray(resposta?.data) ? resposta.data : [];
      todasAsTurmas = todasAsTurmas.concat(turmas);
      total = Number(resposta?.pagination?.total || todasAsTurmas.length);
      page += 1;
    } while (todasAsTurmas.length < total);

    return todasAsTurmas;
  }

  function listarRelatoriosAluno(rm, ra) {
    return request(`/psicologo/alunos/${ra}/prontuario`, {
      params: { rm },
    });
  }

  function criarRelatorioAluno(rm, ra, dadosRelatorio) {
    return request(`/psicologo/alunos/${ra}/prontuario`, {
      method: 'POST',
      params: { rm },
      body: JSON.stringify(dadosRelatorio),
    });
  }

  function atualizarRelatorioAluno(rm, ra, idRelatorio, dadosRelatorio) {
    return request(`/psicologa/${rm}/alunos/${ra}/relatorios/${idRelatorio}`, {
      method: 'PATCH',
      body: JSON.stringify(dadosRelatorio),
    });
  }

  function atualizarStatusAtendimento(rm, ra, status) {
    return request(`/psicologa/${rm}/alunos/${ra}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
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

      localStorage.removeItem('psicologaRm');
      localStorage.removeItem('perfilAcesso');
      sessionStorage.removeItem('psicologaRm');
      sessionStorage.removeItem('perfilAcesso');

      window.location.href = '/login.html';
    } catch (error) {
      console.error('[Psicologa] logout', error);
      window.alert(error.message || 'Nao foi possivel encerrar a sessao.');
    } finally {
      if (botao) {
        botao.disabled = Boolean(estavaDesabilitado);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logoutButton')?.addEventListener('click', realizarLogout);
  });

  window.PsicologaService = {
    buscarPsicologaPorRm,
    listarAlunosAtendidos,
    listarTurmas,
    listarRelatoriosAluno,
    criarRelatorioAluno,
    atualizarRelatorioAluno,
    atualizarStatusAtendimento,
  };
})();
