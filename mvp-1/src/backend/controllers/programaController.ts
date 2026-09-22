import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/programaService';

/**
 * GET /programas — lista todos os programas.
 * Retorna 200 com array de Programa.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const programas = await svc.listarProgramas();
  res.json(programas);
});

/**
 * GET /programas/:id — retorna um programa pelo ID.
 * Retorna 200 com Programa; 404 se não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const programa = await svc.buscarPrograma(Number(req.params.id));
  res.json(programa);
});

/**
 * POST /programas — cria um novo programa.
 * Validação: `fim` deve ser igual ou posterior a `inicio`.
 * Retorna 201 com Programa criado; 400 se período inválido.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const programa = await svc.criarPrograma(req.body);
  res.status(201).json(programa);
});

/**
 * PUT /programas/:id — atualiza um programa existente.
 * Validação: mescla os valores atuais com os enviados antes de revalidar o período.
 * Retorna 200 com Programa atualizado; 400 se período inválido; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const programa = await svc.atualizarPrograma(Number(req.params.id), req.body);
  res.json(programa);
});

/**
 * DELETE /programas/:id — remove fisicamente um programa.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarPrograma(Number(req.params.id));
  res.status(204).send();
});