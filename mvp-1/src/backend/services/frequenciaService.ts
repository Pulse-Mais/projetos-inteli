import * as repo from '../repositories/frequenciaRepository';
import * as alunoRepo from '../repositories/alunoRepository';
import { NotFoundError, BadRequestError } from '../errors/AppError';

/**
 * Retorna os registros de presença de um aluno.
 * Inclui inativos para permitir consulta histórica após formatura.
 * @throws {NotFoundError} se o aluno não existir
 */
export async function buscarFrequencia(id_aluno: number) {
  const aluno = await alunoRepo.findByIdIncludeInactive(id_aluno);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id_aluno} não encontrado`);
  return repo.findByAluno(id_aluno);
}

/**
 * Salva (upsert) registros de presença de um aluno.
 * Apenas registros com status 'presente' ou 'ausente' são persistidos; demais são descartados.
 * @throws {NotFoundError} se o aluno não existir
 * @throws {BadRequestError} se `registros` for vazio ou sem status válido
 */
export async function salvarFrequencia(
  id_aluno: number,
  registros: { id: number; status: string }[],
) {
  const aluno = await alunoRepo.findByIdIncludeInactive(id_aluno);
  if (!aluno) throw new NotFoundError(`Aluno com id ${id_aluno} não encontrado`);

  if (!Array.isArray(registros) || registros.length === 0) {
    throw new BadRequestError('Nenhum registro de frequência fornecido');
  }

  const validos = registros.filter(
    (r) => r.status === 'presente' || r.status === 'ausente',
  );
  if (validos.length === 0) {
    throw new BadRequestError('Status inválido — use "presente" ou "ausente"');
  }

  await repo.upsertMany(
    validos.map((r) => ({
      id_aluno,
      id_aula: Number(r.id),
      status: r.status as 'presente' | 'ausente',
    })),
  );
}
