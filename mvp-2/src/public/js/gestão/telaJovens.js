/* ── mapeamentos de status (espelham os ENUMs do backend) ── */
const STATUS_LABEL = {
  Conectado: "Conectado",
  Capacitado: "Capacitado",
  Transformado: "Transformado",
  Conectado_Capacitado: "Conectado + Capacitado",
  Capacitado_Transformado: "Capacitado + Transformado",
  Conectado_Capacitado_Transformado: "Conectado + Capacitado + Transformado",
};
const STATUS_BADGE = {
  Conectado: "badge-info",
  Capacitado: "badge-warning",
  Transformado: "badge-success",
  Conectado_Capacitado: "badge-warning",
  Capacitado_Transformado: "badge-success",
  Conectado_Capacitado_Transformado: "badge-success",
};
const EMP_LABEL = {
  Empregado: "Empregado",
  Em_formacao: "Em formação",
  Buscando: "Buscando",
  Empreendedor: "Empreendedor",
  Inativo: "Inativo",
};

/* ── estado ── */
let jovens      = [];
let searchVal   = "";
let onlyMulti   = false;
let activeEmp   = new Set(["Empregado", "Em_formacao", "Buscando", "Empreendedor", "Inativo"]);
let currentPage = 1;
const PER_PAGE  = 15;

/* ── filtro ── */
function getFiltered() {
  const q = searchVal.toLowerCase();
  return jovens.filter(j => {
    if (q && !j.nome.toLowerCase().includes(q)) return false;
    if (onlyMulti && !j.multiplicador) return false;
    if (activeEmp.size < 5 && !activeEmp.has(j.status_empregabilidade)) return false;
    return true;
  });
}

const TABLE_EMPTY_ROW = `<tr><td colspan="6" class="table-empty-row"><span><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg><span>Sem dados</span></span></td></tr>`;

