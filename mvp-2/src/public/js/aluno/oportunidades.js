/* oportunidades.js — Integração da tela Oportunidades
   Pulsar · Pulse Mais
*/

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    carregarCursos(),
    carregarEventos(),
    carregarBolsas(),
  ]);

  iniciarModal();
  lucide.createIcons();
});

/* ── Cursos ── */
async function carregarCursos() {
  const container = document.getElementById('opp-cursos-body');
  if (!container) return;

  try {
    const lista = await window.api.get('/oportunidades', { auth: true, params: { tipo: 'Curso' } });

    if (!lista?.length) {
      container.innerHTML = '<p class="opp-empty">Nenhum curso disponível.</p>';
      return;
    }

    container.innerHTML = lista.map(o => {
      const duracao = o.duracao ?? o.carga_horaria ?? null;
      const local   = o.local ?? o.modalidade ?? null;

      return `
        <article class="opp-card">
          <div class="opp-card-head">
            <h3 class="opp-card-title">${o.titulo ?? o.nome ?? '—'}</h3>
            <span class="opp-card-badge is-course">Curso</span>
          </div>
          <div class="opp-card-org">${o.organizacao ?? o.empresa ?? o.instituicao ?? ''}</div>
          <p class="opp-card-desc">${o.descricao ?? ''}</p>
          <div class="opp-card-meta">
            ${duracao ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="history"></i></span><span>${duracao}</span></div>` : ''}
            ${local   ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="map-pin"></i></span><span>${local}</span></div>` : ''}
          </div>
          <div class="opp-card-actions">
            <button class="btn btn-primary btn-block btn-ver-detalhes" data-id="${o.id}" data-type="oportunidade">Ver detalhes</button>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="opp-empty">Erro ao carregar cursos.</p>';
    console.error('Erro ao carregar cursos:', err);
  }
}

/* ── Eventos ── */
async function carregarEventos() {
  const container = document.getElementById('opp-eventos-body');
  if (!container) return;

  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const pad   = n => String(n).padStart(2, '0');
    const primeiro = `${year}-${pad(month + 1)}-01`;
    const ultimo   = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`;

    const lista = await window.api.get('/eventos', {
      auth: true,
      params: { data_inicio: primeiro, data_fim: ultimo },
    });

    if (!lista?.length) {
      container.innerHTML = '<p class="opp-empty">Nenhum evento disponível.</p>';
      return;
    }

    container.innerHTML = lista.map(o => {
      const local = o.local ?? null;
      const data  = o.data_inicio ? formatarData(o.data_inicio) : null;
      const vagas = o.vagas != null
        ? `${o.vagas} vaga${o.vagas !== 1 ? 's' : ''} disponíve${o.vagas !== 1 ? 'is' : 'l'}`
        : null;

      return `
        <article class="opp-card">
          <div class="opp-card-head">
            <h3 class="opp-card-title">${o.nome ?? '—'}</h3>
            <span class="opp-card-badge is-event">Evento</span>
          </div>
          <p class="opp-card-desc">${o.descricao ?? ''}</p>
          <div class="opp-card-meta">
            ${local ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="map-pin"></i></span><span>${local}</span></div>` : ''}
            ${data  ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="calendar"></i></span><span>${data}</span></div>` : ''}
            ${vagas ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="users"></i></span><span>${vagas}</span></div>` : ''}
          </div>
          <div class="opp-card-actions">
            <button class="btn btn-primary btn-block btn-ver-detalhes" data-id="${o.id}" data-type="evento">Ver detalhes</button>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="opp-empty">Erro ao carregar eventos.</p>';
    console.error('Erro ao carregar eventos:', err);
  }
}

/* ── Bolsas ── */
async function carregarBolsas() {
  const container = document.getElementById('opp-bolsas-body');
  if (!container) return;

  try {
    const lista = await window.api.get('/oportunidades', { auth: true, params: { tipo: 'Bolsa' } });

    if (!lista?.length) {
      container.innerHTML = '<p class="opp-empty">Nenhuma bolsa disponível.</p>';
      return;
    }

    container.innerHTML = lista.map(o => {
      const duracao = o.duracao ?? null;
      const valor   = o.valor != null
        ? (o.valor === 0 ? 'Gratuito' : `R$ ${Number(o.valor).toLocaleString('pt-BR')}`)
        : null;

      return `
        <article class="opp-card">
          <div class="opp-card-head">
            <h3 class="opp-card-title">${o.titulo ?? o.nome ?? '—'}</h3>
            <span class="opp-card-badge is-grant">Bolsa</span>
          </div>
          <div class="opp-card-org">${o.organizacao ?? o.empresa ?? o.instituicao ?? ''}</div>
          <p class="opp-card-desc">${o.descricao ?? ''}</p>
          <div class="opp-card-meta">
            ${duracao ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="history"></i></span><span>${duracao}</span></div>` : ''}
            ${valor   ? `<div class="opp-card-meta-row"><span class="meta-icon"><i data-lucide="briefcase"></i></span><span>${valor}</span></div>` : ''}
          </div>
          <div class="opp-card-actions">
            <button class="btn btn-primary btn-block btn-ver-detalhes" data-id="${o.id}" data-type="oportunidade">Ver detalhes</button>
          </div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<p class="opp-empty">Erro ao carregar bolsas.</p>';
    console.error('Erro ao carregar bolsas:', err);
  }
}

/* ── Modal de detalhes ── */
function iniciarModal() {
  const overlay  = document.getElementById('opp-modal');
  const btnClose = document.getElementById('modal-close');
  if (!overlay) return;

  const abrir  = () => { overlay.classList.add('is-visible');    document.body.style.overflow = 'hidden'; };
  const fechar = () => { overlay.classList.remove('is-visible'); document.body.style.overflow = ''; };

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-ver-detalhes');
    if (!btn) return;

    const id   = btn.dataset.id;
    const type = btn.dataset.type;

    document.getElementById('modal-titulo').textContent = 'Carregando...';
    document.getElementById('modal-body').innerHTML = '<div style="display:flex;justify-content:center;padding:24px 0"><span class="spinner" aria-label="Carregando…"></span></div>';
    abrir();
    lucide.createIcons();

    try {
      if (type === 'evento') {
        const ev = await window.api.get(`/eventos/${id}`, { auth: true });
        document.getElementById('modal-titulo').textContent = ev.nome ?? '—';
        document.getElementById('modal-body').innerHTML = `
          <div class="modal-detail-grid">
            ${ev.tipo       ? `<div class="modal-detail-item"><span class="modal-detail-label">Tipo</span><span class="modal-detail-value">${ev.tipo}</span></div>` : ''}
            ${ev.local      ? `<div class="modal-detail-item"><span class="modal-detail-label">Local</span><span class="modal-detail-value">${ev.local}</span></div>` : ''}
            ${ev.data_inicio ? `<div class="modal-detail-item"><span class="modal-detail-label">Início</span><span class="modal-detail-value">${formatarData(ev.data_inicio)}</span></div>` : ''}
            ${ev.data_fim    ? `<div class="modal-detail-item"><span class="modal-detail-label">Término</span><span class="modal-detail-value">${formatarData(ev.data_fim)}</span></div>` : ''}
            ${ev.vagas != null ? `<div class="modal-detail-item"><span class="modal-detail-label">Vagas</span><span class="modal-detail-value">${ev.vagas}</span></div>` : ''}
          </div>
          ${ev.descricao ? `<p class="modal-detail-desc">${ev.descricao}</p>` : ''}
        `;
      } else {
        const op = await window.api.get(`/oportunidades/${id}`, { auth: true });
        const titulo = op.titulo ?? op.nome ?? '—';
        document.getElementById('modal-titulo').textContent = titulo;
        document.getElementById('modal-body').innerHTML = `
          <div class="modal-detail-grid">
            ${op.tipo         ? `<div class="modal-detail-item"><span class="modal-detail-label">Tipo</span><span class="modal-detail-value">${op.tipo}</span></div>` : ''}
            ${op.organizacao  ? `<div class="modal-detail-item"><span class="modal-detail-label">Organização</span><span class="modal-detail-value">${op.organizacao}</span></div>` : ''}
            ${op.local        ? `<div class="modal-detail-item"><span class="modal-detail-label">Local</span><span class="modal-detail-value">${op.local}</span></div>` : ''}
            ${op.modalidade   ? `<div class="modal-detail-item"><span class="modal-detail-label">Modalidade</span><span class="modal-detail-value">${op.modalidade}</span></div>` : ''}
            ${op.data_inicio  ? `<div class="modal-detail-item"><span class="modal-detail-label">Início</span><span class="modal-detail-value">${formatarData(op.data_inicio)}</span></div>` : ''}
            ${op.data_fim     ? `<div class="modal-detail-item"><span class="modal-detail-label">Término</span><span class="modal-detail-value">${formatarData(op.data_fim)}</span></div>` : ''}
            ${op.duracao      ? `<div class="modal-detail-item"><span class="modal-detail-label">Duração</span><span class="modal-detail-value">${op.duracao}</span></div>` : ''}
            ${op.valor != null ? `<div class="modal-detail-item"><span class="modal-detail-label">Valor</span><span class="modal-detail-value">${op.valor === 0 ? 'Gratuito' : `R$ ${Number(op.valor).toLocaleString('pt-BR')}`}</span></div>` : ''}
            ${op.vagas != null ? `<div class="modal-detail-item"><span class="modal-detail-label">Vagas</span><span class="modal-detail-value">${op.vagas}</span></div>` : ''}
          </div>
          ${op.descricao ? `<p class="modal-detail-desc">${op.descricao}</p>` : ''}
          ${op.link ? `<a class="btn btn-primary" href="${op.link}" target="_blank" rel="noopener">Acessar link</a>` : ''}
        `;
      }
    } catch (err) {
      document.getElementById('modal-body').innerHTML = '<p class="opp-empty">Erro ao carregar detalhes.</p>';
    }
  });
}

/* ── Helper ── */
function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
