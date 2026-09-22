import { supabase } from '../db/supabaseClient';

export interface RegistroPresenca {
  id_aluno: number;
  id_aula: number;
  status: 'presente' | 'ausente';
}

// PGRST205 = tabela não encontrada no schema cache (migration pendente)
const TABLE_MISSING_CODE = 'PGRST205';

/**
 * SELECT id_aula, status FROM presenca WHERE id_aluno = id_aluno ORDER BY id_aula.
 * Retorna array vazio silenciosamente se a tabela ainda não existir (migration 004 pendente).
 */
export async function findByAluno(id_aluno: number): Promise<{ id_aula: number; status: string }[]> {
  const { data, error } = await supabase
    .from('presenca')
    .select('id_aula, status')
    .eq('id_aluno', id_aluno)
    .order('id_aula');
  if (error) {
    // Tabela ainda não existe (migration pendente) — retorna vazio em vez de 500
    if (error.code === TABLE_MISSING_CODE) return [];
    throw error;
  }
  return data ?? [];
}

/**
 * UPSERT em presenca com chave de conflito (id_aluno, id_aula).
 * Permite salvar ou atualizar múltiplos registros em uma só operação.
 * Lança erro com mensagem orientada ao desenvolvedor se a tabela não existir.
 */
export async function upsertMany(registros: RegistroPresenca[]): Promise<void> {
  if (registros.length === 0) return;
  const { error } = await supabase
    .from('presenca')
    .upsert(registros, { onConflict: 'id_aluno,id_aula' });
  if (error) {
    if (error.code === TABLE_MISSING_CODE) {
      throw new Error(
        'A tabela de frequência ainda não existe no banco de dados. ' +
        'Execute a migration 004 no Supabase Dashboard para habilitar este recurso.',
      );
    }
    throw error;
  }
}
