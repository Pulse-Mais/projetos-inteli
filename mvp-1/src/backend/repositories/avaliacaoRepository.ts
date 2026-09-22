import { supabase } from '../db/supabaseClient';

export interface Avaliacao {
  id_avaliacao: number;
  nota: number;
  data_avaliacao: string;
  id_indicador: number;
  id_aluno: number;
}

export interface CreateAvaliacaoData {
  nota: number;
  data_avaliacao: string;
  id_indicador: number;
  id_aluno: number;
}

/** SELECT * FROM avaliacao ORDER BY id_avaliacao. */
export async function findAll(): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from('avaliacao')
    .select('*')
    .order('id_avaliacao');

  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM avaliacao WHERE id_avaliacao = id. Retorna null se não encontrada. */
export async function findById(id: number): Promise<Avaliacao | null> {
  const { data, error } = await supabase
    .from('avaliacao')
    .select('*')
    .eq('id_avaliacao', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO avaliacao. Retorna a linha criada. */
export async function create(data: CreateAvaliacaoData): Promise<Avaliacao> {
  const { data: result, error } = await supabase
    .from('avaliacao')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/** UPDATE avaliacao WHERE id_avaliacao = id. Retorna null se não encontrada. */
export async function update(
  id: number,
  data: Partial<Omit<Avaliacao, 'id_avaliacao'>>
): Promise<Avaliacao | null> {
  const { data: result, error } = await supabase
    .from('avaliacao')
    .update(data)
    .eq('id_avaliacao', id)
    .select()
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM avaliacao WHERE id_avaliacao = id. Retorna true se removida. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('avaliacao')
    .delete({ count: 'exact' })
    .eq('id_avaliacao', id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
