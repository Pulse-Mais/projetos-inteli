import * as repo from "../repositories/anotacaoPrivadaRepository";
import { CreateAnotacaoData } from "../repositories/anotacaoPrivadaRepository";
import { NotFoundError } from "../errors/AppError";

/**
 * Lista todas as anotações de um aluno feitas por qualquer mentor (visão do coordenador).
 * RN13: apenas o coordenador acessa esta visão completa.
 */
export async function listarPorAluno(id_aluno: number) {
  return repo.findByAluno(id_aluno);
}

/**
 * Lista as anotações de um mentor específico sobre um aluno.
 * RN13: mentor vê apenas suas próprias anotações; não acessa as de outros mentores.
 */
export async function listarPorAlunoEMentor(
  id_aluno: number,
  id_mentor: number,
) {
  return repo.findByAlunoAndMentor(id_aluno, id_mentor);
}

/** Lista todas as anotações feitas por um mentor sobre quaisquer mentorandos (RF013). */
export async function listarPorMentor(id_mentor: number) {
  return repo.findByMentor(id_mentor);
}

/**
 * Registra uma observação qualitativa do mentor sobre um mentorando (RF012/RF013).
 * Body: { id_mentor, id_aluno, conteudo_texto }.
 */
export async function criarAnotacao(data: CreateAnotacaoData) {
  return repo.create(data);
}

/**
 * Remove uma anotação pela chave composta (mentor + aluno + data_registro).
 * RN13: somente o mentor autor ou o coordenador pode remover.
 * @throws {NotFoundError} se não encontrada
 */
export async function deletarAnotacao(
  id_mentor: number,
  id_aluno: number,
  data_registro: string,
) {
  const removida = await repo.remove(id_mentor, id_aluno, data_registro);
  if (!removida)
    throw new NotFoundError(
      `Anotação do mentor ${id_mentor} sobre o aluno ${id_aluno} em ${data_registro} não encontrada`,
    );
}
