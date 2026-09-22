/* ============================================================
   calendarioGestao.js — Lógica do Calendário & Eventos
   Pulse Mais · Módulo 1AMD2
   Integrado com /api/eventos
   ============================================================ */

lucide.createIcons();

/* ── View toggle ── */
const VIEW_MAP = { 'mês': 'month', 'semana': 'week', 'dia': 'day', 'agenda': 'agenda' };
let currentView = 'month';

document.querySelectorAll('.btn-view').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentView = VIEW_MAP[this.textContent.trim().toLowerCase()] || 'month';
    renderCalendar();
  });
});

/* ──────────────────────────────────────────────────────────
   MAPEAMENTO entre o `tipo` do backend e as categorias visuais
────────────────────────────────────────────────────────── */
const TIPO_TO_COLOR = {
  Eventos_Tech: 'blue',
  Workshop: 'blue',
  Palestra: 'blue',
  Pulse_Mais: 'green',
  Encontro_Rede: 'orange',
  Outro: 'purple',
};
const COLOR_TO_TIPO = {
  blue: 'Workshop',
  purple: 'Outro',
  green: 'Pulse_Mais',
  orange: 'Encontro_Rede',
};

/* Categorias usadas na importação por CSV (campo "categoria") */
const CATEGORY_COLORS = {
  aulas:     'blue',
  mentorias: 'purple',
  eventos:   'green',
  empresas:  'orange',
};

/* ── Estado do calendário ── */
const today = new Date();
let state = { year: today.getFullYear(), month: today.getMonth() };
let selectedDate = new Date(today);
let EVENTS = [];
let editingEvent = null;
let deletingEventId = null;

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const WEEKDAYS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

const MONTHS_SHORT_PT = [
  'jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'
];

/* ── Success overlay ── */
function showSuccessOverlay(title, msg) {
  const overlay = document.getElementById('successOverlay');
  document.getElementById('successOverlayTitle').textContent = title;
  document.getElementById('successOverlayMsg').textContent = msg;
  overlay.hidden = false;
  setTimeout(() => { overlay.hidden = true; }, 1800);
}

/* ── Toast ── */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 3000);
}

/* ── Helpers gerais ── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Helpers de data ── */
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

/* Converte um timestamp do backend para { date, time } no fuso local */
function splitDateTime(iso) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

/* Converte um evento do backend para o formato usado pelo calendário */
function eventToDisplay(ev) {
  const start = splitDateTime(ev.data_inicio);
  const end = ev.data_fim ? splitDateTime(ev.data_fim) : null;
  return {
    id: ev.id,
    date: start.date,
    time: start.time,
    endTime: (end && end.date === start.date) ? end.time : null,
    title: ev.nome,
    color: TIPO_TO_COLOR[ev.tipo] || 'blue',
    tipo: ev.tipo,
    location: ev.local || null,
    participants: ev.vagas ?? null,
  };
}

/* ──────────────────────────────────────────────────────────
   CARREGAMENTO DOS EVENTOS DO MÊS
────────────────────────────────────────────────────────── */
async function loadEventsForMonth(year, month) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  try {
    const data = await window.api.get('/eventos', {
      params: { data_inicio: toISODate(first), data_fim: toISODate(last) },
      auth: true,
    });
    EVENTS = Array.isArray(data) ? data.map(eventToDisplay) : [];
  } catch (e) {
    EVENTS = [];
  }
}

async function loadEventsForWeek() {
  const dow = selectedDate.getDay();
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - dow);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  try {
    const data = await window.api.get('/eventos', {
      params: { data_inicio: toISODate(weekStart), data_fim: toISODate(weekEnd) },
      auth: true,
    });
    EVENTS = Array.isArray(data) ? data.map(eventToDisplay) : [];
  } catch (e) {
    EVENTS = [];
  }
}

