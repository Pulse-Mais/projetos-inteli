import { supabase } from '../db/supabaseClient';

export interface Programa {
  id_programa: number;
  titulo: string;
  inicio: string;
  fim: string;
  // Opcional no tipo: a coluna tem DEFAULT 'Pulse Mais' no banco, então registros
  // antigos/mocks de teste sem o campo continuam válidos.
  tipo?: 'Pulse Mais' | 'Mentoria';
}

export interface CreateProgramaData {
  titulo: string;
  inicio: string;
  fim: string;
  tipo?: 'Pulse Mais' | 'Mentoria';
}

/** SELECT * FROM programa ORDER BY id_programa. */
export async function findAll(): Promise<Programa[]> {
  const { data, error } = await supabase
    .from('programa')
    .select('*')
    .order('id_programa');
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM programa WHERE id_programa = id. Retorna null se não encontrado. */
export async function findById(id: number): Promise<Programa | null> {
  const { data, error } = await supabase
    .from('programa')
    .select('*')
    .eq('id_programa', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO programa. Retorna a linha criada. */
export async function create(data: CreateProgramaData): Promise<Programa> {
  const { data: result, error } = await supabase
    .from('programa')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE programa WHERE id_programa = id. Retorna null se não encontrado. */
export async function update(
  id: number,
  data: Partial<Omit<Programa, 'id_programa'>>
): Promise<Programa | null> {
  const { data: result, error } = await supabase
    .from('programa')
    .update(data)
    .eq('id_programa', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM programa WHERE id_programa = id. Retorna true se removido. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('programa')
    .delete({ count: 'exact' })
    .eq('id_programa', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
