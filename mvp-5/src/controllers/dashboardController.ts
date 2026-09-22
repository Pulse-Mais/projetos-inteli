import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService';
import { ValidationError } from '../errors/AppError';

/**
 * GET /dashboard?id_usuario=<id>
 * Requer perfil Gestao — validação feita no service via validarPerfil.
 * Quando o middleware de autenticação (Pessoa 1) for plugado, substituir
 * req.query.id_usuario por req.user.id.
 */
export async function obterIndicadores(req: Request, res: Response): Promise<void> {
  const idUsuario = Number(req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório como query param (?id_usuario=...)');
  }

  const indicadores = await dashboardService.obterIndicadores(idUsuario);
  res.status(200).json(indicadores);
}

export async function obterEmpregabilidade(req: Request, res: Response): Promise<void> {
  const situacao = typeof req.query.situacao === 'string' ? req.query.situacao : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const programa = req.query.programa ? Number(req.query.programa) : undefined;
  const data = await dashboardService.obterDashboardEmpregabilidade(situacao as any, ano, programa);
  res.status(200).json(data);
}

export async function obterEngajamento(req: Request, res: Response): Promise<void> {
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const programa = req.query.programa ? Number(req.query.programa) : undefined;
  const data = await dashboardService.obterDashboardEngajamento(ano, programa);
  res.status(200).json(data);
}

export async function obterEnsinoSuperior(req: Request, res: Response): Promise<void> {
  const situacao = typeof req.query.situacao === 'string' ? req.query.situacao : undefined;
  const ano = req.query.ano ? Number(req.query.ano) : undefined;
  const data = await dashboardService.obterDashboardEnsinoSuperior(situacao as any, ano);
  res.status(200).json(data);
}