function updateCalLabel() {
  const { year, month } = state;
  let label;
  if (currentView === 'month' || currentView === 'agenda') {
    label = `${MONTHS_PT[month]} ${year}`;
  } else if (currentView === 'week') {
    const dow = selectedDate.getDay();
    const ws = new Date(selectedDate);
    ws.setDate(ws.getDate() - dow);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const s = `${ws.getDate()} ${MONTHS_SHORT_PT[ws.getMonth()]}`;
    const e = `${we.getDate()} ${MONTHS_SHORT_PT[we.getMonth()]} ${we.getFullYear()}`;
    label = `${s} – ${e}`;
  } else if (currentView === 'day') {
    label = `${WEEKDAYS_PT[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS_SHORT_PT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }
  document.getElementById('calMonthLabel').textContent = label;
}

/* ──────────────────────────────────────────────────────────
   RENDERIZA O CALENDÁRIO
────────────────────────────────────────────────────────── */
async function renderCalendar() {
  if (currentView === 'week') {
    await loadEventsForWeek();
  } else {
    await loadEventsForMonth(state.year, state.month);
  }

  updateCalLabel();

  const calHead = document.querySelector('.cal-head');
  calHead.style.display = currentView === 'month' ? '' : 'none';

  const calGrid = document.getElementById('calGrid');
  calGrid.classList.toggle('cal-grid--view', currentView !== 'month');

  switch (currentView) {
    case 'month':  renderMonthView();  break;
    case 'week':   renderWeekView();   break;
    case 'day':    renderDayView();    break;
    case 'agenda': renderAgendaView(); break;
  }

  updateStats();
  renderDayEvents();
}

function renderMonthView() {
  const { year, month } = state;

  const evMap = {};
  EVENTS.forEach(ev => {
    const d = new Date(ev.date + 'T12:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!evMap[day]) evMap[day] = [];
      evMap[day].push(ev);
    }
  });

  const firstDay   = new Date(year, month, 1).getDay();
  const totalDays  = new Date(year, month + 1, 0).getDate();
  const prevTotal  = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  let html = '';
  for (let i = 0; i < totalCells; i++) {
    let dayNum, isCurrentMonth = true;
    if (i < firstDay) {
      dayNum = prevTotal - firstDay + 1 + i; isCurrentMonth = false;
    } else if (i >= firstDay + totalDays) {
      dayNum = i - firstDay - totalDays + 1; isCurrentMonth = false;
    } else {
      dayNum = i - firstDay + 1;
    }

    const isToday = isCurrentMonth && dayNum === today.getDate() && year === today.getFullYear() && month === today.getMonth();
    const cellDate = new Date(year, month, dayNum);
    if (!isCurrentMonth) {
      if (i < firstDay) cellDate.setMonth(month - 1);
      else cellDate.setMonth(month + 1);
    }
    const isSelected = isCurrentMonth && dayNum === selectedDate.getDate() && year === selectedDate.getFullYear() && month === selectedDate.getMonth();

    const classes = ['cal-cell', !isCurrentMonth ? 'cal-cell--other' : '', isToday ? 'cal-cell--today' : '', isSelected ? 'cal-cell--selected' : ''].filter(Boolean).join(' ');

    let pillsHtml = '';
    if (isCurrentMonth && evMap[dayNum]) {
      evMap[dayNum].forEach(ev => {
        pillsHtml += `<div class="ev-pill ev-${ev.color}" title="${ev.time} · ${escapeHtml(ev.title)}"><span class="ev-pill__dot"></span><span>${ev.time} · ${escapeHtml(ev.title)}</span></div>`;
      });
    }
    html += `<div class="${classes}" data-date="${toISODate(cellDate)}"><div class="cal-cell__day">${dayNum}</div>${pillsHtml}</div>`;
  }

  document.getElementById('calGrid').innerHTML = html;

  document.querySelectorAll('.cal-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const [y, m, d] = cell.dataset.date.split('-').map(Number);
      selectedDate = new Date(y, m - 1, d);
      if (selectedDate.getMonth() !== state.month || selectedDate.getFullYear() !== state.year) {
        state.year = selectedDate.getFullYear();
        state.month = selectedDate.getMonth();
      }
      renderCalendar();
    });
  });
}

function renderWeekView() {
  const dow = selectedDate.getDay();
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - dow);
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
  const todayStr = toISODate(today);
  const selStr   = toISODate(selectedDate);

  let header = '<div class="wk-header"><div class="wk-gutter"></div>';
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    const ds = toISODate(d);
    header += `<div class="wk-day-head${ds === todayStr ? ' is-today' : ''}${ds === selStr ? ' is-selected' : ''}" data-date="${ds}">
      <span class="wk-day-head__wd">${WEEKDAYS_PT[d.getDay()].slice(0, 3)}</span>
      <span class="wk-day-head__num">${d.getDate()}</span>
    </div>`;
  }
  header += '</div>';

  let rows = '';
  HOURS.forEach(h => {
    rows += `<div class="wk-row"><div class="wk-time">${pad2(h)}:00</div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(d.getDate() + i);
      const ds = toISODate(d);
      const slotEvs = EVENTS.filter(ev => ev.date === ds && parseInt(ev.time.split(':')[0]) === h);
      rows += `<div class="wk-cell${ds === todayStr ? ' is-today' : ''}${ds === selStr ? ' is-selected' : ''}" data-date="${ds}">`;
      slotEvs.forEach(ev => {
        rows += `<div class="wk-event ev-${ev.color}" title="${escapeHtml(ev.title)}"><span class="wk-event__time">${ev.time}</span> ${escapeHtml(ev.title)}</div>`;
      });
      rows += '</div>';
    }
    rows += '</div>';
  });

  document.getElementById('calGrid').innerHTML = `<div class="wk-view">${header}<div class="wk-body">${rows}</div></div>`;

  document.querySelectorAll('.wk-day-head').forEach(el => {
    el.addEventListener('click', () => {
      const [y, m, d] = el.dataset.date.split('-').map(Number);
      selectedDate = new Date(y, m - 1, d);
      state.year = y; state.month = m - 1;
      renderWeekView(); updateCalLabel(); renderDayEvents();
    });
  });

  document.querySelectorAll('.wk-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.wk-event')) return;
      const [y, m, d] = cell.dataset.date.split('-').map(Number);
      selectedDate = new Date(y, m - 1, d);
      state.year = y; state.month = m - 1;
      renderWeekView(); updateCalLabel(); renderDayEvents();
    });
  });
}

