import { supabase } from '../db/supabaseClient';

export interface Aula {
  id_aula: number;
  id_curso: number;
  id_programa: number;
  numero: number;
  titulo: string;
  data_aula: string | null;
}

export interface CreateAulaData {
  id_curso: number;
  id_programa: number;
  numero: number;
  titulo: string;
  data_aula?: string | null;
}

export type UpdateAulaData = Partial<Pick<Aula, 'numero' | 'titulo' | 'data_aula'>>;

/** SELECT * FROM aula WHERE id_curso = idCurso ORDER BY numero. */
export async function findAllByCurso(idCurso: number): Promise<Aula[]> {
  const { data, error } = await supabase
    .from('aula')
    .select('*')
    .eq('id_curso', idCurso)
    .order('numero');
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM aula WHERE id_aula = id. Retorna null se não encontrada. */
export async function findById(id: number): Promise<Aula | null> {
  const { data, error } = await supabase
    .from('aula')
    .select('*')
    .eq('id_aula', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO aula. Retorna a linha criada. */
export async function create(data: CreateAulaData): Promise<Aula> {
  const { data: result, error } = await supabase
    .from('aula')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE aula WHERE id_aula = id. Retorna null se não encontrada. */
export async function update(id: number, data: UpdateAulaData): Promise<Aula | null> {
  const { data: result, error } = await supabase
    .from('aula')
    .update(data)
    .eq('id_aula', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM aula WHERE id_aula = id (cascateia para presenca). Retorna true se removida. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('aula')
    .delete({ count: 'exact' })
    .eq('id_aula', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
