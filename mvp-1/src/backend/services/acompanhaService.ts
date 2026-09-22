import * as repo from "../repositories/acompanhaRepository";
import { CreateAcompanhaData } from "../repositories/acompanhaRepository";
import { NotFoundError, BadRequestError, ConflictError } from "../errors/AppError";
import { findByIdIncludeInactive as findMentorById } from "../repositories/mentorRepository";
import { findById as findAlunoById } from "../repositories/alunoRepository";
import { findById as findProgramaById } from "../repositories/programaRepository";

/**
 * Cria o vínculo de acompanhamento entre mentor, aluno e programa.
 * Pré-condições: mentor ativo, aluno ativo, programa existente e sem duplicata.
 * @throws {NotFoundError} se mentor, aluno ou programa não forem encontrados
 * @throws {BadRequestError} se mentor ou aluno estiverem inativos
 * @throws {ConflictError} se o vínculo exato já existir
 */
export async function criarAcompanha(data: CreateAcompanhaData) {
  const mentor = await findMentorById(data.id_mentor);
  if (!mentor) {
    throw new NotFoundError(`Mentor com id ${data.id_mentor} nao encontrado`);
  }
  if (!mentor.ativo) {
    throw new BadRequestError("Mentor inativo");
  }

  const aluno = await findAlunoById(data.id_aluno);
  if (!aluno) {
    throw new NotFoundError(`Aluno com id ${data.id_aluno} nao encontrado`);
  }
  if (!aluno.ativo) {
    throw new BadRequestError("Aluno inativo");
  }

  const programa = await findProgramaById(data.id_programa);
  if (!programa) {
    throw new NotFoundError(
      `Programa com id ${data.id_programa} nao encontrado`,
    );
  }

  // Verifica duplicata antes de inserir
  const existente = await repo.findExact(
    data.id_mentor,
    data.id_aluno,
    data.id_programa,
  );
  if (existente) {
    throw new ConflictError(
      "Vinculo entre este mentor, aluno e programa ja existe",
    );
  }

  return repo.create(data);
}

/**
 * Remove o vínculo de acompanhamento pela chave composta.
 * @throws {NotFoundError} se não encontrado
 */
export async function removerAcompanha(
  idMentor: number,
  idAluno: number,
  idPrograma: number,
) {
  const removido = await repo.remove(idMentor, idAluno, idPrograma);
  if (!removido) {
    throw new NotFoundError("Vinculo nao encontrado");
  }
}

/** Lista todos os vínculos de acompanhamento de um aluno. */
export async function listarPorAluno(idAluno: number) {
  return repo.findByAlunoId(idAluno);
}

/** Lista todos os mentorandos de um mentor (com nome, e-mail e programa). */
export async function listarMentorandos(idMentor: number) {
  return repo.findMentorandosByMentorId(idMentor);
}
