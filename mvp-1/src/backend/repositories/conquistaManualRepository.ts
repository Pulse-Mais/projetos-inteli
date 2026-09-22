import { supabase } from '../db/supabaseClient';

export interface ConquistaManual {
  id_conquista: number;
  id_aluno: number;
  titulo: string;
  categoria: string;
  data: string;
  descricao: string | null;
  arquivo_url: string | null;
}

export interface CreateConquistaManualData {
  id_aluno: number;
  titulo: string;
  categoria: string;
  data: string;
  descricao?: string | null;
  arquivo_url?: string | null;
}

/** SELECT * FROM conquista_manual WHERE id_aluno = idAluno ORDER BY data DESC. */
export async function findAllByAluno(idAluno: number): Promise<ConquistaManual[]> {
  const { data, error } = await supabase
    .from('conquista_manual')
    .select('*')
    .eq('id_aluno', idAluno)
    .order('data', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** INSERT INTO conquista_manual. Retorna a linha criada. */
export async function create(data: CreateConquistaManualData): Promise<ConquistaManual> {
  const { data: result, error } = await supabase
    .from('conquista_manual')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * DELETE FROM conquista_manual WHERE id_conquista = ? AND id_aluno = ?.
 * Filtra também por id_aluno para impedir que um id de outro aluno seja removido por engano.
 * Retorna true se a linha existia e foi removida.
 */
export async function remove(idConquista: number, idAluno: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('conquista_manual')
    .delete({ count: 'exact' })
    .eq('id_conquista', idConquista)
    .eq('id_aluno', idAluno);
  if (error) throw error;
  return (count ?? 0) > 0;
}
