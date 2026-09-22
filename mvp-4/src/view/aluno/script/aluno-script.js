const prototypeStudent = {
  ra: '101',
  nome: 'Aluno',
  status: 'ativo',
  turma: 'Turma 1',
  ingresso: '2024',
  foto: '',
  email_primario: '',
  email_secundario: '',
  tel_primario: '',
  tel_secundario: '',
  genero: '',
  cep: '',
  id_turma: '',
  renda_familiar: '',
  data_nasc: '',
  endereco: '',
  cpf: '',
};

const FORMATOS_FOTO_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];
const TAMANHO_MAXIMO_FOTO_BYTES = 2 * 1024 * 1024;

let alunoAtual = null;
let comunicadosAtuais = [];
let jornadaAtual = [];
let ultimoElementoFocado = null;

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obterMes(valor) {
  if (!valor) return '';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return normalizarTexto(String(valor).split(/[\/\-\s]+/)[1] || '');
  }

  return normalizarTexto(
    data.toLocaleString('pt-BR', {
      month: 'long',
      timeZone: 'UTC',
    })
  );
}

function montarItensJornada(jornada) {
  const aulas = Array.isArray(jornada?.aulas) ? jornada.aulas : [];
  const eventos = Array.isArray(jornada?.eventos) ? jornada.eventos : [];
  const certificados = Array.isArray(jornada?.certificados) ? jornada.certificados : [];

  return [
    ...aulas.map((aula) => ({
      titulo: aula.tema,
      data: aula.data,
      status: aula.frequencia ? 'Concluido' : 'Em andamento',
      classe: aula.frequencia ? 'concluido' : 'andamento',
      descricao: aula.frequencia ? 'Presenca registrada no backend.' : 'Aula registrada sem presenca.',
      categoria: 'aula',
    })),
    ...eventos.map((evento) => ({
      titulo: evento.tema,
      data: evento.data,
      status: evento.frequencia ? 'Concluido' : 'Em andamento',
      classe: evento.frequencia ? 'concluido' : 'andamento',
      descricao: evento.categoria
        ? `Participacao registrada em evento da categoria ${evento.categoria}.`
        : 'Participacao registrada na jornada do aluno.',
      categoria: 'evento',
    })),
    ...certificados.map((certificado) => ({
      titulo: certificado.nome,
      data: certificado.data,
      status: 'Concluido',
      classe: 'concluido',
      descricao: 'Certificado disponivel na jornada do aluno.',
      categoria: 'certificado',
    })),
  ].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
}

