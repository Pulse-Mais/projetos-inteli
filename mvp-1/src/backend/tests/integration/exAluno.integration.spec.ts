import request from 'supertest';
import { app } from '../../app';
import { supabase } from '../../db/supabaseClient';

jest.setTimeout(30000);

let isReachable = false;

beforeAll(async () => {
  try {
    const { error } = await supabase.from('usuario').select('id_usuario').limit(1);
    isReachable = !error;
  } catch {
    isReachable = false;
  }
});

const randomDigits = () => String(Math.floor(10000000000 + Math.random() * 90000000000));
const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function criarUsuario() {
  const suffix = uniqueSuffix();
  const { data, error } = await supabase
    .from('usuario')
    .insert({ nome: `User ${suffix}`, email: `user_${suffix}@test.local`, senha: 'senha_teste', cpf: randomDigits() })
    .select('id_usuario')
    .single();
  if (error) throw error;
  return data as { id_usuario: number };
}

async function criarAluno(idUsuario: number, ativo = true) {
  const { data, error } = await supabase
    .from('aluno')
    .insert({ id_usuario: idUsuario, ativo })
    .select('id_usuario, ativo')
    .single();
  if (error) throw error;
  return data as { id_usuario: number; ativo: boolean };
}

async function criarEvento() {
  const suffix = uniqueSuffix();
  const { data, error } = await supabase
    .from('evento')
    .insert({ nome: `Evento ${suffix}`, data: '2025-09-10T10:00:00.000Z', local: 'Auditório Teste' })
    .select('id_evento')
    .single();
  if (error) throw error;
  return data as { id_evento: number };
}

async function criarCoordenador(idUsuario: number) {
  const { data, error } = await supabase
    .from('coordenador')
    .insert({ id_usuario: idUsuario, area: 'Tecnologia' })
    .select('id_usuario')
    .single();
  if (error) throw error;
  return data as { id_usuario: number };
}

async function criarMentor(idUsuario: number, idCoordenador: number) {
  const { data, error } = await supabase
    .from('mentor')
    .insert({ id_usuario: idUsuario, tipo_vinculo: 'externo', disponibilidade: 'disponivel', id_coordenador: idCoordenador, especialidade: 'Carreira', ativo: true })
    .select('id_usuario')
    .single();
  if (error) throw error;
  return data as { id_usuario: number };
}

async function criarMentoria() {
  const { data, error } = await supabase
    .from('mentoria')
    .insert({ formato: 'online', tema: 'Carreira', duracao: 60, data: new Date().toISOString() })
    .select('id_mentoria')
    .single();
  if (error) throw error;
  return data as { id_mentoria: number };
}

async function criarPrograma() {
  const suffix = uniqueSuffix();
  const { data, error } = await supabase
    .from('programa')
    .insert({ titulo: `Programa ${suffix}`, inicio: '2024-01-01', fim: '2024-12-31' })
    .select('id_programa')
    .single();
  if (error) throw error;
  return data as { id_programa: number };
}

async function criarAcompanha(idMentor: number, idAluno: number, idPrograma: number) {
  const { error } = await supabase.from('acompanha').insert({ id_mentor: idMentor, id_aluno: idAluno, id_programa: idPrograma });
  if (error) throw error;
}

async function limpar(ids: {
  historicos?: number[];
  participa_evento?: { id_evento: number; id_aluno: number }[];
  participa_mentoria?: { id_mentoria: number; id_aluno: number }[];
  programas?: number[];
  mentorias?: number[];
  eventos?: number[];
  alunos?: number[];
  mentores?: number[];
  coords?: number[];
  users?: number[];
}) {
  if (ids.historicos?.length) await supabase.from('historico_profissional').delete().in('id_historico', ids.historicos);
  for (const par of ids.participa_evento ?? []) await supabase.from('participa_evento').delete().eq('id_evento', par.id_evento).eq('id_aluno', par.id_aluno);
  for (const par of ids.participa_mentoria ?? []) await supabase.from('participa_mentoria').delete().eq('id_mentoria', par.id_mentoria).eq('id_aluno', par.id_aluno);
  if (ids.mentorias?.length) await supabase.from('mentoria').delete().in('id_mentoria', ids.mentorias);
  if (ids.eventos?.length) await supabase.from('evento').delete().in('id_evento', ids.eventos);
  if (ids.programas?.length) await supabase.from('programa').delete().in('id_programa', ids.programas);
  if (ids.alunos?.length) await supabase.from('aluno').delete().in('id_usuario', ids.alunos);
  if (ids.mentores?.length) await supabase.from('mentor').delete().in('id_usuario', ids.mentores);
  if (ids.coords?.length) await supabase.from('coordenador').delete().in('id_usuario', ids.coords);
  if (ids.users?.length) await supabase.from('usuario').delete().in('id_usuario', ids.users);
}

