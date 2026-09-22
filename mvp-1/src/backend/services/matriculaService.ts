import * as repo from "../repositories/matriculaRepository";
import { CreateMatriculaData } from "../repositories/matriculaRepository";
import { NotFoundError, ConflictError } from "../errors/AppError";

/** Lista todas as matrículas ordenadas por data de ingresso decrescente. */
export async function listarMatriculas() {
  return repo.findAll();
}

/** Lista matrículas de um aluno específico. */
export async function listarPorAluno(id_aluno: number) {
  return repo.findByAluno(id_aluno);
}

/** Lista matrículas de um programa específico. */
export async function listarPorPrograma(id_programa: number) {
  return repo.findByPrograma(id_programa);
}

/**
 * Busca uma matrícula pela chave composta (programa + aluno).
 * @throws {NotFoundError} se não encontrada
 */
export async function buscarMatricula(id_programa: number, id_aluno: number) {
  const matricula = await repo.findOne(id_programa, id_aluno);
  if (!matricula)
    throw new NotFoundError(
      `Matrícula do aluno ${id_aluno} no programa ${id_programa} não encontrada`,
    );
  return matricula;
}

/**
 * Cria uma matrícula de aluno em programa.
 * Impede matrícula duplicada no mesmo programa.
 * @throws {ConflictError} se o aluno já estiver matriculado no programa
 */
export async function criarMatricula(data: CreateMatriculaData) {
  // Impede matrícula duplicada no mesmo programa
  const existente = await repo.findOne(data.id_programa, data.id_aluno);
  if (existente)
    throw new ConflictError(
      `Aluno ${data.id_aluno} já está matriculado no programa ${data.id_programa}`,
    );
  return repo.create(data);
}

/**
 * Atualiza status_conclusao ou data_ingresso de uma matrícula.
 * @throws {NotFoundError} se não encontrada
 */
export async function atualizarMatricula(
  id_programa: number,
  id_aluno: number,
  data: Parameters<typeof repo.update>[2],
) {
  const matricula = await repo.findOne(id_programa, id_aluno);
  if (!matricula)
    throw new NotFoundError(
      `Matrícula do aluno ${id_aluno} no programa ${id_programa} não encontrada`,
    );
  const atualizada = await repo.update(id_programa, id_aluno, data);
  if (!atualizada)
    throw new NotFoundError(
      `Matrícula do aluno ${id_aluno} no programa ${id_programa} não encontrada`,
    );
  return atualizada;
}

/**
 * Remove uma matrícula pela chave composta.
 * @throws {NotFoundError} se não encontrada
 */
export async function deletarMatricula(id_programa: number, id_aluno: number) {
  const removida = await repo.remove(id_programa, id_aluno);
  if (!removida)
    throw new NotFoundError(
      `Matrícula do aluno ${id_aluno} no programa ${id_programa} não encontrada`,
    );
}
