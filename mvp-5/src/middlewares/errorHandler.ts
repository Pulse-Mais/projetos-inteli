import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err instanceof AppError ? err.status : 500;

  console.error({
    status,
    msg: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });

  const publicMessage =
    status === 500 ? 'erro interno do servidor' : err.message;

  res.status(status).json({ error: publicMessage });
};