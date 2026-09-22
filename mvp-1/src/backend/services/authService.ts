import { pool } from '../db/migrations/connection';
import * as usuarioRepo from '../repositories/usuarioRepository';
import { UnauthorizedError, BadRequestError } from '../errors/AppError';

export type Perfil = 'aluno' | 'exaluno' | 'mentor' | 'coordenador';

export interface AuthPayload {
  id_usuario: number;
  email: string;
  nome: string;
  perfil: Perfil;
}

/**
 * Determina o perfil do usuário consultando o PostgreSQL local.
 */
async function determinarPerfil(id_usuario: number): Promise<Perfil> {
  const aluno = await pool.query(
    `SELECT ativo
     FROM aluno
     WHERE id_usuario = $1
     LIMIT 1`,
    [id_usuario],
  );

  if (aluno.rows.length > 0) {
    return aluno.rows[0].ativo ? 'aluno' : 'exaluno';
  }

  const mentor = await pool.query(
    `SELECT ativo
     FROM mentor
     WHERE id_usuario = $1
     LIMIT 1`,
    [id_usuario],
  );

  if (mentor.rows.length > 0) {
    return 'mentor';
  }

  return 'coordenador';
}

/**
 * Valida o e-mail do usuário e retorna os dados públicos da sessão.
 */
export async function login(
  email: string,
): Promise<{ usuario: AuthPayload }> {
  if (!email) {
    throw new BadRequestError('E-mail é obrigatório');
  }

  const usuario = await usuarioRepo.findByEmail(email.toLowerCase().trim());

  if (!usuario) {
    throw new UnauthorizedError('E-mail não encontrado');
  }

  const perfil = await determinarPerfil(usuario.id_usuario);

  const payload: AuthPayload = {
    id_usuario: usuario.id_usuario,
    email: usuario.email,
    nome: usuario.nome,
    perfil,
  };

  return { usuario: payload };
}