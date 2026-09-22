import { supabase } from '../db/supabaseClient';

export interface Evento {
  id_evento: number;
  nome: string;
  data: string;
  local: string;
}

export interface CreateEventoData {
  nome: string;
  data: string;
  local: string;
}

/** SELECT * FROM evento ORDER BY id_evento. */
export async function findAll(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('evento')
    .select('*')
    .order('id_evento');
  if (error) throw error;
  return data ?? [];
}

/** SELECT * FROM evento WHERE id_evento = id. Retorna null se não encontrado. */
export async function findById(id: number): Promise<Evento | null> {
  const { data, error } = await supabase
    .from('evento')
    .select('*')
    .eq('id_evento', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

/** INSERT INTO evento. Retorna a linha criada. */
export async function create(data: CreateEventoData): Promise<Evento> {
  const { data: result, error } = await supabase
    .from('evento')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** UPDATE evento WHERE id_evento = id. Retorna null se não encontrado. */
export async function update(
  id: number,
  data: Partial<Omit<Evento, 'id_evento'>>
): Promise<Evento | null> {
  const { data: result, error } = await supabase
    .from('evento')
    .update(data)
    .eq('id_evento', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

/** DELETE FROM evento WHERE id_evento = id. Retorna true se removido. */
export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('evento')
    .delete({ count: 'exact' })
    .eq('id_evento', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
