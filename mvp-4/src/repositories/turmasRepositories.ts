import pool from '../database/connection';
import { DadosTurma } from '../database/models/turma.model';

class TurmasRepository {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const dataResult = await pool.query(
      `SELECT t.id_turma, t.nome_turma, t.data_inicio, t.data_fim,
              t.capacidade, t.descricao, t.status,
              c.rm AS id_coordenador,
              COUNT(a.ra)::int AS total_alunos
       FROM turma t
       LEFT JOIN coordenador c ON c.rm = t.id_coordenador
       LEFT JOIN aluno a ON a.id_turma = t.id_turma
       GROUP BY t.id_turma, t.nome_turma, t.data_inicio, t.data_fim,
                t.capacidade, t.descricao, t.status, c.rm
       ORDER BY t.id_turma
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM turma');
    const totalAlunosGeralResult = await pool.query('SELECT COUNT(*)::int AS total FROM aluno');

    return {
      data: dataResult.rows,
      total: countResult.rows[0].total,
      totalAlunosGeral: totalAlunosGeralResult.rows[0].total,
    };
  }

  async findById(id: number) {
    const turmaResult = await pool.query(
      `SELECT t.id_turma, t.nome_turma, t.data_inicio, t.data_fim,
              t.capacidade, t.descricao, t.status,
              c.rm AS id_coordenador
       FROM turma t
       LEFT JOIN coordenador c ON c.rm = t.id_coordenador
       WHERE t.id_turma = $1`,
      [id]
    );
    if (turmaResult.rows.length === 0) return null;

    const alunosResult = await pool.query(
      `SELECT ra, nome, status FROM aluno WHERE id_turma = $1`,
      [id]
    );

    return { ...turmaResult.rows[0], alunos: alunosResult.rows };
  }

  async create(dados: DadosTurma) {
    // Verifica se coordenador existe
    const coord = await pool.query('SELECT rm FROM coordenador WHERE rm = $1', [dados.id_coordenador]);
    if (coord.rows.length === 0) return { error: 'coordenador_not_found' };

    const result = await pool.query(
      `INSERT INTO turma (
         nome_turma, data_inicio, data_fim, id_coordenador, capacidade, descricao, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_turma`,
      [
        dados.nome_turma,
        dados.data_inicio,
        dados.data_fim,
        dados.id_coordenador,
        dados.capacidade ?? null,
        dados.descricao ?? null,
        dados.status ?? 'ativa',
      ]
    );
    return { id_turma: result.rows[0].id_turma };
  }

  async update(id: number, dados: DadosTurma) {
    const turma = await pool.query('SELECT id_turma FROM turma WHERE id_turma = $1', [id]);
    if (turma.rows.length === 0) return { error: 'not_found' };

    const coord = await pool.query('SELECT rm FROM coordenador WHERE rm = $1', [dados.id_coordenador]);
    if (coord.rows.length === 0) return { error: 'coordenador_not_found' };

    await pool.query(
      `UPDATE turma
       SET nome_turma = $1,
           data_inicio = $2,
           data_fim = $3,
           id_coordenador = $4,
           capacidade = $5,
           descricao = $6,
           status = $7
       WHERE id_turma = $8`,
      [
        dados.nome_turma,
        dados.data_inicio,
        dados.data_fim,
        dados.id_coordenador,
        dados.capacidade ?? null,
        dados.descricao ?? null,
        dados.status ?? 'ativa',
        id,
      ]
    );
    return { success: true };
  }

  async associarAluno(id_turma: number, ra: number) {
    const turma = await pool.query(
      `SELECT t.id_turma, t.capacidade, t.status, COUNT(a.ra)::int AS total_alunos
       FROM turma t
       LEFT JOIN aluno a ON a.id_turma = t.id_turma
       WHERE t.id_turma = $1
       GROUP BY t.id_turma, t.capacidade, t.status`,
      [id_turma]
    );
    if (turma.rows.length === 0) return { error: 'turma_not_found' };
    if (turma.rows[0].status !== 'ativa') return { error: 'turma_inativa' };
    if (
      turma.rows[0].capacidade !== null &&
      turma.rows[0].total_alunos >= turma.rows[0].capacidade
    ) {
      return { error: 'turma_cheia' };
    }

    const aluno = await pool.query('SELECT ra FROM aluno WHERE ra = $1', [ra]);
    if (aluno.rows.length === 0) return { error: 'aluno_not_found' };

    const already = await pool.query('SELECT ra FROM aluno WHERE ra = $1 AND id_turma = $2', [ra, id_turma]);
    if (already.rows.length > 0) return { error: 'already_associated' };

    await pool.query('UPDATE aluno SET id_turma = $1 WHERE ra = $2', [id_turma, ra]);
    return { success: true };
  }
}

export default new TurmasRepository();
