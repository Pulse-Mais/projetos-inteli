import pool from '../database/connection';
import { PerfilAutenticado, UsuarioAutenticado } from './auth.types';

const configuracaoPorPerfil: Record<PerfilAutenticado, {
  tabela: string;
  chave: 'ra' | 'rm';
  email: 'email_primario' | 'email';
}> = {
  aluno: { tabela: 'aluno', chave: 'ra', email: 'email_primario' },
  coordenadora: { tabela: 'coordenador', chave: 'rm', email: 'email' },
  gestor: { tabela: 'gestor', chave: 'rm', email: 'email' },
  psicologa: { tabela: 'psicologo', chave: 'rm', email: 'email' },
};

export class AuthRepository {
  async autenticar(
    perfil: PerfilAutenticado,
    identificador: string,
    senha: string,
  ): Promise<UsuarioAutenticado | null> {
    const config = configuracaoPorPerfil[perfil];
    const identificadorNormalizado = identificador.trim();
    const identificadorNumerico = Number.parseInt(identificadorNormalizado, 10);
    const buscaPorEmail = identificadorNormalizado.includes('@');
    const buscaPorChave =
      !buscaPorEmail &&
      Number.isInteger(identificadorNumerico) &&
      String(identificadorNumerico) === identificadorNormalizado;

    const condicaoIdentificador = buscaPorEmail
      ? `LOWER(${config.email}) = LOWER($1)`
      : buscaPorChave
        ? `${config.chave} = $1::int`
        : `${config.chave}::TEXT = $1`;

    const resultado = await pool.query(
      `SELECT ${config.chave} AS id, nome, ${config.email} AS email
       FROM ${config.tabela}
       WHERE ${condicaoIdentificador}
         AND senha_hash = crypt($2, senha_hash)
       LIMIT 1`,
      [identificadorNormalizado, senha],
    );

    if (!resultado.rows[0]) return null;

    return {
      id: Number(resultado.rows[0].id),
      nome: resultado.rows[0].nome,
      email: resultado.rows[0].email,
      perfil,
    };
  }
}
