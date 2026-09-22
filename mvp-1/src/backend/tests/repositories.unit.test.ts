/**
 * Cobertura unitária de todos os repositórios.
 * Cada teste usa múltiplas asserções para cobrir error/null/success no mínimo de testes possível.
 */

jest.mock('../db/supabaseClient', () => {
  let resultQueue: Array<{ data: unknown; error: unknown; count?: number | null }> = [];
  let fallback: { data: unknown; error: unknown; count?: number | null } = { data: null, error: null };

  function makeChain(result: { data: unknown; error: unknown; count?: number | null }) {
    const ch: Record<string, unknown> = {};
    for (const m of ['select','insert','update','delete','eq','neq','in','order','single','limit','ilike','contains']) {
      ch[m] = () => ch;
    }
    Object.defineProperty(ch, 'then', {
      get: () => (res: (v: unknown) => void, rej: (e: unknown) => void) =>
        Promise.resolve(result).then(res, rej),
      configurable: true,
    });
    return ch;
  }

  return {
    supabase: {
      from: () => {
        const result = resultQueue.length > 0 ? resultQueue.shift()! : { ...fallback };
        return makeChain(result);
      },
      __setResult: (r: typeof fallback) => { fallback = r; resultQueue = []; },
      __setQueue: (results: Array<typeof fallback>) => { resultQueue = [...results]; },
    },
  };
});

import * as atividadeRepo from '../repositories/atividadeRepository';
import * as avaliacaoRepo from '../repositories/avaliacaoRepository';
import * as matriculaRepo from '../repositories/matriculaRepository';
import * as participaEventoRepo from '../repositories/participaEventoRepository';
import * as gerenciaRepo from '../repositories/gerenciaRepository';
import * as anotacaoPrivadaRepo from '../repositories/anotacaoPrivadaRepository';
import * as dashboardRepo from '../repositories/dashboardRepository';
import * as entregaRepo from '../repositories/entregaRepository';
import * as indicadorRepo from '../repositories/indicadorRepository';
import * as mentoriaRepo from '../repositories/mentoriaRepository';
import * as histProf from '../repositories/historicoProfissionalRepository';
import * as acompanhaRepo from '../repositories/acompanhaRepository';
import * as eventoRepo from '../repositories/eventoRepository';
import * as programaRepo from '../repositories/programaRepository';
import * as usuarioRepo from '../repositories/usuarioRepository';
import * as mentorRepo from '../repositories/mentorRepository';
import * as alunoRepo from '../repositories/alunoRepository';

const { supabase } = require('../db/supabaseClient') as {
  supabase: {
    __setResult: (r: { data: unknown; error: unknown; count?: number | null }) => void;
    __setQueue: (r: Array<{ data: unknown; error: unknown; count?: number | null }>) => void;
  };
};

const dbErr = new Error('DB error');
const pgrst116 = { code: 'PGRST116', message: 'not found' };
const otherErr = { code: 'OTHER', message: 'other db error' };

beforeEach(() => supabase.__setResult({ data: null, error: null }));

// ── Helpers de padrão ─────────────────────────────────────────────────────────

async function testaLista(fn: () => Promise<unknown[]>, item: unknown) {
  supabase.__setResult({ data: null, error: dbErr });
  await expect(fn()).rejects.toThrow();
  supabase.__setResult({ data: null, error: null });
  await expect(fn()).resolves.toEqual([]);
  supabase.__setResult({ data: [item], error: null });
  await expect(fn()).resolves.toEqual([item]);
}

async function testaBuscaComPgrst116(fn: () => Promise<unknown>, item: unknown) {
  supabase.__setResult({ data: null, error: otherErr });
  await expect(fn()).rejects.toEqual(otherErr);
  supabase.__setResult({ data: null, error: pgrst116 });
  await expect(fn()).resolves.toBeNull();
  supabase.__setResult({ data: null, error: null });
  await expect(fn()).resolves.toBeNull();
  supabase.__setResult({ data: item, error: null });
  await expect(fn()).resolves.toEqual(item);
}

async function testaCria(fn: () => Promise<unknown>, item: unknown) {
  supabase.__setResult({ data: null, error: dbErr });
  await expect(fn()).rejects.toThrow();
  supabase.__setResult({ data: item, error: null });
  await expect(fn()).resolves.toEqual(item);
}

