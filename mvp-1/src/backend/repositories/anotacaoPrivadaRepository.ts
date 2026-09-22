import { supabase } from "../db/supabaseClient";

export interface AnotacaoPrivadaRow {
  id_mentor: number;
  id_aluno: number;
  data_registro: string;
  conteudo_texto: string;
}

export interface CreateAnotacaoData {
  id_mentor: number;
  id_aluno: number;
  conteudo_texto: string;
}

/**
 * SELECT * FROM anotacao_privada WHERE id_aluno = id_aluno AND id_mentor = id_mentor ORDER BY data_registro DESC.
 * RN13: visão do mentor — retorna apenas suas próprias anotações sobre o aluno.
 */
export async function findByAlunoAndMentor(
  id_aluno: number,
  id_mentor: number,
): Promise<AnotacaoPrivadaRow[]> {
  const { data, error } = await supabase
    .from("anotacao_privada")
    .select("*")
    .eq("id_aluno", id_aluno)
    .eq("id_mentor", id_mentor)
    .order("data_registro", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * SELECT * FROM anotacao_privada WHERE id_aluno = id_aluno ORDER BY data_registro DESC.
 * RN13: visão do coordenador — retorna anotações de todos os mentores sobre o aluno.
 */
export async function findByAluno(
  id_aluno: number,
): Promise<AnotacaoPrivadaRow[]> {
  const { data, error } = await supabase
    .from("anotacao_privada")
    .select("*")
    .eq("id_aluno", id_aluno)
    .order("data_registro", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM anotacao_privada WHERE id_mentor = id_mentor ORDER BY data_registro DESC. */
export async function findByMentor(
  id_mentor: number,
): Promise<AnotacaoPrivadaRow[]> {
  const { data, error } = await supabase
    .from("anotacao_privada")
    .select("*")
    .eq("id_mentor", id_mentor)
    .order("data_registro", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** INSERT INTO anotacao_privada. O banco define data_registro automaticamente. Retorna a linha criada. */
export async function create(
  data: CreateAnotacaoData,
): Promise<AnotacaoPrivadaRow> {
  const { data: result, error } = await supabase
    .from("anotacao_privada")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * DELETE FROM anotacao_privada WHERE id_mentor = id_mentor AND id_aluno = id_aluno AND data_registro = data_registro.
 * A chave composta garante que apenas o autor (mentor) de uma anotação específica seja removido.
 * Retorna true se removida.
 */
export async function remove(
  id_mentor: number,
  id_aluno: number,
  data_registro: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("anotacao_privada")
    .delete({ count: "exact" })
    .eq("id_mentor", id_mentor)
    .eq("id_aluno", id_aluno)
    .eq("data_registro", data_registro);
  if (error) throw error;
  return (count ?? 0) > 0;
}
