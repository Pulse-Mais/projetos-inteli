import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/avaliacaoService';

/**
 * GET /avaliacoes — lista todas as avaliações sem filtro.
 * Retorna 200 com array de Avaliacao.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const avaliacoes = await svc.listarAvaliacoes();
  res.json(avaliacoes);
});

/**
 * GET /avaliacoes/:id — retorna uma avaliação pelo ID.
 * Retorna 200 com Avaliacao; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const avaliacao = await svc.buscarAvaliacao(Number(req.params.id));
  res.json(avaliacao);
});

/**
 * POST /avaliacoes — cria uma nova avaliação.
 * Validação: `nota` deve estar no intervalo 1–5.
 * Retorna 201 com Avaliacao criada; 400 se nota fora do intervalo.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const avaliacao = await svc.criarAvaliacao(req.body);
  res.status(201).json(avaliacao);
});

/**
 * PUT /avaliacoes/:id — atualiza uma avaliação existente.
 * Validação: se `nota` for enviada, deve estar no intervalo 1–5.
 * Retorna 200 com Avaliacao atualizada; 400 se nota inválida; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const avaliacao = await svc.atualizarAvaliacao(Number(req.params.id), req.body);
  res.json(avaliacao);
});

/**
 * DELETE /avaliacoes/:id — remove fisicamente uma avaliação.
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarAvaliacao(Number(req.params.id));
  res.status(204).send();
});
