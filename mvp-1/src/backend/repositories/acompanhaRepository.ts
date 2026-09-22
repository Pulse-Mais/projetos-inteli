import { supabase } from "../db/supabaseClient";

export interface Acompanha {
  id_mentor: number;
  id_aluno: number;
  id_programa: number;
}

export interface CreateAcompanhaData {
  id_mentor: number;
  id_aluno: number;
  id_programa: number;
}

export interface MentorandoResumo {
  id_usuario: number;
  nome: string;
  email: string;
  id_programa: number;
  programa: string;
  status: "ativo" | "inativo";
}

type UsuarioJoin = {
  nome: string;
  email: string;
};

type AlunoJoin = {
  ativo: boolean;
  usuario: UsuarioJoin | UsuarioJoin[];
};

type ProgramaJoin = {
  titulo: string;
};

interface MentorandoRow {
  id_aluno: number;
  id_programa: number;
  aluno: AlunoJoin | AlunoJoin[] | null;
  programa: ProgramaJoin | ProgramaJoin[] | null;
}

/**
 * SELECT * FROM acompanha WHERE id_mentor = ? AND id_aluno = ? AND id_programa = ? (chave composta exata).
 * Usado para verificar duplicidade antes de criar um novo vínculo.
 * Retorna null se não houver registro.
 */
export async function findExact(
  idMentor: number,
  idAluno: number,
  idPrograma: number,
): Promise<Acompanha | null> {
  const { data, error } = await supabase
    .from("acompanha")
    .select("*")
    .eq("id_mentor", idMentor)
    .eq("id_aluno", idAluno)
    .eq("id_programa", idPrograma)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/**
 * SELECT id_mentor FROM acompanha WHERE id_mentor = ? AND id_aluno = ? LIMIT 1.
 * Ignora o programa — verifica apenas se existe algum vínculo mentor-aluno.
 * Usado pela RN11 para validar pré-condição antes de criar mentoria.
 */
export async function existsVinculo(
  idMentor: number,
  idAluno: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("acompanha")
    .select("id_mentor")
    .eq("id_mentor", idMentor)
    .eq("id_aluno", idAluno)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** INSERT INTO acompanha. Retorna a linha criada com a chave composta (id_mentor, id_aluno, id_programa). */
export async function create(data: CreateAcompanhaData): Promise<Acompanha> {
  const { data: result, error } = await supabase
    .from("acompanha")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result as Acompanha;
}

/**
 * DELETE FROM acompanha WHERE id_mentor = ? AND id_aluno = ? AND id_programa = ?.
 * Retorna true se o vínculo existia e foi removido.
 */
export async function remove(
  idMentor: number,
  idAluno: number,
  idPrograma: number,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("acompanha")
    .delete({ count: "exact" })
    .eq("id_mentor", idMentor)
    .eq("id_aluno", idAluno)
    .eq("id_programa", idPrograma);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** SELECT * FROM acompanha WHERE id_aluno = ? ORDER BY id_programa. Retorna todos os vínculos do aluno. */
export async function findByAlunoId(idAluno: number): Promise<Acompanha[]> {
  const { data, error } = await supabase
    .from("acompanha")
    .select("*")
    .eq("id_aluno", idAluno)
    .order("id_programa");
  if (error) throw error;
  return (data ?? []) as Acompanha[];
}

/**
 * DELETE FROM acompanha WHERE id_aluno = ?.
 * Remove todos os vínculos de mentoria do aluno — usado ao torná-lo ex-aluno,
 * já que cada vínculo referencia um programa do qual o aluno deixou de fazer parte.
 * Retorna a quantidade de vínculos removidos.
 */
export async function removeByAlunoId(idAluno: number): Promise<number> {
  const { error, count } = await supabase
    .from("acompanha")
    .delete({ count: "exact" })
    .eq("id_aluno", idAluno);
  if (error) throw error;
  return count ?? 0;
}

/**
 * SELECT acompanha JOIN aluno!inner JOIN usuario!inner(nome, email) JOIN programa!inner(titulo)
 * WHERE id_mentor = ? ORDER BY id_aluno.
 * Usa INNER JOIN (!) para garantir que só retorna vínculos com aluno e programa cadastrados.
 * Os JOINs aninhados (aluno → usuario e programa) permitem retornar nome, e-mail e título
 * do programa sem consultas adicionais. O mapeamento em memória normaliza arrays vs. objetos
 * retornados pelo PostgREST dependendo do cardinalidade inferida.
 */
export async function findMentorandosByMentorId(
  idMentor: number,
): Promise<MentorandoResumo[]> {
  const { data, error } = await supabase
    .from("acompanha")
    .select("id_aluno, id_programa, aluno!inner(ativo, usuario!inner(nome, email)), programa!inner(titulo)")
    .eq("id_mentor", idMentor)
    .order("id_aluno");
  if (error) throw error;

  const rows = (data ?? []) as MentorandoRow[];
  return rows
    .map((row) => {
      const aluno = Array.isArray(row.aluno) ? row.aluno[0] : row.aluno;
      if (!aluno) return null;
      const usuario = Array.isArray(aluno.usuario)
        ? aluno.usuario[0]
        : aluno.usuario;
      if (!usuario) return null;
      const prog = Array.isArray(row.programa) ? row.programa[0] : row.programa;
      return {
        id_usuario: row.id_aluno,
        nome: usuario.nome,
        email: usuario.email,
        id_programa: row.id_programa,
        programa: prog?.titulo ?? '—',
        status: aluno.ativo === false ? 'inativo' : 'ativo',
      };
    })
    .filter((row): row is MentorandoResumo => row !== null);
}
