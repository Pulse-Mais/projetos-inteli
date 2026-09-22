// Escapa caracteres HTML para prevenir XSS
function sanitize(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {

  // Guard: redireciona se não autenticado ou se não for mentor
  if (!Auth.isAuthenticated()) { window.location.replace('../index.html'); return; }
  const sessao = Auth.getUsuario();
  if (!sessao || sessao.perfil !== 'mentor') { window.location.replace('../index.html'); return; }

  const campoBusca  = document.getElementById('campoBusca');
  const listaEl     = document.getElementById('listaAlunos');
  const contadorEl  = document.getElementById('contador');
  const estadoVazio = document.getElementById('estadoVazio');
  const msgVazia    = document.getElementById('estadoVazioMensagem');
  const dicaEl      = document.getElementById('dica');

  let alunos = [];
  const idMentor = String(sessao.id_usuario);
  const nomeMentor = sessao.nome || 'Mentor';

  const sidebarNome = document.getElementById('sidebarNome');
  if (sidebarNome) sidebarNome.textContent = nomeMentor;

  (function () {
    var foto = localStorage.getItem('fotoMentor');
    var el = document.getElementById('sidebarAvatar');
    if (foto && el) el.src = foto;
    Auth.fetch('/usuarios/' + sessao.id_usuario)
      .then(function (dados) {
        if (dados && dados.foto_url) {
          if (el) el.src = dados.foto_url;
          try { localStorage.setItem('fotoMentor', dados.foto_url); } catch (e) {}
        }
      }).catch(function () {});
  })();

  // Busca os alunos vinculados ao mentor logado via GET /mentores/:id/mentorandos
  async function carregarAlunos() {
    contadorEl.textContent = 'Carregando alunos...';

    if (!idMentor) {
      contadorEl.textContent = 'Mentor nao identificado. Faca login novamente.';
      listaEl.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:40px;">
            <p style="color:var(--color-danger); font-weight:600; margin-bottom:10px;">
              Sessao expirada ou mentor nao identificado.
            </p>
            <button class="btn btn--outline" onclick="logout()" style="margin-top:16px;">
              Fazer login novamente
            </button>
          </td>
        </tr>`;
      return;
    }

    try {
      const endpoint = `/mentores/${idMentor}/mentorandos`;
      const dados = await Auth.fetch(endpoint);

      alunos = dados.map(item => ({
        id:       item.id_usuario,
        nome:     item.nome    || '—',
        email:    item.email   || '—',
        programa: item.programa || '—',
        status:   item.status  || 'ativo',
      }));

      renderizarAlunos(alunos);

    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
      contadorEl.textContent = 'Erro ao carregar alunos.';
      listaEl.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:40px;">
            <p style="color:var(--color-danger); font-weight:600; margin-bottom:10px;">
              Não foi possível carregar os alunos.
            </p>
            <p style="font-size:13px; color:var(--color-text-support);">
              Verifique se o servidor backend está rodando.
            </p>
            <button class="btn btn--outline" onclick="location.reload()" style="margin-top:16px;">
              Tentar novamente
            </button>
          </td>
        </tr>`;
    }
  }

  // Popula a tabela com as linhas dos alunos; exibe estado vazio se a lista estiver vazia
  function renderizarAlunos(lista) {
    listaEl.innerHTML = '';

    if (lista.length === 0) {
      estadoVazio.style.display = 'flex';
      msgVazia.textContent = alunos.length === 0
        ? 'Nenhum aluno vinculado ao seu perfil ainda.'
        : 'Nenhum aluno encontrado para a busca realizada.';
      contadorEl.textContent = '0 alunos encontrados';
      if (dicaEl) dicaEl.style.display = 'none';
      return;
    }

    estadoVazio.style.display = 'none';
    contadorEl.textContent = `${lista.length} aluno(s) encontrado(s)`;
    if (dicaEl) dicaEl.style.display = 'block';

    lista.forEach(aluno => {
      const tr = document.createElement('tr');
      const badgeClass = aluno.status === 'ativo' ? 'badge--ativo' : 'badge--inativo';
      const badgeLabel = aluno.status.charAt(0).toUpperCase() + aluno.status.slice(1);
      tr.innerHTML = `
        <td><a href="dadosAluno.html?id=${aluno.id}" class="nome-link">${sanitize(aluno.nome)}</a></td>
        <td>${sanitize(aluno.email)}</td>
        <td>${sanitize(aluno.programa)}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
      `;
      // Torna a linha inteira clicável como alternativa ao link do nome
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') {
          window.location.href = `dadosAluno.html?id=${aluno.id}`;
        }
      });
      listaEl.appendChild(tr);
    });
  }

  // Filtra os alunos em memória pelo termo digitado (nome, email ou programa)
  function filtrarAlunos() {
    const termo = campoBusca.value.toLowerCase().trim();
    if (!termo) {
      renderizarAlunos(alunos);
      return;
    }
    const filtrados = alunos.filter(a =>
      a.nome.toLowerCase().includes(termo) ||
      a.email.toLowerCase().includes(termo) ||
      a.programa.toLowerCase().includes(termo)
    );
    renderizarAlunos(filtrados);
  }

  // Executa o filtro a cada caractere digitado no campo de busca
  campoBusca.addEventListener('input', filtrarAlunos);

  carregarAlunos();

});

// Remove a sessão do mentor e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}
