import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import { BadRequestError } from '../errors/AppError';
import * as svc from '../services/authService';

/** POST /auth/login — autentica o usuário e retorna os dados da sessão. */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };

  if (!email) {
    throw new BadRequestError('E-mail é obrigatório');
  }

  const { usuario } = await svc.login(email);

  res.json({ usuario });
});
