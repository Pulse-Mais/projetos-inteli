document.addEventListener('DOMContentLoaded', function() {

  const fotoCoord = localStorage.getItem('fotoCoord');
  if (fotoCoord) {
    const av = document.querySelector('.sidebar__avatar');
    if (av) av.src = fotoCoord;
  }

  const form              = document.getElementById('formCadastroOportunidade');
  const btnCadastrar      = document.getElementById('btnCadastrarOportunidade');
  const modalFeedback     = document.getElementById('modalFeedback');
  const feedbackIconContainer = document.getElementById('feedbackIconContainer');
  const feedbackTitle     = document.getElementById('feedbackTitle');
  const feedbackMessage   = document.getElementById('feedbackMessage');
  const btnFeedbackAction = document.getElementById('btnFeedbackAction');

  let sucessoNoCadastro = false;

  // Configura o ícone, as cores e o texto do botão do modal conforme o tipo (sucesso ou erro)
  function mostrarFeedback(tipo, titulo, mensagem) {
    sucessoNoCadastro = (tipo === 'sucesso');

    if (tipo === 'sucesso') {
      feedbackIconContainer.style.background = 'rgba(37, 176, 87, 0.1)';
      feedbackIconContainer.innerHTML = `
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      `;
      btnFeedbackAction.className = 'btn btn--accent';
      btnFeedbackAction.textContent = 'Ir para Oportunidades';
    } else {
      feedbackIconContainer.style.background = 'rgba(220, 38, 38, 0.1)';
      feedbackIconContainer.innerHTML = `
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      `;
      btnFeedbackAction.className = 'btn btn--danger';
      btnFeedbackAction.textContent = 'Entendido';
    }

    feedbackTitle.textContent = titulo;
    feedbackMessage.textContent = mensagem;
    modalFeedback.classList.add('aberto');
  }

  // Valida o prazo, monta o payload e envia o cadastro via POST /oportunidades
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(form);
    const prazoValue = formData.get('prazo');

    // Validação: prazo de inscrição não pode ser uma data passada
    if (prazoValue) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dPrazo = new Date(prazoValue + 'T00:00:00');
      if (dPrazo < hoje) {
        mostrarFeedback('erro', 'Prazo Inválido', 'O prazo de inscrição não pode ser uma data passada. Por favor, corrija o campo.');
        return;
      }
    }

    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Salvando no Banco de Dados...';

    // Constrói o objeto conforme esperado pela API (Omit<Oportunidade, 'id_oportunidade'>)
    const dadosParaAPI = {
      titulo:     formData.get('titulo'),
      empresa:    formData.get('empresa'),
      tipo:       formData.get('tipo'),
      modalidade: formData.get('modalidade'),
      cidade:     formData.get('cidade') || null,
      nivel:      formData.get('nivel') || null,
      prazo:      prazoValue,
      descricao:  formData.get('descricao') || null
    };

    try {
      const response = await fetch('/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaAPI)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erro desconhecido ao cadastrar');
      }

      mostrarFeedback('sucesso', 'Oportunidade Cadastrada!', 'A oportunidade foi publicada com sucesso e já está disponível no mural de oportunidades dos ex-alunos.');

    } catch (error) {
      console.error('Erro no cadastro:', error);
      mostrarFeedback('erro', 'Falha no Cadastro', `Não foi possível cadastrar a oportunidade. Motivo: ${error.message}`);
      btnCadastrar.disabled = false;
      btnCadastrar.textContent = 'Cadastrar Oportunidade';
    }
  });

  // Fecha o modal; em caso de sucesso, limpa o formulário para um novo cadastro
  btnFeedbackAction.addEventListener('click', function() {
    modalFeedback.classList.remove('aberto');
    if (sucessoNoCadastro) {
      window.location.href = 'oportunidadesCoordenador.html';
    }
  });

});

// Remove a sessão do coordenador e redireciona para o login; preserva a foto local
function logout() {
  if (confirm('Deseja realmente sair?')) {
    const foto = localStorage.getItem('fotoCoord');
    localStorage.clear();
    if (foto) localStorage.setItem('fotoCoord', foto);
    window.location.href = '../index.html';
  }
}
