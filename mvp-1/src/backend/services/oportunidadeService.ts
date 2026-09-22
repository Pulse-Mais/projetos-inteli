import * as repo from '../repositories/oportunidadeRepository';
import { OportunidadeFiltros, Oportunidade } from '../repositories/oportunidadeRepository';

/**
 * Lista oportunidades ativas com filtros opcionais.
 * `tipo` filtra por categoria exata; `busca` faz busca parcial em título e empresa.
 * Resultado ordenado por prazo ascendente.
 */
export async function listarOportunidades(filtros: OportunidadeFiltros) {
  return repo.findAll(filtros);
}

export async function criarOportunidade(data: Omit<Oportunidade, 'id_oportunidade'>) {
  return repo.create(data);
}

export async function atualizarOportunidade(id: number, data: Partial<Oportunidade>) {
  return repo.update(id, data);
}

export async function removerOportunidade(id: number) {
  return repo.remove(id);
}