function formatarPercentual(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return '0%';

  return `${numero.toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(numero) ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;
}

function byId(id) {
  return document.getElementById(id);
}

function getRaAluno() {
  return localStorage.getItem('alunoRa')
    || localStorage.getItem('raAluno')
    || '';
}

function formatarData(valor) {
  if (!valor) return '';

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarAno(valor) {
  if (!valor) return '';

  const data = new Date(valor);

  return Number.isNaN(data.getTime()) ? '' : String(data.getUTCFullYear());
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value || '';
}

function setValue(id, value) {
  const element = byId(id);
  if (element) element.value = value || '';
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value || '';
  });
}

function atualizarFeedbackFoto(mensagem = '', tipo = 'info') {
  const feedback = byId('photoFeedback');
  if (!feedback) return;

  feedback.textContent = mensagem;
  feedback.dataset.tipo = tipo;
}

function atualizarRotuloBotaoFoto(temFoto) {
  const texto = temFoto ? 'Alterar foto de perfil' : 'Adicionar foto de perfil';
  byId('changePhotoButton')?.setAttribute('aria-label', texto);
  byId('changePhotoButtonEdit')?.setAttribute('aria-label', texto);
}

function renderAvatar(foto) {
  document.querySelectorAll('[data-avatar-slot]').forEach((slot) => {
    const imagem = slot.querySelector('.avatar-imagem');
    if (!(imagem instanceof HTMLImageElement)) return;

    if (foto) {
      imagem.src = foto;
      slot.classList.add('tem-foto');
    } else {
      imagem.removeAttribute('src');
      slot.classList.remove('tem-foto');
    }
  });

  atualizarRotuloBotaoFoto(Boolean(foto));
}

function renderStudent(student = prototypeStudent) {
  const data = { ...prototypeStudent, ...student };
  const turma = data.id_turma ? `Turma ${data.id_turma}` : data.turma;
  const ingresso = formatarAno(data.data_ingresso) || data.ingresso;
  const nascimento = formatarData(data.data_nasc || data.data_nascimento);

  alunoAtual = data;

  setText('studentName', data.nome);
  setText('studentRa', data.ra);
  setText('studentEmail', data.email_primario);
  setText('studentEmail2', data.email_secundario);
  setText('studentPhone', data.tel_primario);
  setText('studentPhone2', data.tel_secundario);
  setText('gender', data.genero);
  setText('cep', data.cep);
  setText('studentClass', turma);
  setText('income', data.renda_familiar);
  setText('birthDate', nascimento);
  setText('street', data.endereco || data.rua);
  setText('cpf', data.cpf);
  setText('district', data.bairro_estado || data.endereco || '');
  setValue('editEmail', data.email_primario);
  setValue('editEmail2', data.email_secundario);
  setValue('editPhone', data.tel_primario);
  setValue('editPhone2', data.tel_secundario);

  setAllText('.student-chip span', `Ola, ${String(data.nome || 'Aluno').trim()}`);
  setAllText('.perfil-tags .perfil-tag:first-child', turma);
  setAllText('.perfil-tags .perfil-tag:nth-child(2)', ingresso ? `Ingresso: ${ingresso}` : '');
  setAllText('.perfil-status', data.status || '');
  setAllText('.ra-top', `RA: ${data.ra}`);

  const editarTitulo = byId('editarTitle');
  if (editarTitulo) editarTitulo.textContent = data.nome || 'Aluno';

  document.querySelectorAll('.perfil-ra').forEach((element) => {
    if (element.querySelector('strong')) return;
    element.textContent = `RA: ${data.ra}`;
  });

  renderAvatar(data.foto);
}

function selectScreen(screenName) {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
  const screen = byId(`screen-${screenName}`);
  const button = document.querySelector(`[data-screen="${screenName}"]`);
  if (screen) screen.classList.add('active');
  if (button) button.classList.add('active');
}

function abrirModalComunicado(notice) {
  const modal = byId('noticeModal');
  if (!modal || !notice) return;

  ultimoElementoFocado = document.activeElement;
  setText('noticeModalType', notice.tipo || 'Comunicado');
  setText('noticeModalTitle', notice.tema || notice.titulo || 'Comunicado');
  setText('noticeModalDate', formatarData(notice.data));
  setText('noticeModalLocation', notice.sede || 'Pulse Mais');
  setText('noticeModalDescription', notice.descricao || notice.conteudo || 'Sem detalhes adicionais para este comunicado.');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  byId('noticeModalClose')?.focus();
  window.lucide?.createIcons();
}

function fecharModalComunicado() {
  const modal = byId('noticeModal');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.style.overflow = '';
  if (ultimoElementoFocado instanceof HTMLElement) {
    ultimoElementoFocado.focus();
  }
}

function renderNotices(items = comunicadosAtuais) {
  const container = byId('noticeCards');

  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p class="event-description">Nenhum comunicado encontrado.</p>';
    return;
  }

  container.innerHTML = items.map((notice, index) => `
    <article class="event-card" data-notice-index="${index}" tabindex="0" role="button" aria-label="Abrir comunicado ${notice.tema || notice.titulo || 'Comunicado'}">
      <div class="event-image pulsar"><strong>${notice.tipo || 'Comunicado'}</strong><span>${formatarData(notice.data)}</span><small>${notice.sede || 'Pulse Mais'}</small></div>
      <div class="event-content">
        <span class="event-deadline">${formatarData(notice.data)}</span>
        <h3>${notice.tema || notice.titulo || 'Comunicado'}</h3>
        <p class="event-promoter">${notice.sede || 'Pulse Mais'}</p>
        <p class="event-description">${notice.descricao || notice.conteudo || ''}</p>
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.event-card').forEach((card) => {
    const abrir = () => {
      const index = Number(card.getAttribute('data-notice-index'));
      abrirModalComunicado(items[index]);
    };

    card.addEventListener('click', abrir);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        abrir();
      }
    });
  });
}

function renderJornada(items = jornadaAtual) {
  const trilha = document.querySelector('.trilha');

  if (!trilha) return;

  if (!items.length) {
    trilha.innerHTML = '<li class="trilha-item"><div class="trilha-modulo"><h3 class="trilha-titulo">Nenhum registro de jornada encontrado.</h3></div></li>';
    return;
  }

  trilha.innerHTML = items.map((item) => `
    <li class="trilha-item trilha-item--${item.classe}">
      <span class="trilha-rail"><span class="trilha-check"><i data-lucide="check"></i></span></span>
      <div class="trilha-modulo">
        <div class="trilha-modulo-topo">
          <time class="trilha-data">${formatarData(item.data)}</time>
          <span class="pill-status">${item.status}</span>
        </div>
        <h3 class="trilha-titulo">${item.titulo || 'Registro da jornada'}</h3>
        <p class="trilha-desc">${item.descricao}</p>
      </div>
    </li>
  `).join('');

  window.lucide?.createIcons();
}

