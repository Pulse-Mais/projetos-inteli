// Substitui o seletor nativo de <input type="date"> por um calendário customizado,
// já que o popup nativo do navegador não pode ser estilizado via CSS (apenas o ícone
// que abre o seletor é estilizável, não o calendário em si).
//
// O <input type="date"> original é mantido no DOM (mesmo id, name, value, required),
// apenas reduzido visualmente a 1x1px — qualquer código que leia .value, escute
// 'change' ou use FormData continua funcionando sem nenhuma alteração.
//
// Funciona também para campos de data adicionados dinamicamente depois do carregamento
// da página (ex: modo de edição de perfil, modais de agendamento), via MutationObserver.
(function () {
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  var popupAtivo = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  function isoDeHoje() {
    var hoje = new Date();
    return hoje.getFullYear() + '-' + pad(hoje.getMonth() + 1) + '-' + pad(hoje.getDate());
  }

  function formatarExibicao(isoDate) {
    var p = isoDate.split('-');
    if (p.length !== 3) return isoDate;
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function fecharPopup() {
    if (popupAtivo) {
      popupAtivo.remove();
      popupAtivo = null;
    }
    document.removeEventListener('mousedown', onDocMouseDown, true);
    document.removeEventListener('keydown', onDocKeydown, true);
    window.removeEventListener('resize', fecharPopup);
    window.removeEventListener('scroll', fecharPopup, true);
  }

  function onDocMouseDown(e) {
    if (popupAtivo && !popupAtivo.contains(e.target) && !e.target.closest('.date-picker-trigger')) {
      fecharPopup();
    }
  }

  function onDocKeydown(e) {
    if (e.key === 'Escape') fecharPopup();
  }

  function selecionarData(input, trigger, iso) {
    input.value = iso;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    atualizarTrigger(trigger, input);
    fecharPopup();
  }

  // Aplica a máscara DD/MM/AAAA progressivamente conforme o usuário digita
  function aplicarMascaraData(valor) {
    var digitos = valor.replace(/\D/g, '').slice(0, 8);
    var partes = [];
    if (digitos.length > 0) partes.push(digitos.slice(0, 2));
    if (digitos.length > 2) partes.push(digitos.slice(2, 4));
    if (digitos.length > 4) partes.push(digitos.slice(4, 8));
    return partes.join('/');
  }

  // Converte "DD/MM/AAAA" em "AAAA-MM-DD" se for uma data de calendário válida; senão, null
  function paraIso(textoMascarado) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(textoMascarado);
    if (!m) return null;
    var dia = parseInt(m[1], 10), mes = parseInt(m[2], 10), ano = parseInt(m[3], 10);
    if (mes < 1 || mes > 12) return null;
    var diasNoMes = new Date(ano, mes, 0).getDate();
    if (dia < 1 || dia > diasNoMes) return null;
    return ano + '-' + pad(mes) + '-' + pad(dia);
  }

  // Extrai o ano de um atributo min/max ("YYYY-MM-DD"); retorna null se ausente/inválido
  function anoDoAtributo(valor) {
    if (!valor) return null;
    var ano = parseInt(valor.slice(0, 4), 10);
    return isNaN(ano) ? null : ano;
  }

  function abrirCalendario(input, trigger) {
    if (popupAtivo) { fecharPopup(); return; }

    var base = input.value ? new Date(input.value + 'T00:00:00') : new Date();
    var mesAtual = base.getMonth();
    var anoAtual = base.getFullYear();
    var vista = 'dias'; // 'dias' | 'anos'
    var decadaBase = anoAtual - (anoAtual % 12);

    var anoMin = anoDoAtributo(input.min);
    var anoMax = anoDoAtributo(input.max);

    var popup = document.createElement('div');
    popup.className = 'date-picker-popup';

    function renderHeader(tituloTexto, aoClicarAnterior, aoClicarProximo, aoClicarTitulo, anteriorDesabilitado, proximoDesabilitado) {
      var header = document.createElement('div');
      header.className = 'date-picker-popup__header';

      var btnAnterior = document.createElement('button');
      btnAnterior.type = 'button';
      btnAnterior.className = 'date-picker-popup__nav';
      btnAnterior.setAttribute('aria-label', 'Anterior');
      btnAnterior.disabled = !!anteriorDesabilitado;
      btnAnterior.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>';
      btnAnterior.addEventListener('click', aoClicarAnterior);

      var titulo = document.createElement('button');
      titulo.type = 'button';
      titulo.className = 'date-picker-popup__titulo';
      titulo.textContent = tituloTexto;
      titulo.addEventListener('click', aoClicarTitulo);

      var btnProximo = document.createElement('button');
      btnProximo.type = 'button';
      btnProximo.className = 'date-picker-popup__nav';
      btnProximo.setAttribute('aria-label', 'Próximo');
      btnProximo.disabled = !!proximoDesabilitado;
      btnProximo.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';
      btnProximo.addEventListener('click', aoClicarProximo);

      header.appendChild(btnAnterior);
      header.appendChild(titulo);
      header.appendChild(btnProximo);
      return header;
    }

    function renderDias() {
      popup.innerHTML = '';
      var diaSelecionado = input.value || null;
      var hojeIso = isoDeHoje();

      // A navegação de mês fica sempre habilitada; quem bloqueia datas fora do
      // intervalo é o estado "desabilitado" de cada dia individual, abaixo.
      popup.appendChild(renderHeader(
        MESES[mesAtual] + ' ' + anoAtual,
        function () { mesAtual--; if (mesAtual < 0) { mesAtual = 11; anoAtual--; } renderDias(); },
        function () { mesAtual++; if (mesAtual > 11) { mesAtual = 0; anoAtual++; } renderDias(); },
        function () { decadaBase = anoAtual - (anoAtual % 12); vista = 'anos'; renderAnos(); },
        false,
        false
      ));

      var semanaRow = document.createElement('div');
      semanaRow.className = 'date-picker-popup__semana';
      DIAS_SEMANA.forEach(function (d) {
        var span = document.createElement('span');
        span.textContent = d;
        semanaRow.appendChild(span);
      });
      popup.appendChild(semanaRow);

      var grid = document.createElement('div');
      grid.className = 'date-picker-popup__grid';

      var primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
      var totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();

      for (var i = 0; i < primeiroDia; i++) {
        grid.appendChild(document.createElement('span'));
      }

      for (var dia = 1; dia <= totalDias; dia++) {
        var iso = anoAtual + '-' + pad(mesAtual + 1) + '-' + pad(dia);
        var btnDia = document.createElement('button');
        btnDia.type = 'button';
        btnDia.className = 'date-picker-popup__dia';
        var foraDoLimite = (input.min && iso < input.min) || (input.max && iso > input.max);
        if (foraDoLimite) {
          btnDia.disabled = true;
          btnDia.classList.add('date-picker-popup__dia--desabilitado');
        } else {
          btnDia.addEventListener('click', function () {
            selecionarData(input, trigger, this.dataset.iso);
          });
        }
        if (iso === diaSelecionado) btnDia.classList.add('date-picker-popup__dia--selecionado');
        if (iso === hojeIso) btnDia.classList.add('date-picker-popup__dia--hoje');
        btnDia.textContent = String(dia);
        btnDia.dataset.iso = iso;
        grid.appendChild(btnDia);
      }

      popup.appendChild(grid);

      var footer = document.createElement('div');
      footer.className = 'date-picker-popup__footer';
      var btnHoje = document.createElement('button');
      btnHoje.type = 'button';
      btnHoje.className = 'date-picker-popup__hoje';
      btnHoje.textContent = 'Hoje';
      var hojeForaDoLimite = (input.min && hojeIso < input.min) || (input.max && hojeIso > input.max);
      if (hojeForaDoLimite) {
        btnHoje.disabled = true;
      } else {
        btnHoje.addEventListener('click', function () {
          selecionarData(input, trigger, hojeIso);
        });
      }
      footer.appendChild(btnHoje);
      popup.appendChild(footer);
    }

    // Vista de anos: grade de 12 anos por página, navegável por década, para pular
    // direto a um ano distante sem precisar clicar em "mês anterior" repetidas vezes.
    function renderAnos() {
      popup.innerHTML = '';

      var decadaAnterior = anoMin != null && decadaBase - 12 + 11 < anoMin;
      var proximaDecada = anoMax != null && decadaBase + 12 > anoMax;

      popup.appendChild(renderHeader(
        decadaBase + ' – ' + (decadaBase + 11),
        function () { decadaBase -= 12; renderAnos(); },
        function () { decadaBase += 12; renderAnos(); },
        function () { vista = 'dias'; renderDias(); },
        decadaAnterior,
        proximaDecada
      ));

      var grid = document.createElement('div');
      grid.className = 'date-picker-popup__grid-anos';

      for (var i = 0; i < 12; i++) {
        var ano = decadaBase + i;
        var btnAno = document.createElement('button');
        btnAno.type = 'button';
        btnAno.className = 'date-picker-popup__ano';
        if (ano === anoAtual) btnAno.classList.add('date-picker-popup__ano--selecionado');
        if (ano === new Date().getFullYear()) btnAno.classList.add('date-picker-popup__ano--hoje');
        var foraDoLimite = (anoMin != null && ano < anoMin) || (anoMax != null && ano > anoMax);
        btnAno.disabled = foraDoLimite;
        btnAno.textContent = String(ano);
        btnAno.addEventListener('click', function () {
          anoAtual = Number(this.textContent);
          vista = 'dias';
          renderDias();
        });
        grid.appendChild(btnAno);
      }

      popup.appendChild(grid);
    }

    function render() {
      if (vista === 'anos') renderAnos();
      else renderDias();
    }

    render();
    document.body.appendChild(popup);
    posicionarPopup(popup, trigger);
    popupAtivo = popup;

    setTimeout(function () {
      document.addEventListener('mousedown', onDocMouseDown, true);
      document.addEventListener('keydown', onDocKeydown, true);
      window.addEventListener('resize', fecharPopup);
      window.addEventListener('scroll', fecharPopup, true);
    }, 0);
  }

  function posicionarPopup(popup, trigger) {
    var rect = trigger.getBoundingClientRect();
    popup.style.top = (rect.bottom + 6) + 'px';
    popup.style.left = rect.left + 'px';

    requestAnimationFrame(function () {
      var popupRect = popup.getBoundingClientRect();
      if (popupRect.right > window.innerWidth - 8) {
        popup.style.left = Math.max(8, window.innerWidth - popupRect.width - 8) + 'px';
      }
      if (popupRect.bottom > window.innerHeight - 8) {
        popup.style.top = Math.max(8, rect.top - popupRect.height - 6) + 'px';
      }
    });
  }

  // Atualiza o texto digitável do trigger a partir do valor ISO do input real (ex: ao
  // selecionar um dia no popup, ou ao carregar um valor já existente vindo do servidor)
  function atualizarTrigger(trigger, input) {
    var campoTexto = trigger.querySelector('.date-picker-trigger__input');
    if (!campoTexto) return;
    campoTexto.value = input.value ? formatarExibicao(input.value) : '';
  }

  function aprimorarInput(input) {
    if (input.dataset.datePickerAprimorado) return;
    if (!input.parentNode) return;
    input.dataset.datePickerAprimorado = '1';

    var wrapper = document.createElement('div');
    wrapper.className = 'date-picker-wrapper';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    input.classList.add('date-picker-native-hidden');
    input.setAttribute('tabindex', '-1');
    input.setAttribute('aria-hidden', 'true');

    var trigger = document.createElement('div');
    trigger.className = 'date-picker-trigger';
    if (input.disabled) trigger.classList.add('date-picker-trigger--desabilitado');

    var label = input.id ? document.querySelector('label[for="' + input.id + '"]') : null;

    var campoTexto = document.createElement('input');
    campoTexto.type = 'text';
    campoTexto.className = 'date-picker-trigger__input';
    campoTexto.placeholder = 'DD/MM/AAAA';
    campoTexto.setAttribute('inputmode', 'numeric');
    campoTexto.setAttribute('autocomplete', 'off');
    campoTexto.disabled = input.disabled;
    if (label) campoTexto.setAttribute('aria-label', label.textContent.trim());
    campoTexto.value = input.value ? formatarExibicao(input.value) : '';

    var btnIcone = document.createElement('button');
    btnIcone.type = 'button';
    btnIcone.className = 'date-picker-trigger__icone';
    btnIcone.setAttribute('aria-label', 'Abrir calendário');
    btnIcone.disabled = input.disabled;
    btnIcone.innerHTML = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';

    // Digitar a data: aplica a máscara DD/MM/AAAA e, quando completa e válida (e dentro
    // de min/max), sincroniza o <input type="date"> real. Incompleta/inválida = campo real vazio.
    campoTexto.addEventListener('input', function () {
      campoTexto.value = aplicarMascaraData(campoTexto.value);
      fecharPopup();

      if (campoTexto.value.length < 10) {
        if (input.value) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        trigger.classList.remove('date-picker-trigger--erro');
        return;
      }

      var iso = paraIso(campoTexto.value);
      var foraDoLimite = iso && ((input.min && iso < input.min) || (input.max && iso > input.max));

      if (!iso || foraDoLimite) {
        trigger.classList.add('date-picker-trigger--erro');
        if (input.value) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }

      trigger.classList.remove('date-picker-trigger--erro');
      input.value = iso;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    btnIcone.addEventListener('click', function (e) {
      e.stopPropagation();
      abrirCalendario(input, trigger);
    });

    // Suprime a dica nativa de validação (apontaria para o input de 1px, invisível)
    // e usa a borda vermelha do campo customizado como indicação visual de erro.
    input.addEventListener('invalid', function (e) {
      e.preventDefault();
      trigger.classList.add('date-picker-trigger--erro');
      campoTexto.focus();
    });

    // Resincroniza o texto visível quando código externo define input.value diretamente
    // e dispara 'input' (ex: preencher um formulário de edição) — sem isso o gatilho
    // customizado ficaria mostrando o valor antigo (vazio, na maioria dos casos).
    input.addEventListener('input', function () {
      atualizarTrigger(trigger, input);
      trigger.classList.remove('date-picker-trigger--erro');
    });

    trigger.appendChild(campoTexto);
    trigger.appendChild(btnIcone);
    wrapper.appendChild(trigger);
  }

  function aprimorarTodos(raiz) {
    raiz.querySelectorAll('input[type="date"]:not([data-date-picker-aprimorado])').forEach(aprimorarInput);
  }

  document.addEventListener('DOMContentLoaded', function () { aprimorarTodos(document); });

  // Observa campos de data adicionados dinamicamente após o carregamento da página
  // (modo de edição de perfil, modais de agendamento/conquista, etc.)
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches('input[type="date"]')) aprimorarInput(node);
        if (node.querySelectorAll) aprimorarTodos(node);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
