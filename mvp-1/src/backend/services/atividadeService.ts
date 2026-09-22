import * as repo from '../repositories/atividadeRepository';
import { CreateAtividadeData } from '../repositories/atividadeRepository';
import { findById as findProgramaById } from '../repositories/programaRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

/** Lista todas as atividades sem filtro. */
export async function listarAtividades() {
  return repo.findAll();
}

/**
 * Busca uma atividade pelo ID.
 * @throws {NotFoundError} se não encontrada
 */
export async function buscarAtividade(id: number) {
  const atividade = await repo.findById(id);
  if (!atividade) throw new NotFoundError(`Atividade com id ${id} não encontrada`);
  return atividade;
}

/**
 * RN03 — valida que o programa referenciado existe antes de criar ou atualizar a atividade.
 * @throws {BadRequestError} se o programa não existir
 */
async function validarPrograma(id_programa: number) {
  const programa = await findProgramaById(id_programa);
  if (!programa) {
    throw new BadRequestError(`Programa com id ${id_programa} não encontrado (RN03)`);
  }
}

/**
 * Cria uma nova atividade.
 * RN03: valida que o programa existe antes de inserir.
 */
export async function criarAtividade(data: CreateAtividadeData) {
  await validarPrograma(data.id_programa);
  return repo.create(data);
}

/**
 * Atualiza uma atividade existente.
 * RN03: se `id_programa` for alterado, revalida que o programa existe.
 * @throws {NotFoundError} se a atividade não for encontrada
 */
export async function atualizarAtividade(
  id: number,
  data: Parameters<typeof repo.update>[1]
) {
  const atividadeAtual = await repo.findById(id);
  if (!atividadeAtual) throw new NotFoundError(`Atividade com id ${id} não encontrada`);

  // Se id_programa está sendo alterado, revalidar RN03
  if (data.id_programa !== undefined) {
    await validarPrograma(data.id_programa);
  }

  const atualizada = await repo.update(id, data);
  if (!atualizada) throw new NotFoundError(`Atividade com id ${id} não encontrada`);
  return atualizada;
}

/**
 * Remove uma atividade.
 * @throws {NotFoundError} se não encontrada
 */
export async function deletarAtividade(id: number) {
  const removida = await repo.remove(id);
  if (!removida) throw new NotFoundError(`Atividade com id ${id} não encontrada`);
}
