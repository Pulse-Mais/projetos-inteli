import { supabase } from "../db/supabaseClient";

export interface Mentoria {
  id_mentoria: number;
  formato: string;
  tema: string;
  duracao: number;
  data: string;
  // Campos do relatório de mentoria, preenchidos pelas telas do mentor.
  // Opcionais: agendamentos sem relatório os deixam nulos.
  relatorio?: string | null;
  encaminhamentos?: string | null;
  observacoes?: string | null;
  realizada?: boolean | null;
}

export interface CreateMentoriaData {
  formato: string;
  tema: string;
  duracao: number;
  data: string;
  relatorio?: string | null;
  encaminhamentos?: string | null;
  observacoes?: string | null;
}

export interface Realiza {
  id_mentor: number;
  id_mentoria: number;
}

export interface ParticipaMentoria {
  id_mentoria: number;
  id_aluno: number;
}

/** SELECT * FROM mentoria ORDER BY id_mentoria. */
export async function findAll(): Promise<Mentoria[]> {
  const { data, error } = await supabase
    .from("mentoria")
    .select("*")
    .order("id_mentoria");
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM mentoria WHERE id_mentoria = id. Retorna null se não encontrada. */
export async function findById(id: number): Promise<Mentoria | null> {
  const { data, error } = await supabase
    .from("mentoria")
    .select("*")
    .eq("id_mentoria", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

/** INSERT INTO mentoria. Retorna a linha criada. */
export async function create(data: CreateMentoriaData): Promise<Mentoria> {
  const { data: result, error } = await supabase
    .from("mentoria")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE mentoria WHERE id_mentoria = id. Retorna null se não encontrada. */
export async function update(
  id: number,
  data: Partial<Omit<Mentoria, "id_mentoria">>,
): Promise<Mentoria | null> {
  const { data: result, error } = await supabase
    .from("mentoria")
    .update(data)
    .eq("id_mentoria", id)
    .select()
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return result ?? null;
}

/** DELETE FROM mentoria WHERE id_mentoria = id. Retorna true se removida. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from("mentoria")
    .delete({ count: "exact" })
    .eq("id_mentoria", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** INSERT INTO realiza (vincula mentor à mentoria). */
export async function createRealiza(data: Realiza): Promise<Realiza> {
  const { data: result, error } = await supabase
    .from("realiza")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * Retorna as mentorias de um mentor com dados do aluno participante.
 * Estratégia em dois passos para evitar nesting excessivo no PostgREST:
 * 1. SELECT id_mentoria FROM realiza WHERE id_mentor = idMentor
 * 2. SELECT mentoria JOIN participa_mentoria JOIN aluno JOIN usuario WHERE id IN (ids)
 * Filtro de mês opcional: aplica gte/lte no campo `data`.
 */
export async function findByMentor(
  idMentor: number,
  mes?: string,
): Promise<any[]> {
  const { data: realizas, error: rError } = await supabase
    .from("realiza")
    .select("id_mentoria")
    .eq("id_mentor", idMentor);
  if (rError) throw rError;
  const ids = (realizas ?? []).map((r: any) => r.id_mentoria);
  if (ids.length === 0) return [];

  let query = supabase
    .from("mentoria")
    .select("*, participa_mentoria(id_aluno, aluno:aluno!inner(usuario!inner(nome)))")
    .in("id_mentoria", ids)
    .order("data", { ascending: true });

  if (mes) {
    const inicio = `${mes}-01T00:00:00`;
    const [ano, m] = mes.split("-").map(Number);
    const ultimoDia = new Date(ano, m, 0).getDate();
    const fim = `${mes}-${String(ultimoDia).padStart(2, "0")}T23:59:59`;
    query = query.gte("data", inicio).lte("data", fim);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((m: any) => {
    const participacoes = m.participa_mentoria ?? [];
    const primeiro = participacoes[0];
    const nomeAluno = primeiro?.aluno?.usuario?.nome ?? null;
    const idAluno = primeiro?.id_aluno ?? null;
    return {
      id_mentoria: m.id_mentoria,
      formato: m.formato,
      tema: m.tema,
      duracao: m.duracao,
      data: m.data,
      realizada: m.realizada ?? null,
      nome_aluno: nomeAluno,
      id_aluno: idAluno,
    };
  });
}

/**
 * Retorna as mentorias de um aluno via JOIN com participa_mentoria.
 * Estratégia em dois passos: busca os IDs em participa_mentoria, depois carrega as mentorias.
 * Ordenado por data descendente.
 */
export async function findByAluno(idAluno: number): Promise<Mentoria[]> {
  const { data: participacoes, error: pError } = await supabase
    .from("participa_mentoria")
    .select("id_mentoria")
    .eq("id_aluno", idAluno);
  if (pError) throw pError;
  const ids = (participacoes ?? []).map((p: any) => p.id_mentoria);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("mentoria")
    .select("*")
    .in("id_mentoria", ids)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Mentoria[];
}

/** INSERT INTO participa_mentoria (vincula aluno à mentoria). */
export async function createParticipaMentoria(
  data: ParticipaMentoria,
): Promise<ParticipaMentoria> {
  const { data: result, error } = await supabase
    .from("participa_mentoria")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}
