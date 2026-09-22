import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/atividadeService';

/**
 * GET /atividades — lista todas as atividades sem filtro.
 * Retorna 200 com array de Atividade.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const atividades = await svc.listarAtividades();
  res.json(atividades);
});

/**
 * GET /atividades/:id — retorna uma atividade pelo ID.
 * Retorna 200 com Atividade; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const atividade = await svc.buscarAtividade(Number(req.params.id));
  res.json(atividade);
});

/**
 * POST /atividades — cria uma nova atividade vinculada a um programa.
 * RN03: o programa informado em `id_programa` deve existir.
 * Retorna 201 com Atividade criada; 400 se programa não encontrado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const atividade = await svc.criarAtividade(req.body);
  res.status(201).json(atividade);
});

/**
 * PUT /atividades/:id — atualiza uma atividade existente.
 * RN03: se `id_programa` for alterado, revalida que o programa existe.
 * Retorna 200 com Atividade atualizada; 400 se programa inválido; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const atividade = await svc.atualizarAtividade(Number(req.params.id), req.body);
  res.json(atividade);
});

/**
 * DELETE /atividades/:id — remove fisicamente uma atividade.
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarAtividade(Number(req.params.id));
  res.status(204).send();
});
