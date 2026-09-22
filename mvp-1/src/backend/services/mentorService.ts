import * as repo from "../repositories/mentorRepository";
import { CreateMentorData } from "../repositories/mentorRepository";
import { NotFoundError } from "../errors/AppError";
import * as acompanhaRepo from "../repositories/acompanhaRepository";

/** Lista todos os mentores ativos. */
export async function listarMentores() {
  return repo.findAll();
}

/**
 * Busca um mentor ativo pelo ID.
 * @throws {NotFoundError} se não encontrado ou inativo
 */
export async function buscarMentor(id: number) {
  const mentor = await repo.findById(id);
  if (!mentor) throw new NotFoundError(`Mentor com id ${id} não encontrado`);
  return mentor;
}

/** Cria um novo mentor. */
export async function criarMentor(data: CreateMentorData) {
  return repo.create(data);
}

/**
 * Atualiza dados de um mentor.
 * @throws {NotFoundError} se não encontrado
 */
export async function atualizarMentor(
  id: number,
  data: Parameters<typeof repo.update>[1],
) {
  const mentor = await repo.findById(id);
  if (!mentor) throw new NotFoundError(`Mentor com id ${id} não encontrado`);
  const atualizado = await repo.update(id, data);
  if (!atualizado)
    throw new NotFoundError(`Mentor com id ${id} não encontrado`);
  return atualizado;
}

/**
 * Inativa logicamente um mentor (RN13).
 * Seta ativo=false; o mentor não é excluído fisicamente.
 * @throws {NotFoundError} se não encontrado
 */
export async function inativarMentor(id: number) {
  const mentor = await repo.findByIdIncludeInactive(id);
  if (!mentor) throw new NotFoundError(`Mentor com id ${id} não encontrado`);
  const inativado = await repo.inactivate(id);
  if (!inativado) throw new NotFoundError(`Mentor com id ${id} não encontrado`);
}

/**
 * Lista os mentorandos (alunos vinculados) de um mentor.
 * @throws {NotFoundError} se o mentor não estiver ativo
 */
export async function listarMentorandos(id: number) {
  const mentor = await repo.findById(id);
  if (!mentor) throw new NotFoundError(`Mentor com id ${id} não encontrado`);
  return acompanhaRepo.findMentorandosByMentorId(id);
}

/**
 * Lista as mentorias realizadas por um mentor, com filtro opcional por mês.
 * Inclui mentores inativos para preservar histórico.
 * Retorna array vazio se o mentor não existir (sem lançar 404).
 * @param mes - formato YYYY-MM; sem ele, retorna todas as mentorias
 */
export async function listarMentoriasByMentor(id: number, mes?: string) {
  const mentor = await repo.findByIdIncludeInactive(id);
  if (!mentor) return [];
  const { findByMentor } = await import("../repositories/mentoriaRepository");
  return findByMentor(id, mes);
}
