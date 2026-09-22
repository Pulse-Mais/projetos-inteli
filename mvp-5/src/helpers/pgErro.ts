import { DatabaseError } from 'pg';
import { ConflictError } from '../errors/AppError';

export function mapearErroPg(
  erro: unknown,
  mensagemConflito = 'registro já cadastrado'
): never {
  if (erro instanceof DatabaseError) {
    if (erro.code === '23505') {
      throw new ConflictError(mensagemConflito);
    }
    if (erro.code === '23503') {
      throw new ConflictError('referência inválida: registro relacionado não existe');
    }
  }
  throw erro;
}
