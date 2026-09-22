import pool from '../database/connection';
import { Anotacao, AtualizarAnotacao, NovaAnotacao } from '../database/models/anotacao.model';

export class AnotacaoRepository {
  async alunoExiste(ra: number): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM aluno WHERE ra = $1', [ra]);
    return result.rows.length > 0;
  }

  async listarPorAluno(ra: number): Promise<Anotacao[]> {
    const result = await pool.query<Anotacao>(
      `SELECT id_anotacoes, id_aluno, nome_autor, data::text, conteudo
       FROM anotacoes
       WHERE id_aluno = $1
       ORDER BY data DESC, id_anotacoes DESC`,
      [ra],
    );

    return result.rows;
  }

  async criar(ra: number, dados: NovaAnotacao): Promise<Anotacao> {
    const result = await pool.query<Anotacao>(
      `INSERT INTO anotacoes (id_aluno, nome_autor, data, conteudo)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4)
       RETURNING id_anotacoes, id_aluno, nome_autor, data::text, conteudo`,
      [ra, dados.nome_autor, dados.data ?? null, dados.conteudo],
    );

    return result.rows[0];
  }

  async atualizar(id: number, dados: AtualizarAnotacao): Promise<Anotacao | null> {
    const result = await pool.query<Anotacao>(
      `UPDATE anotacoes
       SET nome_autor = COALESCE($1, nome_autor),
           data = COALESCE($2::date, data),
           conteudo = COALESCE($3, conteudo)
       WHERE id_anotacoes = $4
       RETURNING id_anotacoes, id_aluno, nome_autor, data::text, conteudo`,
      [dados.nome_autor ?? null, dados.data ?? null, dados.conteudo ?? null, id],
    );

    return result.rows[0] ?? null;
  }

  async remover(id: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM anotacoes WHERE id_anotacoes = $1',
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
