/* ═══════════════════════════════════════
   MAPEAMENTOS (espelham os ENUMs do backend)
═══════════════════════════════════════ */
const STATUS_LABEL = {
  Conectado: 'Conectado',
  Capacitado: 'Capacitado',
  Transformado: 'Transformado',
  Conectado_Capacitado: 'Conectado + Capacitado',
  Capacitado_Transformado: 'Capacitado + Transformado',
  Conectado_Capacitado_Transformado: 'Conectado + Capacitado + Transformado',
};
const STATUS_CLS = {
  Conectado:'bdg-con', Capacitado:'bdg-cap', Transformado:'bdg-tra',
  Conectado_Capacitado:'bdg-cap', Capacitado_Transformado:'bdg-tra',
  Conectado_Capacitado_Transformado:'bdg-tra'
};
const EMP_LBL = {
  Empregado:'Empregado', Em_formacao:'Em formação',
  Buscando:'Buscando', Empreendedor:'Empreendedor', Inativo:'Inativo'
};

/* ═══════════════════════════════════════
   ESTADO E ELEMENTOS
═══════════════════════════════════════ */
const G = id => document.getElementById(id);
const el = {
  search : G('searchInput'),
  multi  : G('togMulti'),
  chips  : document.querySelectorAll('.chip[data-emp]'),
  tbody  : G('tbody'),
  meta   : G('resMeta'),
  badge  : G('badgeN'),
  pager  : G('pager'),
  err    : G('errMsg'),
};

const PAGE_SIZE = 10;
let page = 1;
let JOVENS = [];
let PROGRAMAS_MAP = {};
const activeEmp = new Set(['Empregado','Em_formacao']);

/* esconde filtros que dependem de dados não disponíveis em GET /api/jovens */
['progSel','coorteSel','freqSlider'].forEach(id => {
  const node = G(id);
  if (!node) return;
  const wrap = node.closest('.fg') || node.closest('.freq-wrap');
  if (wrap) wrap.style.display = 'none';
});

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ═══════════════════════════════════════
   CARREGAMENTO
═══════════════════════════════════════ */
async function loadJovens() {
  el.err.classList.add('hidden');
  try {
    JOVENS = await window.api.get('/jovens', { params: { ativo: true }, auth: true });
    renderTable();
  } catch (e) {
    el.err.textContent = 'Erro ao carregar jovens: ' + e.message;
    el.err.classList.remove('hidden');
  }
}

async function loadProgramas() {
  try {
    const programas = await window.api.get('/programas', { params: { ativo: true }, auth: true });
    PROGRAMAS_MAP = {};
    programas.forEach(p => { PROGRAMAS_MAP[p.id] = p; });
  } catch (e) {
    PROGRAMAS_MAP = {};
  }
}

/* filtros locais */
function applyFilters(){
  const q    = el.search.value.trim().toLowerCase();
  const emp  = [...activeEmp];
  const onlyMulti = el.multi.checked;
  return JOVENS.filter(j=>{
    const digits = q.replace(/\D/g,'');
    const matchQ = !q ||
      j.nome.toLowerCase().includes(q) ||
      (digits.length===11 && String(j.cpf).replace(/\D/g,'')===digits);
    const matchM = !onlyMulti || j.multiplicador;
    const matchE = emp.length===0 || emp.includes(j.status_empregabilidade);
    return matchQ && matchM && matchE;
  });
}

/* render tabela */
function renderTable(){
  el.tbody.innerHTML='';
  const filtered = applyFilters();
  const total    = filtered.length;
  const start    = (page-1)*PAGE_SIZE;
  const slice    = filtered.slice(start, start+PAGE_SIZE);

  el.meta.textContent = total===0 ? 'Nenhum resultado.' :
    slice.length+' de '+total+' registro'+(total!==1?'s':'');
  el.badge.textContent = JOVENS.length+' cadastrados';

  if(!slice.length){
    const tr=document.createElement('tr'); tr.className='empty';
    const td=document.createElement('td'); td.colSpan=6;
    td.textContent='Nenhum jovem encontrado com os filtros selecionados.';
    tr.appendChild(td); el.tbody.appendChild(tr);
    renderPager(0); return;
  }

  slice.forEach(r=>{
    const cls = STATUS_CLS[r.status_jornada]||'bdg-con';
    const label = STATUS_LABEL[r.status_jornada] || r.status_jornada || '—';
    const emp = EMP_LBL[r.status_empregabilidade]||r.status_empregabilidade||'—';
    const tr  = document.createElement('tr');
    tr.innerHTML=
      '<td class="c-name">'+esc(r.nome)+'</td>'+
      '<td class="c-prog">—</td>'+
      '<td><span class="bdg '+cls+'">'+esc(label)+'</span></td>'+
      '<td class="c-freq">—</td>'+
      '<td class="c-emp">'+esc(emp)+'</td>'+
      '<td class="c-ac">'+
        '<button class="lnk" onclick="openDrawer('+r.id+')">Ver</button>'+
        '<span class="sep"> · </span>'+
        '<button class="lnk" data-id="'+r.id+'" id="edit-'+r.id+'">Editar</button>'+
      '</td>';
    el.tbody.appendChild(tr);
  });

  // Delegação de evento para botões Editar
  el.tbody.querySelectorAll('[id^="edit-"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      window.location.href = 'cadastroJovem.html?id=' + id;
    });
  });

  renderPager(total);
}

