import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/dashboardService';

/**
 * GET /dashboard — retorna as métricas agregadas da plataforma.
 * Executa 6 consultas em paralelo: total de ativos, taxa de empregabilidade,
 * alunos matriculados por programa e contagem por categoria (conectado, capacitado, transformado).
 * Retorna 200 com DashboardData.
 */
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dados = await svc.getDashboard();
  res.json(dados);
});