async function testaRemove(fn: () => Promise<boolean>) {
  supabase.__setResult({ data: null, error: dbErr });
  await expect(fn()).rejects.toThrow();
  supabase.__setResult({ data: null, error: null, count: 0 });
  await expect(fn()).resolves.toBe(false);
  supabase.__setResult({ data: null, error: null, count: 1 });
  await expect(fn()).resolves.toBe(true);
  supabase.__setResult({ data: null, error: null, count: null });
  await expect(fn()).resolves.toBe(false);
}

async function testaAtualiza(fn: () => Promise<unknown>, item: unknown) {
  supabase.__setResult({ data: null, error: otherErr });
  await expect(fn()).rejects.toEqual(otherErr);
  supabase.__setResult({ data: null, error: pgrst116 });
  await expect(fn()).resolves.toBeNull();
  supabase.__setResult({ data: null, error: null });
  await expect(fn()).resolves.toBeNull();
  supabase.__setResult({ data: item, error: null });
  await expect(fn()).resolves.toEqual(item);
}

// ── atividadeRepository ───────────────────────────────────────────────────────

describe('atividadeRepository', () => {
  const item = { id_atividade: 1, nome: 'A', descricao: null, data_entrega: '2026-01-01', id_programa: 1 };
  const createData = { nome: 'A', data_entrega: '2026-01-01', id_programa: 1 };

  it('findAll', () => testaLista(() => atividadeRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => atividadeRepo.findById(1), item));
  it('create', () => testaCria(() => atividadeRepo.create(createData), item));
  it('update', () => testaAtualiza(() => atividadeRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => atividadeRepo.remove(1)));
});

// ── avaliacaoRepository ───────────────────────────────────────────────────────

describe('avaliacaoRepository', () => {
  const item = { id_avaliacao: 1, nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 };
  const createData = { nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 };

  it('findAll', () => testaLista(() => avaliacaoRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => avaliacaoRepo.findById(1), item));
  it('create', () => testaCria(() => avaliacaoRepo.create(createData), item));
  it('update', () => testaAtualiza(() => avaliacaoRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => avaliacaoRepo.remove(1)));
});

// ── matriculaRepository ───────────────────────────────────────────────────────

describe('matriculaRepository', () => {
  const item = { id_aluno: 1, id_programa: 1, status_conclusao: 0 };
  const createData = { id_aluno: 1, id_programa: 1, status_conclusao: 0, data_ingresso: '2024-01-01' };

  it('findAll, findByAluno, findByPrograma', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(matriculaRepo.findAll()).rejects.toThrow();
    await expect(matriculaRepo.findByAluno(1)).rejects.toThrow();
    await expect(matriculaRepo.findByPrograma(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(matriculaRepo.findAll()).resolves.toEqual([]);
    await expect(matriculaRepo.findByAluno(1)).resolves.toEqual([]);
    await expect(matriculaRepo.findByPrograma(1)).resolves.toEqual([]);
    supabase.__setResult({ data: [item], error: null });
    await expect(matriculaRepo.findAll()).resolves.toEqual([item]);
    await expect(matriculaRepo.findByAluno(1)).resolves.toEqual([item]);
    await expect(matriculaRepo.findByPrograma(1)).resolves.toEqual([item]);
  });
  it('findOne', () => testaBuscaComPgrst116(() => matriculaRepo.findOne(1, 1), item));
  it('create', () => testaCria(() => matriculaRepo.create(createData), item));
  it('update', () => testaAtualiza(() => matriculaRepo.update(1, 1, {}), item));
  it('remove', () => testaRemove(() => matriculaRepo.remove(1, 1)));
  it('removeByAluno', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(matriculaRepo.removeByAluno(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null, count: 0 });
    await expect(matriculaRepo.removeByAluno(1)).resolves.toBe(0);
    supabase.__setResult({ data: null, error: null, count: 2 });
    await expect(matriculaRepo.removeByAluno(1)).resolves.toBe(2);
  });
});

// ── participaEventoRepository ─────────────────────────────────────────────────

