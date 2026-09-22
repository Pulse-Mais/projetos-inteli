import { pool } from '../db/pool';
import { ComputadorDoado, CriarComputadorDoadoDTO } from '../models/computadorDoado';

const COLUNAS = `id, id_jovem, data_doacao, data_devolucao, modelo`;

export async function listarPorJovem(id_jovem: number): Promise<ComputadorDoado[]> {
  const { rows } = await pool.query<ComputadorDoado>(
    `SELECT ${COLUNAS} FROM computador_doado WHERE id_jovem = $1 ORDER BY data_doacao DESC`,
    [id_jovem]
  );
  return rows;
}

export async function criar(dto: CriarComputadorDoadoDTO): Promise<ComputadorDoado> {
  const { rows } = await pool.query<ComputadorDoado>(
    `INSERT INTO computador_doado (id_jovem, data_doacao, data_devolucao, modelo)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUNAS}`,
    [dto.id_jovem, dto.data_doacao, dto.data_devolucao ?? null, dto.modelo]
  );
  return rows[0];
}

export async function totalNaoDevolvidos(): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    'SELECT COUNT(*) AS total FROM computador_doado WHERE data_devolucao IS NULL'
  );
  return Number(rows[0].total);
}
