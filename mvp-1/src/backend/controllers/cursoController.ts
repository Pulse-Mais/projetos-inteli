import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/cursoService';

/**
 * GET /programas/:id/cursos — lista os cursos de um programa.
 * Retorna 200 com array de Curso; 404 se o programa não existir.
 */
export const listarPorPrograma = asyncHandler(async (req: Request, res: Response) => {
  const cursos = await svc.listarCursosDoPrograma(Number(req.params.id));
  res.json(cursos);
});

/**
 * GET /cursos/:id — retorna um curso pelo ID.
 * Retorna 200 com Curso; 404 se não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const curso = await svc.buscarCurso(Number(req.params.id));
  res.json(curso);
});

/**
 * POST /programas/:id/cursos — cria um curso vinculado ao programa.
 * Retorna 201 com Curso criado; 400 se título ausente; 404 se programa não existir.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const curso = await svc.criarCurso(Number(req.params.id), req.body);
  res.status(201).json(curso);
});

/**
 * PUT /cursos/:id — atualiza um curso existente.
 * Retorna 200 com Curso atualizado; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const curso = await svc.atualizarCurso(Number(req.params.id), req.body);
  res.json(curso);
});

/**
 * DELETE /cursos/:id — remove um curso (cascateia para aulas e presenças).
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarCurso(Number(req.params.id));
  res.status(204).send();
});