function aplicarFiltrosJornada() {
  const query = normalizarTexto(byId('searchJornada')?.value);
  const status = byId('statusJornada')?.value || '';
  const itensFiltrados = jornadaAtual.filter((item) => {
    const textoBusca = normalizarTexto([item.titulo, item.descricao, item.categoria].join(' '));
    const passaBusca = !query || textoBusca.includes(query);
    const passaStatus = !status || item.classe === status;

    return passaBusca && passaStatus;
  });

  renderJornada(itensFiltrados);
}

function aplicarFiltrosComunicados() {
  const query = normalizarTexto(byId('searchNotice')?.value);
  const mesSelecionado = byId('monthNotice')?.value || '';
  const itensFiltrados = comunicadosAtuais.filter((notice) => {
    const textoBusca = normalizarTexto([
      notice.tema,
      notice.titulo,
      notice.sede,
      notice.descricao,
      notice.conteudo,
      notice.tipo,
    ].join(' '));
    const passaBusca = !query || textoBusca.includes(query);
    const passaMes = !mesSelecionado || obterMes(notice.data) === mesSelecionado;

    return passaBusca && passaMes;
  });

  renderNotices(itensFiltrados);
}

function renderAlertaFrequencia(alerta) {
  const banner = byId('alertaFrequencia');
  const titulo = byId('alertaFrequenciaTitulo');
  const mensagem = byId('alertaFrequenciaMensagem');
  const percentual = byId('alertaFrequenciaPercentual');
  const limite = byId('alertaFrequenciaLimite');

  if (!banner || !titulo || !mensagem || !percentual || !limite) return;

  if (!alerta?.exibir_banner) {
    banner.hidden = true;
    return;
  }

  titulo.textContent = 'Sua frequencia esta abaixo do limite definido pela instituicao.';
  mensagem.textContent = alerta.mensagem || 'Procure a equipe pedagogica para regularizar sua situacao.';
  percentual.textContent = formatarPercentual(alerta.frequencia_percentual);
  limite.textContent = formatarPercentual(alerta.limite_frequencia_percentual);
  banner.hidden = false;
  window.lucide?.createIcons();
}

async function carregarAluno() {
  const ra = getRaAluno();

  try {
    const response = await fetch(`/alunos/${encodeURIComponent(ra)}`);
    if (!response.ok) throw new Error('API indisponivel');
    const student = await response.json();
    renderStudent(student);
  } catch (error) {
    console.error('[Aluno] carregar perfil', error);
    renderStudent({ ...prototypeStudent, ra });
  }
}

async function carregarJornada() {
  const ra = getRaAluno();

  try {
    const response = await fetch(`/aluno/${encodeURIComponent(ra)}/jornada`);
    if (!response.ok) throw new Error('Jornada indisponivel');
    jornadaAtual = montarItensJornada(await response.json());
    aplicarFiltrosJornada();
  } catch (error) {
    console.error('[Aluno] carregar jornada', error);
    jornadaAtual = [];
    renderJornada([]);
  }
}

async function carregarAlertasFrequencia() {
  const ra = getRaAluno();

  try {
    const response = await fetch(`/aluno/${encodeURIComponent(ra)}/alertas`);
    if (!response.ok) throw new Error('Alertas indisponiveis');
    renderAlertaFrequencia(await response.json());
  } catch (error) {
    console.error('[Aluno] carregar alertas de frequencia', error);
    renderAlertaFrequencia(null);
  }
}

async function carregarComunicados() {
  try {
    const response = await fetch('/coordenadora/1001/eventos');
    if (!response.ok) throw new Error('Comunicados indisponiveis');
    comunicadosAtuais = await response.json();
    aplicarFiltrosComunicados();
  } catch (error) {
    console.error('[Aluno] carregar comunicados', error);
    comunicadosAtuais = [];
    renderNotices([]);
  }
}

