import { supabase } from "../db/supabaseClient";

export interface ParticipaEventoRow {
  id_evento: number;
  id_aluno: number;
  presenca: boolean;
}

export interface CreateParticipaEventoData {
  id_evento: number;
  id_aluno: number;
  presenca?: boolean;
}

/** SELECT * FROM participa_evento. */
export async function findAll(): Promise<ParticipaEventoRow[]> {
  const { data, error } = await supabase
    .from("participa_evento")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM participa_evento WHERE id_evento = id_evento. */
export async function findByEvento(
  id_evento: number,
): Promise<ParticipaEventoRow[]> {
  const { data, error } = await supabase
    .from("participa_evento")
    .select("*")
    .eq("id_evento", id_evento);
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM participa_evento WHERE id_aluno = id_aluno. */
export async function findByAluno(
  id_aluno: number,
): Promise<ParticipaEventoRow[]> {
  const { data, error } = await supabase
    .from("participa_evento")
    .select("*")
    .eq("id_aluno", id_aluno);
  if (error) throw error;
  return data ?? [];
}

/**
 * SELECT * FROM participa_evento WHERE id_evento = id_evento AND id_aluno = id_aluno.
 * Usado para verificar duplicata e buscar por chave composta. Retorna null se não encontrada.
 */
export async function findOne(
  id_evento: number,
  id_aluno: number,
): Promise<ParticipaEventoRow | null> {
  const { data, error } = await supabase
    .from("participa_evento")
    .select("*")
    .eq("id_evento", id_evento)
    .eq("id_aluno", id_aluno)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/** INSERT INTO participa_evento com presenca=false como padrão. Retorna a linha criada. */
export async function create(
  data: CreateParticipaEventoData,
): Promise<ParticipaEventoRow> {
  const { data: result, error } = await supabase
    .from("participa_evento")
    .insert({ ...data, presenca: data.presenca ?? false })
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * UPDATE participa_evento SET presenca = presenca WHERE id_evento = id_evento AND id_aluno = id_aluno.
 * Usado pelo RF002 para registrar a presença efetiva no evento.
 * Retorna null se não encontrada.
 */
export async function update(
  id_evento: number,
  id_aluno: number,
  presenca: boolean,
): Promise<ParticipaEventoRow | null> {
  const { data: result, error } = await supabase
    .from("participa_evento")
    .update({ presenca })
    .eq("id_evento", id_evento)
    .eq("id_aluno", id_aluno)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return result ?? null;
}

/**
 * DELETE FROM participa_evento WHERE id_evento = id_evento AND id_aluno = id_aluno.
 * Retorna true se removida.
 */
export async function remove(
  id_evento: number,
  id_aluno: number,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("participa_evento")
    .delete({ count: "exact" })
    .eq("id_evento", id_evento)
    .eq("id_aluno", id_aluno);
  if (error) throw error;
  return (count ?? 0) > 0;
}
