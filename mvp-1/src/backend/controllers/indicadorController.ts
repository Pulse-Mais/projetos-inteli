import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/indicadorService';

/**
 * GET /indicadores — lista todos os indicadores.
 * Retorna 200 com array de Indicador.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const indicadores = await svc.listarIndicadores();
  res.json(indicadores);
});

/**
 * GET /indicadores/:id — retorna um indicador pelo ID.
 * Retorna 200 com Indicador; 404 se não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const indicador = await svc.buscarIndicador(Number(req.params.id));
  res.json(indicador);
});

/**
 * POST /indicadores — cria um novo indicador vinculado a um programa.
 * Validação: programa informado em `id_programa` deve existir.
 * Retorna 201 com Indicador criado; 400 se programa não encontrado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const indicador = await svc.criarIndicador(req.body);
  res.status(201).json(indicador);
});

/**
 * PUT /indicadores/:id — atualiza um indicador existente.
 * Se `id_programa` for alterado, revalida que o programa existe.
 * Retorna 200 com Indicador atualizado; 400 se programa inválido; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const indicador = await svc.atualizarIndicador(Number(req.params.id), req.body);
  res.json(indicador);
});

/**
 * DELETE /indicadores/:id — remove fisicamente um indicador.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarIndicador(Number(req.params.id));
  res.status(204).send();
});
