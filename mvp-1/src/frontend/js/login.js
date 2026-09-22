// Autenticação passwordless do Portal Pulse Mais.
// Fluxo: verifica sessão ativa → usuário informa e-mail → POST /auth/login
// → backend retorna { usuario } → Auth.setSession() → redirecionamento por perfil.
// Fallback do mentor: enquanto mentor@pulsemais.org.br não estiver no Supabase, usa mock local (ver bloco catch).
// Depende de: auth.js (carregado antes deste arquivo)

document.addEventListener('DOMContentLoaded', function () {

  const form         = document.getElementById('loginForm');
  const mensagemErro = document.getElementById('mensagemErro');
  const btnEntrar    = document.getElementById('btnEntrar');

  // Se já houver sessão ativa, restaura as chaves legadas e redireciona sem exibir o formulário
  if (Auth.isAuthenticated()) {
    const sessao = Auth.getUsuario();
    if (sessao) {
      restaurarChavesLegadas(sessao);
      redirecionarPorPerfil(sessao.perfil);
      return;
    }
  }

  // Valida o e-mail, envia para POST /auth/login e redireciona conforme o perfil retornado
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    ocultarErro();

    const email = document.getElementById('email').value.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      exibirErro('Informe um e-mail válido.');
      return;
    }

    btnEntrar.textContent = 'Entrando...';
    btnEntrar.disabled = true;

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'E-mail não encontrado. Verifique e tente novamente.');
      }

      Auth.setSession(data.usuario);
      restaurarChavesLegadas(data.usuario);
      redirecionarPorPerfil(data.usuario.perfil);

    } catch (err) {
      // Fallback do mentor enquanto não há cadastro no Supabase
      if (email === 'mentor@pulsemais.org.br') {
        localStorage.setItem('nomeUsuario',   'Ana Oliveira');
        localStorage.setItem('perfilUsuario', 'mentor');
        localStorage.setItem('idUsuario',     '1');
        window.location.href = 'pages/homepageMentor.html';
        return;
      }

      exibirErro(err.message || 'Erro ao conectar. Tente novamente.');
      btnEntrar.textContent = 'Entrar';
      btnEntrar.disabled = false;
    }
  });

  // Grava as chaves de localStorage que as páginas legadas esperam conforme o perfil
  // (auth.js já grava token, nomeUsuario, perfilUsuario e idAluno; aqui cobre coordenador e mentor)
  function restaurarChavesLegadas(usuario) {
    const id = String(usuario.id_usuario || '');
    localStorage.setItem('nomeUsuario',   usuario.nome   || '');
    localStorage.setItem('perfilUsuario', usuario.perfil || '');

    if (usuario.perfil === 'coordenador') {
      localStorage.setItem('usuarioId',    id);                 // lido por perfilCoordenador.js
      localStorage.setItem('emailUsuario', usuario.email || '');
    } else {
      localStorage.removeItem('usuarioId'); // evita que aluno/mentor seja tratado como coordenador
    }

    if (usuario.perfil === 'mentor') {
      localStorage.setItem('idUsuario', id); // lido por homepageMentor.js e agendaMentorias.js
    }
  }

  // Redireciona o usuário para a página inicial do seu perfil após login bem-sucedido
  function redirecionarPorPerfil(perfil) {
    const destinos = {
      'aluno':       'pages/homepageAluno.html',
      'exaluno':     'pages/homepageExAluno.html',
      'mentor':      'pages/homepageMentor.html',
      'coordenador': 'pages/homepage.html',
    };
    window.location.href = destinos[perfil] || 'pages/homepage.html';
  }

  // Exibe a mensagem de erro abaixo do campo de e-mail
  function exibirErro(msg) {
    if (mensagemErro) {
      mensagemErro.textContent = msg || 'E-mail não encontrado.';
      mensagemErro.style.display = 'block';
    }
  }

  // Oculta a mensagem de erro antes de cada nova tentativa
  function ocultarErro() {
    if (mensagemErro) mensagemErro.style.display = 'none';
  }

});
