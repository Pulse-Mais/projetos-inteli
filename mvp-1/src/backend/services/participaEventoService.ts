import * as repo from "../repositories/participaEventoRepository";
import { CreateParticipaEventoData } from "../repositories/participaEventoRepository";
import { NotFoundError, ConflictError } from "../errors/AppError";

/** Lista todas as participações em eventos. */
export async function listarParticipacoes() {
  return repo.findAll();
}

/** Lista todos os participantes de um evento específico. */
export async function listarPorEvento(id_evento: number) {
  return repo.findByEvento(id_evento);
}

/** Lista todos os eventos em que um aluno está registrado. */
export async function listarPorAluno(id_aluno: number) {
  return repo.findByAluno(id_aluno);
}

/**
 * Busca uma participação pela chave composta (evento + aluno).
 * @throws {NotFoundError} se não encontrada
 */
export async function buscarParticipacao(id_evento: number, id_aluno: number) {
  const participacao = await repo.findOne(id_evento, id_aluno);
  if (!participacao)
    throw new NotFoundError(
      `Participação do aluno ${id_aluno} no evento ${id_evento} não encontrada`,
    );
  return participacao;
}

/**
 * Registra a participação de um aluno em um evento.
 * Impede duplicata: um aluno não pode ser registrado duas vezes no mesmo evento.
 * @throws {ConflictError} se já registrado
 */
export async function registrarParticipacao(data: CreateParticipaEventoData) {
  const existente = await repo.findOne(data.id_evento, data.id_aluno);
  if (existente)
    throw new ConflictError(
      `Aluno ${data.id_aluno} já está registrado no evento ${data.id_evento}`,
    );
  return repo.create(data);
}

/**
 * Atualiza a presença (true/false) de um aluno em um evento (RF002).
 * @throws {NotFoundError} se a participação não for encontrada
 */
export async function atualizarPresenca(
  id_evento: number,
  id_aluno: number,
  presenca: boolean,
) {
  const participacao = await repo.findOne(id_evento, id_aluno);
  if (!participacao)
    throw new NotFoundError(
      `Participação do aluno ${id_aluno} no evento ${id_evento} não encontrada`,
    );
  const atualizada = await repo.update(id_evento, id_aluno, presenca);
  if (!atualizada)
    throw new NotFoundError(
      `Participação do aluno ${id_aluno} no evento ${id_evento} não encontrada`,
    );
  return atualizada;
}

/**
 * Remove a participação de um aluno em um evento.
 * @throws {NotFoundError} se não encontrada
 */
export async function removerParticipacao(id_evento: number, id_aluno: number) {
  const removida = await repo.remove(id_evento, id_aluno);
  if (!removida)
    throw new NotFoundError(
      `Participação do aluno ${id_aluno} no evento ${id_evento} não encontrada`,
    );
}
