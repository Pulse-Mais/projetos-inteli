import { pool } from '../db/pool';
import { ForbiddenError, NotFoundError } from '../errors/AppError';
import type { PerfilUsuario } from '../models/enums';

export async function validarPerfil(
  idUsuario: number,
  perfisPermitidos: PerfilUsuario[]
): Promise<void> {
  const { rows } = await pool.query<{ perfil: PerfilUsuario }>(
    'SELECT perfil FROM usuario WHERE id = $1',
    [idUsuario]
  );

  if (rows.length === 0) {
    throw new NotFoundError('usuário');
  }

  if (!perfisPermitidos.includes(rows[0].perfil)) {
    throw new ForbiddenError(
      `perfil ${rows[0].perfil} não autorizado para esta operação`
    );
  }
}