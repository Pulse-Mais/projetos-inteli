import { supabase } from "../db/supabaseClient";

export interface GerenciaRow {
  id_coordenador: number;
  id_programa: number;
}

export interface CreateGerenciaData {
  id_coordenador: number;
  id_programa: number;
}

/** SELECT * FROM gerencia. */
export async function findAll(): Promise<GerenciaRow[]> {
  const { data, error } = await supabase.from("gerencia").select("*");
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM gerencia WHERE id_programa = id_programa. */
export async function findByPrograma(
  id_programa: number,
): Promise<GerenciaRow[]> {
  const { data, error } = await supabase
    .from("gerencia")
    .select("*")
    .eq("id_programa", id_programa);
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM gerencia WHERE id_coordenador = id_coordenador. */
export async function findByCoordenador(
  id_coordenador: number,
): Promise<GerenciaRow[]> {
  const { data, error } = await supabase
    .from("gerencia")
    .select("*")
    .eq("id_coordenador", id_coordenador);
  if (error) throw error;
  return data ?? [];
}

/**
 * SELECT * FROM gerencia WHERE id_coordenador = id_coordenador AND id_programa = id_programa.
 * Usado para verificar duplicata antes de criar. Retorna null se não encontrado.
 */
export async function findOne(
  id_coordenador: number,
  id_programa: number,
): Promise<GerenciaRow | null> {
  const { data, error } = await supabase
    .from("gerencia")
    .select("*")
    .eq("id_coordenador", id_coordenador)
    .eq("id_programa", id_programa)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/** INSERT INTO gerencia. Retorna a linha criada. */
export async function create(data: CreateGerenciaData): Promise<GerenciaRow> {
  const { data: result, error } = await supabase
    .from("gerencia")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * DELETE FROM gerencia WHERE id_coordenador = id_coordenador AND id_programa = id_programa.
 * Retorna true se removido.
 */
export async function remove(
  id_coordenador: number,
  id_programa: number,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("gerencia")
    .delete({ count: "exact" })
    .eq("id_coordenador", id_coordenador)
    .eq("id_programa", id_programa);
  if (error) throw error;
  return (count ?? 0) > 0;
}
