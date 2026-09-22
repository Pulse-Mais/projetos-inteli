import * as repo from "../repositories/gerenciaRepository";
import { CreateGerenciaData } from "../repositories/gerenciaRepository";
import { NotFoundError, ConflictError } from "../errors/AppError";

/** Lista todos os vínculos de gerência. */
export async function listarGerencias() {
  return repo.findAll();
}

/** Lista coordenadores que gerenciam um programa específico. */
export async function listarPorPrograma(id_programa: number) {
  return repo.findByPrograma(id_programa);
}

/** Lista programas gerenciados por um coordenador específico. */
export async function listarPorCoordenador(id_coordenador: number) {
  return repo.findByCoordenador(id_coordenador);
}

/**
 * Cria um vínculo de gerência entre coordenador e programa.
 * Impede duplicata: o mesmo coordenador não pode gerenciar o mesmo programa duas vezes.
 * @throws {ConflictError} se o vínculo já existir
 */
export async function criarGerencia(data: CreateGerenciaData) {
  const existente = await repo.findOne(data.id_coordenador, data.id_programa);
  if (existente)
    throw new ConflictError(
      `Coordenador ${data.id_coordenador} já gerencia o programa ${data.id_programa}`,
    );
  return repo.create(data);
}

/**
 * Remove o vínculo de gerência pela chave composta (coordenador + programa).
 * @throws {NotFoundError} se não encontrado
 */
export async function deletarGerencia(
  id_coordenador: number,
  id_programa: number,
) {
  const removida = await repo.remove(id_coordenador, id_programa);
  if (!removida)
    throw new NotFoundError(
      `Vínculo do coordenador ${id_coordenador} com o programa ${id_programa} não encontrado`,
    );
}
