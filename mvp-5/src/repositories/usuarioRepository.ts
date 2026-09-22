import { pool } from '../db/pool';
import { mapearErroPg } from '../helpers/pgErro';
import type {
  Usuario,
  CriarUsuarioInput,
  AtualizarUsuarioInput
} from '../models/usuario';

const COLUNAS = `id, id_jovem, nome, email, perfil, criado_em, telefone, cidade,
  area_atuacao, disponibilidade, biografia, crp, especializacao, abordagem,
  horario_atendimento`;

export async function buscarPorId(id: number): Promise<Usuario | null> {
  const { rows } = await pool.query<Usuario>(
    `SELECT ${COLUNAS} FROM usuario WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listarTodos(): Promise<Usuario[]> {
  const { rows } = await pool.query<Usuario>(
    `SELECT ${COLUNAS} FROM usuario ORDER BY criado_em DESC`
  );
  return rows;
}

export async function criar(input: CriarUsuarioInput): Promise<Usuario> {
  try {
    const { rows } = await pool.query<Usuario>(
      `INSERT INTO usuario (id_jovem, nome, email, perfil, criado_em)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING ${COLUNAS}`,
      [input.id_jovem ?? null, input.nome, input.email, input.perfil]
    );
    return rows[0];
  } catch (e) {
    // 23505 (unique) / 23503 (FK) mapeados para AppError; demais repropagados.
    mapearErroPg(e, 'email ou vínculo de jovem já cadastrado');
  }
}

export async function atualizar(
  id: number,
  input: AtualizarUsuarioInput
): Promise<Usuario | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (input.nome !== undefined) {
    campos.push(`nome = $${i++}`);
    valores.push(input.nome);
  }
  if (input.email !== undefined) {
    campos.push(`email = $${i++}`);
    valores.push(input.email);
  }
  if (input.perfil !== undefined) {
    campos.push(`perfil = $${i++}`);
    valores.push(input.perfil);
  }
  if (input.telefone !== undefined) {
    campos.push(`telefone = $${i++}`);
    valores.push(input.telefone);
  }
  if (input.cidade !== undefined) {
    campos.push(`cidade = $${i++}`);
    valores.push(input.cidade);
  }
  if (input.area_atuacao !== undefined) {
    campos.push(`area_atuacao = $${i++}`);
    valores.push(input.area_atuacao);
  }
  if (input.disponibilidade !== undefined) {
    campos.push(`disponibilidade = $${i++}`);
    valores.push(input.disponibilidade);
  }
  if (input.biografia !== undefined) {
    campos.push(`biografia = $${i++}`);
    valores.push(input.biografia);
  }
  if (input.crp !== undefined) {
    campos.push(`crp = $${i++}`);
    valores.push(input.crp);
  }
  if (input.especializacao !== undefined) {
    campos.push(`especializacao = $${i++}`);
    valores.push(input.especializacao);
  }
  if (input.abordagem !== undefined) {
    campos.push(`abordagem = $${i++}`);
    valores.push(input.abordagem);
  }
  if (input.horario_atendimento !== undefined) {
    campos.push(`horario_atendimento = $${i++}`);
    valores.push(input.horario_atendimento);
  }

  if (campos.length === 0) return buscarPorId(id);

  valores.push(id);

  const { rows } = await pool.query<Usuario>(
    `UPDATE usuario SET ${campos.join(', ')} WHERE id = $${i} RETURNING ${COLUNAS}`,
    valores
  );
  return rows[0] ?? null;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM usuario WHERE id = $1',
    [id]
  );
  return (rowCount ?? 0) > 0;
}
