import * as repo from '../repositories/programaRepository';
import { CreateProgramaData } from '../repositories/programaRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';

/** Lista todos os programas sem filtro. */
export async function listarProgramas() {
  return repo.findAll();
}

/**
 * Busca um programa pelo ID.
 * @throws {NotFoundError} se não encontrado
 */
export async function buscarPrograma(id: number) {
  const programa = await repo.findById(id);
  if (!programa) throw new NotFoundError(`Programa com id ${id} não encontrado`);
  return programa;
}

/**
 * Valida que a data de fim é igual ou posterior à data de início.
 * @throws {BadRequestError} se o período for inválido
 */
function validarPeriodo(inicio: string, fim: string) {
  if (new Date(fim) < new Date(inicio)) {
    throw new BadRequestError('A data de fim deve ser igual ou posterior à data de início');
  }
}

/**
 * Cria um novo programa.
 * Validação: data de fim deve ser >= data de início.
 */
export async function criarPrograma(data: CreateProgramaData) {
  validarPeriodo(data.inicio, data.fim);
  return repo.create(data);
}

/**
 * Atualiza um programa existente.
 * Mescla os valores atuais com os enviados antes de revalidar o período,
 * para que uma atualização parcial (só `fim`, por exemplo) use o `inicio` atual.
 * @throws {NotFoundError} se não encontrado
 * @throws {BadRequestError} se o período resultante for inválido
 */
export async function atualizarPrograma(
  id: number,
  data: Parameters<typeof repo.update>[1]
) {
  const programaAtual = await repo.findById(id);
  if (!programaAtual) throw new NotFoundError(`Programa com id ${id} não encontrado`);

  // Validar período com valores mesclados
  const inicio = data.inicio ?? programaAtual.inicio;
  const fim = data.fim ?? programaAtual.fim;
  validarPeriodo(inicio, fim);

  const programa = await repo.update(id, data);
  if (!programa) throw new NotFoundError(`Programa com id ${id} não encontrado`);
  return programa;
}

/**
 * Remove um programa.
 * @throws {NotFoundError} se não encontrado
 */
export async function deletarPrograma(id: number) {
  const removido = await repo.remove(id);
  if (!removido) throw new NotFoundError(`Programa com id ${id} não encontrado`);
}
