import { supabase } from '../db/supabaseClient';

export interface Curso {
  id_curso: number;
  id_programa: number;
  titulo: string;
  ordem: number;
}

export interface CreateCursoData {
  id_programa: number;
  titulo: string;
  ordem?: number;
}

export type UpdateCursoData = Partial<Omit<Curso, 'id_curso' | 'id_programa'>>;

/** SELECT * FROM curso WHERE id_programa = idPrograma ORDER BY ordem. */
export async function findAllByPrograma(idPrograma: number): Promise<Curso[]> {
  const { data, error } = await supabase
    .from('curso')
    .select('*')
    .eq('id_programa', idPrograma)
    .order('ordem');
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM curso WHERE id_curso = id. Retorna null se não encontrado. */
export async function findById(id: number): Promise<Curso | null> {
  const { data, error } = await supabase
    .from('curso')
    .select('*')
    .eq('id_curso', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO curso. Retorna a linha criada. */
export async function create(data: CreateCursoData): Promise<Curso> {
  const { data: result, error } = await supabase
    .from('curso')
    .insert({ ordem: 1, ...data })
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE curso WHERE id_curso = id. Retorna null se não encontrado. */
export async function update(id: number, data: UpdateCursoData): Promise<Curso | null> {
  const { data: result, error } = await supabase
    .from('curso')
    .update(data)
    .eq('id_curso', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM curso WHERE id_curso = id (cascateia para aula e presenca). Retorna true se removido. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('curso')
    .delete({ count: 'exact' })
    .eq('id_curso', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