/* ── render da tabela (recebe só os itens da página atual) ── */
function renderTable(pageItems, hasResults) {
  const tbody = document.getElementById("tableBody");

  if (!hasResults) {
    tbody.innerHTML = TABLE_EMPTY_ROW;
    return;
  }

  tbody.innerHTML = pageItems.map(j => {
    const badge    = STATUS_BADGE[j.status_jornada] || "badge-info";
    const label    = STATUS_LABEL[j.status_jornada] || j.status_jornada || "—";
    const emp      = EMP_LABEL[j.status_empregabilidade] || j.status_empregabilidade || "—";
    const programa = j.programa_nome || "—";
    const freq     = j.frequencia != null ? `${j.frequencia}%` : "—";
    const freqCls  = j.frequencia == null ? "" : j.frequencia >= 75 ? "freq-ok" : j.frequencia >= 60 ? "freq-atencao" : "freq-risco";
    return `
      <tr>
        <td class="col-nome">${esc(j.nome)}</td>
        <td class="col-programa">${esc(programa)}</td>
        <td>
          <span class="badge ${badge}">${esc(label)}</span>
        </td>
        <td class="col-freq"><span class="${freqCls}">${esc(freq)}</span></td>
        <td class="col-emp">${esc(emp)}</td>
        <td class="col-acoes">
          <div class="acoes">
            <a class="btn-acao" href="#" onclick="verJovem(${j.id});return false;">Ver</a>
            <div class="row-menu">
              <button class="row-menu-btn" type="button" aria-label="Mais ações" onclick="toggleRowMenu(event, ${j.id});">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              <div class="row-menu-dropdown" id="rowMenu-${j.id}" hidden>
                <button class="row-menu-item" type="button" onclick="editarJovem(${j.id});">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  Editar
                </button>
                <button class="row-menu-item is-danger" type="button" onclick="pedirConfirmacaoExclusao(${j.id});">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* ── menu de 3 pontinhos (só um aberto por vez) ── */
function toggleRowMenu(event, id) {
  event.stopPropagation();
  const menu = document.getElementById(`rowMenu-${id}`);
  const estavaAberto = !menu.hidden;
  document.querySelectorAll(".row-menu-dropdown").forEach(m => { m.hidden = true; });
  menu.hidden = estavaAberto;
}
document.addEventListener("click", () => {
  document.querySelectorAll(".row-menu-dropdown").forEach(m => { m.hidden = true; });
});

/* ── exclusão (soft-delete via PATCH /jovens/:id/arquivar) ── */
let jovemParaExcluir = null;
const modalExcluir    = document.getElementById("modalConfirmExcluir");
const btnConfirmar    = document.getElementById("confirmExcluirBtn");

function pedirConfirmacaoExclusao(id) {
  document.querySelectorAll(".row-menu-dropdown").forEach(m => { m.hidden = true; });
  const jovem = jovens.find(j => j.id === id);
  jovemParaExcluir = id;
  document.getElementById("confirmExcluirNome").textContent = jovem ? jovem.nome : "este jovem";
  modalExcluir.classList.add("active");
}

function fecharModalExcluir() {
  modalExcluir.classList.remove("active");
  jovemParaExcluir = null;
}

document.getElementById("closeConfirmExcluir").addEventListener("click", fecharModalExcluir);
document.getElementById("cancelConfirmExcluir").addEventListener("click", fecharModalExcluir);
modalExcluir.addEventListener("click", e => { if (e.target === modalExcluir) fecharModalExcluir(); });

btnConfirmar.addEventListener("click", async () => {
  if (!jovemParaExcluir) return;
  const id = jovemParaExcluir;
  const textoOriginal = btnConfirmar.textContent;
  btnConfirmar.disabled = true;
  btnConfirmar.textContent = "Excluindo...";
  try {
    await window.api.patch(`/jovens/${id}/arquivar`, { auth: true });
    window.api.invalidateCache('/jovens');
    window.api.invalidateCache('/matriculas');
    window.api.invalidateCache('/frequencias/resumo');
    jovens = jovens.filter(j => j.id !== id);
    document.getElementById("countBadge").textContent =
      `${jovens.length} cadastrado${jovens.length === 1 ? "" : "s"}`;
    fecharModalExcluir();
    render();
  } catch (e) {
    alert(e?.data?.error || "Erro ao excluir jovem.");
  } finally {
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = textoOriginal;
  }
});

/* ── render da paginação (estilo igual ao de registrarMentoriaMentor.js) ── */
function renderPagination(total, totalPages) {
  const countEl   = document.getElementById("jovensCount");
  const container = document.getElementById("jovensPagination");

  if (countEl) {
    const start = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
    const end   = Math.min(currentPage * PER_PAGE, total);
    countEl.textContent = total === 0 ? "" : `Exibindo ${start}–${end} de ${total} jovens`;
  }

  if (!container) return;

  if (totalPages <= 1) { container.hidden = true; return; }
  container.hidden = false;

  const WING = 2;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - WING && i <= currentPage + WING)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  container.innerHTML = `
    <button class="page-btn" id="prevPage" ${currentPage === 1 ? "disabled" : ""} aria-label="Página anterior">
      <i data-lucide="chevron-left" style="width:16px;height:16px"></i>
    </button>
    ${pages.map(p => p === "…"
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === currentPage ? "is-active" : ""}" data-page="${p}">${p}</button>`
    ).join("")}
    <button class="page-btn" id="nextPage" ${currentPage === totalPages ? "disabled" : ""} aria-label="Próxima página">
      <i data-lucide="chevron-right" style="width:16px;height:16px"></i>
    </button>`;

  if (window.lucide) lucide.createIcons();

  container.querySelector("#prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; render(); scrollToList(); }
  });
  container.querySelector("#nextPage")?.addEventListener("click", () => {
    if (currentPage < totalPages) { currentPage++; render(); scrollToList(); }
  });
  container.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      render();
      scrollToList();
    });
  });
}

function scrollToList() {
  document.getElementById("tableBody")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ── render (filtra + pagina + desenha) ── */
function render() {
  const filtered   = getFiltered();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start     = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  renderTable(pageItems, filtered.length > 0);
  renderPagination(filtered.length, totalPages);
}

function esc(s) {
  return String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function verJovem(id)    { window.location.href = "perfilAlunoGestao.html?id=" + id; }
function editarJovem(id) { window.location.href = "cadastroJovem.html?id=" + id; }

/* ── skeleton de 8 linhas exibido enquanto os dados carregam ── */
const SKELETON_TR = `
  <tr>
    <td><span class="skeleton" style="width:55%;height:13px"></span></td>
    <td><span class="skeleton" style="width:70%;height:13px"></span></td>
    <td><span class="skeleton" style="width:80px;height:20px;border-radius:10px"></span></td>
    <td><span class="skeleton" style="width:38px;height:13px"></span></td>
    <td><span class="skeleton" style="width:65%;height:13px"></span></td>
    <td></td>
  </tr>`;

/* ── carregamento via API ── */
async function loadJovens() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = Array(8).fill(SKELETON_TR).join("");
  window.setPageLoading?.(true);
  try {
    const [jovensData, matriculasData, programasData, freqResumoData] = await Promise.all([
      window.api.get("/jovens",             { params: { ativo: true },   auth: true, cache: true, cacheTtl: 60_000 }),
      window.api.get("/matriculas",         { params: { status: "Ativo" }, auth: true, cache: true, cacheTtl: 60_000 }).catch(() => []),
      window.api.get("/programas",          { params: { ativo: true },   auth: true, cache: true, cacheTtl: 60_000 }).catch(() => []),
      window.api.get("/frequencias/resumo", {                             auth: true, cache: true, cacheTtl: 60_000 }).catch(() => []),
    ]);

    const programaMap = {};
    (Array.isArray(programasData) ? programasData : []).forEach(p => { programaMap[p.id] = p.nome; });

    const matriculaMap = {};
    (Array.isArray(matriculasData) ? matriculasData : []).forEach(m => {
      matriculaMap[m.jovem_id] = programaMap[m.programa_id] || null;
    });

    const freqMap = {};
    (Array.isArray(freqResumoData) ? freqResumoData : []).forEach(f => {
      freqMap[f.jovem_id] = f.percentual;
    });

    jovens = (Array.isArray(jovensData) ? jovensData : []).map(j => ({
      ...j,
      programa_nome: matriculaMap[j.id] || null,
      frequencia: freqMap[j.id] != null ? freqMap[j.id] : null,
    }));

    document.getElementById("countBadge").textContent =
      `${jovens.length} cadastrado${jovens.length === 1 ? "" : "s"}`;
    render();
  } catch (e) {
    tbody.innerHTML = TABLE_EMPTY_ROW;
    console.error('Erro ao carregar jovens:', e);
  } finally {
    window.setPageLoading?.(false);
  }
}

/* ── eventos ── */
document.getElementById("searchInput").addEventListener("input", e => {
  searchVal = e.target.value; currentPage = 1; render();
});

/* Programa, Coorte/Período e Frequência ainda não estão disponíveis na API de jovens */
["filterPrograma", "filterPeriodo", "filterFreq"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  const group = el.closest(".filter-group");
  if (group) group.style.display = "none";
});

document.getElementById("filterMult").addEventListener("change", e => {
  onlyMulti = e.target.checked; currentPage = 1; render();
});

document.querySelectorAll(".emp-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const val = chip.dataset.val;
    if (activeEmp.has(val)) activeEmp.delete(val);
    else activeEmp.add(val);
    chip.classList.toggle("active", activeEmp.has(val));
    currentPage = 1;
    render();
  });
});

document.getElementById("btnNovoJovem").addEventListener("click", () =>
  window.location.href = "cadastroJovem.html");

document.getElementById("btnExportar").addEventListener("click", exportarJovens);

async function exportarJovens() {
  const btn = document.getElementById("btnExportar");
  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Exportando...";
  try {
    const resp = await fetch("/api/jovens/exportar", {
      headers: { Authorization: `Bearer ${window.api.getToken()}` },
    });
    if (!resp.ok) throw new Error("Falha ao exportar a lista de jovens.");

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jovens-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(e.message || "Erro ao exportar a lista de jovens.");
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

/* ── init ── */
lucide.createIcons();
loadJovens();