/* paginação */
function renderPager(total){
  el.pager.innerHTML='';
  const pages = Math.ceil(total/PAGE_SIZE);
  if(pages<=1) return;
  const mk=(l,p,d)=>{
    const b=document.createElement('button'); b.className='pgb';
    b.textContent=l; b.disabled=d; b.onclick=()=>{page=p;renderTable();}; return b;
  };
  el.pager.appendChild(mk('« Primeiro',1,page===1));
  el.pager.appendChild(mk('‹ Anterior',page-1,page===1));
  const s=document.createElement('span'); s.className='pgi';
  s.textContent='Página '+page+' de '+pages; el.pager.appendChild(s);
  el.pager.appendChild(mk('Próximo ›',page+1,page===pages));
  el.pager.appendChild(mk('Último »',pages,page===pages));
}

/* ═══════════════════════════════════════
   DRAWER — detalhamento do jovem
═══════════════════════════════════════ */
function initials(nome){ return String(nome||'').split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase(); }

function formatCpf(cpf){
  const d = String(cpf||'').replace(/\D/g,'');
  return d.length===11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : (cpf||'—');
}

function formatDate(d){
  if(!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('pt-BR');
}

async function openDrawer(id){
  const j = JOVENS.find(x=>x.id===id);
  if(!j) return;

  G('dr-title').textContent = 'Detalhes do Jovem';
  G('dr-edit-btn').onclick = ()=>window.location.href='cadastroJovem.html?id='+j.id;

  const cls = STATUS_CLS[j.status_jornada]||'bdg-con';
  const label = STATUS_LABEL[j.status_jornada] || j.status_jornada || '—';
  const emp = EMP_LBL[j.status_empregabilidade]||j.status_empregabilidade||'—';

  G('dr-body').innerHTML = `
    <div class="dr-hero">
      <div class="dr-avatar">${initials(j.nome)}</div>
      <div>
        <div class="dr-name">${esc(j.nome)}</div>
        <div class="dr-sub">${formatCpf(j.cpf)} &nbsp;·&nbsp; ${formatDate(j.data_nascimento)}</div>
      </div>
    </div>

    <div class="dr-badges">
      <span class="bdg ${cls}">${esc(label)}</span>
      <span class="bdg" style="background:#F0F2F5;color:#1A1A1A">${esc(emp)}</span>
      ${j.multiplicador ? '<span class="bdg" style="background:#F0F2F5;color:#1A1A1A">Multiplicador</span>' : ''}
    </div>

    <div class="dr-section">
      <div class="dr-section-title">Contato</div>
      <div class="dr-grid">
        <div class="dr-field full">
          <span class="dr-label">E-mail</span>
          <span class="dr-value">${esc(j.email || '—')}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Telefone</span>
          <span class="dr-value">${esc(j.telefone || '—')}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Bairro</span>
          <span class="dr-value">${esc(j.bairro || '—')}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Cidade / UF</span>
          <span class="dr-value">${esc(j.cidade || '—')}${j.estado ? ' — ' + esc(j.estado) : ''}</span>
        </div>
      </div>
    </div>

    <hr class="dr-divider">

    <div class="dr-section" id="dr-loading-section">
      <div class="dr-section-title">Carregando ficha...</div>
    </div>
  `;

  // Foto do jovem (fonte: usuarios.foto_url da conta vinculada); fallback iniciais
  window.avatar.render(G('dr-body').querySelector('.dr-avatar'), j.foto_url, j.nome);

  G('overlay').classList.add('open');
  G('drawer').classList.add('open');
  document.body.style.overflow='hidden';

  try {
    const ficha = await window.api.get(`/jovens/${id}/ficha`, { auth: true });
    renderFichaSections(ficha);
  } catch (e) {
    const section = G('dr-loading-section');
    if (section) section.innerHTML = `<div class="dr-section-title">Ficha</div><p class="dr-value">Erro ao carregar dados adicionais: ${esc(e.message)}</p>`;
  }
}

function renderFichaSections(ficha){
  const section = G('dr-loading-section');
  if (!section) return;

  const pct = ficha.frequencia && ficha.frequencia.total_aulas
    ? Math.max(0, Math.min(100, ficha.frequencia.percentual || 0))
    : null;

  const matriculasHtml = (ficha.matriculas || []).map(m => {
    const programa = PROGRAMAS_MAP[m.programa_id];
    return `
      <div class="dr-field full">
        <span class="dr-label">${programa ? esc(programa.nome) + (programa.coorte ? ' · ' + esc(programa.coorte) : '') : 'Programa #' + m.programa_id}</span>
        <span class="dr-value">Status: ${esc(m.status)} · Matrícula em ${formatDate(m.data_matricula)}${m.data_conclusao ? ' · Conclusão em ' + formatDate(m.data_conclusao) : ''}</span>
      </div>`;
  }).join('');

  const mentoria = ficha.ultima_mentoria;
  const ensino = (ficha.ensino_superior || []);
  const certificados = ficha.certificados || [];
  const competencias = ficha.competencias || [];

  section.outerHTML = `
    <div class="dr-section">
      <div class="dr-section-title">Programa</div>
      <div class="dr-grid">
        ${matriculasHtml || '<div class="dr-field full"><span class="dr-value">Nenhuma matrícula encontrada.</span></div>'}
        ${pct !== null ? `
        <div class="dr-field full">
          <span class="dr-label">Frequência</span>
          <div class="dr-fbar" style="margin-top:4px">
            <div class="dr-ftrack"><div class="dr-ffill" style="width:${pct}%"></div></div>
            <span class="dr-fpct">${pct}%</span>
          </div>
        </div>` : ''}
      </div>
    </div>

    <hr class="dr-divider">

    <div class="dr-section">
      <div class="dr-section-title">Mentoria</div>
      <div class="dr-grid">
        ${mentoria ? `
        <div class="dr-field full">
          <span class="dr-label">Mentor</span>
          <span class="dr-value">${esc(mentoria.mentor_nome)}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Última mentoria</span>
          <span class="dr-value">${formatDate(mentoria.data_mentoria)}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Status</span>
          <span class="dr-value">${esc(mentoria.status_mentoria)}</span>
        </div>` : '<div class="dr-field full"><span class="dr-value">Nenhuma mentoria registrada.</span></div>'}
      </div>
    </div>

    <hr class="dr-divider">

    <div class="dr-section" style="padding-bottom:8px">
      <div class="dr-section-title">Formação e certificações</div>
      <div class="dr-grid">
        <div class="dr-field full">
          <span class="dr-value">${ensino.length ? ensino.map(e => esc(e.instituicao) + ' — ' + esc(e.cursos) + ' (' + esc(e.status) + ')').join('<br>') : 'Nenhum registro de ensino superior.'}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Certificados</span>
          <span class="dr-value">${certificados.length}</span>
        </div>
        <div class="dr-field">
          <span class="dr-label">Competências</span>
          <span class="dr-value">${competencias.length}</span>
        </div>
      </div>
    </div>
  `;
}

function closeDrawer(){
  G('overlay').classList.remove('open');
  G('drawer').classList.remove('open');
  document.body.style.overflow='';
}

/* fechar com Esc */
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });

/* ── Events ── */

// Overlay e drawer: fechar ao clicar no overlay ou no botão fechar
document.getElementById('overlay').addEventListener('click', closeDrawer);
document.querySelector('.dr-close').addEventListener('click', closeDrawer);
document.querySelector('.dr-btn-close').addEventListener('click', closeDrawer);

el.search.addEventListener('input',()=>{page=1;renderTable();});
el.multi.addEventListener('change',()=>{page=1;renderTable();});
el.chips.forEach(c=>c.addEventListener('click',()=>{
  const v=c.dataset.emp;
  activeEmp.has(v)?(activeEmp.delete(v),c.classList.remove('on')):(activeEmp.add(v),c.classList.add('on'));
  page=1; renderTable();
}));
G('btnExport').addEventListener('click',()=>alert('Exportação CSV — RF012 a implementar.'));
G('btnNew').addEventListener('click',()=>window.location.href='cadastroJovem.html');

/* ── Init ── */
if (typeof lucide !== 'undefined') lucide.createIcons();
loadProgramas();
loadJovens();
