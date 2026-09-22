import { pool } from '../db/pool';
import type { VinculoMentoria } from '../models/sessaoMentoria';

const COLUNAS = `id, id_mentor, id_jovem, status_vinculo, data_inicio, data_fim`;

export async function buscarPorMentor(id_mentor: number): Promise<VinculoMentoria[]> {
  const { rows } = await pool.query<VinculoMentoria>(
    `SELECT ${COLUNAS} FROM vinculo_mentoria WHERE id_mentor = $1 ORDER BY data_inicio DESC`,
    [id_mentor]
  );
  return rows;
}

export async function buscarPorMentorEJovem(
  id_mentor: number,
  id_jovem: number
): Promise<VinculoMentoria | null> {
  const { rows } = await pool.query<VinculoMentoria>(
    `SELECT ${COLUNAS} FROM vinculo_mentoria WHERE id_mentor = $1 AND id_jovem = $2`,
    [id_mentor, id_jovem]
  );
  return rows[0] ?? null;
}
