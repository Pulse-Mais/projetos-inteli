document.addEventListener('DOMContentLoaded', function () {

  let todasOportunidades = [];
  let filtroAtivo = '';

  // Busca oportunidades via GET /oportunidades com os filtros ativos e renderiza os cards
  function carregarOportunidades() {
    const params = new URLSearchParams();
    if (filtroAtivo) params.set('tipo', filtroAtivo);
    const campoBusca = document.getElementById('buscaOport');
    const texto = campoBusca ? campoBusca.value.trim() : '';
    if (texto) params.set('busca', texto);

    fetch('/oportunidades?' + params.toString())
      .then(function (res) {
        if (!res.ok) throw new Error('Erro ao carregar oportunidades');
        return res.json();
      })
      .then(function (oport) {
        todasOportunidades = oport;
        renderOportunidades(todasOportunidades);
        atualizarContador(todasOportunidades.length, todasOportunidades.length);
      })
      .catch(function (err) {
        console.error(err);
        renderOportunidades([]);
      });
  }

  carregarOportunidades();

  // Atualiza o filtro de tipo ativo e recarrega as oportunidades ao clicar em um botão de filtro
  document.querySelectorAll('.oport-filtro').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.oport-filtro').forEach(function (b) { b.classList.remove('ativo'); });
      btn.classList.add('ativo');
      filtroAtivo = btn.dataset.tipo;
      carregarOportunidades();
    });
  });

  // Recarrega as oportunidades a cada caractere digitado no campo de busca por texto
  const campoBusca = document.getElementById('buscaOport');
  if (campoBusca) {
    campoBusca.addEventListener('input', function () { carregarOportunidades(); });
  }

  // Renderiza os cards de oportunidades no grid; exibe estado vazio se a lista estiver vazia
  function renderOportunidades(lista) {
    const grid  = document.getElementById('oportunidadesGrid');
    const vazio = document.getElementById('estadoVazioOport');
    if (!grid) return;

    if (!lista || lista.length === 0) {
      grid.innerHTML = '';
      if (vazio) vazio.style.display = 'flex';
      return;
    }

    if (vazio) vazio.style.display = 'none';

    // Cores de fundo e texto por tipo de oportunidade
    const TIPO_COR = {
      'Vaga':            { bg: 'rgba(0,56,112,0.08)',   cor: 'var(--color-primary)' },
      'Evento':          { bg: 'rgba(37,176,87,0.08)',  cor: 'var(--color-accent)' },
      'Estágio':         { bg: 'rgba(245,158,11,0.08)', cor: 'var(--color-warning)' },
      'Bolsa de Estudo': { bg: 'rgba(139,92,246,0.08)', cor: '#7c3aed' }
    };

    grid.innerHTML = lista.map(function (o) {
      const cores = TIPO_COR[o.tipo] || TIPO_COR['Vaga'];
      const prazoFmt = formatarData(o.prazo);
      return `
        <div class="oport-card card">
          <div class="oport-card__header">
            <span class="oport-card__tipo" style="background:${cores.bg};color:${cores.cor};">${o.tipo}</span>
            ${o.nivel ? `<span class="badge badge--pendente">${o.nivel}</span>` : ''}
          </div>
          <h3 class="oport-card__titulo">${o.titulo}</h3>
          <p class="oport-card__empresa">${o.empresa}</p>
          <p class="oport-card__desc">${o.descricao}</p>
          <div class="oport-card__footer">
            <div class="oport-card__meta">
              <span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                ${o.modalidade}
              </span>
              ${o.cidade ? `<span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                ${o.cidade}
              </span>` : ''}
              <span>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Até ${prazoFmt}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Abre o modal de detalhes ao clicar em um card; o índice isola os dados de cada oportunidade
    grid.querySelectorAll('.oport-card').forEach(function (card, index) {
      card.addEventListener('click', function () {
        abrirModalOport(lista[index]);
      });
    });
  }

  // ===== MODAL DE DETALHES DA OPORTUNIDADE =====
  let oportunidadeAtual = null;
  const modalOport        = document.getElementById('modalOportunidade');
  const btnFecharOport1   = document.getElementById('btnFecharModalOport');
  const btnFecharOport2   = document.getElementById('btnFecharModalOport2');
  const btnBaixarOportPdf = document.getElementById('btnBaixarOportPdf');

  // Preenche os campos do modal com os dados da oportunidade clicada e o exibe
  function abrirModalOport(oportunidade) {
    if (!modalOport || !oportunidade) return;
    oportunidadeAtual = oportunidade;

    const logoImg = document.getElementById('modalOportLogo');
    const logoPlaceholder = document.getElementById('modalOportLogoPlaceholder');
    if (oportunidade.foto_url) {
      logoImg.src = oportunidade.foto_url;
      logoImg.style.display = 'block';
      if (logoPlaceholder) logoPlaceholder.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      if (logoPlaceholder) logoPlaceholder.style.display = '';
    }

    document.getElementById('modalOportTipo').textContent       = oportunidade.tipo || '';
    document.getElementById('modalOportTitulo').textContent     = oportunidade.titulo || '';
    document.getElementById('modalOportEmpresa').textContent    = oportunidade.empresa || '';
    document.getElementById('modalOportModalidade').textContent = oportunidade.modalidade || '—';
    document.getElementById('modalOportPrazo').textContent      = formatarData(oportunidade.prazo) || '—';
    document.getElementById('modalOportCidade').textContent     = oportunidade.cidade || '—';
    document.getElementById('modalOportNivel').textContent      = oportunidade.nivel || '—';
    document.getElementById('modalOportDescricao').textContent  = oportunidade.descricao || 'Sem descrição disponível.';

    modalOport.classList.add('aberto');
  }

  // Fecha o modal de detalhes
  function fecharModalOport() {
    if (modalOport) modalOport.classList.remove('aberto');
  }

  // Gera e baixa um PDF simples no cliente com os dados da oportunidade aberta (sem chamada ao servidor)
  function baixarOportunidadePdf() {
    if (!oportunidadeAtual) return;
    const o = oportunidadeAtual;

    function esc(texto) {
      return String(texto || '').replace(/[\\()]/g, function (c) { return '\\' + c; });
    }

    const linhas = [
      'BT /F1 18 Tf 50 770 Td (' + esc(o.tipo + ' - ' + o.titulo) + ') Tj ET',
      'BT /F1 13 Tf 50 740 Td (' + esc('Empresa: ' + o.empresa) + ') Tj ET',
      'BT /F1 11 Tf 50 715 Td (' + esc('Modalidade: ' + (o.modalidade || '-') + '   Cidade: ' + (o.cidade || '-')) + ') Tj ET',
      'BT /F1 11 Tf 50 695 Td (' + esc('Nivel: ' + (o.nivel || '-') + '   Prazo: ' + (formatarData(o.prazo) || '-')) + ') Tj ET',
      'BT /F1 11 Tf 50 665 Td (' + esc((o.descricao || '').slice(0, 110)) + ') Tj ET',
    ].join('\n');

    const objs = [];
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
    objs[4] = '<< /Length ' + linhas.length + ' >>\nstream\n' + linhas + '\nendstream';
    objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (let i = 1; i < objs.length; i++) {
      offsets[i] = pdf.length;
      pdf += i + ' 0 obj\n' + objs[i] + '\nendobj\n';
    }
    const xref = pdf.length;
    pdf += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
    for (let j = 1; j < objs.length; j++) {
      pdf += String(offsets[j]).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = (o.titulo || 'oportunidade').replace(/[^\w]+/g, '_') + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (btnFecharOport1)   btnFecharOport1.addEventListener('click', fecharModalOport);
  if (btnFecharOport2)   btnFecharOport2.addEventListener('click', fecharModalOport);
  if (btnBaixarOportPdf) btnBaixarOportPdf.addEventListener('click', baixarOportunidadePdf);

  // Clicar fora do conteúdo do modal (no overlay) também fecha
  if (modalOport) {
    modalOport.addEventListener('click', function (e) {
      if (e.target === modalOport) fecharModalOport();
    });
  }

  // Tecla Esc fecha o modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModalOport();
  });

  // Atualiza o texto do contador de resultados exibidos
  function atualizarContador(filtrado, total) {
    const el = document.getElementById('contadorOport');
    if (el) el.textContent = `${filtrado} de ${total} oportunidades`;
  }

  // Formata data ISO para o padrão brasileiro (ex.: "20/jun./2026")
  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
});

// Remove a sessão do usuário e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    ['pulsemais_token', 'pulsemais_usuario', 'nomeUsuario', 'perfilUsuario', 'idAluno', 'usuarioId', 'emailUsuario']
      .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = '../index.html';
  }
}
