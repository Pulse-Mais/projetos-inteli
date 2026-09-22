import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import { BadRequestError } from '../errors/AppError';
import * as svc from '../services/frequenciaService';

/**
 * GET /frequencia?id_aluno=<id> — retorna os registros de presença de um aluno.
 * Validação: `id_aluno` obrigatório e positivo na query string.
 * Retorna 200 com array de { id_aula, status }; 400 se id_aluno inválido; 404 se aluno não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const id_aluno = Number(req.query.id_aluno);
  if (isNaN(id_aluno) || id_aluno <= 0) {
    throw new BadRequestError('Parâmetro id_aluno inválido ou ausente');
  }
  const registros = await svc.buscarFrequencia(id_aluno);
  res.json(registros);
});

/**
 * POST /frequencia — salva (upsert) registros de presença de um aluno.
 * Body: { id_aluno, registros: [{ id, status: 'presente'|'ausente' }] }.
 * Status inválidos são descartados silenciosamente pelo service.
 * Retorna 204 sem corpo; 400 se id_aluno ausente ou array vazio/inválido; 404 se aluno não encontrado.
 */
export const salvar = asyncHandler(async (req: Request, res: Response) => {
  const { id_aluno, registros } = req.body;
  if (!id_aluno || isNaN(Number(id_aluno))) {
    throw new BadRequestError('Campo id_aluno inválido ou ausente');
  }
  await svc.salvarFrequencia(Number(id_aluno), registros);
  res.status(204).send();
});
