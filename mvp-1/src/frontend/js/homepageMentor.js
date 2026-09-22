// Escapa caracteres HTML para prevenir XSS ao inserir dados dinâmicos no DOM
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

  const nome = sessao.nome || 'Mentor(a)';
  const saudacao = document.getElementById('saudacao');
  if (saudacao) saudacao.textContent = `Olá, ${nome}! Bom te ver por aqui.`;
  const sidebarNome = document.getElementById('sidebarNome');
  if (sidebarNome) sidebarNome.textContent = nome;

  // Carrega foto do mentor no sidebar a partir do cache local e sincroniza com o servidor
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

  const idMentor = String(sessao.id_usuario);

  // Busca os alunos vinculados ao mentor e exibe a tabela e o KPI de alunos ativos
  async function carregarMentorandos() {
    const tbody     = document.getElementById('tabelaMentorandos');
    const kpiAlunos = document.getElementById('kpiAlunos');

    if (!idMentor) {
      if (kpiAlunos) kpiAlunos.textContent = '—';
      if (tbody) tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:28px; color:var(--color-text-support); font-size:13px;">
            Sessão inválida. Faça login novamente.
          </td>
        </tr>`;
      return;
    }

    try {
      const dados = await Auth.fetch(`/mentores/${idMentor}/mentorandos`);

      if (kpiAlunos) kpiAlunos.textContent = dados.length;

      if (dados.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding:28px; color:var(--color-text-support); font-size:13px;">
              Nenhum aluno associado a este mentor ainda.
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = dados.map(aluno => {
        const nome   = sanitize(aluno.nome  || '—');
        const email  = sanitize(aluno.email || '—');
        const prog   = sanitize(aluno.programa || '—');
        const id     = aluno.id_usuario;
        const status = aluno.status || 'ativo';
        const badgeClass = status === 'ativo' ? 'badge--ativo' : 'badge--inativo';
        const badgeLabel = status.charAt(0).toUpperCase() + status.slice(1);
        return `
          <tr>
            <td><a href="dadosAluno.html?id=${id}" class="nome-link">${nome}</a></td>
            <td>${email}</td>
            <td>${prog}</td>
            <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
          </tr>`;
      }).join('');

    } catch (err) {
      console.error('Erro ao carregar mentorandos:', err);
      if (kpiAlunos) kpiAlunos.textContent = '—';
      if (tbody) tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding:28px; color:var(--color-text-support); font-size:13px;">
            Não foi possível carregar os alunos. Verifique se o servidor está rodando.
          </td>
        </tr>`;
    }
  }

  // Busca as mentorias do mentor e calcula os KPIs de realizadas e próxima data
  async function carregarMentorias() {
    const kpiMentorias = document.getElementById('kpiMentorias');
    const kpiProxima   = document.getElementById('kpiProxima');

    if (!idMentor) {
      if (kpiMentorias) kpiMentorias.textContent = '—';
      if (kpiProxima)   kpiProxima.textContent   = '—';
      return;
    }

    try {
      const dados = await Auth.fetch(`/mentores/${idMentor}/mentorias`);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const realizadas = dados.filter(m => new Date(m.data) <= hoje);
      const futuras    = dados
        .filter(m => new Date(m.data) > hoje)
        .sort((a, b) => new Date(a.data) - new Date(b.data));

      if (kpiMentorias) kpiMentorias.textContent = realizadas.length;

      if (kpiProxima) {
        if (futuras.length > 0) {
          const proxData = new Date(futuras[0].data);
          kpiProxima.textContent = proxData.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else {
          kpiProxima.textContent = 'Sem agenda';
        }
      }

    } catch (err) {
      console.error('Erro ao carregar mentorias:', err);
      if (kpiMentorias) kpiMentorias.textContent = '—';
      if (kpiProxima)   kpiProxima.textContent   = '—';
    }
  }

  carregarMentorandos();
  carregarMentorias();

});

// Remove a sessão do mentor e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}
