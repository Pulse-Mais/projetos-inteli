import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/oportunidadeService';

/**
 * GET /oportunidades?tipo=<tipo>&busca=<texto> — lista oportunidades ativas com filtros opcionais.
 * `tipo` filtra por categoria exata (Vaga, Evento, Estágio, Bolsa de Estudo).
 * `busca` faz busca parcial case-insensitive em titulo e empresa.
 * Retorna 200 com array de Oportunidade ordenado por prazo asc.
 */
export const listar = asyncHandler(async (req: Request, res: Response) => {
  const { tipo, busca } = req.query as Record<string, string | undefined>;
  const oportunidades = await svc.listarOportunidades({ tipo, busca });
  res.json(oportunidades);
});

export const criar = asyncHandler(async (req: Request, res: Response) => {
  const dados = await svc.criarOportunidade(req.body);
  res.status(201).json(dados);
});

export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const dados = await svc.atualizarOportunidade(Number(req.params.id), req.body);
  res.json(dados);
});

export const remover = asyncHandler(async (req: Request, res: Response) => {
  await svc.removerOportunidade(Number(req.params.id));
  res.status(204).send();
});