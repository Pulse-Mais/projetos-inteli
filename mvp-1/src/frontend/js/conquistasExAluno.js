document.addEventListener('DOMContentLoaded', function () {

  const idAluno = localStorage.getItem('idAluno');
  let nomeExAluno = localStorage.getItem('nomeUsuario') || '';

  // Renderiza o placeholder da linha do tempo imediatamente para evitar FOUC
  renderJornada({}, 0);

  // Busca conquistas e dados do portal em paralelo para montar a linha do tempo
  Promise.all([
    fetch('/alunos/' + idAluno + '/conquistas').then(function (r) {
      if (!r.ok) throw new Error('Erro ' + r.status + ' ao carregar conquistas');
      return r.json();
    }),
    fetch('/alunos/' + idAluno + '/portal').then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; })
  ])
    .then(function (resultados) {
      var conquistas = resultados[0];
      var portal     = resultados[1];

      renderConquistas(conquistas);

      // Deriva as datas da jornada a partir das conquistas e do perfil do portal
      var certificados = conquistas
        .filter(function (c) { return c.categoria === 'Certificado'; })
        .sort(function (a, b) { return (a.data || '').localeCompare(b.data || ''); });

      var dataIngresso = portal && portal.data_ingresso
        ? portal.data_ingresso.split('T')[0]
        : null;

      var jornada = {
        conectado:    dataIngresso || null,
        capacitado:   certificados.length > 0 ? certificados[0].data : null,
        transformado: certificados.length > 0 ? certificados[certificados.length - 1].data : null,
        mentor:       null
      };

      // Ex-aluno sempre completou pelo menos até o nível "Transformado" (nível 3)
      renderJornada(jornada, 3);
    })
    .catch(function (err) {
      const lista = document.getElementById('conquistasLista');
      if (lista) lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar as conquistas.</p>';
      console.error(err);
      // Mesmo com erro, marca a jornada como concluída até Transformado
      renderJornada({}, 3);
    });

  // Renderiza a linha do tempo horizontal da jornada do ex-aluno
  // nivelConcluido: 0=nenhum, 1=conectado, 2=capacitado, 3=transformado, 4=mentor
  function renderJornada(jornada, nivelConcluido) {
    const el = document.getElementById('jornadaTimeline');
    if (!el) return;
    jornada = jornada || {};
    nivelConcluido = nivelConcluido || 0;

    const etapas = [
      { chave: 'conectado',    label: 'Conectado',    desc: 'Entrou na rede' },
      { chave: 'capacitado',   label: 'Capacitado',   desc: 'Concluiu o programa' },
      { chave: 'transformado', label: 'Transformado', desc: 'Inserido no mercado' },
      { chave: 'mentor',       label: 'Mentor',       desc: 'Retribui à rede' }
    ];

    el.innerHTML = etapas.map(function (etapa, i) {
      const data = jornada[etapa.chave];
      // Etapa concluída se o nível garante isso OU se há uma data registrada
      const concluida = (i < nivelConcluido) || !!data;
      // Conector verde somente se a próxima etapa também está concluída
      const proximaConcluida = i < etapas.length - 1 &&
        ((i + 1 < nivelConcluido) || !!jornada[etapas[i + 1].chave]);

      const classes = ['jornada__step'];
      classes.push(concluida ? 'jornada__step--done' : 'jornada__step--pendente');
      if (proximaConcluida) classes.push('jornada__step--conecta');

      const marcador = concluida
        ? '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
        : '';

      // Data real se disponível, "Concluído" se etapa done sem data, "Em breve" se pendente
      const dataFmt = data ? formatarData(data) : (concluida ? 'Concluído' : 'Em breve');

      return `
        <div class="${classes.join(' ')}">
          <div class="jornada__dot">${marcador}</div>
          <div class="jornada__label">${etapa.label}</div>
          <div class="jornada__desc">${etapa.desc}</div>
          <div class="jornada__data">${dataFmt}</div>
        </div>
      `;
    }).join('');
  }

  // Renderiza a lista de conquistas e certificados ordenada da mais recente para a mais antiga
  function renderConquistas(conquistas) {
    const lista = document.getElementById('conquistasLista');
    if (!lista) return;
    if (!conquistas || conquistas.length === 0) {
      lista.innerHTML = '<p class="estado-carregando">Nenhuma conquista registrada.</p>';
      return;
    }

    const ordenadas = [...conquistas].sort(function (a, b) { return b.data.localeCompare(a.data); });

    lista.innerHTML = ordenadas.map(function (c, idx) {
      const ehCertificado = c.categoria === 'Certificado';
      const botaoPdf = ehCertificado
        ? `<button type="button" class="btn btn--outline cert-item__pdf" onclick="baixarCertificado('${c.titulo.replace(/'/g, "\\'")}')">
             <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
             Baixar PDF
           </button>`
        : '';

      return `
        <div class="cert-item" data-indice="${idx}">
          <div class="cert-item__icone">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          </div>
          <div class="cert-item__info">
            <p class="cert-item__titulo">${c.titulo}</p>
            <p class="cert-item__meta">${c.categoria} &bull; ${formatarData(c.data)}</p>
            <p class="cert-item__desc">${c.descricao}</p>
          </div>
          <div class="cert-item__acao">
            <span class="badge badge--ativo">${c.categoria}</span>
            ${botaoPdf}
          </div>
        </div>
      `;
    }).join('');

    // Abre o modal de detalhes ao clicar no item; o índice isola os dados de cada conquista
    lista.querySelectorAll('.cert-item').forEach(function (item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function (e) {
        // Evita reabrir o modal quando o clique foi no botão de baixar PDF do card
        if (e.target.closest('.cert-item__pdf')) return;
        abrirModalConquista(ordenadas[Number(item.dataset.indice)]);
      });
    });
  }

  // Formata data ISO para o padrão brasileiro (ex.: "15 jun. 2025")
  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // Expõe o nome do ex-aluno para o gerador de PDF no escopo global
  window.__nomeExAluno = function () { return nomeExAluno; };

  // ===== MODAL DE DETALHES DA CONQUISTA =====
  const modalConquista = document.getElementById('modalConquista');
  const btnFechar1     = document.getElementById('btnFecharModalConquista');
  const btnFechar2     = document.getElementById('btnFecharModalConquista2');

  if (btnFechar1) btnFechar1.addEventListener('click', fecharModalConquista);
  if (btnFechar2) btnFechar2.addEventListener('click', fecharModalConquista);

  if (modalConquista) {
    modalConquista.addEventListener('click', function (e) {
      if (e.target === modalConquista) fecharModalConquista();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModalConquista();
  });
});

