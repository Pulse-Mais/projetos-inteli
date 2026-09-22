document.addEventListener('DOMContentLoaded', function () {

  const hoje = new Date();
  let mesAtual = hoje.getMonth();
  let anoAtual = hoje.getFullYear();

  const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // Todos os eventos carregados (filtro de mês feito no cliente)
  let todosEventos = [];
  let tipoAluno = 'mentoria';

  const sessao  = Auth.getUsuario();
  const idAluno = sessao ? String(sessao.id_usuario) : null;

  const tituloMesEl    = document.getElementById('tituloMes');
  const calendarioGrid = document.getElementById('calendarioGrid');
  const legendaEl      = document.getElementById('legendaAgenda');
  const btnAnterior    = document.getElementById('btnMesAnterior');
  const btnProximo     = document.getElementById('btnProximoMes');

  const TIPOS = {
    mentoria:  { bg: 'rgba(37,176,87,0.12)',   border: 'rgba(37,176,87,0.3)',   texto: 'var(--color-accent)',   rotulo: 'Mentoria' },
    evento:    { bg: 'rgba(37,176,87,0.12)',   border: 'rgba(37,176,87,0.3)',   texto: 'var(--color-accent)',   rotulo: 'Evento' },
    aula:      { bg: 'rgba(0,56,112,0.09)',    border: 'rgba(0,56,112,0.25)',   texto: 'var(--color-primary)', rotulo: 'Aula' },
    atividade: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)', texto: 'var(--color-warning)', rotulo: 'Atividade' },
  };

  // Tooltip flutuante para exibir detalhes completos dos eventos
  const tooltip = document.createElement('div');
  tooltip.className = 'evento-tooltip';
  document.body.appendChild(tooltip);

  calendarioGrid.addEventListener('mouseover', function (e) {
    const cel = e.target.closest('.calendario-celula--evento');
    if (!cel || !cel.dataset.eventos) { tooltip.classList.remove('visivel'); return; }
    const evs = JSON.parse(cel.dataset.eventos);
    tooltip.innerHTML = evs.map(function (ev) {
      const cor = TIPOS[ev.tipo] || TIPOS.evento;
      const detalhe = ev.subtitulo || ev.nome || '';
      return '<div class="evento-tooltip__item">'
        + '<span class="evento-tooltip__tipo" style="color:' + cor.texto + '">' + cor.rotulo + '</span>'
        + (detalhe ? '<span class="evento-tooltip__nome">' + esc(detalhe) + '</span>' : '')
        + '</div>';
    }).join('');
    tooltip.classList.add('visivel');
  });

  calendarioGrid.addEventListener('mousemove', function (e) {
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    const w = tooltip.offsetWidth;
    const h = tooltip.offsetHeight;
    tooltip.style.left = (x + w > window.innerWidth  ? e.clientX - w - 6 : x) + 'px';
    tooltip.style.top  = (y + h > window.innerHeight ? e.clientY - h - 6 : y) + 'px';
  });

  calendarioGrid.addEventListener('mouseleave', function () {
    tooltip.classList.remove('visivel');
  });

  function eventosNoDia(dia) {
    return todosEventos.filter(function (ev) {
      if (!ev.data) return false;
      // Usa T12:00:00 para evitar desvio de fuso (datas ISO midnight UTC)
      const d = new Date(ev.data.slice(0, 10) + 'T12:00:00');
      return d.getDate() === dia && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
  }

  function renderizarCalendario() {
    tituloMesEl.textContent = `${MESES_PT[mesAtual]} ${anoAtual}`;

    const cabecalhos = calendarioGrid.querySelectorAll('.calendario-dia-semana');
    calendarioGrid.innerHTML = '';
    cabecalhos.forEach(function (c) { calendarioGrid.appendChild(c); });

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDias   = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const diasMesAnt  = new Date(anoAtual, mesAtual, 0).getDate();

    const celulas = [];
    for (let i = primeiroDia - 1; i >= 0; i--) celulas.push({ dia: diasMesAnt - i, outroMes: true });
    for (let d = 1; d <= totalDias; d++)       celulas.push({ dia: d, outroMes: false });
    const resto = celulas.length % 7;
    if (resto !== 0) {
      for (let d = 1; d <= (7 - resto); d++) celulas.push({ dia: d, outroMes: true });
    }

    const totalLinhas = celulas.length / 7;

    celulas.forEach(function (celula, idx) {
      const div = document.createElement('div');
      div.className = 'calendario-celula';

      if (Math.floor(idx / 7) === totalLinhas - 1) div.classList.add('calendario-celula--ultima-linha');
      if (celula.outroMes) { div.classList.add('calendario-celula--outro-mes'); }

      if (!celula.outroMes) {
        const evs = eventosNoDia(celula.dia);
        if (evs.length > 0) {
          div.classList.add('calendario-celula--evento');
          div.dataset.eventos = JSON.stringify(evs);
          const primeiroCor = TIPOS[evs[0].tipo] || TIPOS.evento;
          div.style.background   = primeiroCor.bg;
          div.style.borderColor  = primeiroCor.border;

          let html = `<span class="calendario-celula__dia" style="color:${primeiroCor.texto}">${celula.dia}</span>`;
          evs.slice(0, 3).forEach(function (ev) {
            const cor = TIPOS[ev.tipo] || TIPOS.evento;
            html += `<span class="evento-label" style="color:${cor.texto}">${cor.rotulo}</span>`;
            const detalhe = ev.subtitulo || ev.nome || '';
            if (detalhe) html += `<span class="evento-aluno" style="color:${cor.texto}">${esc(detalhe)}</span>`;
          });
          if (evs.length > 3) {
            html += `<span class="evento-label" style="color:var(--color-text-support)">+${evs.length - 3}</span>`;
          }
          div.innerHTML = html;
        } else {
          div.innerHTML = `<span class="calendario-celula__dia">${celula.dia}</span>`;
        }
      } else {
        div.innerHTML = `<span class="calendario-celula__dia"></span>`;
      }

      calendarioGrid.appendChild(div);
    });

    // Legenda dinâmica
    if (legendaEl) {
      if (tipoAluno === 'curso') {
        legendaEl.innerHTML = `
          <div class="legenda-item">
            <div class="legenda-cor" style="background:rgba(0,56,112,0.12);border-color:var(--color-primary)"></div>
            <span class="legenda-texto">Aula</span>
          </div>
          <div class="legenda-item">
            <div class="legenda-cor" style="background:rgba(37,176,87,0.12);border-color:var(--color-accent)"></div>
            <span class="legenda-texto">Evento</span>
          </div>
          <div class="legenda-item">
            <div class="legenda-cor" style="background:rgba(245,158,11,0.12);border-color:var(--color-warning)"></div>
            <span class="legenda-texto">Atividade</span>
          </div>`;
      } else {
        legendaEl.innerHTML = `<div class="legenda-cor"></div><span class="legenda-texto">Mentoria agendada</span>`;
      }
    }
  }

  async function carregarEventos() {
    todosEventos = [];

    if (!idAluno) { renderizarCalendario(); return; }

    try {
      const perfil = await Auth.fetch('/alunos/' + idAluno + '/perfil');
      if (!perfil) { renderizarCalendario(); return; }

      const programaIngresso = (perfil.programa_ingresso || '').toLowerCase();
      tipoAluno = programaIngresso.includes('pulse mais') ? 'curso' : 'mentoria';

      if (tipoAluno === 'mentoria') {
        // ── Mentoria: exibe sessões de mentoria ──────────────────────────────
        const mentorias = await Auth.fetch('/mentorias?id_aluno=' + idAluno) || [];
        mentorias.forEach(function (m) {
          if (m.data) todosEventos.push({ tipo: 'mentoria', nome: 'Mentoria', data: m.data, subtitulo: m.tema || '' });
        });

      } else {
        // ── Pulse Mais: exibe eventos, aulas e atividades ────────────────────

        // 1. Eventos do perfil
        (perfil.eventos || []).forEach(function (e) {
          if (e.data) todosEventos.push({ tipo: 'evento', nome: e.nome || 'Evento', data: e.data });
        });

        // 2. Aulas via programa → cursos → aulas
        const programas = (perfil.programas || []).filter(function (p) { return p.id_programa; });
        for (let pi = 0; pi < programas.length; pi++) {
          try {
            const cursos = await Auth.fetch('/programas/' + programas[pi].id_programa + '/cursos') || [];
            for (let ci = 0; ci < cursos.length; ci++) {
              try {
                const aulas = await Auth.fetch('/cursos/' + cursos[ci].id_curso + '/aulas') || [];
                aulas.forEach(function (a) {
                  if (a.data_aula) todosEventos.push({
                    tipo: 'aula',
                    nome: cursos[ci].titulo,
                    data: a.data_aula,
                    subtitulo: 'Aula ' + a.numero + (a.titulo ? ' — ' + a.titulo : ''),
                  });
                });
              } catch (e) {}
            }
          } catch (e) {}
        }

        // 3. Atividades
        try {
          const atividades = await Auth.fetch('/atividades') || [];
          atividades.forEach(function (a) {
            const data = a.data || a.data_entrega || a.data_inicio || '';
            if (data) todosEventos.push({
              tipo: 'atividade',
              nome: a.nome || a.titulo || 'Atividade',
              data: data,
            });
          });
        } catch (e) {}
      }

    } catch (err) {
      console.error('Erro ao carregar agenda:', err);
    }

    renderizarCalendario();
  }

  btnAnterior.addEventListener('click', function () {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    renderizarCalendario();
  });

  btnProximo.addEventListener('click', function () {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    renderizarCalendario();
  });

  carregarEventos();

});
