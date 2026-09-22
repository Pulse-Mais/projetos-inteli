/* ============================================================
   importarPlanilha.js — Importar Planilha (Frequência) via CSV
   Pulse Mais · Módulo 1AMD2
   Depende de: lucide (CDN), api.js, main.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  if (typeof lucide !== 'undefined') lucide.createIcons();

  /* ── Fechar / Cancelar ── */
  document.getElementById('btnClose').addEventListener('click', () => { window.location.href = 'dashboardGestao.html'; });
  document.getElementById('btnCancelar').addEventListener('click', () => { window.location.href = 'dashboardGestao.html'; });

  /* ── Elementos ── */
  const fileDrop     = document.getElementById('fileDrop');
  const fileInput    = document.getElementById('fileInput');
  const fileDropText = document.getElementById('fileDropText');
  const feedback     = document.getElementById('importFeedback');
  const btnImportar  = document.getElementById('btnImportar');

  let selectedFile = null;

  /* ── Drag & Drop ── */
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

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  /* ── Validar arquivo ── */
  function handleFile(file) {
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCSV) {
      showFeedback('Formato inválido. Selecione um arquivo .csv', 'error');
      reset();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('O arquivo excede o tamanho máximo de 5 MB.', 'error');
      reset();
      return;
    }

    selectedFile = file;
    fileDropText.innerHTML = `Arquivo selecionado: <span>${file.name}</span>`;
    showFeedback('', '');
    btnImportar.disabled = false;
  }

  function reset() {
    selectedFile = null;
    fileInput.value = '';
    fileDropText.innerHTML = 'Arraste o arquivo aqui ou <span>clique para selecionar</span>';
    btnImportar.disabled = true;
  }

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = 'import-feedback' + (type ? ` ${type}` : '');
  }

  /* ── Importar ── */
  btnImportar.addEventListener('click', async () => {
    if (!selectedFile) return;

    const originalLabel = btnImportar.textContent;
    btnImportar.disabled = true;
    btnImportar.textContent = 'Importando...';
    showFeedback('', '');

    try {
      const formData = new FormData();
      formData.append('arquivo', selectedFile);

      const response = await fetch('/api/frequencias/importar-csv', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${window.api.getToken()}` },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'Não foi possível processar o arquivo.');

      if (data.validos.length === 0) {
        throw new Error('Nenhum registro válido encontrado no arquivo.');
      }

      const resultado = await window.api.post('/frequencias/confirmar-importacao', {
        body: { registros: data.validos },
        auth: true,
      });

      let msg = `${resultado.importados} registro(s) importado(s) com sucesso.`;
      if (data.invalidos.length > 0) {
        msg += ` ${data.invalidos.length} registro(s) ignorado(s) por conter erros.`;
      }
      showFeedback(msg, 'success');
      reset();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      btnImportar.textContent = originalLabel;
      if (selectedFile) btnImportar.disabled = false;
    }
  });

});