describe('Ex-Aluno (Pedro) — historico_profissional', () => {
  it('POST /alunos/:id/historico cria registro e ele aparece no PostgreSQL', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    const payload = { cargo: 'Engenheiro de Software', empresa: 'TechCorp', data_inicio: '2022-03-01', data_fim: null };
    try {
      const res = await request(app).post(`/alunos/${alunoRow.id_usuario}/historico`).send(payload);
      expect(res.status).toBe(201);
      expect(res.body.cargo).toBe(payload.cargo);
      const { data: dbRow, error } = await supabase.from('historico_profissional').select('*').eq('id_historico', res.body.id_historico).single();
      expect(error).toBeNull();
      expect((dbRow as any).cargo).toBe(payload.cargo);
      await limpar({ historicos: [res.body.id_historico], alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    } catch (err) {
      await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
      throw err;
    }
  });

  it('PUT /alunos/:id/historico/:id_hist atualiza cargo e a mudança reflete no PostgreSQL', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    const { data: criado, error: errCria } = await supabase.from('historico_profissional').insert({ cargo: 'Analista Jr', empresa: 'StartupX', data_inicio: '2021-06-01', id_aluno: alunoRow.id_usuario }).select('id_historico').single();
    if (errCria) { await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] }); throw errCria; }
    const idHist = (criado as any).id_historico;
    try {
      const res = await request(app).put(`/alunos/${alunoRow.id_usuario}/historico/${idHist}`).send({ cargo: 'Analista Sênior' });
      expect(res.status).toBe(200);
      expect(res.body.cargo).toBe('Analista Sênior');
    } finally {
      await limpar({ historicos: [idHist], alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });

  it('GET /alunos/:id/historico retorna 404 quando o aluno está inativo (ex-aluno)', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, false);
    try {
      const res = await request(app).get(`/alunos/${alunoRow.id_usuario}/historico`);
      expect(res.status).toBe(404);
    } finally {
      await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });

  it('POST /alunos/:id/historico retorna 404 para ex-aluno (ativo = false)', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, false);
    try {
      const res = await request(app).post(`/alunos/${alunoRow.id_usuario}/historico`).send({ cargo: 'Gerente', empresa: 'Empresa Y', data_inicio: '2023-01-01' });
      expect(res.status).toBe(404);
    } finally {
      await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });
});

