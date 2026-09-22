if (window.lucide) lucide.createIcons();

  /* ── State & Elements ── */
  var state = { programaId: null, date: null, turma: '', rows: [] };

  var TURMAS = ['Turma 1', 'Turma 2', 'Turma Remota'];

  var el = {
    programaSelect: document.getElementById('programaSelect'),
    turmaFilter:    document.getElementById('turmaFilter'),
    attendanceDate: document.getElementById('attendanceDate'),
    btnImportCsv:   document.getElementById('btnImportCsv'),
    tbody:          document.getElementById('attendanceTbody'),
    turmaCount:     document.getElementById('turmaCount'),
    btnSave:        document.getElementById('btnSave'),
    btnCancelar:    document.getElementById('btnCancelar'),
    footerMessage:  document.getElementById('footerMessage'),
    summaryPct:     document.getElementById('summaryPct'),
    summaryBarFill: document.getElementById('summaryBarFill'),
    summaryBarPct:  document.getElementById('summaryBarPct'),
    lgPres:         document.getElementById('lgPres'),
    lgGrav:         document.getElementById('lgGrav'),
    lgAus:          document.getElementById('lgAus'),
  };

  function escapeHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function normalizeCpf(v) { return String(v||'').replace(/\D/g,''); }
  function formatCpf(v) {
    var d = normalizeCpf(v);
    return d.length===11 ? d.slice(0,3)+'.***.***-'+d.slice(9) : v;
  }
  function initials(nome) {
    var p = String(nome||'').trim().split(/\s+/);
    return p.length>=2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (p[0]&&p[0][0]||'?').toUpperCase();
  }
  function setMessage(text, type) {
    el.footerMessage.textContent = text;
    el.footerMessage.className = 'status-msg'+(type?' '+type:'');
  }

  function alertBadge(freq) {
    if (freq < 50) return '<span class="badge-critico">Crítico &lt; 50%</span>';
    if (freq < 75) return '<span class="badge-atencao">Atenção &lt; 75%</span>';
    return '<span class="badge-ok">—</span>';
  }

  function turmaOptionsHtml(selected) {
    var html = '<option value=""'+(!selected?' selected':'')+'>—</option>';
    TURMAS.forEach(function(t){
      html += '<option value="'+t+'"'+(t===selected?' selected':'')+'>'+t+'</option>';
    });
    return html;
  }

  function buildRow(row, index) {
    var id   = row.jovem_id || 'row-'+index;
    var freq = typeof row.freq === 'number' ? row.freq : null;
    var freqHtml = freq !== null
      ? '<div class="freq-cell"><div class="freq-bar-bg"><div class="freq-bar-fill" style="width:'+Math.min(freq,100)+'%"></div></div><span class="freq-pct">'+freq+'%</span></div>'
      : '<span style="color:var(--color-border)">—</span>';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><div class="jovem-cell">'+
        '<div class="jovem-avatar">'+escapeHtml(initials(row.nome))+'</div>'+
        '<div><div class="jovem-nome">'+escapeHtml(row.nome||'-')+'</div>'+
        '<div class="jovem-cpf">CPF '+formatCpf(row.cpf)+'</div></div>'+
      '</div></td>'+
      '<td><select class="turma-row-select" data-index="'+index+'">'+turmaOptionsHtml(row.turma)+'</select></td>'+
      '<td class="col-radio"><label class="radio-wrap presencial"><input type="radio" name="st-'+id+'" value="Presencial"'+(row.status==='Presencial'?' checked':'')+'><div class="radio-circle"></div></label></td>'+
      '<td class="col-radio"><label class="radio-wrap gravacao"><input type="radio" name="st-'+id+'" value="Gravacao"'+(row.status==='Gravacao'?' checked':'')+'><div class="radio-circle"></div></label></td>'+
      '<td class="col-radio"><label class="radio-wrap ausente"><input type="radio" name="st-'+id+'" value="Ausente"'+(row.status==='Ausente'?' checked':'')+'><div class="radio-circle"></div></label></td>'+
      '<td>'+freqHtml+'</td>'+
      '<td class="col-alert">'+(freq!==null?alertBadge(freq):'')+'</td>';

    // Foto do jovem (fonte: usuarios.foto_url); fallback iniciais
    if (row.foto_url && window.avatar) window.avatar.render(tr.querySelector('.jovem-avatar'), row.foto_url, row.nome);

    tr.querySelectorAll('input[type="radio"]').forEach(function(inp) {
      inp.addEventListener('change', function() {
        state.rows[index].status = inp.value;
        updateSummary();
      });
    });

    tr.querySelector('.turma-row-select').addEventListener('change', function(e) {
      saveTurma(index, e.target.value);
    });

    return tr;
  }

  function renderTable() {
    el.tbody.innerHTML = '';
    if (!state.rows.length) {
      el.tbody.innerHTML = '<tr><td colspan="7" class="empty-row">Nenhum jovem matriculado neste programa/turma.</td></tr>';
      el.turmaCount.textContent = '';
      updateSummary(); return;
    }
    el.turmaCount.textContent = 'Jovens da turma ('+state.rows.length+')';
    state.rows.forEach(function(r,i){ el.tbody.appendChild(buildRow(r,i)); });
    updateSummary();
  }

  function updateSummary() {
    var total = state.rows.length;
    var pres  = state.rows.filter(function(r){ return r.status==='Presencial'; }).length;
    var grav  = state.rows.filter(function(r){ return r.status==='Gravacao'; }).length;
    var aus   = state.rows.filter(function(r){ return r.status==='Ausente'; }).length;
    var pct   = total ? Math.round((pres+grav)/total*100) : 0;
    el.lgPres.textContent = pres;
    el.lgGrav.textContent = grav;
    el.lgAus.textContent  = aus;
    el.summaryPct.textContent    = total ? pct+'%' : '—';
    el.summaryBarPct.textContent = total ? pct+'%' : '';
    el.summaryBarFill.style.width = total ? pct+'%' : '0%';
  }

  async function loadProgramas() {
    try {
      var data = await window.api.get('/programas', { params: { ativo: true }, auth: true });
      el.programaSelect.innerHTML='<option value="">Selecione o programa</option>';
      (Array.isArray(data)?data:[]).forEach(function(p){
        var o=document.createElement('option');
        o.value=String(p.id); o.textContent=p.nome;
        el.programaSelect.appendChild(o);
      });
    } catch(e){ setMessage('Erro ao carregar programas.','error'); }
  }

  async function loadAttendance() {
    var programaId = el.programaSelect.value;
    if (!programaId) { state.rows=[]; renderTable(); return; }

    state.programaId = programaId;
    state.date  = el.attendanceDate.value || null;
    state.turma = el.turmaFilter.value || '';

    try {
      setMessage('Carregando lista...','info');
      var params = { programa_id: programaId };
      if (state.date)  params.data_aula = state.date;
      if (state.turma) params.turma = state.turma;

      var data = await window.api.get('/frequencias/alunos', { params: params, auth: true });
      state.rows = Array.isArray(data) ? data.map(function(item){
        return {
          jovem_id: item.jovem_id,
          matricula_id: item.matricula_id,
          frequencia_id: item.frequencia_id || null,
          nome: item.nome || '',
          cpf: item.cpf || '',
          foto_url: item.foto_url || null,
          turma: item.turma || '',
          status: item.tipo_presenca || null,
          freq: typeof item.frequencia === 'number' ? item.frequencia : null,
          observacoes: item.observacao || '',
        };
      }) : [];
      setMessage(state.rows.length?'Lista carregada.':'Nenhum aluno matriculado encontrado.',state.rows.length?'success':'info');
      renderTable();
    } catch(e){ setMessage('Erro ao carregar frequência.','error'); }
  }

  async function saveTurma(index, turma) {
    var row = state.rows[index];
    if (!row || !row.matricula_id) return;
    try {
      await window.api.put('/matriculas/'+row.matricula_id, { body: { turma: turma || null }, auth: true });
      row.turma = turma || '';
      setMessage('Turma atualizada para '+escapeHtml(row.nome)+'.','success');
    } catch(e) {
      setMessage(e?.data?.error || 'Erro ao atualizar turma.','error');
      renderTable();
    }
  }

  async function saveAttendance() {
    if (!state.rows.length) { setMessage('Não há dados para salvar.','error'); return; }
    if (!state.date) { setMessage('Selecione uma data para registrar a frequência.','error'); return; }

    var pendentes = state.rows.filter(function(r){ return !r.status; });
    if (pendentes.length) {
      setMessage('Marque a presença de todos os alunos antes de salvar.','error');
      return;
    }

    try {
      el.btnSave.disabled=true; setMessage('Salvando frequência...','info');

      for (var i=0; i<state.rows.length; i++) {
        var r = state.rows[i];
        if (r.frequencia_id) {
          await window.api.put('/frequencias/'+r.frequencia_id, {
            body: { tipo_presenca: r.status, observacao: r.observacoes, data_aula: state.date },
            auth: true,
          });
        } else {
          var created = await window.api.post('/frequencias', {
            body: {
              jovem_id: r.jovem_id,
              programa_id: state.programaId,
              data_aula: state.date,
              tipo_presenca: r.status,
              observacao: r.observacoes,
            },
            auth: true,
          });
          if (created && created.id) r.frequencia_id = created.id;
        }
      }

      setMessage('Frequência salva com sucesso.','success');
    } catch(e){ setMessage(e?.data?.error || e.message,'error'); }
    finally { el.btnSave.disabled=false; }
  }

  /* Eventos */
  el.programaSelect.addEventListener('change', loadAttendance);
  el.turmaFilter.addEventListener('change', loadAttendance);
  el.attendanceDate.addEventListener('change', function(){ if(el.programaSelect.value) loadAttendance(); });
  el.btnSave.addEventListener('click', saveAttendance);
  el.btnCancelar.addEventListener('click', function(){
    if (el.programaSelect.value) {
      loadAttendance();   // recarrega do servidor, descartando marcações não salvas
    } else {
      setMessage('','');
    }
  });
  el.btnImportCsv.addEventListener('click', function(){ window.location.href = 'importarFrequencia.html'; });

  /* ── init ── */
  (function init() {
    renderTable();
    loadProgramas();
  })();
