document.addEventListener('DOMContentLoaded', function () {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  const params = new URLSearchParams(window.location.search);
  const idExAluno = params.get('id');

  // Datas de início/fim de emprego e de certificado são sempre retroativas: anos
  // futuros não fazem sentido nesses campos do modal "Adicionar Conquista".
  var hojeIsoConquista = new Date().toISOString().split('T')[0];
  ['conqDataInicio', 'conqDataFim', 'conqDataCert'].forEach(function (id) {
    var campo = document.getElementById(id);
    if (campo) campo.max = hojeIsoConquista;
  });

  let conquistasAtuais = [];

  if (!idExAluno) {
    const lista = document.getElementById('conquistasListaCoord');
    if (lista) lista.innerHTML = '<p class="estado-carregando">Ex-aluno não identificado. Volte para a lista de alunos.</p>';
    return;
  }

  // Busca dados do portal (identidade + profissional) e conquistas em paralelo
  Promise.all([
    fetch('/alunos/' + idExAluno + '/portal').then(function (r) {
      if (!r.ok) throw new Error('Erro ' + r.status + ' ao carregar perfil');
      return r.json();
    }),
    fetch('/alunos/' + idExAluno + '/conquistas').then(function (r) {
      if (!r.ok) throw new Error('Erro ' + r.status + ' ao carregar conquistas');
      return r.json();
    })
  ])
    .then(function (resultados) {
      preencherIdentidade(resultados[0]);
      conquistasAtuais = resultados[1];
      renderConquistas(conquistasAtuais);
      renderJornada(resultados[0], conquistasAtuais);
    })
    .catch(function (err) {
      console.error(err);
      const lista = document.getElementById('conquistasListaCoord');
      if (lista) lista.innerHTML = '<p class="estado-carregando">Não foi possível carregar os dados deste ex-aluno.</p>';
    });

  // Preenche a coluna de identidade e os dados pessoais/profissionais do Portal
  function preencherIdentidade(dados) {
    const u = dados.usuario || {};
    setText('exCoordNome', u.nome);
    setText('exCoordEmail', u.email);
    setText('exCoordTelefone', dados.telefone);
    setText('exCoordFormatura', formatarData(dados.data_formatura));
    setText('exCoordCargo', dados.cargo_atual);
    setText('exCoordEmpresa', dados.empresa_atual);
    setText('exCoordArea', dados.area_interesse);
    setText('exCoordMentoria', dados.disponibilidade_mentoria === true ? 'Sim' : (dados.disponibilidade_mentoria === false ? 'Não' : ''));

    const foto = document.getElementById('exCoordFoto');
    if (foto && u.foto_url) foto.src = u.foto_url;

    if (u.nome) document.querySelector('.page-topbar h2').textContent = 'Perfil de ' + u.nome.split(' ')[0];
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = (val === '' || val == null) ? '—' : val;
  }

  // Renderiza a linha do tempo horizontal da jornada do ex-aluno (mesma lógica de conquistasExAluno.js)
  function renderJornada(portal, conquistas) {
    const el = document.getElementById('jornadaTimelineCoord');
    if (!el) return;

    const certificados = (conquistas || [])
      .filter(function (c) { return c.categoria === 'Certificado'; })
      .sort(function (a, b) { return (a.data || '').localeCompare(b.data || ''); });

    const jornada = {
      conectado:    portal && portal.data_ingresso ? String(portal.data_ingresso).split('T')[0] : null,
      capacitado:   certificados.length > 0 ? certificados[0].data : null,
      transformado: certificados.length > 0 ? certificados[certificados.length - 1].data : null,
      mentor:       null
    };
    const nivelConcluido = 3; // todo ex-aluno já completou ao menos até "Transformado"

    const etapas = [
      { chave: 'conectado',    label: 'Conectado',    desc: 'Entrou na rede' },
      { chave: 'capacitado',   label: 'Capacitado',   desc: 'Concluiu o programa' },
      { chave: 'transformado', label: 'Transformado', desc: 'Inserido no mercado' },
      { chave: 'mentor',       label: 'Mentor',       desc: 'Retribui à rede' }
    ];

    el.innerHTML = etapas.map(function (etapa, i) {
      const data = jornada[etapa.chave];
      const concluida = (i < nivelConcluido) || !!data;
      const proximaConcluida = i < etapas.length - 1 &&
        ((i + 1 < nivelConcluido) || !!jornada[etapas[i + 1].chave]);

      const classes = ['jornada__step'];
      classes.push(concluida ? 'jornada__step--done' : 'jornada__step--pendente');
      if (proximaConcluida) classes.push('jornada__step--conecta');

      const marcador = concluida
        ? '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
        : '';

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
    const lista = document.getElementById('conquistasListaCoord');
    if (!lista) return;
    if (!conquistas || conquistas.length === 0) {
      lista.innerHTML = '<p class="estado-carregando">Nenhuma conquista registrada ainda.</p>';
      return;
    }

    const ordenadas = [...conquistas].sort(function (a, b) { return b.data.localeCompare(a.data); });

    lista.innerHTML = ordenadas.map(function (c, idx) {
      const ehCertificado = c.categoria === 'Certificado';
      const botaoPdf = ehCertificado
        ? `<button type="button" class="btn btn--outline cert-item__pdf" data-indice-pdf="${idx}">
             <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
             ${c.arquivo_url ? 'Baixar Certificado' : 'Baixar PDF'}
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

    lista.querySelectorAll('.cert-item').forEach(function (item) {
      item.style.cursor = 'pointer';
      item.addEventListener('click', function (e) {
        if (e.target.closest('.cert-item__pdf')) return;
        abrirModalConquista(ordenadas[Number(item.dataset.indice)]);
      });
    });

    // Baixa o arquivo real do certificado quando existir; caso contrário, gera o PDF mock
    lista.querySelectorAll('.cert-item__pdf').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const c = ordenadas[Number(btn.dataset.indicePdf)];
        if (!c) return;
        if (c.arquivo_url) {
          baixarArquivoReal(c.arquivo_url, c.titulo);
        } else {
          baixarCertificadoCoord(c.titulo);
        }
      });
    });
  }

  // Formata data ISO para o padrão brasileiro (ex.: "15 jun. 2025")
  function formatarData(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  window.__formatarDataCoord = formatarData;

  // ===== MODAL: DETALHES DA CONQUISTA =====
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

  // Exclui a conquista aberta no modal de detalhes: certificado manual via
  // /conquistas-manuais, ou marco profissional via /historico (mesma chave usada
  // pelo botão "Editar" da Adicionar Conquista, ambos os tipos do mesmo modal).
  const btnExcluirConquista = document.getElementById('btnExcluirConquistaModal');
  if (btnExcluirConquista) {
    btnExcluirConquista.addEventListener('click', async function () {
      const idConquista = this.dataset.idConquista;
      const idHistorico = this.dataset.idHistorico;
      const titulo = this.dataset.titulo || 'esta conquista';
      if (!idConquista && !idHistorico) return;

      if (!confirm('Excluir "' + titulo + '"? Essa ação não pode ser desfeita.')) return;

      const endpoint = idConquista
        ? '/alunos/' + idExAluno + '/conquistas-manuais/' + idConquista
        : '/alunos/' + idExAluno + '/historico/' + idHistorico;

      this.disabled = true;
      try {
        const res = await fetch(endpoint, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('Erro ' + res.status);
        fecharModalConquista();
        await recarregarConquistas();
      } catch (error) {
        console.error('Erro ao excluir conquista:', error);
        alert('Não foi possível excluir a conquista. Tente novamente.');
      } finally {
        this.disabled = false;
      }
    });
  }

  // ===== MODAL: ADICIONAR CONQUISTA =====
  const modalAdicionar    = document.getElementById('modalAdicionarConquista');
  const formAdicionar     = document.getElementById('formAdicionarConquista');
  const erroAdicionar     = document.getElementById('erroAdicionarConquista');
  const btnSalvar         = document.getElementById('btnSalvarConquista');
  const selectTipoConq    = document.getElementById('conqTipo');
  const camposEmprego     = document.getElementById('camposEmprego');
  const camposCertificado = document.getElementById('camposCertificado');
  const inputArquivo      = document.getElementById('conqArquivo');

  const TAMANHO_MAX_ARQUIVO = 4 * 1024 * 1024; // 4 MB
  let arquivoBase64 = null;

  // Alterna os grupos de campos visíveis conforme o tipo de conquista escolhido
  function atualizarCamposConquista() {
    const ehCertificado = selectTipoConq.value === 'certificado';
    camposEmprego.style.display     = ehCertificado ? 'none' : '';
    camposCertificado.style.display = ehCertificado ? '' : 'none';
  }
  selectTipoConq.addEventListener('change', atualizarCamposConquista);

  // Converte o arquivo selecionado (PDF ou imagem) para base64, com limite de tamanho
  inputArquivo.addEventListener('change', function () {
    const file = this.files[0];
    arquivoBase64 = null;
    erroAdicionar.style.display = 'none';
    if (!file) return;

    if (file.size > TAMANHO_MAX_ARQUIVO) {
      erroAdicionar.textContent = 'Arquivo muito grande. O tamanho máximo é 4 MB.';
      erroAdicionar.style.display = 'block';
      this.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) { arquivoBase64 = e.target.result; };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnAdicionarConquista').addEventListener('click', function () {
    formAdicionar.reset();
    arquivoBase64 = null;
    erroAdicionar.style.display = 'none';
    atualizarCamposConquista();
    modalAdicionar.classList.add('aberto');
  });

  function fecharModalAdicionar() {
    modalAdicionar.classList.remove('aberto');
  }

  document.getElementById('btnFecharModalAdicionar').addEventListener('click', fecharModalAdicionar);
  document.getElementById('btnCancelarAdicionarConquista').addEventListener('click', fecharModalAdicionar);
  modalAdicionar.addEventListener('click', function (e) {
    if (e.target === modalAdicionar) fecharModalAdicionar();
  });

  // Recarrega conquistas e jornada para refletir o novo registro
  async function recarregarConquistas() {
    const [portalAtualizado, conquistasAtualizadas] = await Promise.all([
      fetch('/alunos/' + idExAluno + '/portal').then(function (r) { return r.json(); }),
      fetch('/alunos/' + idExAluno + '/conquistas').then(function (r) { return r.json(); })
    ]);
    conquistasAtuais = conquistasAtualizadas;
    renderConquistas(conquistasAtuais);
    renderJornada(portalAtualizado, conquistasAtuais);
  }

  // Registra a conquista: "emprego" via POST /historico, "certificado" via POST /conquistas-manuais
  formAdicionar.addEventListener('submit', async function (e) {
    e.preventDefault();
    erroAdicionar.style.display = 'none';

    const ehCertificado = selectTipoConq.value === 'certificado';
    let endpoint, dados;

    if (ehCertificado) {
      const titulo = document.getElementById('conqTitulo').value;
      const data   = document.getElementById('conqDataCert').value;
      if (!titulo || !data) {
        erroAdicionar.textContent = 'Título e data são obrigatórios.';
        erroAdicionar.style.display = 'block';
        return;
      }
      if (!arquivoBase64) {
        erroAdicionar.textContent = 'O arquivo do certificado (PDF ou imagem) é obrigatório.';
        erroAdicionar.style.display = 'block';
        return;
      }
      endpoint = '/alunos/' + idExAluno + '/conquistas-manuais';
      dados = {
        titulo: titulo,
        categoria: 'Certificado',
        data: data,
        descricao: document.getElementById('conqDescricaoCert').value || null,
        arquivo_url: arquivoBase64
      };
    } else {
      const cargo = document.getElementById('conqCargo').value;
      const empresa = document.getElementById('conqEmpresa').value;
      const dataInicio = document.getElementById('conqDataInicio').value;
      if (!cargo || !empresa || !dataInicio) {
        erroAdicionar.textContent = 'Cargo, empresa e data de início são obrigatórios.';
        erroAdicionar.style.display = 'block';
        return;
      }
      endpoint = '/alunos/' + idExAluno + '/historico';
      dados = {
        cargo: cargo,
        empresa: empresa,
        data_inicio: dataInicio,
        data_fim: document.getElementById('conqDataFim').value || null
      };
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Erro ao adicionar conquista');

      fecharModalAdicionar();
      await recarregarConquistas();
    } catch (err) {
      erroAdicionar.textContent = err.message;
      erroAdicionar.style.display = 'block';
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar Conquista';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    fecharModalConquista();
    fecharModalAdicionar();
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
  if (dataEl && typeof window.__formatarDataCoord === 'function') {
    dataEl.textContent = window.__formatarDataCoord(conquista.data);
  }

  const fotoEl  = document.getElementById('modalConquistaFoto');
  const iconeEl = document.getElementById('modalConquistaIcone');
  const imagemPreview = conquista.foto_url ||
    (conquista.arquivo_url && conquista.arquivo_url.startsWith('data:image') ? conquista.arquivo_url : null);
  if (imagemPreview) {
    fotoEl.src = imagemPreview;
    fotoEl.style.display  = 'block';
    iconeEl.style.display = 'none';
  } else {
    fotoEl.style.display  = 'none';
    iconeEl.style.display = '';
  }

  // O botão Excluir só aparece para conquistas que correspondem a uma linha real
  // (conquista_manual ou historico_profissional) — conquistas derivadas de eventos
  // ou de matrícula concluída não têm uma linha própria para apagar.
  const btnExcluir = document.getElementById('btnExcluirConquistaModal');
  if (conquista.id_conquista || conquista.id_historico) {
    btnExcluir.style.display = '';
    btnExcluir.dataset.idConquista = conquista.id_conquista || '';
    btnExcluir.dataset.idHistorico = conquista.id_historico || '';
    btnExcluir.dataset.titulo = conquista.titulo || '';
  } else {
    btnExcluir.style.display = 'none';
    delete btnExcluir.dataset.idConquista;
    delete btnExcluir.dataset.idHistorico;
  }

  const iconeDownload = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>';
  const btnPdf = document.getElementById('btnBaixarCertificadoModal');
  if (conquista.arquivo_url) {
    // Certificado real anexado pelo coordenador (PDF ou imagem) — baixa o arquivo original
    btnPdf.style.display = '';
    btnPdf.innerHTML = iconeDownload + ' Baixar Certificado';
    btnPdf.onclick = function () { baixarArquivoReal(conquista.arquivo_url, conquista.titulo); };
  } else if (conquista.categoria === 'Certificado') {
    // Certificado derivado da conclusão do programa, sem arquivo real — gera um PDF simples
    btnPdf.style.display = '';
    btnPdf.innerHTML = iconeDownload + ' Baixar Certificado PDF';
    btnPdf.onclick = function () { baixarCertificadoCoord(conquista.titulo); };
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

// Baixa o arquivo real anexado pelo coordenador (PDF ou imagem) convertendo a data URL em Blob.
// Necessário porque navegadores modernos (Chrome) bloqueiam window.open()/navegação direta
// para data: URLs grandes — a aba abria em branco e nunca carregava o conteúdo.
function baixarArquivoReal(dataUrl, nomeBase) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!match) return;

  const mime = match[1];
  const binario = atob(match[2]);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);

  const extensoesPorMime = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp'
  };
  const extensao = extensoesPorMime[mime] || '';

  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (nomeBase || 'certificado').replace(/[^\w]+/g, '_') + extensao;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Gera e baixa um certificado em PDF minimal client-side (mesmo gerador usado em conquistasExAluno.js)
function baixarCertificadoCoord(titulo) {
  function esc(s) { return String(s).replace(/([\\()])/g, '\\$1'); }

  const conteudo =
    'BT /F1 22 Tf 70 760 Td (' + esc('Certificado Pulse Mais') + ') Tj ET\n' +
    'BT /F1 15 Tf 70 715 Td (' + esc(titulo) + ') Tj ET';

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

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    localStorage.clear();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
