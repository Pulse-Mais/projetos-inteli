import type { Request, Response } from 'express';
import * as historicoRepo from '../repositories/historicoAcoesRepository';

export async function listar(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const registros = await historicoRepo.listar(limit);
  res.status(200).json(registros);
}
