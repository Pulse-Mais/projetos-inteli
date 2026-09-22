import * as indicadorRepo from '../repositories/indicadorRepository';
import * as programaRepo from '../repositories/programaRepository';
import { CreateIndicadorData } from '../repositories/indicadorRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

/** Lista todos os indicadores sem filtro. */
export async function listarIndicadores() {
  return indicadorRepo.findAll();
}

/**
 * Busca um indicador pelo ID.
 * @throws {NotFoundError} se não encontrado
 */
export async function buscarIndicador(id: number) {
  const indicador = await indicadorRepo.findById(id);

  if (!indicador) {
    throw new NotFoundError(`Indicador com id ${id} não encontrado`);
  }

  return indicador;
}

/**
 * Cria um novo indicador vinculado a um programa.
 * Validação: programa informado em `id_programa` deve existir.
 * @throws {BadRequestError} se o programa não existir
 */
export async function criarIndicador(data: CreateIndicadorData) {
  const programa = await programaRepo.findById(data.id_programa);

  if (!programa) {
    throw new BadRequestError('Programa informado não existe');
  }

  return indicadorRepo.create(data);
}

/**
 * Atualiza um indicador existente.
 * Se `id_programa` for alterado, revalida que o programa existe.
 * @throws {NotFoundError} se não encontrado
 * @throws {BadRequestError} se o novo programa não existir
 */
export async function atualizarIndicador(
  id: number,
  data: Parameters<typeof indicadorRepo.update>[1]
) {
  const indicadorAtual = await indicadorRepo.findById(id);

  if (!indicadorAtual) {
    throw new NotFoundError(`Indicador com id ${id} não encontrado`);
  }

  if (data.id_programa !== undefined) {
    const programa = await programaRepo.findById(data.id_programa);

    if (!programa) {
      throw new BadRequestError('Programa informado não existe');
    }
  }

  const indicador = await indicadorRepo.update(id, data);

  if (!indicador) {
    throw new NotFoundError(`Indicador com id ${id} não encontrado`);
  }

  return indicador;
}

/**
 * Remove um indicador.
 * @throws {NotFoundError} se não encontrado
 */
export async function deletarIndicador(id: number) {
  const removido = await indicadorRepo.remove(id);

  if (!removido) {
    throw new NotFoundError(`Indicador com id ${id} não encontrado`);
  }
}