// Preenche o modal com os dados da conquista clicada e o exibe;
// o botão de PDF só aparece para a categoria "Certificado"
function abrirModalConquista(conquista) {
  const modal = document.getElementById('modalConquista');
  if (!modal || !conquista) return;

  document.getElementById('modalConquistaCategoria').textContent = conquista.categoria || '';
  document.getElementById('modalConquistaTitulo').textContent    = conquista.titulo || '';
  document.getElementById('modalConquistaDescricao').textContent = conquista.descricao || 'Sem descrição disponível.';

  const dataEl = document.getElementById('modalConquistaData');
  if (dataEl) {
    const d = conquista.data ? new Date(conquista.data + 'T00:00:00') : null;
    dataEl.textContent = d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  }

  const fotoEl  = document.getElementById('modalConquistaFoto');
  const iconeEl = document.getElementById('modalConquistaIcone');
  if (conquista.foto_url) {
    fotoEl.src = conquista.foto_url;
    fotoEl.style.display  = 'block';
    iconeEl.style.display = 'none';
  } else {
    fotoEl.style.display  = 'none';
    iconeEl.style.display = '';
  }

  const btnPdf = document.getElementById('btnBaixarCertificadoModal');
  if (conquista.categoria === 'Certificado') {
    btnPdf.style.display = '';
    btnPdf.onclick = function () { baixarCertificado(conquista.titulo); };
  } else {
    btnPdf.style.display = 'none';
    btnPdf.onclick = null;
  }

  modal.classList.add('aberto');
}

// Fecha o modal de detalhes da conquista
function fecharModalConquista() {
  const modal = document.getElementById('modalConquista');
  if (modal) modal.classList.remove('aberto');
}

// Gera e baixa um certificado em PDF minimal client-side (mock).
// Substituir por download do arquivo real quando a API estiver disponível.
function baixarCertificado(titulo) {
  const nome = (typeof window.__nomeExAluno === 'function' && window.__nomeExAluno()) || 'Ex-Aluno(a)';

  function esc(s) { return String(s).replace(/([\\()])/g, '\\$1'); }

  const conteudo =
    'BT /F1 22 Tf 70 760 Td (' + esc('Certificado Pulse Mais') + ') Tj ET\n' +
    'BT /F1 15 Tf 70 715 Td (' + esc(titulo) + ') Tj ET\n' +
    'BT /F1 12 Tf 70 685 Td (' + esc('Emitido para: ' + nome) + ') Tj ET';

  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>';
  objs[4] = '<< /Length ' + conteudo.length + ' >>\nstream\n' + conteudo + '\nendstream';
  objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = pdf.length;
    pdf += i + ' 0 obj\n' + objs[i] + '\nendobj\n';
  }
  const xrefPos = pdf.length;
  pdf += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
  for (let i = 1; i < objs.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = titulo.replace(/[^\w]+/g, '_') + '.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Remove a sessão do usuário e redireciona para o login
function logout() {
  if (confirm('Deseja realmente sair?')) {
    ['pulsemais_token', 'pulsemais_usuario', 'nomeUsuario', 'perfilUsuario', 'idAluno', 'usuarioId', 'emailUsuario']
      .forEach(function (k) { localStorage.removeItem(k); });
    window.location.href = '../index.html';
  }
}
