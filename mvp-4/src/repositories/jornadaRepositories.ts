import pool from '../database/connection';

const CODIGOS_SCHEMA_ALERTA_TOLERAVEIS = new Set([
  '42P01', // undefined_table
  '42703', // undefined_column
  '42883', // undefined_function/operator mismatch
  '42804', // datatype mismatch
]);

class JornadaRepository {
  async findAluno(ra: number) {
    const result = await pool.query('SELECT ra, nome FROM aluno WHERE ra = $1', [ra]);
    return result.rows[0] ?? null;
  }

  async findJornada(ra: number) {
    const turmasRes = await pool.query(
      `SELECT t.id_turma, t.nome_turma, t.data_inicio, t.data_fim,
              CASE WHEN NOW() BETWEEN t.data_inicio AND t.data_fim THEN 'Em andamento'
                   WHEN NOW() > t.data_fim THEN 'Concluída'
                   ELSE 'Não iniciada' END AS status
       FROM turma t
       WHERE t.id_turma = (SELECT id_turma FROM aluno WHERE ra = $1)`,
      [ra]
    );

    const aulasRes = await pool.query(
      `SELECT f.id_aula, a.tema, f.data, f.frequencia
       FROM frequenta f
       JOIN aula a ON a.id_aula = f.id_aula
       WHERE f.id_aluno = $1
       ORDER BY f.data`,
      [ra]
    );

    let eventos = [];

    try {
      const eventosRes = await pool.query(
        `SELECT p.id_evento, e.tema, p.data, e.categoria, p.frequencia
         FROM participa p
         JOIN evento e ON e.id_evento = p.id_evento
         WHERE p.id_aluno = $1
         ORDER BY p.data`,
        [ra]
      );

      eventos = eventosRes.rows;
    } catch (error: any) {
      if (error?.code !== '42P01') {
        throw error;
      }
    }

    const certRes = await pool.query(
      `SELECT id_certificado, nome, data FROM certificado WHERE id_aluno = $1 ORDER BY data`,
      [ra]
    );

    const empreRes = await pool.query(
      `SELECT empresa, cargo, data_inicio, faixa_salarial
       FROM empregabilidade WHERE id_aluno = $1
       ORDER BY data_inicio DESC LIMIT 1`,
      [ra]
    );

    const emprego = empreRes.rows[0]
      ? { status: 'Empregado', ...empreRes.rows[0] }
      : { status: 'Não empregado' };

    return {
      turmas: turmasRes.rows,
      aulas: aulasRes.rows,
      eventos,
      certificados: certRes.rows,
      empregabilidade: emprego,
    };
  }

  async findCertificados(ra: number) {
    const result = await pool.query(
      `SELECT id_certificado, nome, data FROM certificado WHERE id_aluno = $1 ORDER BY data`,
      [ra]
    );
    return result.rows;
  }

  async findAlertas(ra: number) {
    const frequenciaRes = await pool.query(
      `SELECT
         COUNT(id_aula)::int AS total_aulas,
         COUNT(CASE WHEN frequencia THEN 1 END)::int AS presencas
       FROM frequenta
       WHERE id_aluno = $1`,
      [ra]
    );

    const { total_aulas, presencas } = frequenciaRes.rows[0];
    const frequenciaPercentual = total_aulas > 0
      ? parseFloat(((presencas / total_aulas) * 100).toFixed(1))
      : 0;

    let alertas = [];

    try {
      const alertasRes = await pool.query(
        `SELECT
           id_alerta,
           'frequencia' AS tipo,
           CASE
             WHEN LOWER(COALESCE(status::text, '')) IN ('true', 'ativo') THEN 'ativo'
             ELSE 'resolvido'
           END AS status,
           COALESCE(motivo, 'Frequencia abaixo do limite exigido.') AS descricao,
           data_inicio::text AS data_alerta
         FROM alerta
         WHERE id_aluno = $1
           AND (
             tipo = 1
             OR LOWER(COALESCE(motivo, '')) LIKE '%frequ%'
           )
         ORDER BY data_inicio DESC, id_alerta DESC`,
        [ra]
      );

      alertas = alertasRes.rows;
    } catch (error: any) {
      if (!CODIGOS_SCHEMA_ALERTA_TOLERAVEIS.has(error?.code)) {
        throw error;
      }

      console.warn('[JornadaRepository] Alertas indisponiveis por incompatibilidade de schema.', {
        ra,
        code: error?.code,
        message: error?.message,
      });
    }

    return {
      frequencia_percentual: frequenciaPercentual,
      alertas,
    };
  }
}

export default new JornadaRepository();
