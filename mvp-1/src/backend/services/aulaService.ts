import * as repo from '../repositories/aulaRepository';
import { UpdateAulaData } from '../repositories/aulaRepository';
import * as cursoRepo from '../repositories/cursoRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';

/**
 * Lista as aulas de um curso.
 * @throws {NotFoundError} se o curso não existir
 */
export async function listarAulasDoCurso(idCurso: number) {
  const curso = await cursoRepo.findById(idCurso);
  if (!curso) throw new NotFoundError(`Curso com id ${idCurso} não encontrado`);
  return repo.findAllByCurso(idCurso);
}

/** Busca uma aula pelo ID. @throws {NotFoundError} se não encontrada */
export async function buscarAula(id: number) {
  const aula = await repo.findById(id);
  if (!aula) throw new NotFoundError(`Aula com id ${id} não encontrada`);
  return aula;
}

export interface CreateAulaForm {
  numero: number;
  titulo: string;
  data_aula?: string | null;
}

/**
 * Cria uma aula vinculada a um curso (e, por herança, ao programa do curso).
 * @throws {BadRequestError} se número ou título ausentes
 * @throws {NotFoundError} se o curso não existir
 */
export async function criarAula(idCurso: number, data: CreateAulaForm) {
  if (!data.titulo) throw new BadRequestError('Título da aula é obrigatório');
  if (data.numero === undefined || data.numero === null) {
    throw new BadRequestError('Número da aula é obrigatório');
  }

  const curso = await cursoRepo.findById(idCurso);
  if (!curso) throw new NotFoundError(`Curso com id ${idCurso} não encontrado`);

  return repo.create({
    id_curso: idCurso,
    id_programa: curso.id_programa,
    numero: data.numero,
    titulo: data.titulo,
    data_aula: data.data_aula ?? null,
  });
}

/** Atualiza uma aula existente. @throws {NotFoundError} se não encontrada */
export async function atualizarAula(id: number, data: UpdateAulaData) {
  const aula = await repo.update(id, data);
  if (!aula) throw new NotFoundError(`Aula com id ${id} não encontrada`);
  return aula;
}

/** Remove uma aula (cascateia para presenças). @throws {NotFoundError} se não encontrada */
export async function deletarAula(id: number) {
  const removida = await repo.remove(id);
  if (!removida) throw new NotFoundError(`Aula com id ${id} não encontrada`);
}
