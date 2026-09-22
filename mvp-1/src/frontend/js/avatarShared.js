// Foto de perfil compartilhada entre as telas do ex-aluno.
// A foto é salva em localStorage ('fotoUsuario') como data URL e aplicada
// ao avatar da sidebar e à foto do perfil para manter consistência entre páginas.
(function () {
  // Aplica a foto salva (cache local) a todos os elementos de avatar visíveis na página atual
  function aplicarFoto() {
    var foto = localStorage.getItem('fotoUsuario');
    if (!foto) return;
    var alvos = document.querySelectorAll('.sidebar__avatar, #perfilFoto, #portalFoto');
    alvos.forEach(function (img) { img.src = foto; });
  }

  // Busca a foto atual no servidor (fonte de verdade) e atualiza o cache local.
  // Necessário porque o logout() limpa todo o localStorage (inclusive 'fotoUsuario'),
  // e sem isso a foto nunca era restaurada no login seguinte — mesmo já persistida no banco.
  function sincronizarFotoServidor() {
    var idAluno = localStorage.getItem('idAluno');
    if (!idAluno) return;
    fetch('/alunos/' + idAluno + '/portal')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (dados) {
        var fotoServidor = dados && dados.usuario && dados.usuario.foto_url;
        if (!fotoServidor) return;
        try { localStorage.setItem('fotoUsuario', fotoServidor); } catch (e) { /* ignora */ }
        aplicarFoto();
      })
      .catch(function () { /* mantém o que já estiver em cache local, se houver */ });
  }

  function iniciar() {
    aplicarFoto();
    sincronizarFotoServidor();
  }

  if (document.readyState !== 'loading') iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);

  // Exposto globalmente para ser chamado após o upload de uma nova foto
  window.aplicarFotoUsuario = aplicarFoto;
})();
