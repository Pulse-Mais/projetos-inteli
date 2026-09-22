import { supabase } from "../db/supabaseClient";

export interface MentorRow {
  id_usuario: number;
  tipo_vinculo: string;
  disponibilidade: string;
  especialidade: string | null;
  ativo: boolean;
  id_coordenador: number;
  // Preenchido apenas por `findAll` (JOIN com a tabela `usuario`); opcional para
  // não quebrar os demais métodos que selecionam apenas a tabela `mentor`.
  nome?: string;
}

export interface CreateMentorData {
  id_usuario: number;
  tipo_vinculo: string;
  disponibilidade: string;
  id_coordenador: number;
  especialidade?: string | null;
  ativo?: boolean;
}

/**
 * SELECT mentor.*, usuario(nome) FROM mentor WHERE ativo = true ORDER BY id_usuario.
 * Faz JOIN com `usuario` para incluir o nome do mentor (usado, por exemplo, no
 * dropdown de vínculo de mentor no cadastro de aluno). O campo `nome` é achatado
 * no objeto retornado; o aninhamento `usuario` é removido.
 */
export async function findAll(): Promise<MentorRow[]> {
  const { data, error } = await supabase
    .from("mentor")
    .select("*, usuario(nome)")
    .eq("ativo", true)
    .order("id_usuario");
  if (error) throw error;
  return (data ?? []).map((row: any) => {
    // PostgREST pode devolver a relação como objeto ou array, dependendo da
    // cardinalidade inferida; normalizamos ambos os casos.
    const usuario = Array.isArray(row.usuario) ? row.usuario[0] : row.usuario;
    const { usuario: _omit, ...mentor } = row;
    return { ...mentor, nome: usuario?.nome };
  });
}

/** SELECT * FROM mentor WHERE id_usuario = id AND ativo = true. Retorna null se não encontrado ou inativo. */
export async function findById(id: number): Promise<MentorRow | null> {
  const { data, error } = await supabase
    .from("mentor")
    .select("*")
    .eq("id_usuario", id)
    .eq("ativo", true)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/**
 * SELECT * FROM mentor WHERE id_usuario = id (sem filtro de ativo).
 * Usado para validações que devem incluir mentores inativos, como histórico de mentorias.
 */
export async function findByIdIncludeInactive(
  id: number,
): Promise<MentorRow | null> {
  const { data, error } = await supabase
    .from("mentor")
    .select("*")
    .eq("id_usuario", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/** INSERT INTO mentor com ativo=true como padrão. Retorna a linha criada. */
export async function create(data: CreateMentorData): Promise<MentorRow> {
  const { data: result, error } = await supabase
    .from("mentor")
    .insert({ ...data, ativo: data.ativo ?? true })
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE mentor WHERE id_usuario = id. Retorna null se não encontrado. */
export async function update(
  id: number,
  data: Partial<Omit<MentorRow, "id_usuario">>,
): Promise<MentorRow | null> {
  const { data: result, error } = await supabase
    .from("mentor")
    .update(data)
    .eq("id_usuario", id)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return result ?? null;
}

/**
 * UPDATE mentor SET ativo = false WHERE id_usuario = id (RN13 — inativação lógica).
 * Retorna true se a linha foi afetada.
 */
export async function inactivate(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from("mentor")
    .update({ ativo: false }, { count: "exact" })
    .eq("id_usuario", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
