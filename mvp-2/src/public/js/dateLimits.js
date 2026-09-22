/* dateLimits.js — Define limites de data para todos os <input type="date">.
   Evita que o usuário selecione anos absurdos (passado remoto ou futuro infinito).

   Política:
   - min: 01/01/1900 (sem datas anteriores).
   - max: padrão = hoje + 5 anos (permite agendamentos/planejamentos, mas limitado).
          input com data-date-limit="past" = hoje (não permite datas futuras,
          ex.: data de nascimento, frequência, filtros, admissão).

   Aplica-se aos inputs presentes no carregamento e a qualquer input de data
   adicionado dinamicamente depois (modais, formulários injetados via JS). */
(function () {
  const MIN_DATE     = '1900-01-01';
  const FUTURE_YEARS = 5;

  function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function limites() {
    const hoje   = new Date();
    const futuro = new Date(hoje);
    futuro.setFullYear(futuro.getFullYear() + FUTURE_YEARS);
    return { hoje: iso(hoje), futuro: iso(futuro) };
  }

  function aplicar(input) {
    if (!input || input.type !== 'date') return;
    const { hoje, futuro } = limites();
    if (!input.min) input.min = MIN_DATE;
    if (!input.max) input.max = input.dataset.dateLimit === 'past' ? hoje : futuro;
  }

  function varrer(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches && node.matches('input[type="date"]')) aplicar(node);
    if (node.querySelectorAll) node.querySelectorAll('input[type="date"]').forEach(aplicar);
  }

  function init() {
    varrer(document.body);
    new MutationObserver(mutacoes => {
      mutacoes.forEach(m => m.addedNodes.forEach(varrer));
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