function renderDayView() {
  const dateStr = toISODate(selectedDate);
  const dayEvs  = EVENTS.filter(ev => ev.date === dateStr);
  const HOURS   = Array.from({ length: 15 }, (_, i) => i + 7);

  let html = '<div class="dv-view">';
  HOURS.forEach(h => {
    const slotEvs = dayEvs.filter(ev => parseInt(ev.time.split(':')[0]) === h);
    html += `<div class="dv-row"><div class="dv-time">${pad2(h)}:00</div><div class="dv-cell">`;
    slotEvs.forEach(ev => {
      const time = ev.endTime ? `${ev.time} – ${ev.endTime}` : ev.time;
      const meta = [ev.location ? escapeHtml(ev.location) : null, ev.participants ? `${ev.participants} vagas` : null].filter(Boolean).join(' · ');
      html += `<div class="dv-event ev-${ev.color}">
        <div class="dv-event__time">${time}</div>
        <div class="dv-event__title">${escapeHtml(ev.title)}</div>
        ${meta ? `<div class="dv-event__meta">${meta}</div>` : ''}
      </div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

function renderAgendaView() {
  const dateStr = toISODate(selectedDate);
  const evs = EVENTS
    .filter(ev => ev.date >= dateStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (!evs.length) {
    document.getElementById('calGrid').innerHTML = '<div class="ag-empty">Nenhum evento programado a partir desta data.</div>';
    return;
  }

  const grouped = {};
  evs.forEach(ev => { if (!grouped[ev.date]) grouped[ev.date] = []; grouped[ev.date].push(ev); });

  const todayStr = toISODate(today);
  let html = '<div class="ag-view">';
  Object.entries(grouped).forEach(([date, dayEvs]) => {
    const d = new Date(date + 'T12:00:00');
    html += `<div class="ag-group">
      <div class="ag-date${date === todayStr ? ' is-today' : ''}">
        <span class="ag-date__wd">${WEEKDAYS_PT[d.getDay()]}</span>
        <span class="ag-date__num">${d.getDate()} ${MONTHS_SHORT_PT[d.getMonth()]} ${d.getFullYear()}</span>
      </div>
      <div class="ag-events">`;
    dayEvs.forEach(ev => {
      const time = ev.endTime ? `${ev.time} – ${ev.endTime}` : ev.time;
      html += `<div class="ag-event">
        <span class="ag-dot ev-${ev.color}-dot"></span>
        <div class="ag-event__body">
          <div class="ag-event__time">${time}</div>
          <div class="ag-event__title">${escapeHtml(ev.title)}</div>
          ${ev.location ? `<div class="ag-event__meta">${escapeHtml(ev.location)}</div>` : ''}
        </div>
      </div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  document.getElementById('calGrid').innerHTML = html;
}

/* ──────────────────────────────────────────────────────────
   PAINEL "EVENTOS DO DIA"
────────────────────────────────────────────────────────── */
function renderDayEvents() {
  const dateStr = toISODate(selectedDate);
  const dayEvents = EVENTS
    .filter(ev => ev.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  document.getElementById('dayEventsBadge').textContent = dayEvents.length;

  const dateLabel = document.getElementById('dayEventsDate');
  dateLabel.innerHTML = `
    ${WEEKDAYS_PT[selectedDate.getDay()]}
    <strong>${selectedDate.getDate()} ${MONTHS_SHORT_PT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}</strong>
  `;

  const list = document.getElementById('dayEventsList');

  if (dayEvents.length === 0) {
    list.innerHTML = `<p class="day-event__empty">Nenhum evento neste dia.</p>`;
    return;
  }

  list.innerHTML = dayEvents.map(ev => {
    const time = ev.endTime ? `${ev.time} – ${ev.endTime}` : ev.time;
    const metaParts = [];
    if (ev.location) metaParts.push(escapeHtml(ev.location));
    if (ev.participants) metaParts.push(`${ev.participants} vagas`);
    return `
      <div class="day-event">
        <div class="day-event__top">
          <p class="day-event__time">${time}</p>
          <div class="day-event__actions">
            <button class="day-event__btn" data-action="edit" data-id="${ev.id}" title="Editar evento">
              <i data-lucide="pencil"></i>
            </button>
            <button class="day-event__btn day-event__btn--danger" data-action="delete" data-id="${ev.id}" title="Excluir evento">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
        <p class="day-event__name">${escapeHtml(ev.title)}</p>
        ${metaParts.length ? `<p class="day-event__meta">${metaParts.join('<br>')}</p>` : ''}
      </div>`;
  }).join('');

  lucide.createIcons({ nodes: [list] });

  list.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ev = dayEvents.find(e => String(e.id) === btn.dataset.id);
      if (ev) openEditModal(ev);
    });
  });

  list.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ev = dayEvents.find(e => String(e.id) === btn.dataset.id);
      if (ev) openConfirmDelete(ev.id, ev.title);
    });
  });
}

