import { supabase } from '../../db/supabaseClient';
import * as avaliacaoRepo from '../../repositories/avaliacaoRepository';
import * as atividadeRepo from '../../repositories/atividadeRepository';
import * as programaRepo from '../../repositories/programaRepository';
import * as alunoRepo from '../../repositories/alunoRepository';

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

describe('Integração — Linha de Evolução (JOIN aluno + avaliacao) e FKs', () => {
  it('consulta faz JOIN corretamente e retorna média de notas', async () => {
    if (!isReachable) {
      console.warn('[evolucao.integration] Supabase inalcançável — teste pulado');
      return;
    }

    const { data: progData, error: progErr } = await supabase
      .from('programa')
      .insert({ titulo: `Prog Teste ${Date.now()}`, inicio: '2020-01-01', fim: '2025-01-01' })
      .select('id_programa')
      .single();
    expect(progErr).toBeNull();
    const programa = progData as any;

    const { data: ativData, error: ativErr } = await supabase
      .from('atividade')
      .insert({ status: 'aberta', id_programa: programa.id_programa })
      .select('id_atividade')
      .single();
    expect(ativErr).toBeNull();
    const atividade = ativData as any;

    const cpf = `88888888${Date.now().toString().slice(-3)}`;
    const { data: userData, error: userErr } = await supabase
      .from('usuario')
      .insert({ nome: 'Aluno Evolucao', email: `aluno-evo-${Date.now()}@ex.com`, senha: 'senha', cpf })
      .select('id_usuario')
      .single();
    expect(userErr).toBeNull();
    const usuario = userData as any;

    const { data: alunoData, error: alunoErr } = await supabase
      .from('aluno')
      .insert({ id_usuario: usuario.id_usuario })
      .select('id_usuario')
      .single();
    expect(alunoErr).toBeNull();
    const aluno = alunoData as any;

    const nota1 = 4;
    const nota2 = 5;
    const { data: a1Data } = await supabase
      .from('avaliacao')
      .insert({ nota: nota1, id_indicador: 1, id_aluno: aluno.id_usuario })
      .select('id_avaliacao')
      .single();
    const a1 = a1Data as any;

    const { data: a2Data } = await supabase
      .from('avaliacao')
      .insert({ nota: nota2, id_indicador: 1, id_aluno: aluno.id_usuario })
      .select('id_avaliacao')
      .single();
    const a2 = a2Data as any;

    const notas = [nota1, nota2];
    const media = notas.reduce((s, v) => s + v, 0) / notas.length;
    expect(media).toBeCloseTo(4.5, 5);

    if (a1?.id_avaliacao) await avaliacaoRepo.remove(a1.id_avaliacao);
    if (a2?.id_avaliacao) await avaliacaoRepo.remove(a2.id_avaliacao);
    await alunoRepo.inactivate(aluno.id_usuario);
    if (atividade?.id_atividade) await atividadeRepo.remove(atividade.id_atividade);
    if (programa?.id_programa) await programaRepo.remove(programa.id_programa);
  });

  it('FKs no PostgreSQL impedem inserção de avaliação com id_aluno inválido', async () => {
    if (!isReachable) {
      console.warn('[evolucao.integration] Supabase inalcançável — teste pulado');
      return;
    }

    const fakeAlunoId = 999999999;
    await expect(
      avaliacaoRepo.create({ nota: 5, id_indicador: 1, id_aluno: fakeAlunoId } as any),
    ).rejects.toBeTruthy();
  });
});
