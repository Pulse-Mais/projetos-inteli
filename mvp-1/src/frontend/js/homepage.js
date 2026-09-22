document.addEventListener('DOMContentLoaded', function() {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  // Lê o nome do coordenador salvo no login e atualiza a saudação e o nome na sidebar
  const nome = localStorage.getItem('nomeUsuario') || 'Coordenador(a)';

  const saudacao  = document.getElementById('saudacao');
  const nomeCoord = document.getElementById('nomeCoord');

  if (saudacao) saudacao.textContent = `Olá, ${nome}! Bom te ver por aqui.`;
  if (nomeCoord) nomeCoord.textContent = nome;
});

// Remove a sessão do coordenador e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    localStorage.removeItem('pulsemais_token');
    localStorage.removeItem('pulsemais_usuario');
    localStorage.removeItem('nomeUsuario');
    localStorage.removeItem('perfilUsuario');
    localStorage.removeItem('usuarioId');
    window.location.href = '../index.html';
  }
}
