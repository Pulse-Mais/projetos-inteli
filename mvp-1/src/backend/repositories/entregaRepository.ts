import { supabase } from '../db/supabaseClient';

export interface Entrega {
  id_aluno: number;
  id_atividade: number;
  data_entrega: string;
}

export interface CreateEntregaData {
  id_aluno: number;
  id_atividade: number;
  data_entrega: string;
}

/**
 * SELECT * FROM realiza_entrega WHERE id_aluno = id ORDER BY id_atividade.
 * Tabela de associação entre aluno e atividade (chave composta).
 */
export async function findAllByAluno(id_aluno: number): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from('realiza_entrega')
    .select('*')
    .eq('id_aluno', id_aluno)
    .order('id_atividade');
  if (error) throw error;
  return data ?? [];
}

/** INSERT INTO realiza_entrega. Retorna a linha criada. */
export async function create(data: CreateEntregaData): Promise<Entrega> {
  const { data: result, error } = await supabase
    .from('realiza_entrega')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * UPDATE realiza_entrega WHERE id_aluno = id_aluno AND id_atividade = id_atividade.
 * Retorna null se a entrega não existir.
 */
export async function update(
  id_aluno: number,
  id_atividade: number,
  data: Partial<Omit<Entrega, 'id_aluno' | 'id_atividade'>>
): Promise<Entrega | null> {
  const { data: result, error } = await supabase
    .from('realiza_entrega')
    .update(data)
    .eq('id_aluno', id_aluno)
    .eq('id_atividade', id_atividade)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/**
 * DELETE FROM realiza_entrega WHERE id_aluno = id_aluno AND id_atividade = id_atividade.
 * Retorna true se removida.
 */
export async function remove(
  id_aluno: number,
  id_atividade: number
): Promise<boolean> {
  const { error, count } = await supabase
    .from('realiza_entrega')
    .delete({ count: 'exact' })
    .eq('id_aluno', id_aluno)
    .eq('id_atividade', id_atividade);
  if (error) throw error;
  return (count ?? 0) > 0;
}
