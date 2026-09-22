import { supabase } from '../db/supabaseClient';

export interface Indicador {
  id_indicador: number;
  nome: string;
  descricao: string | null;
  id_programa: number;
}

export interface CreateIndicadorData {
  nome: string;
  descricao?: string | null;
  id_programa: number;
}

/** SELECT * FROM indicador ORDER BY id_indicador. */
export async function findAll(): Promise<Indicador[]> {
  const { data, error } = await supabase
    .from('indicador')
    .select('*')
    .order('id_indicador');

  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM indicador WHERE id_indicador = id. Retorna null se não encontrado. */
export async function findById(id: number): Promise<Indicador | null> {
  const { data, error } = await supabase
    .from('indicador')
    .select('*')
    .eq('id_indicador', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO indicador. Retorna a linha criada. */
export async function create(data: CreateIndicadorData): Promise<Indicador> {
  const { data: result, error } = await supabase
    .from('indicador')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result;
}

/** UPDATE indicador WHERE id_indicador = id. Retorna null se não encontrado. */
export async function update(
  id: number,
  data: Partial<Omit<Indicador, 'id_indicador'>>
): Promise<Indicador | null> {
  const { data: result, error } = await supabase
    .from('indicador')
    .update(data)
    .eq('id_indicador', id)
    .select()
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM indicador WHERE id_indicador = id. Retorna true se removido. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('indicador')
    .delete({ count: 'exact' })
    .eq('id_indicador', id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
