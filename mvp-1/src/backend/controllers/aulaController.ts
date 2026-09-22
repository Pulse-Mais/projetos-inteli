import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/aulaService';

/**
 * GET /cursos/:id/aulas — lista as aulas de um curso.
 * Retorna 200 com array de Aula; 404 se o curso não existir.
 */
export const listarPorCurso = asyncHandler(async (req: Request, res: Response) => {
  const aulas = await svc.listarAulasDoCurso(Number(req.params.id));
  res.json(aulas);
});

/**
 * GET /aulas/:id — retorna uma aula pelo ID.
 * Retorna 200 com Aula; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const aula = await svc.buscarAula(Number(req.params.id));
  res.json(aula);
});

/**
 * POST /cursos/:id/aulas — cria uma aula vinculada ao curso.
 * Retorna 201 com Aula criada; 400 se número/título ausentes; 404 se curso não existir.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const aula = await svc.criarAula(Number(req.params.id), req.body);
  res.status(201).json(aula);
});

/**
 * PUT /aulas/:id — atualiza uma aula existente.
 * Retorna 200 com Aula atualizada; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const aula = await svc.atualizarAula(Number(req.params.id), req.body);
  res.json(aula);
});

/**
 * DELETE /aulas/:id — remove uma aula (cascateia para presenças).
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarAula(Number(req.params.id));
  res.status(204).send();
});
