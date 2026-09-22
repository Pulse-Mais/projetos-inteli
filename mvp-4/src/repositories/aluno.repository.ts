import pool from '../database/connection';
import { Aluno } from '../database/models/aluno.model';
import { preencherCategoriaAluno } from '../utils/categoria-aluno';

export class AlunoRepository {
  async buscarPorRA(ra: number): Promise<Aluno | null> {
    const result = await pool.query<Aluno>(
      `SELECT
        ra,
        nome,
        cpf,
        fotos AS foto,
        data_nasc,
        id_turma,
        status,
        genero,
        data_ingresso,
        nivel_formacao,
        categoria,
        email_primario,
        email_secundario,
        tel_primario,
        tel_secundario,
        cep,
        endereco,
        renda_familiar
       FROM aluno
       WHERE ra = $1`,
      [ra],
    );

    const aluno = result.rows[0] ?? null;

    return aluno ? preencherCategoriaAluno(aluno) : null;
  }

  async atualizar(ra: number, dados: Partial<Aluno>): Promise<void> {
    const campos = Object.keys(dados) as (keyof Aluno)[];

    if (campos.length === 0) return;

    const camposBanco = campos.map(campo => (campo === 'foto' ? 'fotos' : campo));

    if (camposBanco.length === 0) return;

    const sets = camposBanco.map((campo, i) => `${String(campo)} = $${i + 1}`).join(', ');
    const valores = camposBanco.map(campo => {
      const campoModelo = campo === 'fotos' ? 'foto' : campo;
      return dados[campoModelo as keyof Aluno];
    });
    valores.push(ra as any);

    await pool.query(
      `UPDATE aluno SET ${sets} WHERE ra = $${valores.length}`,
      valores,
    );
  }
} 
