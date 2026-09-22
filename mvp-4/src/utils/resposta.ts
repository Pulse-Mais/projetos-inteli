import { Response } from 'express';

export interface RespostaSucesso<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface RespostaErro {
  success: false;
  error: string;
  campos?: string[];
  debug?: Record<string, unknown>;
}

/**
 * Envia resposta de sucesso padronizada.
 */
export function responderSucesso<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
): Response {
  const corpo: RespostaSucesso<T> = { success: true, data };
  if (message) corpo.message = message;
  return res.status(statusCode).json(corpo);
}

/**
 * Envia resposta de erro padronizada.
 * Nunca expõe stack traces ou detalhes técnicos em produção.
 */
export function responderErro(
  res: Response,
  error: string,
  statusCode: number = 500,
  extras?: { campos?: string[]; debug?: Record<string, unknown> },
): Response {
  const corpo: RespostaErro = { success: false, error };

  if (extras?.campos) {
    corpo.campos = extras.campos;
  }

  if (process.env.NODE_ENV !== 'production' && extras?.debug) {
    corpo.debug = extras.debug;
  }

  return res.status(statusCode).json(corpo);
}
