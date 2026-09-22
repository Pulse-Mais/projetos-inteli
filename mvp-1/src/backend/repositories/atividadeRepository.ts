import { supabase } from '../db/supabaseClient';

export interface Atividade {
  id_atividade: number;
  nome: string;
  descricao: string | null;
  data_entrega: string;
  id_programa: number;
}

export interface CreateAtividadeData {
  nome: string;
  descricao?: string | null;
  data_entrega: string;
  id_programa: number;
}

/** SELECT * FROM atividade ORDER BY id_atividade. */
export async function findAll(): Promise<Atividade[]> {
  const { data, error } = await supabase
    .from('atividade')
    .select('*')
    .order('id_atividade');
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM atividade WHERE id_atividade = id. Retorna null se não encontrada. */
export async function findById(id: number): Promise<Atividade | null> {
  const { data, error } = await supabase
    .from('atividade')
    .select('*')
    .eq('id_atividade', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO atividade. Retorna a linha criada. */
export async function create(data: CreateAtividadeData): Promise<Atividade> {
  const { data: result, error } = await supabase
    .from('atividade')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE atividade WHERE id_atividade = id. Retorna null se não encontrada. */
export async function update(
  id: number,
  data: Partial<Omit<Atividade, 'id_atividade'>>
): Promise<Atividade | null> {
  const { data: result, error } = await supabase
    .from('atividade')
    .update(data)
    .eq('id_atividade', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM atividade WHERE id_atividade = id. Retorna true se removida. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('atividade')
    .delete({ count: 'exact' })
    .eq('id_atividade', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
