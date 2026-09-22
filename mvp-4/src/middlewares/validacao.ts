import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

type ValidadorCampo = (valor: unknown) => string | null;

interface EsquemaValidacao {
  [campo: string]: {
    validador: ValidadorCampo;
    obrigatorio?: boolean;
    fonte?: 'body' | 'params' | 'query';
  };
}

/**
 * Validadores reutilizáveis para campos comuns.
 */
export const Validadores = {
  numeroPositivo: (nome: string): ValidadorCampo =>
    (valor) => {
      const n = Number(valor);
      if (!Number.isInteger(n) || n <= 0) return `${nome} deve ser um número inteiro positivo.`;
      return null;
    },

  textoNaoVazio: (nome: string, maxLen?: number): ValidadorCampo =>
    (valor) => {
      if (typeof valor !== 'string' || valor.trim().length === 0)
        return `${nome} é obrigatório e não pode estar vazio.`;
      if (maxLen && valor.length > maxLen)
        return `${nome} deve ter no máximo ${maxLen} caracteres.`;
      return null;
    },

  email: (nome: string): ValidadorCampo =>
    (valor) => {
      if (typeof valor !== 'string') return `${nome} deve ser um texto.`;
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(valor)) return `${nome} deve ser um e-mail válido.`;
      return null;
    },

  data: (nome: string): ValidadorCampo =>
    (valor) => {
      if (typeof valor !== 'string') return `${nome} deve ser uma data no formato YYYY-MM-DD.`;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(valor) || isNaN(Date.parse(valor)))
        return `${nome} deve ser uma data válida no formato YYYY-MM-DD.`;
      return null;
    },

  booleano: (nome: string): ValidadorCampo =>
    (valor) => {
      if (typeof valor !== 'boolean') return `${nome} deve ser verdadeiro ou falso.`;
      return null;
    },

  umaOpcao: (nome: string, opcoes: string[]): ValidadorCampo =>
    (valor) => {
      if (!opcoes.includes(String(valor)))
        return `${nome} deve ser um dos valores: ${opcoes.join(', ')}.`;
      return null;
    },
};

/**
 * Middleware factory: valida campos de acordo com o esquema fornecido.
 * Retorna erro 400 com lista de erros se alguma validação falhar.
 *
 * @example
 * router.post('/rota', validar({
 *   nome: { validador: Validadores.textoNaoVazio('Nome'), obrigatorio: true, fonte: 'body' },
 *   ra: { validador: Validadores.numeroPositivo('RA'), obrigatorio: true, fonte: 'params' },
 * }), controller.metodo);
 */
export function validar(esquema: EsquemaValidacao) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const erros: string[] = [];

    for (const [campo, config] of Object.entries(esquema)) {
      const fonte = config.fonte ?? 'body';
      const fonteReq = fonte === 'body' ? req.body : fonte === 'params' ? req.params : req.query;
      const valor = fonteReq?.[campo];

      if (valor === undefined || valor === null || valor === '') {
        if (config.obrigatorio !== false) {
          erros.push(`Campo obrigatório ausente: ${campo}.`);
        }
        continue;
      }

      const erro = config.validador(valor);
      if (erro) erros.push(erro);
    }

    if (erros.length > 0) {
      next(
        new AppError(
          erros.length === 1 ? erros[0] : `Dados inválidos: ${erros.join(' ')}`,
          400,
        ),
      );
      return;
    }

    next();
  };
}

/**
 * Valida que o corpo da requisição não está vazio.
 */
export function exigirBody(req: Request, _res: Response, next: NextFunction): void {
  if (!req.body || Object.keys(req.body).length === 0) {
    next(new AppError('O corpo da requisição não pode estar vazio.', 400));
    return;
  }
  next();
}

/**
 * Valida parâmetros de rota numéricos comuns (ra, rm, id).
 */
export function validarParamNumerico(param: string, nome: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const valor = Number(req.params[param]);
    if (!Number.isInteger(valor) || valor <= 0) {
      next(new AppError(`${nome} inválido.`, 400));
      return;
    }
    next();
  };
}