async function salvarDados(dados, mensagemErroPadrao) {
  const ra = alunoAtual?.ra || getRaAluno();
  const response = await fetch(`/alunos/${encodeURIComponent(ra)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.error || mensagemErroPadrao);
  }
}

async function salvarEdicao() {
  const botao = byId('saveEditButton');
  const textoOriginal = botao?.textContent || 'Salvar';
  const dados = {
    email_primario: byId('editEmail').value.trim(),
    email_secundario: byId('editEmail2').value.trim(),
    tel_primario: byId('editPhone').value.trim(),
    tel_secundario: byId('editPhone2').value.trim(),
  };

  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Salvando...';
  }

  try {
    await salvarDados(dados, 'Nao foi possivel salvar.');
    renderStudent({ ...alunoAtual, ...dados });
    selectScreen('dados');
  } catch (error) {
    console.error('[Aluno] salvar perfil', error);
    window.alert(error.message || 'Nao foi possivel salvar os dados.');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }
}

function validarArquivoFoto(arquivo) {
  if (!arquivo) {
    throw new Error('Selecione uma imagem para continuar.');
  }

  if (!FORMATOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
    throw new Error('Formato de foto invalido. Envie PNG, JPG ou WEBP.');
  }

  if (arquivo.size > TAMANHO_MAXIMO_FOTO_BYTES) {
    throw new Error('A foto excede o tamanho maximo de 2 MB.');
  }
}

function lerArquivoComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo selecionado.'));
    reader.readAsDataURL(arquivo);
  });
}

async function salvarFoto(arquivo) {
  validarArquivoFoto(arquivo);
  atualizarFeedbackFoto('Salvando foto...', 'info');

  const foto = await lerArquivoComoDataUrl(arquivo);
  await salvarDados({ foto }, 'Nao foi possivel salvar a foto.');
  renderStudent({ ...alunoAtual, foto });
  atualizarFeedbackFoto('Foto salva com sucesso.', 'sucesso');
}

function abrirSeletorFoto() {
  atualizarFeedbackFoto('');
  byId('profilePhotoInput')?.click();
}

async function lidarComMudancaDeFoto(event) {
  const input = event.target;
  const arquivo = input.files?.[0];

  try {
    await salvarFoto(arquivo);
  } catch (error) {
    console.error('[Aluno] salvar foto', error);
    atualizarFeedbackFoto(error.message || 'Nao foi possivel salvar a foto.', 'erro');
  } finally {
    input.value = '';
  }
}

async function realizarLogout() {
  const botao = byId('logoutButton');
  const estavaDesabilitado = botao?.disabled;

  if (botao) {
    botao.disabled = true;
  }

  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Nao foi possivel encerrar a sessao.');
    }

    localStorage.removeItem('alunoRa');
    localStorage.removeItem('raAluno');
    localStorage.removeItem('perfilAcesso');
    sessionStorage.removeItem('alunoRa');
    sessionStorage.removeItem('raAluno');
    sessionStorage.removeItem('perfilAcesso');

    window.location.href = '/login.html';
  } catch (error) {
    console.error('[Aluno] logout', error);
    window.alert(error.message || 'Nao foi possivel encerrar a sessao.');
  } finally {
    if (botao) {
      botao.disabled = Boolean(estavaDesabilitado);
    }
  }
}

function configurarEventos() {
  document.querySelectorAll('.nav-item').forEach(button => {
    if (button.id === 'logoutButton') return;
    button.addEventListener('click', () => selectScreen(button.dataset.screen));
  });

  byId('editProfileButton')?.addEventListener('click', () => selectScreen('editar'));
  byId('cancelEditButton')?.addEventListener('click', () => selectScreen('dados'));
  byId('saveEditButton')?.addEventListener('click', salvarEdicao);
  byId('changePhotoButton')?.addEventListener('click', abrirSeletorFoto);
  byId('changePhotoButtonEdit')?.addEventListener('click', abrirSeletorFoto);
  byId('profilePhotoInput')?.addEventListener('change', lidarComMudancaDeFoto);
  byId('logoutButton')?.addEventListener('click', realizarLogout);
  byId('noticeModalClose')?.addEventListener('click', fecharModalComunicado);
  byId('noticeModal')?.addEventListener('click', (event) => {
    if (event.target?.dataset?.modalClose === 'true') {
      fecharModalComunicado();
    }
  });

  byId('searchJornada')?.addEventListener('input', aplicarFiltrosJornada);
  byId('statusJornada')?.addEventListener('change', aplicarFiltrosJornada);
  byId('searchNotice')?.addEventListener('input', aplicarFiltrosComunicados);
  byId('monthNotice')?.addEventListener('change', aplicarFiltrosComunicados);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      fecharModalComunicado();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  configurarEventos();
  carregarAluno();
  carregarJornada();
  carregarAlertasFrequencia();
  carregarComunicados();
  window.lucide?.createIcons();
});
