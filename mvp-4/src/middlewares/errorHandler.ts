import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

interface ErroAplicacao extends Error {
  code?: string;
  detail?: string;
  table?: string;
  column?: string;
  status?: number;
  statusCode?: number;
}

const statusDoErro = (error: ErroAplicacao): number => {
  if (error instanceof AppError) return error.statusCode;
  if (Number.isInteger(error.statusCode)) return Number(error.statusCode);
  if (Number.isInteger(error.status)) return Number(error.status);
  if (error.code === '23505') return 409;
  return 500;
};

const mensagemDoErro = (error: ErroAplicacao, status: number): string => {
  if (error instanceof AppError) return error.message;
  if (error.code === '23505') return 'Registro duplicado.';
  if (status >= 500) return 'Ocorreu um erro interno. Tente novamente mais tarde.';
  return error.message || 'Erro na requisicao.';
};

export const rotaNaoEncontrada = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
};

export const tratadorGlobalDeErros = (
  error: ErroAplicacao,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = statusDoErro(error);

  if (status >= 500) {
    console.error('[ERRO]', req.method, req.path, {
      message: error.message,
      code: error.code,
      table: error.table,
      column: error.column,
      detail: error.detail,
    });
  }

  res.status(status).json({
    success: false,
    error: mensagemDoErro(error, status),
  });
};
