import pool from '../database/connection';

class FrequenciaRepository {
  // ── Aulas ────────────────────────────────────────────────────────────────

  async registrarFrequenciaAula(
    ra: number,
    id_aula: number,
    data: string,
    frequencia: boolean,
    id_coordenador: number
  ) {
    const aluno = await pool.query('SELECT ra FROM aluno WHERE ra = $1', [ra]);
    if (aluno.rows.length === 0) return { error: 'aluno_not_found' };

    const aula = await pool.query('SELECT id_aula FROM aula WHERE id_aula = $1', [id_aula]);
    if (aula.rows.length === 0) return { error: 'aula_not_found' };

    const dup = await pool.query(
      'SELECT 1 FROM frequenta WHERE id_aluno = $1 AND id_aula = $2',
      [ra, id_aula]
    );
    if (dup.rows.length > 0) return { error: 'duplicate' };

    await pool.query(
      `INSERT INTO frequenta (id_aluno, id_aula, data, frequencia)
       VALUES ($1, $2, $3, $4)`,
      [ra, id_aula, data, frequencia]
    );
    return { success: true };
  }

  async getFrequenciaAulas(ra: number) {
    const aluno = await pool.query('SELECT ra FROM aluno WHERE ra = $1', [ra]);
    if (aluno.rows.length === 0) return { error: 'not_found' };

    const result = await pool.query(
      `SELECT f.id_aula, a.tema, f.data, f.frequencia
       FROM frequenta f
       JOIN aula a ON a.id_aula = f.id_aula
       WHERE f.id_aluno = $1
       ORDER BY f.data`,
      [ra]
    );

    const total = result.rows.length;
    const presencas = result.rows.filter((r) => r.frequencia).length;
    const percentual = total > 0 ? parseFloat(((presencas / total) * 100).toFixed(1)) : 0;

    return { frequencias: result.rows, total_aulas: total, percentual_presenca: percentual };
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  async registrarFrequenciaEvento(
    ra: number,
    id_evento: number,
    data: string,
    frequencia: boolean,
    id_coordenador: number
  ) {
    const aluno = await pool.query('SELECT ra FROM aluno WHERE ra = $1', [ra]);
    if (aluno.rows.length === 0) return { error: 'aluno_not_found' };

    const evento = await pool.query('SELECT id_evento FROM evento WHERE id_evento = $1', [id_evento]);
    if (evento.rows.length === 0) return { error: 'evento_not_found' };

    const dup = await pool.query(
      'SELECT 1 FROM participa WHERE id_aluno = $1 AND id_evento = $2',
      [ra, id_evento]
    );
    if (dup.rows.length > 0) return { error: 'duplicate' };

    await pool.query(
      `INSERT INTO participa (id_aluno, id_evento, data, frequencia)
       VALUES ($1, $2, $3, $4)`,
      [ra, id_evento, data, frequencia]
    );
    return { success: true };
  }

  // ── Frequência por turma ──────────────────────────────────────────────────

  async getFrequenciaTurma(id_turma: number) {
    const turma = await pool.query(
      'SELECT id_turma, nome_turma FROM turma WHERE id_turma = $1',
      [id_turma]
    );
    if (turma.rows.length === 0) return { error: 'not_found' };

    const result = await pool.query(
      `SELECT a.ra, a.nome,
              COUNT(f.id_aula)::int AS total_aulas,
              COUNT(CASE WHEN f.frequencia THEN 1 END)::int AS presencas
       FROM aluno a
       LEFT JOIN frequenta f ON f.id_aluno = a.ra
       WHERE a.id_turma = $1
       GROUP BY a.ra, a.nome
       ORDER BY a.nome`,
      [id_turma]
    );

    const frequencias = result.rows.map((row) => {
      const pct = row.total_aulas > 0
        ? parseFloat(((row.presencas / row.total_aulas) * 100).toFixed(1))
        : 0;
      return {
        ra: row.ra,
        nome: row.nome,
        percentual_presenca: pct,
        alerta_evasao: pct < 85,
      };
    });

    return { ...turma.rows[0], frequencias };
  }
}

export default new FrequenciaRepository();
