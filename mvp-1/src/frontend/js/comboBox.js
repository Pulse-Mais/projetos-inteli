// Transforma um <select class="combo-busca"> em um campo de busca com sugestões
// (digite e veja as opções que começam com o texto digitado), mantendo o <select>
// original oculto no DOM (mesmo id/name/value/disabled) — qualquer código existente
// que leia .value, escute 'change' ou use FormData continua funcionando sem alteração.
//
// Também reage automaticamente quando o select é habilitado/desabilitado ou tem suas
// <option> substituídas dinamicamente (ex: lista de cidades recarregada ao trocar o
// estado), via MutationObserver — a página não precisa chamar nenhuma função extra.
(function () {
  var popupAtivo = null;
  var fecharPopupAtual = null;

  function normalizar(texto) {
    var semAcento = (texto || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return semAcento.toLowerCase().trim();
  }

  function fecharPopup() {
    if (popupAtivo) {
      popupAtivo.remove();
      popupAtivo = null;
    }
    fecharPopupAtual = null;
    document.removeEventListener('mousedown', onDocMouseDown, true);
    document.removeEventListener('keydown', onDocKeydown, true);
    window.removeEventListener('resize', fecharPopup);
    window.removeEventListener('scroll', fecharPopup, true);
  }

  function onDocMouseDown(e) {
    if (popupAtivo && !popupAtivo.contains(e.target) && !e.target.closest('.combo-busca-trigger')) {
      fecharPopup();
    }
  }

  function onDocKeydown(e) {
    if (e.key === 'Escape') fecharPopup();
  }

  function posicionarPopup(popup, trigger) {
    var rect = trigger.getBoundingClientRect();
    popup.style.top = (rect.bottom + 4) + 'px';
    popup.style.left = rect.left + 'px';
    popup.style.width = rect.width + 'px';

    requestAnimationFrame(function () {
      var popupRect = popup.getBoundingClientRect();
      if (popupRect.bottom > window.innerHeight - 8) {
        popup.style.top = Math.max(8, rect.top - popupRect.height - 4) + 'px';
      }
    });
  }

  // Lê as <option> do select no momento da chamada (não em cache), para refletir
  // sempre a lista mais atual — importante quando as opções são recarregadas via API.
  function opcoesValidas(select) {
    return Array.prototype.filter.call(select.options, function (opt) {
      return opt.value !== '';
    });
  }

  function abrirLista(select, input, trigger) {
    fecharPopup();
    if (select.disabled) return;

    var popup = document.createElement('div');
    popup.className = 'combo-busca-popup';

    function render(filtro) {
      popup.innerHTML = '';
      var termo = normalizar(filtro);
      var encontrou = false;

      opcoesValidas(select).forEach(function (opt) {
        if (termo && normalizar(opt.textContent).indexOf(termo) !== 0) return;
        encontrou = true;

        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'combo-busca-item';
        if (opt.value === select.value) item.classList.add('combo-busca-item--selecionado');
        item.textContent = opt.textContent;
        item.addEventListener('click', function () {
          select.value = opt.value;
          input.value = opt.textContent;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          fecharPopup();
        });
        popup.appendChild(item);
      });

      if (!encontrou) {
        var vazio = document.createElement('div');
        vazio.className = 'combo-busca-vazio';
        vazio.textContent = 'Nenhuma opção encontrada';
        popup.appendChild(vazio);
      }
    }

    render(input.value);
    document.body.appendChild(popup);
    posicionarPopup(popup, trigger);
    popupAtivo = popup;
    fecharPopupAtual = fecharPopup;

    input.dataset.renderAtivo = '1';
    input._renderCombo = render;

    setTimeout(function () {
      document.addEventListener('mousedown', onDocMouseDown, true);
      document.addEventListener('keydown', onDocKeydown, true);
      window.addEventListener('resize', fecharPopup);
      window.addEventListener('scroll', fecharPopup, true);
    }, 0);
  }

  // Restaura o texto exibido para refletir a opção realmente selecionada no select —
  // chamado ao sair do campo sem escolher um item válido da lista, e ao sincronizar
  // o visual quando as opções do select mudam dinamicamente.
  function sincronizarTexto(select, input) {
    var selecionada = select.options[select.selectedIndex];
    input.value = (selecionada && selecionada.value) ? selecionada.textContent : '';
  }

  function aprimorarSelect(select) {
    if (select.dataset.comboBuscaAprimorado) return;
    if (!select.parentNode) return;
    select.dataset.comboBuscaAprimorado = '1';

    var wrapper = document.createElement('div');
    wrapper.className = 'combo-busca-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add('combo-busca-real-hidden');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');

    var trigger = document.createElement('div');
    trigger.className = 'combo-busca-trigger';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'combo-busca-trigger__input';
    input.setAttribute('autocomplete', 'off');
    input.placeholder = select.options[0] ? select.options[0].textContent : 'Selecione...';
    input.disabled = select.disabled;

    var label = select.id ? document.querySelector('label[for="' + select.id + '"]') : null;
    if (label) input.setAttribute('aria-label', label.textContent.trim());

    var iconeSvg = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';

    sincronizarTexto(select, input);

    input.addEventListener('focus', function () { abrirLista(select, input, trigger); });
    input.addEventListener('click', function () { abrirLista(select, input, trigger); });
    input.addEventListener('input', function () {
      if (!popupAtivo) abrirLista(select, input, trigger);
      else if (input._renderCombo) input._renderCombo(input.value);
    });
    input.addEventListener('blur', function () {
      // Pequeno atraso para permitir que o clique em um item da lista seja processado antes
      setTimeout(function () { sincronizarTexto(select, input); }, 150);
    });

    // Suprime a dica nativa de validação (apontaria para o select de 1px, invisível)
    // e usa a borda vermelha do campo customizado como indicação visual de erro.
    select.addEventListener('invalid', function (e) {
      e.preventDefault();
      trigger.classList.add('combo-busca-trigger--erro');
      input.focus();
    });
    select.addEventListener('change', function () {
      trigger.classList.remove('combo-busca-trigger--erro');
    });

    trigger.appendChild(input);
    trigger.insertAdjacentHTML('beforeend', iconeSvg);
    wrapper.appendChild(trigger);

    // Reage a mudanças feitas pela própria página: habilitar/desabilitar o select
    // (ex: cidade liberada após escolher o estado) ou substituir suas <option>
    // (ex: lista de cidades recarregada via API).
    var observerSelect = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'disabled') {
          input.disabled = select.disabled;
        }
        if (m.type === 'childList') {
          input.placeholder = select.options[0] ? select.options[0].textContent : 'Selecione...';
          sincronizarTexto(select, input);
        }
      });
    });
    observerSelect.observe(select, { attributes: true, attributeFilter: ['disabled'], childList: true });
  }

  function aprimorarTodos(raiz) {
    raiz.querySelectorAll('select.combo-busca:not([data-combo-busca-aprimorado])').forEach(aprimorarSelect);
  }

  document.addEventListener('DOMContentLoaded', function () { aprimorarTodos(document); });

  // Observa selects de combo-busca adicionados dinamicamente após o carregamento da página
  var observerGlobal = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('select.combo-busca')) aprimorarSelect(node);
        if (node.querySelectorAll) aprimorarTodos(node);
      });
    });
  });
  observerGlobal.observe(document.documentElement, { childList: true, subtree: true });
})();
