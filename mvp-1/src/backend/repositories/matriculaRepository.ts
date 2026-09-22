import { supabase } from "../db/supabaseClient";

export interface MatriculaRow {
  id_programa: number;
  id_aluno: number;
  status_conclusao: number;
  data_ingresso: string;
}

export interface CreateMatriculaData {
  id_programa: number;
  id_aluno: number;
  status_conclusao: number;
  data_ingresso: string;
}

/** SELECT * FROM matricula ORDER BY data_ingresso DESC. */
export async function findAll(): Promise<MatriculaRow[]> {
  const { data, error } = await supabase
    .from("matricula")
    .select("*")
    .order("data_ingresso", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM matricula WHERE id_aluno = id_aluno ORDER BY data_ingresso DESC. */
export async function findByAluno(id_aluno: number): Promise<MatriculaRow[]> {
  const { data, error } = await supabase
    .from("matricula")
    .select("*")
    .eq("id_aluno", id_aluno)
    .order("data_ingresso", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM matricula WHERE id_programa = id_programa. */
export async function findByPrograma(
  id_programa: number,
): Promise<MatriculaRow[]> {
  const { data, error } = await supabase
    .from("matricula")
    .select("*")
    .eq("id_programa", id_programa);
  if (error) throw error;
  return data ?? [];
}

/**
 * SELECT * FROM matricula WHERE id_programa = id_programa AND id_aluno = id_aluno.
 * Usado para verificar duplicata e buscar por chave composta. Retorna null se não encontrada.
 */
export async function findOne(
  id_programa: number,
  id_aluno: number,
): Promise<MatriculaRow | null> {
  const { data, error } = await supabase
    .from("matricula")
    .select("*")
    .eq("id_programa", id_programa)
    .eq("id_aluno", id_aluno)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/** INSERT INTO matricula. Retorna a linha criada. */
export async function create(data: CreateMatriculaData): Promise<MatriculaRow> {
  const { data: result, error } = await supabase
    .from("matricula")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * UPDATE matricula WHERE id_programa = id_programa AND id_aluno = id_aluno.
 * Aceita apenas status_conclusao e data_ingresso. Retorna null se não encontrada.
 */
export async function update(
  id_programa: number,
  id_aluno: number,
  data: Partial<Pick<MatriculaRow, "status_conclusao" | "data_ingresso">>,
): Promise<MatriculaRow | null> {
  const { data: result, error } = await supabase
    .from("matricula")
    .update(data)
    .eq("id_programa", id_programa)
    .eq("id_aluno", id_aluno)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return result ?? null;
}

/**
 * DELETE FROM matricula WHERE id_programa = id_programa AND id_aluno = id_aluno.
 * Retorna true se removida.
 */
export async function remove(
  id_programa: number,
  id_aluno: number,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("matricula")
    .delete({ count: "exact" })
    .eq("id_programa", id_programa)
    .eq("id_aluno", id_aluno);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * DELETE FROM matricula WHERE id_aluno = id_aluno.
 * Remove todos os vínculos de programa do aluno — usado ao torná-lo ex-aluno,
 * já que um ex-aluno não deve permanecer associado a nenhum programa.
 * Retorna a quantidade de matrículas removidas.
 */
export async function removeByAluno(id_aluno: number): Promise<number> {
  const { error, count } = await supabase
    .from("matricula")
    .delete({ count: "exact" })
    .eq("id_aluno", id_aluno);
  if (error) throw error;
  return count ?? 0;
}
