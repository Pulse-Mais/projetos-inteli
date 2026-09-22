import { supabase } from '../db/supabaseClient';

export interface AlunoPorPrograma {
  id_programa: number;
  nome_programa: string;
  total_alunos: number;
}

/** SELECT COUNT(*) FROM aluno WHERE ativo = true. */
export async function countAlunosAtivos(): Promise<number> {
  const { count, error } = await supabase
    .from('aluno')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true);
  if (error) throw error;
  return count ?? 0;
}

/**
 * SELECT COUNT(*) FROM aluno WHERE ativo = true AND programa_ingresso ILIKE '%keyword%'.
 * Usado para contar alunos por categoria de ingresso (conectado, capacitado, transformado).
 */
export async function countByCategoria(keyword: string): Promise<number> {
  const { count, error } = await supabase
    .from('aluno')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)
    .ilike('programa_ingresso', `%${keyword}%`);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Conta alunos ativos que possuem pelo menos um registro em historico_profissional.
 * Estratégia em dois passos: busca ids distintos em historico_profissional,
 * depois conta alunos ativos com esses ids. Base da taxa de empregabilidade.
 */
export async function countAlunosComHistorico(): Promise<number> {
  const { data, error: histError } = await supabase
    .from('historico_profissional')
    .select('id_aluno');
  if (histError) throw histError;

  const idsComHistorico = [...new Set((data ?? []).map((h) => h.id_aluno))];
  if (idsComHistorico.length === 0) return 0;

  const { count, error } = await supabase
    .from('aluno')
    .select('*', { count: 'exact', head: true })
    .eq('ativo', true)
    .in('id_usuario', idsComHistorico);
  if (error) throw error;
  return count ?? 0;
}

/**
 * SELECT matricula JOIN programa, agrupado por programa.
 * Conta todos os alunos matriculados em cada programa (independente de conclusão),
 * já que `status_conclusao` ainda não é marcado por nenhuma funcionalidade da
 * plataforma — uma contagem de "concluintes" ficaria sempre zerada.
 */
export async function alunosPorPrograma(): Promise<AlunoPorPrograma[]> {
  const { data, error } = await supabase
    .from('matricula')
    .select('id_programa, programa(id_programa, titulo)');
  if (error) throw error;

  const mapa = new Map<number, AlunoPorPrograma>();
  for (const row of data ?? []) {
    const prog = (row.programa as unknown) as { id_programa: number; titulo: string } | null;
    if (!prog) continue;
    if (mapa.has(prog.id_programa)) {
      mapa.get(prog.id_programa)!.total_alunos++;
    } else {
      mapa.set(prog.id_programa, {
        id_programa: prog.id_programa,
        nome_programa: prog.titulo,
        total_alunos: 1,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) => a.id_programa - b.id_programa);
}
