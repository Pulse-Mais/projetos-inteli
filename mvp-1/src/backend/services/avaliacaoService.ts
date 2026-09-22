import * as avaliacaoRepo from '../repositories/avaliacaoRepository';
import { CreateAvaliacaoData } from '../repositories/avaliacaoRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

/** Lista todas as avaliações sem filtro. */
export async function listarAvaliacoes() {
  return avaliacaoRepo.findAll();
}

/**
 * Busca uma avaliação pelo ID.
 * @throws {NotFoundError} se não encontrada
 */
export async function buscarAvaliacao(id: number) {
  const avaliacao = await avaliacaoRepo.findById(id);

  if (!avaliacao) {
    throw new NotFoundError(`Avaliação com id ${id} não encontrada`);
  }

  return avaliacao;
}

/**
 * Valida que a nota está no intervalo permitido de 1 a 5.
 * @throws {BadRequestError} se fora do intervalo
 */
function validarNota(nota: number) {
  if (typeof nota !== 'number' || nota < 1 || nota > 5) {
    throw new BadRequestError('A nota deve estar entre 1 e 5');
  }
}

/**
 * Cria uma nova avaliação.
 * Validação: `nota` deve estar entre 1 e 5.
 */
export async function criarAvaliacao(data: CreateAvaliacaoData) {
  validarNota(data.nota);

  return avaliacaoRepo.create(data);
}

/**
 * Atualiza uma avaliação existente.
 * Se `nota` for enviada, revalida que está entre 1 e 5.
 * @throws {NotFoundError} se não encontrada
 */
export async function atualizarAvaliacao(
  id: number,
  data: Parameters<typeof avaliacaoRepo.update>[1]
) {
  const avaliacaoAtual = await avaliacaoRepo.findById(id);

  if (!avaliacaoAtual) {
    throw new NotFoundError(`Avaliação com id ${id} não encontrada`);
  }

  if (data.nota !== undefined) {
    validarNota(data.nota);
  }

  const avaliacao = await avaliacaoRepo.update(id, data);

  if (!avaliacao) {
    throw new NotFoundError(`Avaliação com id ${id} não encontrada`);
  }

  return avaliacao;
}

/**
 * Remove uma avaliação.
 * @throws {NotFoundError} se não encontrada
 */
export async function deletarAvaliacao(id: number) {
  const removido = await avaliacaoRepo.remove(id);

  if (!removido) {
    throw new NotFoundError(`Avaliação com id ${id} não encontrada`);
  }
}
