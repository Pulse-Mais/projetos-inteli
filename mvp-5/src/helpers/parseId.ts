import { ValidationError } from '../errors/AppError';

export function parseId(valor: unknown, nome = 'id'): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${nome} inválido`);
  }
  return n;
}
