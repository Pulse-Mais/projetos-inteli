// Utilitários compartilhados do Portal do Aluno.
// Carregado antes dos scripts de cada página do portal.
// Depende de: auth.js (carregado antes deste arquivo)

// Guard de sessão: redireciona para o login se não houver JWT válido com perfil 'aluno'
(function sessionGuard() {
  if (!Auth.isAuthenticated()) {
    window.location.replace('../index.html');
    return;
  }
  const usuario = Auth.getUsuario();
  if (!usuario || usuario.perfil !== 'aluno') {
    window.location.replace('../index.html');
  }
}());

// Aplica a foto de perfil salva no localStorage em todos os avatares da página
function carregarFotoSalva() {
  const foto = localStorage.getItem('fotoPerfil');
  document.querySelectorAll('.sidebar__avatar').forEach(function (el) {
    el.src = foto || '/assets/avatar.png';
  });
  const portalFoto = document.getElementById('portalFoto');
  if (portalFoto) portalFoto.src = foto || '/assets/avatar.png';
  const btnRemover = document.getElementById('btnRemoverFoto');
  if (btnRemover) btnRemover.style.display = foto ? '' : 'none';
}

// Configura o toggle da sidebar mobile e o botão de logout declarativo no HTML
document.addEventListener('DOMContentLoaded', function () {
  carregarFotoSalva();
  const toggle  = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggle && sidebar && overlay) {
    // Abre/fecha a sidebar no mobile ao clicar no botão hamburguer
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('aberta');
      overlay.classList.toggle('ativa');
    });
    // Fecha a sidebar ao clicar no overlay escuro
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('aberta');
      overlay.classList.remove('ativa');
    });
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});

// Remove a sessão do aluno e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    Auth.clearSession();
    window.location.href = '../index.html';
  }
}

// Formata data ISO para DD/MM (ex.: "15/06")
function formatarDataCurta(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Formata data ISO para DD/Mês abrev/AAAA (ex.: "15/jun./2025")
function formatarDataMedia(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Escapa caracteres HTML antes de inserir em innerHTML para prevenir XSS
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