describe('participaEventoRepository', () => {
  const item = { id_evento: 1, id_aluno: 1, presenca: false };
  const createData = { id_evento: 1, id_aluno: 1 };

  it('findAll, findByEvento, findByAluno', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(participaEventoRepo.findAll()).rejects.toThrow();
    await expect(participaEventoRepo.findByEvento(1)).rejects.toThrow();
    await expect(participaEventoRepo.findByAluno(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(participaEventoRepo.findAll()).resolves.toEqual([]);
    await expect(participaEventoRepo.findByEvento(1)).resolves.toEqual([]);
    await expect(participaEventoRepo.findByAluno(1)).resolves.toEqual([]);
    supabase.__setResult({ data: [item], error: null });
    await expect(participaEventoRepo.findAll()).resolves.toEqual([item]);
    await expect(participaEventoRepo.findByEvento(1)).resolves.toEqual([item]);
    await expect(participaEventoRepo.findByAluno(1)).resolves.toEqual([item]);
  });
  it('findOne', () => testaBuscaComPgrst116(() => participaEventoRepo.findOne(1, 1), item));
  it('create', () => testaCria(() => participaEventoRepo.create(createData), item));
  it('update', () => testaAtualiza(() => participaEventoRepo.update(1, 1, true), item));
  it('remove', () => testaRemove(() => participaEventoRepo.remove(1, 1)));
});

// ── gerenciaRepository ────────────────────────────────────────────────────────

describe('gerenciaRepository', () => {
  const item = { id_coordenador: 1, id_programa: 1 };

  it('findAll, findByPrograma, findByCoordenador', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(gerenciaRepo.findAll()).rejects.toThrow();
    await expect(gerenciaRepo.findByPrograma(1)).rejects.toThrow();
    await expect(gerenciaRepo.findByCoordenador(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(gerenciaRepo.findAll()).resolves.toEqual([]);
    await expect(gerenciaRepo.findByPrograma(1)).resolves.toEqual([]);
    await expect(gerenciaRepo.findByCoordenador(1)).resolves.toEqual([]);
    supabase.__setResult({ data: [item], error: null });
    await expect(gerenciaRepo.findAll()).resolves.toEqual([item]);
    await expect(gerenciaRepo.findByPrograma(1)).resolves.toEqual([item]);
    await expect(gerenciaRepo.findByCoordenador(1)).resolves.toEqual([item]);
  });
  it('findOne', () => testaBuscaComPgrst116(() => gerenciaRepo.findOne(1, 1), item));
  it('create', () => testaCria(() => gerenciaRepo.create(item), item));
  it('remove', () => testaRemove(() => gerenciaRepo.remove(1, 1)));
});

// ── anotacaoPrivadaRepository ─────────────────────────────────────────────────

describe('anotacaoPrivadaRepository', () => {
  const item = { id_mentor: 1, id_aluno: 1, data_registro: '2026-01-01', conteudo_texto: 'ok' };
  const createData = { id_mentor: 1, id_aluno: 1, conteudo_texto: 'ok' };

  it('findByAlunoAndMentor, findByAluno, findByMentor', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(anotacaoPrivadaRepo.findByAlunoAndMentor(1, 1)).rejects.toThrow();
    await expect(anotacaoPrivadaRepo.findByAluno(1)).rejects.toThrow();
    await expect(anotacaoPrivadaRepo.findByMentor(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(anotacaoPrivadaRepo.findByAlunoAndMentor(1, 1)).resolves.toEqual([]);
    await expect(anotacaoPrivadaRepo.findByAluno(1)).resolves.toEqual([]);
    await expect(anotacaoPrivadaRepo.findByMentor(1)).resolves.toEqual([]);
    supabase.__setResult({ data: [item], error: null });
    await expect(anotacaoPrivadaRepo.findByAlunoAndMentor(1, 1)).resolves.toEqual([item]);
    await expect(anotacaoPrivadaRepo.findByAluno(1)).resolves.toEqual([item]);
    await expect(anotacaoPrivadaRepo.findByMentor(1)).resolves.toEqual([item]);
  });
  it('create', () => testaCria(() => anotacaoPrivadaRepo.create(createData), item));
  it('remove', () => testaRemove(() => anotacaoPrivadaRepo.remove(1, 1, '2026-01-01')));
});

// ── dashboardRepository ───────────────────────────────────────────────────────

describe('dashboardRepository', () => {
  it('countAlunosAtivos', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(dashboardRepo.countAlunosAtivos()).rejects.toThrow();
    supabase.__setResult({ data: null, error: null, count: null });
    await expect(dashboardRepo.countAlunosAtivos()).resolves.toBe(0);
    supabase.__setResult({ data: null, error: null, count: 5 });
    await expect(dashboardRepo.countAlunosAtivos()).resolves.toBe(5);
  });

  it('countAlunosComHistorico — sem histórico e com histórico', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(dashboardRepo.countAlunosComHistorico()).rejects.toThrow();
    supabase.__setResult({ data: [], error: null });
    await expect(dashboardRepo.countAlunosComHistorico()).resolves.toBe(0);
    // com ids — ativa a 2ª query; count da 2ª query é o que importa
    supabase.__setResult({ data: [{ id_aluno: 1 }], error: null, count: 3 });
    await expect(dashboardRepo.countAlunosComHistorico()).resolves.toBe(3);
  });

  it('alunosPorPrograma', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(dashboardRepo.alunosPorPrograma()).rejects.toThrow();
    supabase.__setResult({ data: [], error: null });
    await expect(dashboardRepo.alunosPorPrograma()).resolves.toEqual([]);
    supabase.__setResult({
      data: [
        { id_programa: 1, programa: { id_programa: 1, titulo: 'P1' } },
        { id_programa: 1, programa: { id_programa: 1, titulo: 'P1' } },
        { id_programa: 2, programa: null },
      ],
      error: null,
    });
    const result = await dashboardRepo.alunosPorPrograma();
    expect(result).toEqual([{ id_programa: 1, nome_programa: 'P1', total_alunos: 2 }]);
  });
});

