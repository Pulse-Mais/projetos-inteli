import { pool } from '../db/pool';
import type { Programa, CriarProgramaDTO, AtualizarProgramaDTO } from '../models/programa';

const COLUNAS = `id, nome, descricao, data_inicio, data_fim`;

export async function listarTodos(): Promise<Programa[]> {
  const { rows } = await pool.query<Programa>(
    `SELECT ${COLUNAS} FROM programa ORDER BY data_inicio DESC`
  );
  return rows;
}

export async function buscarPorId(id: number): Promise<Programa | null> {
  const { rows } = await pool.query<Programa>(
    `SELECT ${COLUNAS} FROM programa WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function criar(dados: CriarProgramaDTO): Promise<Programa> {
  const { rows } = await pool.query<Programa>(
    `INSERT INTO programa (nome, descricao, data_inicio, data_fim)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUNAS}`,
    [dados.nome, dados.descricao ?? null, dados.data_inicio, dados.data_fim ?? null]
  );
  return rows[0];
}

export async function atualizar(id: number, dados: AtualizarProgramaDTO): Promise<Programa | null> {
  const { rows } = await pool.query<Programa>(
    `UPDATE programa
     SET nome        = COALESCE($1, nome),
         descricao   = COALESCE($2, descricao),
         data_inicio = COALESCE($3, data_inicio),
         data_fim    = COALESCE($4, data_fim)
     WHERE id = $5
     RETURNING ${COLUNAS}`,
    [dados.nome ?? null, dados.descricao ?? null, dados.data_inicio ?? null, dados.data_fim ?? null, id]
  );
  return rows[0] ?? null;
}

export async function listarJovensInscritos(
  id_programa: number
): Promise<{ id_jovem: number; nome: string; status_conclusao: string }[]> {
  const { rows } = await pool.query(
    `SELECT j.id AS id_jovem, j.nome, ip.status_conclusao
     FROM inscricao_programa ip
     JOIN jovem j ON j.id = ip.id_jovem
     WHERE ip.id_programa = $1
     ORDER BY j.nome ASC`,
    [id_programa]
  );
  return rows;
}

export async function listarAulas(
  id_programa: number
): Promise<{ id: number; nome: string; data: Date }[]> {
  const { rows } = await pool.query(
    `SELECT id, nome, data
     FROM aula
     WHERE id_programa = $1
     ORDER BY data ASC`,
    [id_programa]
  );
  return rows;
}
