/* dashboard.js — Integração da tela Dashboard do Aluno
   Pulsar · Pulse Mais
*/

const FREQ_MINIMA = 75;
const CIRCUNFERENCIA = 270.18; // 2 * π * 43

document.addEventListener('DOMContentLoaded', async () => {
  const jovem_id = window.currentUser?.jovem_id;

  // Preenche nome e iniciais imediatamente do JWT (sem esperar API)
  const nomeJwt = window.currentUser?.nome;
  if (nomeJwt) {
    setText('dash-nome',           nomeJwt);
    setText('dash-breadcrumb-nome', nomeJwt);
    setText('dash-initials',        gerarIniciais(nomeJwt));
  }

  const t0 = performance.now();
  window.setPageLoading?.(true);
  try {
    await Promise.all([
      carregarPerfil(jovem_id),
      carregarDashboard(jovem_id),
    ]);
  } finally {
    window.setPageLoading?.(false);
  }
  console.log(`[PERF] Dashboard Aluno carregado em ${(performance.now() - t0).toFixed(0)}ms`);

  lucide.createIcons();
});

/* ── Perfil: nome, iniciais, CPF, programa, localidade ── */
async function carregarPerfil(jovem_id) {
  try {
    const t0 = performance.now();
    const [me, ficha] = await Promise.all([
      window.api.get('/me',               { auth: true, cache: true, cacheTtl: 30_000 }),
      jovem_id ? window.api.get(`/jovens/${jovem_id}/ficha`, { auth: true, cache: true, cacheTtl: 60_000 }) : Promise.resolve(null),
    ]);
    console.log(`[PERF] /me + /jovens/ficha responderam em ${(performance.now() - t0).toFixed(0)}ms`);

    const nome = me.nome ?? '—';
    setText('dash-nome',           nome);
    setText('dash-breadcrumb-nome', nome);
    window.avatar.render(document.getElementById('dash-initials'), me.foto_url, nome);
    window.avatar.render(document.querySelector('.avatar-trigger .avatar'), me.foto_url, nome);

    const nameEl = document.querySelector('.avatar-name');
    if (nameEl) nameEl.textContent = nome;

    const jovem = ficha?.jovem ?? null;

    if (jovem) {
      if (jovem.cpf) {
        setText('dash-cpf', `CPF ${formatarCpf(jovem.cpf)}`);
      }

      const matriculaAtiva = (ficha.matriculas ?? []).find(m => m.status === 'Ativo');
      if (matriculaAtiva?.programa_nome) setText('dash-programa', matriculaAtiva.programa_nome);

      if (jovem.data_nascimento) {
        const anos = calcularIdade(jovem.data_nascimento);
        setText('dash-idade', `${anos} ano${anos !== 1 ? 's' : ''}`);
      }

      const bairro   = jovem.bairro   ?? jovem.regiao  ?? null;
      const cidade   = jovem.cidade   ?? null;
      const estado   = jovem.estado   ?? jovem.uf      ?? null;
      const partes   = [bairro, [cidade, estado].filter(Boolean).join(' / ')].filter(Boolean);
      if (partes.length) setText('dash-location', partes.join(' • '));

      const badgeJornada = document.getElementById('dash-badge-jornada');
      if (badgeJornada && jovem.status_jornada) {
        badgeJornada.textContent = jovem.status_jornada;
        badgeJornada.hidden = false;
      }

      const badgeMult = document.getElementById('dash-badge-multiplicadora');
      if (badgeMult && jovem.multiplicador) {
        badgeMult.hidden = false;
      }
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }
}

/* ── KPIs do dashboard ── */
async function carregarDashboard(jovem_id) {
  if (!jovem_id) return;

  try {
    const t0 = performance.now();
    const d = await window.api.get(`/dashboard/aluno/${jovem_id}`, { auth: true, cache: true, cacheTtl: 30_000 });
    console.log(`[PERF] /dashboard/aluno/${jovem_id} respondeu em ${(performance.now() - t0).toFixed(0)}ms`);

    /* ── Atividades ── */
    const pendentes = d.atividades_pendentes ?? 0;
    setText('dash-ativ-pendentes', `${pendentes} pendente${pendentes !== 1 ? 's' : ''}`);

    const certs = d.certificados ?? 0;
    setText('dash-certificados', `${certs} certificado${certs !== 1 ? 's' : ''}`);

    /* ── Mentorias ── */
    if (d.ultima_mentoria) {
      const m       = d.ultima_mentoria;
      const dataStr = m.data_mentoria ? formatarData(m.data_mentoria) : '—';
      setText('dash-ment-ultima', dataStr);
      setText('dash-ment-mentor', m.mentor_nome ?? '—');
    }

    /* ── Frequência ── */
    const freq = d.frequencia ?? {};
    const pct  = parseFloat(freq.percentual ?? 0);

    setText('dash-freq-valor', `${pct.toFixed(1)}%`);

    const circle = document.getElementById('dash-freq-circle');
    if (circle) {
      const offset = CIRCUNFERENCIA * (1 - pct / 100);
      circle.setAttribute('stroke-dashoffset', offset.toFixed(2));

      circle.classList.remove('is-success', 'is-warning', 'is-danger');
      if (pct >= FREQ_MINIMA)      circle.classList.add('is-success');
      else if (pct >= 50)          circle.classList.add('is-warning');
      else                         circle.classList.add('is-danger');
    }

    const diff    = pct - FREQ_MINIMA;
    const diffEl  = document.getElementById('dash-freq-diferenca');
    if (diffEl) {
      diffEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} p.p.`;
      diffEl.className   = `value ${diff >= 0 ? 'is-success' : 'is-danger'}`;
    }

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

/* ── Helpers ── */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function gerarIniciais(nome) {
  if (!nome) return '--';
  const partes = nome.trim().split(' ');
  const a = partes[0]?.[0] ?? '';
  const b = partes[partes.length - 1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function formatarCpf(cpf) {
  const d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function calcularIdade(dataNascimento) {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos   = hoje.getFullYear() - nasc.getFullYear();
  const m    = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}
