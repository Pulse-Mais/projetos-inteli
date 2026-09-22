/* ============================================================
   registroAnotacoes.js — Lógica da Tela de Registro de Anotações
   Pulse Mais · Módulo 1AMD2
   Depende de: lucide (CDN), api.js (integração futura)
   ============================================================ */

/* ── Inicializa ícones Lucide ── */
lucide.createIcons();

/* ──────────────────────────────────────────────────────────
   SALVAR
────────────────────────────────────────────────────────── */
const params      = new URLSearchParams(window.location.search);
const jovemId     = params.get('id');
const anotacaoId  = params.get('anotacao_id');   // presente => modo edição
const modoEdicao  = !!anotacaoId;

/* ── Cancelar: volta ao perfil do jovem (ou à página anterior) ── */
document.getElementById('btnCancelar').addEventListener('click', () => {
  if (jovemId) window.location.href = `perfilAlunoGestao.html?id=${jovemId}`;
  else history.back();
});

/* ── Modo edição: carrega a anotação e preenche o formulário ── */
async function carregarAnotacao() {
  document.querySelector('.page-title').textContent = 'Editar anotação';
  try {
    const a = await window.api.get(`/anotacoes/${anotacaoId}`, { auth: true });
    document.getElementById('categoria').value      = a.categoria || '';
    document.getElementById('tipoAlerta').value     = a.tipo_alerta || 'Geral';
    document.getElementById('textoAnotacao').value  = a.texto || '';
  } catch (err) {
    alert(err?.data?.error || 'Erro ao carregar anotação.');
  }
}
if (modoEdicao) carregarAnotacao();

document.getElementById('btnSalvar').addEventListener('click', async () => {
  const categoria  = document.getElementById('categoria').value;
  const tipoAlerta = document.getElementById('tipoAlerta').value;
  const texto      = document.getElementById('textoAnotacao').value.trim();

  /* Validação básica */
  if (!categoria || !texto || !jovemId) {
    highlight('categoria',     !categoria);
    highlight('textoAnotacao', !texto);
    if (!jovemId) alert('Jovem não informado. Acesse pelo perfil do jovem.');
    return;
  }

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;

  try {
    if (modoEdicao) {
      await window.api.put(`/anotacoes/${anotacaoId}`, {
        body: { categoria, tipo_alerta: tipoAlerta, texto },
        auth: true,
      });
    } else {
      await window.api.post('/anotacoes', {
        body: { jovem_id: Number(jovemId), categoria, tipo_alerta: tipoAlerta, texto },
        auth: true,
      });
    }
    window.location.href = `perfilAlunoGestao.html?id=${jovemId}`;
  } catch (err) {
    alert(err?.data?.error || `Erro ao salvar anotação: ${err.message}`);
    btn.disabled = false;
  }
});

/* ── Utilitário: destaca campo inválido ── */
function highlight(id, hasError) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' ? el : el;
  target.style.borderColor = hasError ? '#DC2626' : '';

  if (hasError) {
    target.addEventListener('input', () => { target.style.borderColor = ''; }, { once: true });
    target.addEventListener('change', () => { target.style.borderColor = ''; }, { once: true });
  }
}