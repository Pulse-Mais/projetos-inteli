import pool from '../database/connection';
import { EmpregoAtivo, HistoricoEmprego, NovoEmprego } from '../database/models/emprego.model';

type EmpregoParaEncerramento = {
  id_emprego: number;
  data_inicio: string;
};

export class EmpregoRepository {
  static async buscarAlunoPorRa(ra: number): Promise<{ ra: number } | null> {
    const resultado = await pool.query<{ ra: number }>(
      'SELECT ra FROM aluno WHERE ra = $1',
      [ra],
    );

    return resultado.rows[0] || null;
  }

  static async buscarEmpregoAtivo(ra: number): Promise<EmpregoAtivo | null> {
    const resultado = await pool.query<EmpregoAtivo>(
      `SELECT id_emprego, empresa, cargo, data_inicio
       FROM empregabilidade
       WHERE id_aluno = $1
         AND data_encerramento IS NULL
       ORDER BY data_inicio DESC
       LIMIT 1`,
      [ra],
    );

    return resultado.rows[0] || null;
  }

  static async inserirEmprego(ra: number, dados: NovoEmprego): Promise<{ id_emprego: number }> {
    const resultado = await pool.query<{ id_emprego: number }>(
      `INSERT INTO empregabilidade (id_aluno, empresa, cargo, data_inicio, faixa_salarial)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_emprego`,
      [ra, dados.empresa, dados.cargo, dados.data_inicio, dados.faixa_salarial],
    );

    return resultado.rows[0];
  }

  static async atualizarStatusAluno(ra: number, status: string): Promise<void> {
    await pool.query(
      'UPDATE aluno SET status = $1 WHERE ra = $2',
      [status, ra],
    );
  }

  static async buscarEmpregoPorId(
    ra: number,
    id_emprego: number,
  ): Promise<EmpregoParaEncerramento | null> {
    const resultado = await pool.query<EmpregoParaEncerramento>(
      `SELECT id_emprego, data_inicio
       FROM empregabilidade
       WHERE id_aluno = $1
         AND id_emprego = $2`,
      [ra, id_emprego],
    );

    return resultado.rows[0] || null;
  }

  static async encerrarEmprego(
    ra: number,
    id_emprego: number,
    data_encerramento: string,
  ): Promise<void> {
    await pool.query(
      `UPDATE empregabilidade
       SET data_encerramento = $1
       WHERE id_aluno = $2
         AND id_emprego = $3`,
      [data_encerramento, ra, id_emprego],
    );
  }

  static async listarEmpregosPorRa(ra: number): Promise<HistoricoEmprego[]> {
    const resultado = await pool.query<HistoricoEmprego>(
      `SELECT
         id_emprego,
         empresa,
         cargo,
         data_inicio,
         data_encerramento,
         data_encerramento AS data_termino,
         faixa_salarial,
         (data_encerramento IS NULL) AS ativo
       FROM empregabilidade
       WHERE id_aluno = $1
       ORDER BY data_inicio DESC`,
      [ra],
    );

    return resultado.rows;
  }
}