describe('N:N participa_evento — integridade referencial', () => {
  it('insere presença de aluno em evento existente com sucesso', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    const eventoRow = await criarEvento();
    try {
      const { data, error } = await supabase.from('participa_evento').insert({ id_evento: eventoRow.id_evento, id_aluno: alunoRow.id_usuario, presenca: true }).select('id_evento, id_aluno, presenca').single();
      expect(error).toBeNull();
      expect((data as any).presenca).toBe(true);
    } finally {
      await limpar({ participa_evento: [{ id_evento: eventoRow.id_evento, id_aluno: alunoRow.id_usuario }], eventos: [eventoRow.id_evento], alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });

  it('FK participa_evento viola integridade ao usar id_evento inexistente', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    try {
      const { error } = await supabase.from('participa_evento').insert({ id_evento: 999999999, id_aluno: alunoRow.id_usuario, presenca: false });
      expect(error).not.toBeNull();
      expect(error!.code).toBe('23503');
    } finally {
      await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });

  it('FK participa_evento viola integridade ao usar id_aluno inexistente', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const eventoRow = await criarEvento();
    try {
      const { error } = await supabase.from('participa_evento').insert({ id_evento: eventoRow.id_evento, id_aluno: 999999998, presenca: false });
      expect(error).not.toBeNull();
      expect(error!.code).toBe('23503');
    } finally {
      await limpar({ eventos: [eventoRow.id_evento] });
    }
  });

  it('presença duplicada na mesma (aluno, evento) viola PK composta', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    const eventoRow = await criarEvento();
    try {
      await supabase.from('participa_evento').insert({ id_evento: eventoRow.id_evento, id_aluno: alunoRow.id_usuario, presenca: true });
      const { error } = await supabase.from('participa_evento').insert({ id_evento: eventoRow.id_evento, id_aluno: alunoRow.id_usuario, presenca: false });
      expect(error).not.toBeNull();
      expect(error!.code).toBe('23505');
    } finally {
      await limpar({ participa_evento: [{ id_evento: eventoRow.id_evento, id_aluno: alunoRow.id_usuario }], eventos: [eventoRow.id_evento], alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });
});

describe('N:N participa_mentoria — integridade referencial', () => {
  it('FK participa_mentoria viola integridade ao usar id_mentoria inexistente', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const userRow = await criarUsuario();
    const alunoRow = await criarAluno(userRow.id_usuario, true);
    try {
      const { error } = await supabase.from('participa_mentoria').insert({ id_mentoria: 999999997, id_aluno: alunoRow.id_usuario });
      expect(error).not.toBeNull();
      expect(error!.code).toBe('23503');
    } finally {
      await limpar({ alunos: [alunoRow.id_usuario], users: [userRow.id_usuario] });
    }
  });

  it('POST /mentorias com dados válidos cria vínculo em participa_mentoria no PostgreSQL', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const coordUserRow = await criarUsuario();
    const mentorUserRow = await criarUsuario();
    const alunoUserRow = await criarUsuario();
    const coordRow = await criarCoordenador(coordUserRow.id_usuario);
    const mentorRow = await criarMentor(mentorUserRow.id_usuario, coordRow.id_usuario);
    const alunoRow = await criarAluno(alunoUserRow.id_usuario, true);
    const programa = await criarPrograma();
    await criarAcompanha(mentorRow.id_usuario, alunoRow.id_usuario, programa.id_programa);
    const mentoriaIds: number[] = [];
    try {
      const payload = { formato: 'online', tema: 'Planejamento de Carreira', duracao: 45, data: new Date().toISOString(), id_mentor: mentorRow.id_usuario, id_aluno: alunoRow.id_usuario };
      const res = await request(app).post('/mentorias').send(payload);
      expect(res.status).toBe(201);
      mentoriaIds.push(res.body.id_mentoria);
      const { data: vinculo, error } = await supabase.from('participa_mentoria').select('id_mentoria, id_aluno').eq('id_mentoria', res.body.id_mentoria).eq('id_aluno', alunoRow.id_usuario).single();
      expect(error).toBeNull();
      expect(vinculo).toBeTruthy();
    } finally {
      await limpar({ mentorias: mentoriaIds, alunos: [alunoRow.id_usuario], mentores: [mentorRow.id_usuario], coords: [coordRow.id_usuario], programas: [programa.id_programa], users: [alunoUserRow.id_usuario, mentorUserRow.id_usuario, coordUserRow.id_usuario] });
    }
  });

  it('FK participa_mentoria viola integridade ao usar id_aluno inexistente', async () => {
    if (!isReachable) { console.warn('[exAluno] Supabase inalcançável — pulado'); return; }
    const mentoriaRow = await criarMentoria();
    try {
      const { error } = await supabase.from('participa_mentoria').insert({ id_mentoria: mentoriaRow.id_mentoria, id_aluno: 999999996 });
      expect(error).not.toBeNull();
      expect(error!.code).toBe('23503');
    } finally {
      await limpar({ mentorias: [mentoriaRow.id_mentoria] });
    }
  });
});
