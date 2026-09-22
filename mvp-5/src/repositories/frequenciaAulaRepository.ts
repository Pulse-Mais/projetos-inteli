import { pool } from '../db/pool';
import type { FrequenciaAula, CriarFrequenciaAulaDTO } from '../models/frequenciaAula';

const COLUNAS = `id, id_jovem, id_aula, aula, data, presente`;

export async function inserir(dados: CriarFrequenciaAulaDTO): Promise<FrequenciaAula> {
  const { rows } = await pool.query<FrequenciaAula>(
    `INSERT INTO frequencia_aula (id_jovem, id_aula, data, presente, aula)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUNAS}`,
    [dados.id_jovem, dados.id_aula, dados.data, dados.presente, dados.aula]
  );
  return rows[0];
}

export async function buscarPorId(id: number): Promise<FrequenciaAula | null> {
  const { rows } = await pool.query<FrequenciaAula>(
    `SELECT ${COLUNAS} FROM frequencia_aula WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function buscarPorJovem(idJovem: number): Promise<FrequenciaAula[]> {
  const { rows } = await pool.query<FrequenciaAula>(
    `SELECT ${COLUNAS} FROM frequencia_aula WHERE id_jovem = $1 ORDER BY data DESC`,
    [idJovem]
  );
  return rows;
}

export async function buscarPorAula(idAula: number): Promise<FrequenciaAula[]> {
  const { rows } = await pool.query<FrequenciaAula>(
    `SELECT ${COLUNAS} FROM frequencia_aula WHERE id_aula = $1 ORDER BY id_jovem`,
    [idAula]
  );
  return rows;
}

/**
 * Taxa de presença do jovem em aulas (0–100).
 * Retorna 0 se não houver registros.
 */
export async function calcularTaxaPresenca(idJovem: number): Promise<number> {
  const { rows } = await pool.query<{ taxa: number | null }>(
    `SELECT ROUND(
       COUNT(*) FILTER (WHERE presente = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
       2
     ) AS taxa
     FROM frequencia_aula
     WHERE id_jovem = $1`,
    [idJovem]
  );
  return rows[0]?.taxa ?? 0;
}

/**
 * Mapa de presença agrupado por jovem — usado pelo dashboardService em Promise.all.
 */
export async function buscarMapaPresenca(): Promise<Array<{ id_jovem: number; taxa_presenca: number }>> {
  const { rows } = await pool.query<{ id_jovem: number; taxa_presenca: number }>(
    `SELECT
       id_jovem,
       ROUND(
         COUNT(*) FILTER (WHERE presente = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
         2
       ) AS taxa_presenca
     FROM frequencia_aula
     GROUP BY id_jovem
     ORDER BY id_jovem`
  );
  return rows;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM frequencia_aula WHERE id = $1',
    [id]
  );
  return (rowCount ?? 0) > 0;
}
