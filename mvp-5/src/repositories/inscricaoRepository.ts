import { pool } from '../db/pool';
import type { Inscricao, CriarInscricaoDTO } from '../models/inscricao';

const COLUNAS = `id, id_jovem, id_programa, status_conclusao, data_matricula, data_status`;

export async function buscarPorJovem(id_jovem: number): Promise<Inscricao[]> {
  const { rows } = await pool.query<Inscricao>(
    `SELECT ${COLUNAS}
     FROM inscricao_programa
     WHERE id_jovem = $1
     ORDER BY data_matricula DESC`,
    [id_jovem]
  );
  return rows;
}

export async function buscarPorJovemEPrograma(
  id_jovem: number,
  id_programa: number
): Promise<Inscricao | null> {
  const { rows } = await pool.query<Inscricao>(
    `SELECT ${COLUNAS} FROM inscricao_programa WHERE id_jovem = $1 AND id_programa = $2`,
    [id_jovem, id_programa]
  );
  return rows[0] ?? null;
}

export async function criar(dados: CriarInscricaoDTO): Promise<Inscricao> {
  const { rows } = await pool.query<Inscricao>(
    `INSERT INTO inscricao_programa (id_jovem, id_programa, status_conclusao, data_matricula, data_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUNAS}`,
    [
      dados.id_jovem,
      dados.id_programa,
      dados.status_conclusao,
      dados.data_matricula,
      dados.data_status ?? null,
    ]
  );
  return rows[0];
}
