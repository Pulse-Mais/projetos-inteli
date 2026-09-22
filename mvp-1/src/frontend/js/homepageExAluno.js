document.addEventListener('DOMContentLoaded', function () {
  // Lê o primeiro nome do ex-aluno logado e exibe na saudação da hero section
  const nome = localStorage.getItem('nomeUsuario') || 'Ex-Aluno(a)';
  const primeiroNome = nome.split(' ')[0];

  const elSaudacao = document.getElementById('heroSaudacao');
  if (elSaudacao) elSaudacao.textContent = 'Olá, ' + primeiroNome + '. Bom te ver por aqui.';
});

// Remove a sessão do usuário e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    ['pulsemais_token', 'pulsemais_usuario', 'nomeUsuario', 'perfilUsuario', 'idAluno', 'usuarioId', 'emailUsuario']
      .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = '../index.html';
  }
}