// ── entregaRepository ─────────────────────────────────────────────────────────

describe('entregaRepository', () => {
  const item = { id_aluno: 1, id_atividade: 1, data_entrega: '2026-01-01' };
  const createData = { id_aluno: 1, id_atividade: 1, data_entrega: '2026-01-01' };

  it('findAllByAluno', () => testaLista(() => entregaRepo.findAllByAluno(1), item));
  it('create', () => testaCria(() => entregaRepo.create(createData), item));
  it('update', () => testaAtualiza(() => entregaRepo.update(1, 1, {}), item));
  it('remove', () => testaRemove(() => entregaRepo.remove(1, 1)));
});

// ── indicadorRepository ───────────────────────────────────────────────────────

describe('indicadorRepository', () => {
  const item = { id_indicador: 1, nome: 'N', descricao: null, id_programa: 1 };
  const createData = { nome: 'N', id_programa: 1 };

  it('findAll', () => testaLista(() => indicadorRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => indicadorRepo.findById(1), item));
  it('create', () => testaCria(() => indicadorRepo.create(createData), item));
  it('update', () => testaAtualiza(() => indicadorRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => indicadorRepo.remove(1)));
});

// ── mentoriaRepository ────────────────────────────────────────────────────────

describe('mentoriaRepository', () => {
  const item = { id_mentoria: 1, formato: 'online', tema: 'T', duracao: 60, data: '2026-01-01' };
  const createData = { formato: 'online', tema: 'T', duracao: 60, data: '2026-01-01' };

  it('findAll', () => testaLista(() => mentoriaRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => mentoriaRepo.findById(1), item));
  it('create', () => testaCria(() => mentoriaRepo.create(createData), item));
  it('update', () => testaAtualiza(() => mentoriaRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => mentoriaRepo.remove(1)));
  it('createRealiza', () => testaCria(() => mentoriaRepo.createRealiza({ id_mentoria: 1, id_mentor: 1 }), { id_mentoria: 1, id_mentor: 1 }));
  it('createParticipaMentoria', () => testaCria(() => mentoriaRepo.createParticipaMentoria({ id_mentoria: 1, id_aluno: 1 }), { id_mentoria: 1, id_aluno: 1 }));
});

// ── historicoProfissionalRepository ──────────────────────────────────────────

describe('historicoProfissionalRepository', () => {
  const item = { id_aluno: 1, cargo: 'Dev', empresa: 'Corp', data_inicio: '2024-01-01', data_fim: null };
  const createData = { id_aluno: 1, cargo: 'Dev', empresa: 'Corp', data_inicio: '2024-01-01' };

  it('findAllByAluno', () => testaLista(() => histProf.findAllByAluno(1), item));
  it('create', () => testaCria(() => histProf.create(createData), item));
  it('update', () => testaAtualiza(() => histProf.update(1, 1, {}), item));
  it('remove', () => testaRemove(() => histProf.remove(1, 1)));
});