/* ──────────────────────────────────────────────────────────
   KPIs E CATEGORIAS
────────────────────────────────────────────────────────── */
async function updateStats() {
  const { year, month } = state;

  document.getElementById('kpiMonth').textContent = EVENTS.length;

  const todayStr = toISODate(today);
  try {
    const todayEvents = await window.api.get('/eventos', {
      params: { data_inicio: todayStr, data_fim: todayStr },
      auth: true,
    });
    document.getElementById('kpiToday').textContent = Array.isArray(todayEvents) ? todayEvents.length : 0;
  } catch (e) {
    document.getElementById('kpiToday').textContent = '—';
  }

  const counts = { blue: 0, purple: 0, green: 0, orange: 0 };
  EVENTS.forEach(ev => { if (counts[ev.color] !== undefined) counts[ev.color]++; });
  Object.keys(counts).forEach(color => {
    const el = document.querySelector(`.cat-count[data-color="${color}"]`);
    if (el) el.textContent = counts[color];
  });
}

/* ──────────────────────────────────────────────────────────
   EXPORTAÇÃO (.ics)
────────────────────────────────────────────────────────── */
function escapeICS(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toICSDateTime(date, time) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function addOneHour(time) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function buildICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pulsar//Calendario e Eventos//PT-BR',
    'CALSCALE:GREGORIAN',
  ];

  events.forEach((ev, i) => {
    const dtStart = toICSDateTime(ev.date, ev.time);
    const dtEnd = toICSDateTime(ev.date, ev.endTime || addOneHour(ev.time));
    lines.push(
      'BEGIN:VEVENT',
      `UID:evento-${ev.id ?? i}-${ev.date.replace(/-/g, '')}@pulsar`,
      `DTSTAMP:${toICSDateTime(toISODate(today), '00:00')}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(ev.title)}`,
    );
    if (ev.location) lines.push(`LOCATION:${escapeICS(ev.location)}`);
    if (ev.participants) lines.push(`DESCRIPTION:${escapeICS(`${ev.participants} vagas`)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

document.getElementById('btnExportarIcs').addEventListener('click', async () => {
  let events = EVENTS;
  try {
    const data = await window.api.get('/eventos', { auth: true });
    if (Array.isArray(data)) events = data.map(eventToDisplay);
  } catch (e) { /* exporta apenas os eventos já carregados */ }

  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calendario-pulsar.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

/* ── Navegação ── */
document.getElementById('btnPrev').addEventListener('click', () => {
  if (currentView === 'month' || currentView === 'agenda') {
    state.month--; if (state.month < 0) { state.month = 11; state.year--; }
  } else if (currentView === 'week') {
    selectedDate = new Date(selectedDate); selectedDate.setDate(selectedDate.getDate() - 7);
    state.year = selectedDate.getFullYear(); state.month = selectedDate.getMonth();
  } else if (currentView === 'day') {
    selectedDate = new Date(selectedDate); selectedDate.setDate(selectedDate.getDate() - 1);
    state.year = selectedDate.getFullYear(); state.month = selectedDate.getMonth();
  }
  renderCalendar();
});

document.getElementById('btnNext').addEventListener('click', () => {
  if (currentView === 'month' || currentView === 'agenda') {
    state.month++; if (state.month > 11) { state.month = 0; state.year++; }
  } else if (currentView === 'week') {
    selectedDate = new Date(selectedDate); selectedDate.setDate(selectedDate.getDate() + 7);
    state.year = selectedDate.getFullYear(); state.month = selectedDate.getMonth();
  } else if (currentView === 'day') {
    selectedDate = new Date(selectedDate); selectedDate.setDate(selectedDate.getDate() + 1);
    state.year = selectedDate.getFullYear(); state.month = selectedDate.getMonth();
  }
  renderCalendar();
});

document.getElementById('btnToday').addEventListener('click', () => {
  state = { year: today.getFullYear(), month: today.getMonth() };
  selectedDate = new Date(today);
  renderCalendar();
});

/* ──────────────────────────────────────────────────────────
   MODAIS — abrir / fechar
────────────────────────────────────────────────────────── */
function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }

const modalNovoEvento = document.getElementById('modalNovoEvento');
const modalImportarPlanilha = document.getElementById('modalImportarPlanilha');
const modalConfirmarExcluir = document.getElementById('modalConfirmarExcluir');

function openNovoEventoModal() {
  editingEvent = null;
  document.getElementById('modalNovoEventoTitle').textContent = 'Novo Evento';
  document.getElementById('btnSalvarEvento').textContent = 'Salvar evento';
  document.getElementById('formNovoEvento').reset();
  document.getElementById('eventDate').value = toISODate(selectedDate);
  openModal(modalNovoEvento);
}

function openEditModal(ev) {
  editingEvent = ev;
  document.getElementById('modalNovoEventoTitle').textContent = 'Editar Evento';
  document.getElementById('btnSalvarEvento').textContent = 'Atualizar evento';
  document.getElementById('eventTitle').value = ev.title;
  document.getElementById('eventDate').value = ev.date;
  document.getElementById('eventStart').value = ev.time;
  document.getElementById('eventEnd').value = ev.endTime || '';
  document.getElementById('eventCategory').value = ev.color;
  document.getElementById('eventLocation').value = ev.location || '';
  document.getElementById('eventParticipants').value = ev.participants || '';
  openModal(modalNovoEvento);
}

function openConfirmDelete(eventId, eventTitle) {
  deletingEventId = eventId;
  document.getElementById('confirmDeleteTitle').textContent = eventTitle;
  openModal(modalConfirmarExcluir);
}

document.getElementById('btnNovoEvento').addEventListener('click', openNovoEventoModal);
document.getElementById('closeNovoEvento').addEventListener('click', () => closeModal(modalNovoEvento));
document.getElementById('cancelNovoEvento').addEventListener('click', () => closeModal(modalNovoEvento));

document.getElementById('btnImportarPlanilha').addEventListener('click', () => openModal(modalImportarPlanilha));
document.getElementById('closeImportarPlanilha').addEventListener('click', () => closeModal(modalImportarPlanilha));
document.getElementById('cancelImportarPlanilha').addEventListener('click', () => closeModal(modalImportarPlanilha));

document.getElementById('closeConfirmarExcluir').addEventListener('click', () => closeModal(modalConfirmarExcluir));
document.getElementById('cancelConfirmarExcluir').addEventListener('click', () => closeModal(modalConfirmarExcluir));

document.getElementById('btnConfirmarExcluir').addEventListener('click', async () => {
  if (!deletingEventId) return;
  try {
    await window.api.delete(`/eventos/${deletingEventId}`, { auth: true });
    closeModal(modalConfirmarExcluir);
    await renderCalendar();
    showToast('Evento excluído com sucesso.');
  } catch (err) {
    alert(err?.data?.error || `Erro ao excluir evento: ${err.message}`);
  } finally {
    deletingEventId = null;
  }
});

[modalNovoEvento, modalImportarPlanilha, modalConfirmarExcluir].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    [modalNovoEvento, modalImportarPlanilha, modalConfirmarExcluir].forEach(closeModal);
  }
});

/* ──────────────────────────────────────────────────────────
   FORMULÁRIO — NOVO EVENTO
────────────────────────────────────────────────────────── */
document.getElementById('formNovoEvento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnSalvarEvento');
  if (btn.disabled) return;
  btn.disabled = true;

  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;
  const startTime = document.getElementById('eventStart').value;
  const endTime = document.getElementById('eventEnd').value;
  const color = document.getElementById('eventCategory').value;
  const location = document.getElementById('eventLocation').value.trim();
  const participants = document.getElementById('eventParticipants').value;

  if (!title || !date || !startTime) { btn.disabled = false; return; }

  const isEditing = !!editingEvent;

  const payload = {
    nome: title,
    data_inicio: `${date}T${startTime}:00`,
    data_fim: endTime ? `${date}T${endTime}:00` : null,
    tipo: COLOR_TO_TIPO[color] || 'Outro',
    local: location || null,
    vagas: participants ? Number(participants) : null,
  };

  try {
    if (isEditing) {
      await window.api.put(`/eventos/${editingEvent.id}`, { body: payload, auth: true });
    } else {
      await window.api.post('/eventos', { body: payload, auth: true });
    }

    const [y, m, d] = date.split('-').map(Number);
    selectedDate = new Date(y, m - 1, d);
    state.year = selectedDate.getFullYear();
    state.month = selectedDate.getMonth();

    closeModal(modalNovoEvento);
    await renderCalendar();
    showSuccessOverlay(
      isEditing ? 'Evento atualizado!' : 'Evento criado!',
      isEditing ? 'As alterações foram salvas com sucesso.' : 'O evento foi salvo com sucesso.'
    );
  } catch (err) {
    alert(err?.data?.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} evento: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

/* ──────────────────────────────────────────────────────────
   IMPORTAÇÃO DE PLANILHA (.csv)
────────────────────────────────────────────────────────── */
const fileInput = document.getElementById('fileInput');
const fileDrop = document.getElementById('fileDrop');
const fileDropText = document.getElementById('fileDropText');
const importFeedback = document.getElementById('importFeedback');
const confirmImportarPlanilha = document.getElementById('confirmImportarPlanilha');

let parsedImportEvents = null;

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const events = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx]; });

    if (!row.data || !row.titulo) continue;

    const color = CATEGORY_COLORS[row.categoria?.toLowerCase()] || 'blue';

    events.push({
      date: row.data,
      time: row.horario_inicio || '00:00',
      endTime: row.horario_fim || null,
      title: row.titulo,
      color,
      location: row.local || null,
      participants: row.participantes ? Number(row.participantes) : null,
    });
  }

  return events;
}

function handleFile(file) {
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.csv')) {
    importFeedback.textContent = 'Formato inválido. Envie um arquivo .csv.';
    importFeedback.className = 'import-feedback error';
    parsedImportEvents = null;
    confirmImportarPlanilha.disabled = true;
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const events = parseCSV(reader.result);
    if (events.length === 0) {
      importFeedback.textContent = 'Nenhum evento válido encontrado no arquivo.';
      importFeedback.className = 'import-feedback error';
      parsedImportEvents = null;
      confirmImportarPlanilha.disabled = true;
      return;
    }
    parsedImportEvents = events;
    fileDropText.innerHTML = `Arquivo selecionado: <span>${file.name}</span>`;
    importFeedback.textContent = `${events.length} evento(s) prontos para importar.`;
    importFeedback.className = 'import-feedback success';
    confirmImportarPlanilha.disabled = false;
  };
  reader.readAsText(file, 'UTF-8');
}

fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

['dragover', 'dragleave', 'drop'].forEach(evt => {
  fileDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    if (evt === 'dragover') fileDrop.classList.add('dragover');
    else fileDrop.classList.remove('dragover');
  });
});
fileDrop.addEventListener('drop', (e) => {
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

confirmImportarPlanilha.addEventListener('click', async () => {
  if (!parsedImportEvents) return;

  try {
    for (const ev of parsedImportEvents) {
      await window.api.post('/eventos', {
        body: {
          nome: ev.title,
          data_inicio: `${ev.date}T${ev.time}:00`,
          data_fim: ev.endTime ? `${ev.date}T${ev.endTime}:00` : null,
          tipo: COLOR_TO_TIPO[ev.color] || 'Outro',
          local: ev.location || null,
          vagas: ev.participants ?? null,
        },
        auth: true,
      });
    }

    const last = parsedImportEvents[parsedImportEvents.length - 1];
    const [y, m, d] = last.date.split('-').map(Number);
    selectedDate = new Date(y, m - 1, d);
    state.year = selectedDate.getFullYear();
    state.month = selectedDate.getMonth();

    await renderCalendar();
    resetImportModal();
    closeModal(modalImportarPlanilha);
  } catch (err) {
    importFeedback.textContent = `Erro ao importar: ${err?.data?.error || err.message}`;
    importFeedback.className = 'import-feedback error';
  }
});

function resetImportModal() {
  fileInput.value = '';
  fileDropText.innerHTML = 'Arraste o arquivo aqui ou <span>clique para selecionar</span>';
  importFeedback.textContent = '';
  importFeedback.className = 'import-feedback';
  confirmImportarPlanilha.disabled = true;
  parsedImportEvents = null;
  fileDrop.classList.remove('dragover');
}

document.getElementById('closeImportarPlanilha').addEventListener('click', resetImportModal);
document.getElementById('cancelImportarPlanilha').addEventListener('click', resetImportModal);

/* ── Init ── */
renderCalendar();
