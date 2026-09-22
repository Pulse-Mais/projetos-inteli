document.addEventListener('DOMContentLoaded', function () {

  const usuario      = Auth.getUsuario();
  const idAluno      = usuario ? usuario.id_usuario : localStorage.getItem('idAluno');
  const nomeCompleto = usuario ? usuario.nome : (localStorage.getItem('nomeUsuario') || 'Aluno(a)');
  const primeiroNome = nomeCompleto.split(' ')[0];

  const elSaudacao = document.getElementById('heroSaudacao');
  if (elSaudacao) elSaudacao.textContent = 'Olá, ' + primeiroNome + '. Bom te ver por aqui.';

  carregarPortal(idAluno);
  carregarProximosEventos();

  async function carregarPortal(id) {
    if (!id) return;
    const badge = document.getElementById('heroBadge');
    try {
      const dados = await Auth.fetch('/alunos/' + id + '/portal');
      if (!dados || !badge) return;
      const programa = dados.programa_ingresso || 'Pulse Mais';
      const ano      = dados.data_ingresso
        ? new Date(dados.data_ingresso + 'T00:00:00').getFullYear()
        : '';
      badge.textContent = programa.toUpperCase() + (ano ? ' — ' + ano : '');
    } catch (err) {
      if (badge) badge.textContent = 'Programa não disponível';
    }
  }

  async function carregarProximosEventos() {
    const lista   = document.getElementById('programasLista');
    const loading = document.getElementById('loadingProgramas');
    if (!lista) return;

    if (!idAluno) {
      if (loading) loading.remove();
      lista.innerHTML = '<p class="estado-vazio">Faça login para ver seus próximos eventos.</p>';
      return;
    }

    try {
      const perfil = await Auth.fetch('/alunos/' + idAluno + '/perfil');
      if (!perfil) throw new Error('perfil não encontrado');

      const programaIngresso = (perfil.programa_ingresso || '').toLowerCase();
      const tipo = programaIngresso.includes('pulse mais') ? 'curso' : 'mentoria';

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      var eventos = [];

      if (tipo === 'mentoria') {
        var mentorias = await Auth.fetch('/mentorias?id_aluno=' + idAluno) || [];
        mentorias.forEach(function (m) {
          if (!m.data) return;
          var d = new Date(m.data.slice(0, 10) + 'T12:00:00');
          if (d >= hoje) eventos.push({ nome: m.tema || 'Mentoria', data: m.data, tipo: 'Mentoria' });
        });

      } else {
        // 1. Eventos do perfil
        (perfil.eventos || []).forEach(function (e) {
          if (!e.data) return;
          var d = new Date(e.data.slice(0, 10) + 'T12:00:00');
          if (d >= hoje) eventos.push({ nome: e.nome || 'Evento', data: e.data, tipo: 'Evento' });
        });

        // 2. Aulas via programa → cursos → aulas
        var programas = (perfil.programas || []).filter(function (p) { return p.id_programa; });
        for (var pi = 0; pi < programas.length; pi++) {
          try {
            var cursos = await Auth.fetch('/programas/' + programas[pi].id_programa + '/cursos') || [];
            for (var ci = 0; ci < cursos.length; ci++) {
              try {
                var aulas = await Auth.fetch('/cursos/' + cursos[ci].id_curso + '/aulas') || [];
                aulas.forEach(function (a) {
                  if (!a.data_aula) return;
                  var d = new Date(a.data_aula.slice(0, 10) + 'T12:00:00');
                  if (d >= hoje) eventos.push({
                    nome: a.titulo || ('Aula ' + a.numero),
                    data: a.data_aula,
                    tipo: 'Aula',
                    subtitulo: cursos[ci].titulo || '',
                  });
                });
              } catch (e) {}
            }
          } catch (e) {}
        }

        // 3. Atividades
        try {
          var atividades = await Auth.fetch('/atividades') || [];
          atividades.forEach(function (a) {
            var data = a.data || a.data_entrega || a.data_inicio || '';
            if (!data) return;
            var d = new Date(data.slice(0, 10) + 'T12:00:00');
            if (d >= hoje) eventos.push({
              nome:   a.nome || a.titulo || 'Atividade',
              data:   data,
              tipo:   'Atividade',
            });
          });
        } catch (e) {}
      }

      if (loading) loading.remove();

      eventos.sort(function (a, b) { return new Date(a.data) - new Date(b.data); });
      var proximos = eventos.slice(0, 3);

      if (proximos.length === 0) {
        lista.innerHTML = '<p class="estado-vazio">Nenhum evento próximo agendado.</p>';
        return;
      }

      renderEventos(proximos);

    } catch (err) {
      if (loading) loading.remove();
      lista.innerHTML = '<p class="estado-vazio">Não foi possível carregar os eventos.</p>';
      console.error('Erro ao carregar próximos eventos:', err);
    }
  }

  function diasRestantes(dataStr) {
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var d = new Date(dataStr.slice(0, 10) + 'T12:00:00');
    var diff = Math.round((d - hoje) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff <= 7)  return 'Em ' + diff + ' dias';
    return '';
  }

  function formatarData(dataStr) {
    if (!dataStr) return '';
    var d = new Date(dataStr.slice(0, 10) + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  var TIPO_ICONE = {
    'Aula':
      '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>',
    'Mentoria':
      '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
    'Evento':
      '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    'Atividade':
      '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>',
  };

  var TIPO_CLASSE = {
    'Aula': 'aula', 'Mentoria': 'mentoria', 'Evento': 'evento', 'Atividade': 'atividade',
  };

  function renderEventos(eventos) {
    var lista = document.getElementById('programasLista');
    if (!lista) return;

    lista.innerHTML = eventos.map(function (ev) {
      var cls    = TIPO_CLASSE[ev.tipo] || 'aula';
      var icone  = TIPO_ICONE[ev.tipo]  || TIPO_ICONE['Aula'];
      var prazo  = diasRestantes(ev.data);
      var data   = formatarData(ev.data);
      var meta   = [prazo, data].filter(Boolean).join(' · ');

      return (
        '<a class="programa-item" href="agendaAluno.html" aria-label="Ver ' + esc(ev.nome) + ' na agenda">' +
          '<div class="programa-item__icone programa-item__icone--' + cls + '">' + icone + '</div>' +
          '<div class="programa-item__info">' +
            '<p class="programa-item__nome">' + esc(ev.nome) + '</p>' +
            (ev.subtitulo ? '<p class="programa-item__subtitulo">' + esc(ev.subtitulo) + '</p>' : '') +
            (meta ? '<p class="programa-item__data">' + meta + '</p>' : '') +
          '</div>' +
          '<span class="programa-item__badge programa-item__badge--' + cls + '">' + esc(ev.tipo) + '</span>' +
        '</a>'
      );
    }).join('');
  }

});
