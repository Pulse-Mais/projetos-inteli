import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  usuario?: Record<string, unknown>;
}

export function autenticar(
  _req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  next();
}
