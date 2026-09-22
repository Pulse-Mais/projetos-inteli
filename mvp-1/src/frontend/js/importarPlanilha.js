// Importação em lote de alunos via planilha (.csv ou .xlsx) pelo coordenador.
// Diferente do cadastro manual, nenhuma coluna é obrigatória: o backend aceita
// linhas parcialmente preenchidas e gera placeholders para nome/e-mail/CPF ausentes.
document.addEventListener('DOMContentLoaded', function () {
  const btnAbrir   = document.getElementById('btnImportarPlanilha');
  const modal      = document.getElementById('modalImportarPlanilha');
  const btnFechar  = document.getElementById('btnFecharImportar');
  const btnEnviar  = document.getElementById('btnEnviarImportar');
  const inputArquivo = document.getElementById('inputArquivoPlanilha');
  const erro       = document.getElementById('erroImportar');
  const resultado  = document.getElementById('resultadoImportar');

  if (!btnAbrir || !modal) return;

  let importacaoRealizada = false;

  function abrirModal() {
    modal.classList.add('aberto');
  }

  function fecharModal() {
    modal.classList.remove('aberto');
    if (importacaoRealizada) {
      // Recarrega para refletir os novos alunos nos indicadores e gráficos do Dashboard
      window.location.reload();
      return;
    }
    resetarModal();
  }

  function resetarModal() {
    inputArquivo.value = '';
    erro.style.display = 'none';
    resultado.style.display = 'none';
    resultado.innerHTML = '';
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Importar Alunos';
  }

  btnAbrir.addEventListener('click', abrirModal);
  btnFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) fecharModal(); });

  btnEnviar.addEventListener('click', async function () {
    erro.style.display = 'none';
    resultado.style.display = 'none';

    const arquivo = inputArquivo.files[0];
    if (!arquivo) {
      erro.textContent = 'Selecione um arquivo .csv ou .xlsx antes de importar.';
      erro.style.display = 'block';
      return;
    }

    const formData = new FormData();
    formData.append('arquivo', arquivo);

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Importando...';

    try {
      const res = await fetch('/importacao/alunos', { method: 'POST', body: formData });
      const body = await res.json();

      if (!res.ok && res.status !== 207) {
        throw new Error(body.error || body.message || 'Erro ao importar a planilha.');
      }

      importacaoRealizada = body.importados > 0;
      renderizarResultado(body);
    } catch (err) {
      erro.textContent = err.message;
      erro.style.display = 'block';
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Importar Outro Arquivo';
    }
  });

  function renderizarResultado(body) {
    const conflitos = body.conflitos || [];

    let html =
      '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px;">' +
        statBox(body.importados, 'Importados', 'var(--color-primary)') +
        statBox(body.ignorados || 0, 'Linhas vazias ignoradas', 'var(--color-text-support)') +
        statBox(conflitos.length, 'Conflitos', conflitos.length > 0 ? 'var(--color-danger)' : 'var(--color-text-support)') +
      '</div>';

    if (conflitos.length > 0) {
      html +=
        '<p style="font-size:13px; font-weight:600; color:var(--color-danger); margin-bottom:8px;">Linhas não importadas:</p>' +
        '<div style="max-height:200px; overflow-y:auto; border:1px solid var(--color-border); border-radius:var(--radius-sm);">' +
        '<table style="width:100%; font-size:13px; border-collapse:collapse;">' +
          '<thead><tr style="background:var(--color-gray);">' +
            '<th style="text-align:left; padding:8px 12px;">Linha</th>' +
            '<th style="text-align:left; padding:8px 12px;">CPF</th>' +
            '<th style="text-align:left; padding:8px 12px;">Motivo</th>' +
          '</tr></thead><tbody>' +
          conflitos.map(function (c) {
            return '<tr style="border-top:1px solid var(--color-border);">' +
              '<td style="padding:8px 12px;">' + c.linha + '</td>' +
              '<td style="padding:8px 12px;">' + c.cpf + '</td>' +
              '<td style="padding:8px 12px;">' + c.motivo + '</td>' +
            '</tr>';
          }).join('') +
          '</tbody></table></div>';
    } else if (body.importados > 0) {
      html += '<p style="font-size:13px; color:var(--color-primary); font-weight:600;">Todos os alunos foram importados com sucesso!</p>';
    }

    resultado.innerHTML = html;
    resultado.style.display = 'block';
  }

  function statBox(valor, rotulo, cor) {
    return '<div style="flex:1; min-width:120px; padding:12px 16px; border:1px solid var(--color-border); border-radius:var(--radius-sm); text-align:center;">' +
      '<p style="font-size:24px; font-weight:700; color:' + cor + ';">' + valor + '</p>' +
      '<p style="font-size:12px; color:var(--color-text-support);">' + rotulo + '</p>' +
    '</div>';
  }
});
