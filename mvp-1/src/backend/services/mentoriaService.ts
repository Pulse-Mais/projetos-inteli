import * as repo from "../repositories/mentoriaRepository";
import { CreateMentoriaData } from "../repositories/mentoriaRepository";
import { NotFoundError, BadRequestError } from "../errors/AppError";
import { findByIdIncludeInactive as findMentorById } from "../repositories/mentorRepository";
import { findByIdIncludeInactive as findAlunoById } from "../repositories/alunoRepository";
import { existsVinculo } from "../repositories/acompanhaRepository";

/** Lista todas as mentorias. */
export async function listarMentorias() {
  return repo.findAll();
}

/** Lista mentorias de um aluno específico (via tabela participa_mentoria). */
export async function listarMentoriasDoAluno(idAluno: number) {
  return repo.findByAluno(idAluno);
}

/**
 * Busca uma mentoria pelo ID.
 * @throws {NotFoundError} se não encontrada
 */
export async function buscarMentoria(id: number) {
  const mentoria = await repo.findById(id);
  if (!mentoria)
    throw new NotFoundError(`Mentoria com id ${id} não encontrada`);
  return mentoria;
}

/**
 * Cria uma mentoria e registra os vínculos auxiliares (realiza, participa_mentoria).
 * RN11: exige mentor ativo, aluno ativo e vínculo em `acompanha` entre os dois.
 * Em caso de falha nos inserts auxiliares, faz rollback da mentoria criada.
 * @throws {NotFoundError} se mentor ou aluno não existirem
 * @throws {BadRequestError} se mentor ou aluno inativos, ou sem vínculo de acompanhamento
 */
export async function criarMentoria(
  data: CreateMentoriaData & { id_mentor: number; id_aluno: number },
) {
  // Valida mentor ativo
  const mentor = await findMentorById(data.id_mentor);
  if (!mentor) {
    throw new NotFoundError(`Mentor com id ${data.id_mentor} não encontrado`);
  }
  if (!mentor.ativo) {
    throw new BadRequestError("Mentor inativo");
  }

  // Valida aluno ativo
  const aluno = await findAlunoById(data.id_aluno);
  if (!aluno) {
    throw new NotFoundError(`Aluno com id ${data.id_aluno} não encontrado`);
  }
  if (!aluno.ativo) {
    throw new BadRequestError("Aluno inativo");
  }

  // Valida que o mentor acompanha esse aluno (existe vínculo em acompanha)
  const vinculado = await existsVinculo(data.id_mentor, data.id_aluno);
  if (!vinculado) {
    throw new BadRequestError(
      `Mentor ${data.id_mentor} nao possui vinculo com aluno ${data.id_aluno}. Crie o vinculo via POST /acompanha antes.`,
    );
  }

  const { id_mentor, id_aluno, ...mentoriaData } = data;
  const mentoria = await repo.create(mentoriaData);

  try {
    await repo.createRealiza({ id_mentor, id_mentoria: mentoria.id_mentoria });
    await repo.createParticipaMentoria({
      id_aluno,
      id_mentoria: mentoria.id_mentoria,
    });
  } catch (err) {
    try {
      await repo.remove(mentoria.id_mentoria);
    } catch {
      // ignore cleanup errors
    }
    throw err;
  }

  return mentoria;
}

/**
 * Atualiza dados de uma mentoria existente.
 * @throws {NotFoundError} se não encontrada
 */
export async function atualizarMentoria(
  id: number,
  data: Parameters<typeof repo.update>[1],
) {
  const mentoria = await repo.update(id, data);
  if (!mentoria)
    throw new NotFoundError(`Mentoria com id ${id} não encontrada`);
  return mentoria;
}

/**
 * Remove fisicamente uma mentoria.
 * Mentoria não usa inativação lógica.
 * @throws {NotFoundError} se não encontrada
 */
export async function deletarMentoria(id: number) {
  const removido = await repo.remove(id);
  if (!removido)
    throw new NotFoundError(`Mentoria com id ${id} não encontrada`);
}
