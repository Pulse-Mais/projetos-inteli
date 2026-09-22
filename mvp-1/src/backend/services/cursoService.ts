import * as repo from '../repositories/cursoRepository';
import { CreateCursoData, UpdateCursoData } from '../repositories/cursoRepository';
import * as programaRepo from '../repositories/programaRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';

/**
 * Lista os cursos de um programa.
 * @throws {NotFoundError} se o programa não existir
 */
export async function listarCursosDoPrograma(idPrograma: number) {
  const programa = await programaRepo.findById(idPrograma);
  if (!programa) throw new NotFoundError(`Programa com id ${idPrograma} não encontrado`);
  return repo.findAllByPrograma(idPrograma);
}

/** Busca um curso pelo ID. @throws {NotFoundError} se não encontrado */
export async function buscarCurso(id: number) {
  const curso = await repo.findById(id);
  if (!curso) throw new NotFoundError(`Curso com id ${id} não encontrado`);
  return curso;
}

/**
 * Cria um curso vinculado a um programa.
 * @throws {BadRequestError} se título ausente
 * @throws {NotFoundError} se o programa não existir
 */
export async function criarCurso(idPrograma: number, data: Omit<CreateCursoData, 'id_programa'>) {
  if (!data.titulo) throw new BadRequestError('Título do curso é obrigatório');

  const programa = await programaRepo.findById(idPrograma);
  if (!programa) throw new NotFoundError(`Programa com id ${idPrograma} não encontrado`);

  return repo.create({ id_programa: idPrograma, titulo: data.titulo, ordem: data.ordem });
}

/** Atualiza um curso existente. @throws {NotFoundError} se não encontrado */
export async function atualizarCurso(id: number, data: UpdateCursoData) {
  const curso = await repo.update(id, data);
  if (!curso) throw new NotFoundError(`Curso com id ${id} não encontrado`);
  return curso;
}

/** Remove um curso (cascateia para aulas e presenças). @throws {NotFoundError} se não encontrado */
export async function deletarCurso(id: number) {
  const removido = await repo.remove(id);
  if (!removido) throw new NotFoundError(`Curso com id ${id} não encontrado`);
}
