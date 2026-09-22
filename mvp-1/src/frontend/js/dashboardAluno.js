// Dashboard de Desempenho do Aluno.
// Carrega dados reais do backend:
//   GET /alunos/:id/perfil  → soft skills + mentorias, eventos, programas para os KPIs
//   GET /atividades         → tabela de próximas atividades
//   GET /frequencia?id_aluno=<id> → % de presença nas aulas
// Depende de: auth.js, portalAluno.js (carregados antes)

function normalizar(str) {
  return String(str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

document.addEventListener('DOMContentLoaded', function () {

  const usuario = Auth.getUsuario();
  const idAluno = usuario ? usuario.id_usuario : localStorage.getItem('idAluno');

  let todasAtividades = [];

  carregarPerfil(idAluno);
  carregarAtividades();

  const searchInput = document.getElementById('dashSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = normalizar(this.value.trim());
      renderTabelaAtividades(
        q
          ? todasAtividades.filter(a =>
              normalizar(a.nome).includes(q) || normalizar(a.tipo).includes(q))
          : todasAtividades,
      );
    });
  }

  async function carregarPerfil(id) {
    if (!id) {
      carregarFrequencia(null, 'mentoria');
      return;
    }

    try {
      const perfil = await Auth.fetch('/alunos/' + id + '/perfil');
      if (!perfil) return;

      const programaIngresso = (perfil.programa_ingresso || '').toLowerCase();
      const tipo = programaIngresso.includes('pulse mais') ? 'curso' : 'mentoria';

      const kpiEventos = document.getElementById('kpiEventos');
      if (kpiEventos) kpiEventos.textContent = String((perfil.eventos || []).length);

      if (tipo === 'mentoria') {
        renderMentores(perfil.mentorias || []);
      } else {
        // curso: troca label para "Aulas / participadas", esconde mentores, mostra barras por curso
        const labelEl = document.getElementById('kpiMentoriasLabel');
        const subEl   = document.getElementById('kpiMentoriasSub');
        if (labelEl) labelEl.textContent = 'Aulas';
        if (subEl)   subEl.textContent   = 'participadas';

        const mentoresCard = document.getElementById('mentoresCard');
        if (mentoresCard) mentoresCard.style.display = 'none';

        carregarAulasPorCurso(idAluno, perfil.programas || []);
      }

      carregarFrequencia(idAluno, tipo);

    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  }

  async function carregarAtividades() {
    const tabela = document.getElementById('tabelaAtividades');
    if (!tabela) return;

    tabela.innerHTML = '<p class="estado-carregando">Carregando...</p>';

    try {
      const dados = await Auth.fetch('/atividades');

      todasAtividades = (dados || []).map(a => ({
        nome:   a.nome   || a.titulo      || 'Atividade',
        data:   a.data   || a.data_inicio || a.data_entrega || '',
        tipo:   a.tipo   || 'Aula',
        status: a.status || 'pendente',
      }));

      renderTabelaAtividades(todasAtividades);
    } catch (err) {
      tabela.innerHTML = '<p class="estado-vazio">Não foi possível carregar as atividades.</p>';
      console.error('Erro ao carregar atividades:', err);
    }
  }

  async function carregarFrequencia(id, tipo) {
    const el  = document.getElementById('kpiFrequencia');
    const sub = document.getElementById('kpiFrequenciaSub');
    if (!el) return;
    if (!id) { el.textContent = '—'; return; }

    try {
      const registros = await Auth.fetch('/frequencia?id_aluno=' + id);
      // total = apenas registros marcados pelo coordenador (presente OU ausente)
      const total     = (registros || []).length;
      const presentes = (registros || []).filter(r => r.status === 'presente').length;

      const kpiMid = document.getElementById('kpiMentorias');

      if (total === 0) {
        el.textContent = '—';
        if (sub) sub.textContent = '';
        if (kpiMid) kpiMid.textContent = '0';
      } else {
        const pct = Math.round((presentes / total) * 100);
        el.textContent = pct + '%';
        const cor = pct >= 75
          ? 'var(--color-accent)'
          : pct >= 50
            ? 'var(--color-warning)'
            : 'var(--color-danger)';
        el.style.color = cor;
        const icon = document.getElementById('kpiFrequenciaIcon');
        if (icon) icon.style.color = cor;

        // mentoria: sub da frequência removido; curso: mostra fração de aulas
        if (tipo === 'curso') {
          if (sub) sub.textContent = presentes + ' de ' + total + ' aulas';
        } else {
          if (sub) sub.textContent = '';
        }

        // card do meio sempre mostra o nº de presenças
        if (kpiMid) kpiMid.textContent = String(presentes);
      }
    } catch (err) {
      if (el) el.textContent = '—';
      console.error('Erro ao carregar frequência:', err);
    }
  }

  async function carregarAulasPorCurso(idAluno, programas) {
    const card = document.getElementById('minhasAulasCard');
    const bars = document.getElementById('minhasAulasBars');
    if (!card || !bars) return;

    const comId = (programas || []).filter(function (p) { return p.id_programa; });
    if (comId.length === 0) return;

    card.style.display = '';
    bars.innerHTML = '<p class="estado-carregando">Carregando...</p>';

    // 1. Presença do aluno (uma única chamada)
    var presencaMap = {};
    try {
      var registros = await Auth.fetch('/frequencia?id_aluno=' + idAluno) || [];
      registros.forEach(function (r) { presencaMap[r.id_aula] = r.status; });
    } catch (e) {}

    // 2. Para cada programa → GET /programas/:id/cursos → para cada curso → GET /cursos/:id/aulas
    var cursos = [];
    for (var pi = 0; pi < comId.length; pi++) {
      var prog = comId[pi];
      var listaCursos = [];
      try { listaCursos = await Auth.fetch('/programas/' + prog.id_programa + '/cursos') || []; } catch (e) { continue; }
      for (var ci = 0; ci < listaCursos.length; ci++) {
        var c = listaCursos[ci];
        var aulas = [];
        try { aulas = await Auth.fetch('/cursos/' + c.id_curso + '/aulas') || []; } catch (e) {}
        var marcadas  = aulas.filter(function (a) { return presencaMap[a.id_aula] !== undefined; });
        var presentes = marcadas.filter(function (a) { return presencaMap[a.id_aula] === 'presente'; }).length;
        cursos.push({ id: c.id_curso, nome: c.titulo, presentes: presentes, total: marcadas.length });
      }
    }

    if (cursos.length === 0) {
      bars.innerHTML = '<p class="estado-vazio">Nenhum curso encontrado.</p>';
      return;
    }

    function corDoPct(pct, semDados) {
      if (semDados) return 'var(--color-text-support)';
      return pct >= 75 ? 'var(--color-accent)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    }

    function renderCursos(idSelecionado) {
      bars.innerHTML = cursos.map(function (c) {
        var pct  = c.total > 0 ? Math.round((c.presentes / c.total) * 100) : 0;
        var cor  = corDoPct(pct, c.total === 0);
        var ativo = c.id === idSelecionado ? ' curso-row--ativo' : '';
        return (
          '<div class="prog-row curso-row' + ativo + '" style="cursor:pointer" data-id="' + c.id + '">' +
            '<span class="prog-row__label">' + esc(c.nome) + '</span>' +
            '<div class="prog-row__track">' +
              '<div class="prog-row__fill" style="width:' + pct + '%; background:' + cor + ';"></div>' +
            '</div>' +
            '<span class="prog-row__count">' + c.presentes + ' de ' + c.total + ' aulas</span>' +
            '<span class="prog-row__pct" style="color:' + cor + '">' + (c.total > 0 ? pct + '%' : '—') + '</span>' +
          '</div>'
        );
      }).join('');

      bars.querySelectorAll('.curso-row').forEach(function (row) {
        row.addEventListener('click', function () {
          var id    = Number(this.dataset.id);
          var curso = cursos.find(function (x) { return x.id === id; });
          if (!curso) return;

          renderCursos(id);

          var pct = curso.total > 0 ? Math.round((curso.presentes / curso.total) * 100) : 0;
          var cor = corDoPct(pct, curso.total === 0);

          var elFreq = document.getElementById('kpiFrequencia');
          var elSub  = document.getElementById('kpiFrequenciaSub');
          var elIcon = document.getElementById('kpiFrequenciaIcon');
          var elMid  = document.getElementById('kpiMentorias');

          if (elFreq) { elFreq.textContent = curso.total > 0 ? pct + '%' : '—'; elFreq.style.color = cor; }
          if (elIcon) elIcon.style.color = cor;
          if (elSub)  elSub.textContent = curso.presentes + ' de ' + curso.total + ' aulas';
          if (elMid)  elMid.textContent = String(curso.presentes);
        });
      });
    }

    renderCursos(null);

    // Tooltip flutuante para mostrar nome completo do curso e progresso
    var dashTooltip = document.createElement('div');
    dashTooltip.className = 'dash-tooltip';
    document.body.appendChild(dashTooltip);

    bars.addEventListener('mouseover', function (e) {
      var row = e.target.closest('.curso-row');
      if (!row) { dashTooltip.classList.remove('visivel'); return; }
      var id  = Number(row.dataset.id);
      var c   = cursos.find(function (x) { return x.id === id; });
      if (!c) return;
      var pct = c.total > 0 ? Math.round((c.presentes / c.total) * 100) : 0;
      var cor = corDoPct(pct, c.total === 0);
      dashTooltip.innerHTML =
        '<span class="dash-tooltip__nome">' + esc(c.nome) + '</span>' +
        '<span class="dash-tooltip__detalhe" style="color:' + cor + '">' +
          c.presentes + ' de ' + c.total + ' aulas — ' + (c.total > 0 ? pct + '%' : '—') +
        '</span>';
      dashTooltip.classList.add('visivel');
    });

    bars.addEventListener('mousemove', function (e) {
      var x = e.clientX + 14;
      var y = e.clientY + 14;
      var w = dashTooltip.offsetWidth;
      var h = dashTooltip.offsetHeight;
      dashTooltip.style.left = (x + w > window.innerWidth  ? e.clientX - w - 6 : x) + 'px';
      dashTooltip.style.top  = (y + h > window.innerHeight ? e.clientY - h - 6 : y) + 'px';
    });

    bars.addEventListener('mouseleave', function () {
      dashTooltip.classList.remove('visivel');
    });
  }

  function renderMentores(mentorias) {
    const card = document.getElementById('mentoresCard');
    const list = document.getElementById('mentoresList');
    if (!card || !list) return;

    if (!mentorias || mentorias.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = '';
    list.innerHTML = mentorias.map(m =>
      '<div class="mentor-chip">' +
        '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>' +
        esc(m.nome_mentor || 'Mentor') +
      '</div>'
    ).join('');
  }

  function renderProgramaBars(skills) {
    const container = document.getElementById('programaBars');
    if (!container) return;

    if (!skills || skills.length === 0) {
      container.innerHTML = '<p class="estado-vazio">Nenhuma avaliação registrada.</p>';
      return;
    }

    container.innerHTML = skills.map(s => {
      const pct = Math.round((Math.min(s.valor, 5) / 5) * 100);
      return (
        '<div class="prog-row">' +
          '<span class="prog-row__label">' + esc(s.nome) + '</span>' +
          '<div class="prog-row__track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + esc(s.nome) + '">' +
            '<div class="prog-row__fill" style="width:' + pct + '%;"></div>' +
          '</div>' +
          '<span class="prog-row__pct">' + pct + '%</span>' +
        '</div>'
      );
    }).join('');
  }

  function renderTabelaAtividades(atividades) {
    const tabela = document.getElementById('tabelaAtividades');
    if (!tabela) return;

    if (!atividades || atividades.length === 0) {
      tabela.innerHTML = '<p class="estado-vazio">Nenhuma atividade encontrada.</p>';
      return;
    }

    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    tabela.innerHTML = atividades.map(a => {
      let badgeClass, badgeLabel;

      if (a.status === 'pendente') {
        const dataEntrega = a.data ? new Date(a.data + 'T00:00:00') : null;
        const atrasado = dataEntrega && dataEntrega < hoje;
        badgeClass = atrasado ? 'badge--inativo' : 'badge--pendente';
        badgeLabel = atrasado ? 'Atrasado' : 'Pendente';
      } else if (a.status === 'concluido' || a.status === 'entregue') {
        badgeClass = 'badge--ativo';
        badgeLabel = 'Entregue';
      } else if (a.status === 'cancelado') {
        badgeClass = 'badge--inativo';
        badgeLabel = 'Cancelado';
      } else {
        badgeClass = 'badge--pendente';
        badgeLabel = esc(a.status);
      }
      return (
        '<div class="tabela-row">' +
          '<span class="tabela-row__nome">' + esc(a.nome) + '</span>' +
          '<span class="tabela-row__data">' + formatarDataCurta(a.data) + '</span>' +
          '<span class="tabela-row__tipo">' + esc(a.tipo) + '</span>' +
          '<span class="tabela-row__status"><span class="badge ' + badgeClass + '">' + badgeLabel + '</span></span>' +
        '</div>'
      );
    }).join('');
  }

});
