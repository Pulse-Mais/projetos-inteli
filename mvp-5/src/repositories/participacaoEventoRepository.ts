import { pool } from '../db/pool';
import type { ParticipacaoEvento, CriarParticipacaoEventoDTO } from '../models/participacaoEvento';

const COLUNAS = `id, id_jovem, id_evento, evento, data, presente`;

export async function inserir(dados: CriarParticipacaoEventoDTO): Promise<ParticipacaoEvento> {
  const { rows } = await pool.query<ParticipacaoEvento>(
    `INSERT INTO participacao_evento (id_jovem, id_evento, evento, data, presente)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUNAS}`,
    [dados.id_jovem, dados.id_evento, dados.evento, dados.data, dados.presente]
  );

  return rows[0];
}

export async function buscarPorId(id: number): Promise<ParticipacaoEvento | null> {
  const { rows } = await pool.query<ParticipacaoEvento>(
    `SELECT ${COLUNAS} FROM participacao_evento WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function buscarPorJovem(idJovem: number): Promise<ParticipacaoEvento[]> {
  const { rows } = await pool.query<ParticipacaoEvento>(
    `SELECT ${COLUNAS} FROM participacao_evento WHERE id_jovem = $1 ORDER BY data DESC`,
    [idJovem]
  );

  return rows;
}

export async function buscarPorEvento(idEvento: number): Promise<ParticipacaoEvento[]> {
  const { rows } = await pool.query<ParticipacaoEvento>(
    `SELECT ${COLUNAS} FROM participacao_evento WHERE id_evento = $1 ORDER BY id_jovem`,
    [idEvento]
  );

  return rows;
}

export async function calcularTaxaParticipacao(idJovem: number): Promise<number> {
  const { rows } = await pool.query<{ taxa: number | null }>(
    `SELECT
       ROUND(
         COUNT(*) FILTER (WHERE presente = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
         2
       ) AS taxa
     FROM participacao_evento
     WHERE id_jovem = $1`,
    [idJovem]
  );

  return rows[0]?.taxa ?? 0;
}

export async function buscarCalendario(): Promise<
  Array<{ evento: string; data: Date; total_participantes: number }>
> {
  const { rows } = await pool.query<{
    evento: string;
    data: Date;
    total_participantes: number;
  }>(
    `SELECT
       e.nome AS evento,
       e.data,
       COUNT(pe.id) AS total_participantes
     FROM participacao_evento pe
     JOIN evento e ON pe.id_evento = e.id
     GROUP BY e.id, e.nome, e.data
     ORDER BY e.data ASC`
  );

  return rows;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM participacao_evento WHERE id = $1',
    [id]
  );

  return (rowCount ?? 0) > 0;
}
