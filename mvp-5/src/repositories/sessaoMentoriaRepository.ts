import { pool } from '../db/pool';
import type {
  SessaoMentoria,
  CriarSessaoMentoriaDTO,
  AtualizarSessaoMentoriaDTO,
} from '../models/sessaoMentoria';

const COLUNAS = `id, id_jovem, id_mentor, data, presente, avaliacao, duracao_minutos`;

export async function buscarPorMentor(id_mentor: number): Promise<SessaoMentoria[]> {
  const { rows } = await pool.query<SessaoMentoria>(
    `SELECT ${COLUNAS} FROM sessao_mentoria WHERE id_mentor = $1 ORDER BY data DESC`,
    [id_mentor]
  );
  return rows;
}

export async function buscarPorId(id: number): Promise<SessaoMentoria | null> {
  const { rows } = await pool.query<SessaoMentoria>(
    `SELECT ${COLUNAS} FROM sessao_mentoria WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function buscarPorJovem(id_jovem: number): Promise<SessaoMentoria[]> {
  const { rows } = await pool.query<SessaoMentoria>(
    `SELECT ${COLUNAS} FROM sessao_mentoria WHERE id_jovem = $1 ORDER BY data DESC`,
    [id_jovem]
  );
  return rows;
}

export async function criar(dados: CriarSessaoMentoriaDTO): Promise<SessaoMentoria> {
  const { rows } = await pool.query<SessaoMentoria>(
    `INSERT INTO sessao_mentoria (id_jovem, id_mentor, data, presente, avaliacao, duracao_minutos)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUNAS}`,
    [dados.id_jovem, dados.id_mentor, dados.data, dados.presente, dados.avaliacao ?? null, dados.duracao_minutos ?? 60]
  );
  return rows[0];
}

export async function atualizar(
  id: number,
  dados: AtualizarSessaoMentoriaDTO
): Promise<SessaoMentoria | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (dados.data !== undefined) { campos.push(`data = $${i++}`); valores.push(dados.data); }
  if (dados.presente !== undefined) { campos.push(`presente = $${i++}`); valores.push(dados.presente); }
  if (dados.avaliacao !== undefined) { campos.push(`avaliacao = $${i++}`); valores.push(dados.avaliacao); }
  if (dados.duracao_minutos !== undefined) { campos.push(`duracao_minutos = $${i++}`); valores.push(dados.duracao_minutos); }

  if (campos.length === 0) return buscarPorId(id);

  valores.push(id);
  const { rows } = await pool.query<SessaoMentoria>(
    `UPDATE sessao_mentoria SET ${campos.join(', ')} WHERE id = $${i} RETURNING ${COLUNAS}`,
    valores
  );
  return rows[0] ?? null;
}
