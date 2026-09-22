import { supabase } from '../db/supabaseClient';

export interface Oportunidade {
  id_oportunidade: number;
  titulo: string;
  empresa: string;
  tipo: string;
  modalidade: string;
  cidade: string | null;
  descricao: string | null;
  nivel: string | null;
  prazo: string;
}

export interface OportunidadeFiltros {
  tipo?: string;
  busca?: string;
}

/**
 * SELECT campos FROM oportunidade WHERE ativo = true ORDER BY prazo ASC.
 * Filtros opcionais:
 * - `tipo`: match exato na coluna tipo (Vaga, Evento, Estágio, Bolsa de Estudo)
 * - `busca`: busca parcial case-insensitive em titulo OR empresa (OR lógico do PostgREST)
 */
export async function findAll(filtros: OportunidadeFiltros = {}): Promise<Oportunidade[]> {
  let query = supabase
    .from('oportunidade')
    .select('id_oportunidade, titulo, empresa, tipo, modalidade, cidade, descricao, nivel, prazo')
    .eq('ativo', true)
    .order('prazo', { ascending: true });

  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }

  if (filtros.busca) {
    query = query.or(`titulo.ilike.%${filtros.busca}%,empresa.ilike.%${filtros.busca}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function create(data: Omit<Oportunidade, 'id_oportunidade'>): Promise<Oportunidade> {
  const { data: result, error } = await supabase
    .from('oportunidade')
    .insert({ ...data, ativo: true })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function update(id: number, data: Partial<Oportunidade>): Promise<Oportunidade | null> {
  const { data: result, error } = await supabase
    .from('oportunidade')
    .update(data)
    .eq('id_oportunidade', id)
    .select()
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return result ?? null;
}

export async function remove(id: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('oportunidade')
    .update({ ativo: false })
    .eq('id_oportunidade', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
