(function () {
  const modal = document.createElement("div");
  modal.className = "modal-fluxo";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-fluxo__caixa" role="dialog" aria-modal="true" aria-labelledby="modal-fluxo-titulo">
      <div class="modal-fluxo__icone"><i data-lucide="triangle-alert"></i></div>
      <h2 class="modal-fluxo__titulo" id="modal-fluxo-titulo"></h2>
      <p class="modal-fluxo__texto"></p>
      <div class="modal-fluxo__acoes">
        <button type="button" class="btn-fluxo btn-fluxo--secundario" data-modal-cancelar>Cancelar</button>
        <button type="button" class="btn-fluxo btn-fluxo--primario" data-modal-confirmar>Confirmar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  window.PulseModal = {
    confirm({ titulo = "Confirmar ação", texto = "Deseja continuar?", confirmar = "Confirmar", perigo = false } = {}) {
      modal.querySelector(".modal-fluxo__titulo").textContent = titulo;
      modal.querySelector(".modal-fluxo__texto").textContent = texto;
      const botaoConfirmar = modal.querySelector("[data-modal-confirmar]");
      botaoConfirmar.textContent = confirmar;
      botaoConfirmar.className = "btn-fluxo " + (perigo ? "btn-fluxo--perigo" : "btn-fluxo--primario");
      modal.hidden = false;
      renderIcons();

      return new Promise((resolve) => {
        const concluir = (resultado) => {
          modal.hidden = true;
          botaoConfirmar.onclick = null;
          modal.querySelector("[data-modal-cancelar]").onclick = null;
          resolve(resultado);
        };
        botaoConfirmar.onclick = () => concluir(true);
        modal.querySelector("[data-modal-cancelar]").onclick = () => concluir(false);
      });
    },
  };

  document.querySelectorAll("[data-abas]").forEach((container) => {
    container.addEventListener("click", (event) => {
      const aba = event.target.closest("[data-aba]");
      if (!aba) return;
      const alvo = aba.dataset.aba;
      container.querySelectorAll("[data-aba]").forEach((item) => item.classList.toggle("ativa", item === aba));
      document.querySelectorAll("[data-aba-painel]").forEach((painel) => {
        painel.hidden = painel.dataset.abaPainel !== alvo;
      });
    });
  });
})();
