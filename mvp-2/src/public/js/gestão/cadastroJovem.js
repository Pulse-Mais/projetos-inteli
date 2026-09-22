'use strict';

/* ============================================================
   cadastro-jovem.js — Lógica da tela Cadastro de Jovem
   Pulsar · Módulo 1AMD2
   ============================================================ */

/* ── Lucide icons init + sidebar toggle + nav active ── */
// ── Init icons ────────────────────────────────────────────────────
  function initLucide() {
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  }
  initLucide();

/* ── Form: validação, máscaras, submit ── */

  const PATH_API  = '/jovens';
  const form      = document.getElementById('cadastroForm');
  const btnSave   = document.getElementById('btnSave');
  const alertOk   = document.getElementById('alertSuccess');
  const alertErr  = document.getElementById('alertError');
  const alertText = document.getElementById('alertErrorText');

  /* ── Máscaras ── */
  function maskCPF(v) {
    const d = v.replace(/\D/g,'').slice(0,11);
    if (d.length > 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0,3)}.${d.slice(3)}`;
    return d;
  }
  function maskDate(v) {
    const d = v.replace(/\D/g,'').slice(0,8);
    if (d.length > 4) return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    if (d.length > 2) return `${d.slice(0,2)}/${d.slice(2)}`;
    return d;
  }
  function maskPhone(v) {
    const d = v.replace(/\D/g,'').slice(0,11);
    if (d.length > 10) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length > 6)  return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    if (d.length > 2)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return d;
  }

  document.getElementById('cpf').addEventListener('input', e => { e.target.value = maskCPF(e.target.value); });
  document.getElementById('data_nascimento').addEventListener('input', e => { e.target.value = maskDate(e.target.value); });
  document.getElementById('telefone').addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });

  /* ── Validadores ── */
  function validCPF(cpf) {
    const d = cpf.replace(/\D/g,'');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += +d[i] * (10 - i);
    let r = (s * 10) % 11; if (r >= 10) r = 0;
    if (r !== +d[9]) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += +d[i] * (11 - i);
    r = (s * 10) % 11; if (r >= 10) r = 0;
    return r === +d[10];
  }
  function validDate(v) {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return false;
    const [dd,mm,yyyy] = v.split('/').map(Number);
    const date  = new Date(yyyy, mm-1, dd);
    const today = new Date(); today.setHours(0,0,0,0);
    if (date.getDate()!==dd||date.getMonth()!==mm-1||date.getFullYear()!==yyyy) return false;
    if (date >= today) return false;
    const yD=today.getFullYear()-yyyy, mD=today.getMonth()-(mm-1), dD=today.getDate()-dd;
    const age = yD - (mD<0||(mD===0&&dD<0)?1:0);
    return age >= 14 && age <= 120;
  }
  function validEmail(v) { return !v||/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }
  function validPhone(v) { const d=v.replace(/\D/g,''); return !v||(d.length>=10&&d.length<=11); }

  /* ── Field state ── */
  function setField(inputId, errId, ok, msg) {
    const el=document.getElementById(inputId), err=document.getElementById(errId);
    if (!el) return;
    el.classList.toggle('is-error',!ok);
    el.classList.toggle('is-valid', ok && el.value.trim()!=='');
    el.setAttribute('aria-invalid', ok?'false':'true');
    if (err) err.classList.toggle('show',!ok);
  }

  /* ── Validate all ── */
  function validateAll() {
    let valid = true;
    const nome = document.getElementById('nome').value.trim();
    if (nome.length < 3) { setField('nome','err-nome',false, nome?'Nome muito curto.':'Nome obrigatório (RN03).'); valid=false; }
    else setField('nome','err-nome',true);

    const cpf = document.getElementById('cpf').value;
    if (!cpf) { setField('cpf','err-cpf',false,'CPF obrigatório (RN03).'); valid=false; }
    else if (!validCPF(cpf)) { setField('cpf','err-cpf',false,'CPF inválido.'); valid=false; }
    else setField('cpf','err-cpf',true);

    const nasc = document.getElementById('data_nascimento').value;
    if (!nasc) { setField('data_nascimento','err-nascimento',false,'Data obrigatória (RN03).'); valid=false; }
    else if (!validDate(nasc)) { setField('data_nascimento','err-nascimento',false,'Data inválida ou fora do intervalo (14–120 anos).'); valid=false; }
    else setField('data_nascimento','err-nascimento',true);

    const email = document.getElementById('email').value.trim();
    if (!validEmail(email)) { setField('email','err-email',false,'Formato de e-mail inválido.'); valid=false; }
    else setField('email','err-email',true);

    const tel = document.getElementById('telefone').value;
    if (!validPhone(tel)) { setField('telefone','err-telefone',false,'Telefone deve ter 10 ou 11 dígitos.'); valid=false; }
    else setField('telefone','err-telefone',true);

    const checked=[...document.querySelectorAll('[name="status_jornada"]:checked')];
    const errStatus=document.getElementById('err-status');
    if (checked.length===0) { errStatus.classList.add('show'); valid=false; }
    else errStatus.classList.remove('show');

    return valid;
  }

  /* ── Payload ── */
  function buildPayload() {
    const g = id => document.getElementById(id)?.value.trim()||null;
    const dr = g('data_nascimento'); let isoDate=null;
    if (dr&&/^\d{2}\/\d{2}\/\d{4}$/.test(dr)) {
      const [dd,mm,yyyy]=dr.split('/'); isoDate=`${yyyy}-${mm}-${dd}`;
    }
    const statuses=[...document.querySelectorAll('[name="status_jornada"]:checked')].map(c=>c.value);
    return {
      nome: g('nome'),
      cpf: document.getElementById('cpf').value.replace(/\D/g,''),
      data_nascimento: isoDate,
      email: g('email'),
      telefone: document.getElementById('telefone').value.replace(/\D/g,'')||null,
      renda_familiar: g('renda_familiar'),
      tipo_moradia: g('tipo_moradia'),
      genero: g('genero'),
      autodeclaracao_racial: document.getElementById('raca')?.value||null,
      bairro: g('bairro'),
      cidade: g('cidade'),
      status_jornada: statuses.join('_'),
      consentimento_lgpd: true,
    };
  }

  /* ── Alerts ── */
  function showAlert(type, msg) {
    alertOk.classList.toggle('show', type==='success');
    alertErr.classList.toggle('show', type==='error');
    if (type==='error'&&msg) alertText.textContent=msg;
    (type==='success'?alertOk:alertErr).scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function hideAlerts() { alertOk.classList.remove('show'); alertErr.classList.remove('show'); }
  function clearStates() {
    form.querySelectorAll('input,select').forEach(el=>{ el.classList.remove('is-error','is-valid'); el.setAttribute('aria-invalid','false'); });
    form.querySelectorAll('.err-msg').forEach(el=>el.classList.remove('show'));
  }

  /* ── Toggle de senha ── */
  document.getElementById('btnToggleSenha').addEventListener('click', () => {
    const inp = document.getElementById('senha');
    const svg = document.getElementById('eyeIcon');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    svg.innerHTML = show
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
  });

  /* ── Modo edição: carrega dados do jovem existente ── */
  const jovemId = new URLSearchParams(window.location.search).get('id');

  function preencherFormulario(jovem) {
    const set = (id, val) => { const el=document.getElementById(id); if (el && val!=null) el.value = val; };

    set('nome', jovem.nome);
    if (jovem.cpf) document.getElementById('cpf').value = maskCPF(jovem.cpf);
    if (jovem.data_nascimento) {
      const d = new Date(jovem.data_nascimento);
      if (!isNaN(d.getTime())) {
        const dd=String(d.getUTCDate()).padStart(2,'0'), mm=String(d.getUTCMonth()+1).padStart(2,'0');
        document.getElementById('data_nascimento').value = `${dd}/${mm}/${d.getUTCFullYear()}`;
      }
    }
    set('email', jovem.email);
    if (jovem.telefone) document.getElementById('telefone').value = maskPhone(jovem.telefone);
    set('renda_familiar', jovem.renda_familiar);
    set('tipo_moradia', jovem.tipo_moradia);
    set('genero', jovem.genero);
    set('raca', jovem.autodeclaracao_racial);
    set('bairro', jovem.bairro);
    set('cidade', jovem.cidade);

    const statuses = (jovem.status_jornada || '').split('_').filter(Boolean);
    document.querySelectorAll('[name="status_jornada"]').forEach(chk => {
      chk.checked = statuses.includes(chk.value);
    });
  }

  async function carregarJovem() {
    try {
      const jovem = await window.api.get(`${PATH_API}/${jovemId}`, { auth: true });
      preencherFormulario(jovem);
    } catch (err) {
      showAlert('error', err?.data?.error || `Erro ao carregar jovem: ${err.message}`);
    }
  }

  if (jovemId) {
    document.querySelector('.page-title').textContent = 'Editar Jovem';
    document.title = document.title.replace('Novo Jovem', 'Editar Jovem');
    btnSave.textContent = 'Salvar alterações';
    // oculta campo de senha no modo edição
    const senhaSection = document.getElementById('senha-section');
    if (senhaSection) senhaSection.hidden = true;
    carregarJovem();
  }

  /* ── Submit ── */
  form.addEventListener('submit', async e => {
    e.preventDefault(); hideAlerts();
    if (!validateAll()) {
      showAlert('error','Corrija os campos destacados antes de salvar.');
      const first=form.querySelector('.is-error');
      if (first) first.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    const orig=btnSave.innerHTML;
    btnSave.disabled=true;
    btnSave.innerHTML=`<svg viewBox="0 0 24 24" style="animation:spin .75s linear infinite;width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.75;stroke-linecap:round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Salvando...`;
    try {
      if (jovemId) {
        await window.api.put(`${PATH_API}/${jovemId}`, { body: buildPayload(), auth: true });
        showAlert('success');
        setTimeout(()=>{ window.location.href=`perfilAlunoGestao.html?id=${jovemId}`; },1500);
      } else {
        // valida senha se preenchida
        const senhaVal = document.getElementById('senha').value;
        if (senhaVal && senhaVal.length < 8) {
          const errSenha = document.getElementById('err-senha');
          document.getElementById('senha').classList.add('is-error');
          if (errSenha) errSenha.classList.add('show');
          showAlert('error', 'A senha temporária deve ter no mínimo 8 caracteres.');
          return;
        }

        const payload  = buildPayload();
        const novoJovem = await window.api.post(PATH_API, { body: payload, auth: true });

        // cria conta de login se e-mail + senha foram informados
        const emailVal = payload.email;
        if (senhaVal && emailVal) {
          await window.api.post('/usuarios', {
            body: {
              nome:     payload.nome,
              email:    emailVal,
              senha:    senhaVal,
              perfil:   'Aluno',
              jovem_id: novoJovem.id,
              ativo:    true,
            },
            auth: true,
          });
        }

        form.reset();
        document.querySelector('[name="status_jornada"][value="Conectado"]').checked=true;
        clearStates();
        document.getElementById('successOverlay').hidden = false;
        setTimeout(()=>{ window.location.href='telaJovens.html'; },1600);
      }
    } catch(err) { showAlert('error', err?.data?.error || `Erro: ${err.message}`); }
    finally { btnSave.disabled=false; btnSave.innerHTML=orig; }
  });

  /* ── Cancelar: volta para a tela de jovens sem salvar nada ── */
  document.getElementById('btnCancel').addEventListener('click', ()=>{
    window.location.href = 'telaJovens.html';
  });

  /* ── Blur revalidation ── */
  const blurMap = {
    nome: ()=>{ const v=document.getElementById('nome').value.trim(); setField('nome','err-nome',v.length>=3,v.length>=3?'':(v?'Nome muito curto.':'Nome obrigatório.')); },
    cpf: ()=>{ const el=document.getElementById('cpf'); if(!el.value)return; setField('cpf','err-cpf',validCPF(el.value),validCPF(el.value)?'':'CPF inválido.'); },
    data_nascimento: ()=>{ const el=document.getElementById('data_nascimento'); if(!el.value)return; setField('data_nascimento','err-nascimento',validDate(el.value),validDate(el.value)?'':'Data inválida.'); },
    email: ()=>{ const el=document.getElementById('email'); if(!el.value)return; setField('email','err-email',validEmail(el.value.trim()),validEmail(el.value.trim())?'':'E-mail inválido.'); },
    telefone: ()=>{ const el=document.getElementById('telefone'); if(!el.value)return; setField('telefone','err-telefone',validPhone(el.value),validPhone(el.value)?'':'Telefone inválido.'); },
  };
  Object.entries(blurMap).forEach(([id,fn])=>{
    const el=document.getElementById(id); if(!el)return;
    el.addEventListener('blur',fn);
    el.addEventListener('input',()=>{ if(el.classList.contains('is-error')) el.classList.remove('is-error'); });
  });