// ── acompanhaRepository ───────────────────────────────────────────────────────

describe('acompanhaRepository', () => {
  it('create', () => testaCria(
    () => acompanhaRepo.create({ id_mentor: 1, id_aluno: 1, id_programa: 1 }),
    { id_mentor: 1, id_aluno: 1, id_programa: 1 },
  ));

  it('findMentorandosByMentorId — error e null data', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(acompanhaRepo.findMentorandosByMentorId(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(acompanhaRepo.findMentorandosByMentorId(1)).resolves.toEqual([]);
  });

  it('findMentorandosByMentorId — aluno null e aluno válido', async () => {
    // aluno = null → filtrado
    supabase.__setResult({ data: [{ aluno: null }], error: null });
    await expect(acompanhaRepo.findMentorandosByMentorId(1)).resolves.toEqual([]);
    // aluno com usuario válido
    supabase.__setResult({
      data: [{ aluno: { id_usuario: 2, usuario: { nome: 'A', email: 'a@a.com', cpf: '111' } } }],
      error: null,
    });
    const result = await acompanhaRepo.findMentorandosByMentorId(1);
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('A');
  });

  it('removeByAlunoId', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(acompanhaRepo.removeByAlunoId(1)).rejects.toThrow();
    supabase.__setResult({ data: null, error: null, count: 0 });
    await expect(acompanhaRepo.removeByAlunoId(1)).resolves.toBe(0);
    supabase.__setResult({ data: null, error: null, count: 1 });
    await expect(acompanhaRepo.removeByAlunoId(1)).resolves.toBe(1);
  });
});

// ── eventoRepository ──────────────────────────────────────────────────────────

describe('eventoRepository', () => {
  const item = { id_evento: 1, nome: 'Ev', data: '2026-01-01', descricao: null };
  const createData = { nome: 'Ev', data: '2026-01-01' };

  it('findAll', () => testaLista(() => eventoRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => eventoRepo.findById(1), item));
  it('create', () => testaCria(() => eventoRepo.create(createData as any), item));
  it('update', () => testaAtualiza(() => eventoRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => eventoRepo.remove(1)));
});

// ── programaRepository ────────────────────────────────────────────────────────

describe('programaRepository', () => {
  const item = { id_programa: 1, titulo: 'P', inicio: '2026-01-01', fim: '2026-12-31' };
  const createData = { titulo: 'P', inicio: '2026-01-01', fim: '2026-12-31' };

  it('findAll', () => testaLista(() => programaRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => programaRepo.findById(1), item));
  it('create', () => testaCria(() => programaRepo.create(createData), item));
  it('update', () => testaAtualiza(() => programaRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => programaRepo.remove(1)));
});

// ── usuarioRepository ─────────────────────────────────────────────────────────

describe('usuarioRepository', () => {
  const item = { id_usuario: 1, nome: 'U', email: 'u@u.com', senha: 'x', cpf: '12345678901' };
  const createData = { nome: 'U', email: 'u@u.com', senha: 'x', cpf: '12345678901' };

  it('findAll', () => testaLista(() => usuarioRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => usuarioRepo.findById(1), item));
  it('findByEmail', () => testaBuscaComPgrst116(() => usuarioRepo.findByEmail('u@u.com'), item));
  it('findByCpf', () => testaBuscaComPgrst116(() => usuarioRepo.findByCpf('12345678901'), item));
  it('create', () => testaCria(() => usuarioRepo.create(createData), item));
  it('update', () => testaAtualiza(() => usuarioRepo.update(1, {}), item));
  it('remove', () => testaRemove(() => usuarioRepo.remove(1)));
});

// ── mentorRepository ──────────────────────────────────────────────────────────

describe('mentorRepository', () => {
  const item = { id_usuario: 1, tipo_vinculo: 'interno', disponibilidade: 'disponivel', ativo: true, id_coordenador: 2 };
  const createData = { tipo_vinculo: 'interno', disponibilidade: 'disponivel', ativo: true, id_coordenador: 2, id_usuario: 1 };

  it('findAll', () => testaLista(() => mentorRepo.findAll(), item));
  it('findById', () => testaBuscaComPgrst116(() => mentorRepo.findById(1), item));
  it('findByIdIncludeInactive', () => testaBuscaComPgrst116(() => mentorRepo.findByIdIncludeInactive(1), item));
  it('create', () => testaCria(() => mentorRepo.create(createData), item));
  it('update', () => testaAtualiza(() => mentorRepo.update(1, {}), item));
  it('inactivate', () => testaRemove(() => mentorRepo.inactivate(1)));
});

