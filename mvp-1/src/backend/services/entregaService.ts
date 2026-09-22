import * as repo from '../repositories/entregaRepository';
import { CreateEntregaData } from '../repositories/entregaRepository';
import { findById as findAlunoById } from '../repositories/alunoRepository';
import { BadRequestError, NotFoundError } from '../errors/AppError';

/**
 * Valida que o aluno existe e está ativo.
 * @throws {NotFoundError} se não encontrado
 */
async function validarAluno(id_aluno: number) {
  const aluno = await findAlunoById(id_aluno);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id_aluno} não encontrado`);
  return aluno;
}

/**
 * RN04 — valida que a data de entrega não é futura.
 * @throws {BadRequestError} se a data for posterior à data atual
 */
function validarDataEntrega(data_entrega: string) {
  const dataEntrega = new Date(data_entrega);
  const hoje = new Date();
  // zera a hora para comparar apenas a data
  hoje.setHours(23, 59, 59, 999);
  if (dataEntrega > hoje) {
    throw new BadRequestError(
      'A data de entrega não pode ser futura (RN04)'
    );
  }
}

/**
 * Lista todas as entregas de um aluno.
 * @throws {NotFoundError} se o aluno não for encontrado
 */
export async function listarEntregas(id_aluno: number) {
  await validarAluno(id_aluno);
  return repo.findAllByAluno(id_aluno);
}

/**
 * Registra a entrega de uma atividade por um aluno.
 * RN04: `data_entrega` não pode ser futura.
 * @throws {NotFoundError} se o aluno não for encontrado
 * @throws {BadRequestError} se a data for futura
 */
export async function registrarEntrega(data: CreateEntregaData) {
  await validarAluno(data.id_aluno);
  validarDataEntrega(data.data_entrega);
  return repo.create(data);
}

/**
 * Atualiza uma entrega existente.
 * RN04: se `data_entrega` for enviada, não pode ser futura.
 * @throws {NotFoundError} se o aluno ou a entrega não forem encontrados
 */
export async function atualizarEntrega(
  id_aluno: number,
  id_atividade: number,
  data: Parameters<typeof repo.update>[2]
) {
  await validarAluno(id_aluno);

  if (data.data_entrega !== undefined) {
    validarDataEntrega(data.data_entrega);
  }

  const entrega = await repo.update(id_aluno, id_atividade, data);
  if (!entrega) {
    throw new NotFoundError(
      `Entrega do aluno ${id_aluno} para atividade ${id_atividade} não encontrada`
    );
  }
  return entrega;
}

/**
 * Remove uma entrega pela chave composta (aluno + atividade).
 * @throws {NotFoundError} se o aluno ou a entrega não forem encontrados
 */
export async function removerEntrega(id_aluno: number, id_atividade: number) {
  await validarAluno(id_aluno);
  const removida = await repo.remove(id_aluno, id_atividade);
  if (!removida) {
    throw new NotFoundError(
      `Entrega do aluno ${id_aluno} para atividade ${id_atividade} não encontrada`
    );
  }
}
