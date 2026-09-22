import { supabase } from '../db/supabaseClient';

export interface HistoricoProfissional {
  id_historico: number;
  cargo: string | null;
  empresa: string | null;
  data_inicio: string;
  data_fim: string | null;
  renda: number | null;
  id_aluno: number;
}

export interface CreateHistoricoData {
  cargo: string;
  empresa: string;
  data_inicio: string;
  data_fim?: string | null;
  id_aluno: number;
}

export type UpdateHistoricoData = Partial<Omit<HistoricoProfissional, 'id_historico' | 'id_aluno'>>;

/**
 * SELECT * FROM historico_profissional WHERE id_aluno = idAluno ORDER BY data_inicio DESC.
 * Retorna o histórico do mais recente para o mais antigo.
 */
export async function findAllByAluno(idAluno: number): Promise<HistoricoProfissional[]> {
  const { data, error } = await supabase
    .from('historico_profissional')
    .select('*')
    .eq('id_aluno', idAluno)
    .order('data_inicio', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** INSERT INTO historico_profissional. Retorna a linha criada. */
export async function create(data: CreateHistoricoData): Promise<HistoricoProfissional> {
  const { data: result, error } = await supabase
    .from('historico_profissional')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * UPDATE historico_profissional WHERE id_historico = idHistorico AND id_aluno = idAluno.
 * Filtra por id_aluno para impedir que um aluno edite o histórico de outro.
 * Retorna null se não encontrado.
 */
export async function update(
  idHistorico: number,
  idAluno: number,
  data: UpdateHistoricoData,
): Promise<HistoricoProfissional | null> {
  const { data: result, error } = await supabase
    .from('historico_profissional')
    .update(data)
    .eq('id_historico', idHistorico)
    .eq('id_aluno', idAluno)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/**
 * DELETE FROM historico_profissional WHERE id_historico = idHistorico AND id_aluno = idAluno.
 * Filtra por id_aluno para garantir que o registro pertence ao aluno correto.
 * Retorna true se removido.
 */
export async function remove(idHistorico: number, idAluno: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('historico_profissional')
    .delete({ count: 'exact' })
    .eq('id_historico', idHistorico)
    .eq('id_aluno', idAluno);
  if (error) throw error;
  return (count ?? 0) > 0;
}