// ── alunoRepository ───────────────────────────────────────────────────────────

describe('alunoRepository', () => {
  const aluno = { id_usuario: 1, ativo: true };
  const alunoComUsuario = { ...aluno, usuario: { nome: 'T', email: 't@t.com', cpf: '111' } };

  it('findAll — erro, null e filtros', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(alunoRepo.findAll()).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(alunoRepo.findAll()).resolves.toEqual([]);
    supabase.__setResult({ data: [aluno], error: null });
    await expect(alunoRepo.findAll()).resolves.toEqual([aluno]);
    await expect(alunoRepo.findAll({ ativo: false, nome: 'X', cpf: '111', email: 'x@x.com' })).resolves.toEqual([aluno]);
  });

  it('findAllComUsuario — erro, filtros', async () => {
    supabase.__setResult({ data: null, error: dbErr });
    await expect(alunoRepo.findAllComUsuario()).rejects.toThrow();
    supabase.__setResult({ data: null, error: null });
    await expect(alunoRepo.findAllComUsuario()).resolves.toEqual([]);
    supabase.__setResult({ data: [alunoComUsuario], error: null });
    await expect(alunoRepo.findAllComUsuario({ ativo: true, nome: 'T', cpf: '111', email: 't@t.com' })).resolves.toEqual([alunoComUsuario]);
  });

  it('findById', () => testaBuscaComPgrst116(() => alunoRepo.findById(1), aluno));
  it('findByIdIncludeInactive', () => testaBuscaComPgrst116(() => alunoRepo.findByIdIncludeInactive(1), aluno));
  it('findByIdComUsuario', () => testaBuscaComPgrst116(() => alunoRepo.findByIdComUsuario(1), alunoComUsuario));
  it('create', () => testaCria(() => alunoRepo.create({ id_usuario: 1 }), aluno));
  it('update', () => testaAtualiza(() => alunoRepo.update(1, {}), aluno));
  it('inactivate', async () => {
    supabase.__setResult({ data: null, error: otherErr });
    await expect(alunoRepo.inactivate(1)).rejects.toEqual(otherErr);
    supabase.__setResult({ data: null, error: pgrst116 });
    await expect(alunoRepo.inactivate(1)).resolves.toBe(false);
    supabase.__setResult({ data: null, error: null });
    await expect(alunoRepo.inactivate(1)).resolves.toBe(false);
    supabase.__setResult({ data: { ativo: false }, error: null });
    await expect(alunoRepo.inactivate(1)).resolves.toBe(true);
  });

  it('hardDelete', () => testaRemove(() => alunoRepo.hardDelete(1)));

  it('findPerfilById — error e null', async () => {
    supabase.__setResult({ data: null, error: otherErr });
    await expect(alunoRepo.findPerfilById(1)).rejects.toEqual(otherErr);
    supabase.__setResult({ data: null, error: null });
    await expect(alunoRepo.findPerfilById(1)).resolves.toBeNull();
    supabase.__setResult({ data: { ativo: false, usuario: {} }, error: null });
    await expect(alunoRepo.findPerfilById(1)).resolves.toBeNull();
  });

  it('findPerfilById — sucesso completo', async () => {
    supabase.__setQueue([
      { data: { ativo: true, usuario: { nome: 'Test', email: 't@t.com', cpf: '111' } }, error: null },
      { data: [{ programa: { titulo: 'Prog A' } }], error: null },
      { data: [{ evento: { nome: 'Ev', data: '2026-01-01' } }], error: null },
      { data: [{ nota: 4, id_indicador: 1 }], error: null },
      { data: [{ mentoria: { id_mentoria: 1, realiza: [{ mentor: { usuario: { nome: 'M' } } }] } }], error: null },
      { data: [{ cargo: 'Dev', empresa: 'Corp', data_inicio: '2024-01-01', data_fim: null }], error: null },
      { data: [{ id_indicador: 1, nome: 'Habilidade' }], error: null },
    ]);
    const perfil = await alunoRepo.findPerfilById(1);
    expect(perfil).not.toBeNull();
    expect(perfil!.avaliacoes[0].indicador).toBe('Habilidade');
  });
});
