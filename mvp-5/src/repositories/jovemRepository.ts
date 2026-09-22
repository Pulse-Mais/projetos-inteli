import { pool } from '../db/pool';
import type { Jovem, JovemCriacao, JovemAtualizacao, JovemFiltros } from '../models/jovem';
import type { PoolClient } from 'pg';
import { mapearErroPg } from '../helpers/pgErro';

const COLUNAS = `id, nome, email, telefone, cpf, data_nascimento, endereco,
  genero, renda_inicial, categoria_atual, status_global,
  criado_em, atualizado_em`;

export async function buscarPorId(id: number): Promise<Jovem | null> {
  const { rows } = await pool.query<Jovem>(
    `SELECT ${COLUNAS} FROM jovem WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function buscarPorCpf(cpf: string): Promise<Jovem | null> {
  const { rows } = await pool.query<Jovem>(
    `SELECT ${COLUNAS} FROM jovem WHERE cpf = $1`,
    [cpf]
  );
  return rows[0] ?? null;
}

/** RN01 — verifica duplicata de e-mail antes do INSERT. */
export async function buscarPorEmail(email: string): Promise<Jovem | null> {
  const { rows } = await pool.query<Jovem>(
    `SELECT ${COLUNAS} FROM jovem WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarComFiltros(filtros: JovemFiltros): Promise<Jovem[]> {
  const condicoes: string[] = [];
  const valores: unknown[] = [];

  if (filtros.categoria !== undefined) {
    valores.push(filtros.categoria);
    condicoes.push(`j.categoria_atual = $${valores.length}`);
  }

  if (filtros.status_global !== undefined) {
    valores.push(filtros.status_global);
    condicoes.push(`j.status_global = $${valores.length}`);
  }

  if (filtros.programa !== undefined) {
    valores.push(filtros.programa);
    condicoes.push(`EXISTS (
      SELECT 1 FROM inscricao_programa ip
       WHERE ip.id_jovem = j.id
         AND ip.id_programa = $${valores.length}
    )`);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  const { rows } = await pool.query<Jovem>(
    `SELECT j.id, j.nome, j.email, j.telefone, j.cpf, j.data_nascimento,
            j.endereco, j.genero, j.renda_inicial, j.categoria_atual,
            j.status_global, j.criado_em, j.atualizado_em
       FROM jovem j
       ${where}
      ORDER BY j.criado_em DESC`,
    valores
  );
  return rows;
}

export async function inserir(
  dados: JovemCriacao,
  client?: PoolClient
): Promise<Jovem> {
  const executor = client ?? pool;

  try {
    const { rows } = await executor.query<Jovem>(
      `INSERT INTO jovem
         (nome, email, telefone, cpf, data_nascimento, endereco,
          genero, renda_inicial, categoria_atual, status_global,
          criado_em, atualizado_em)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Conectado', 'Ativo', NOW(), NOW())
       RETURNING ${COLUNAS}`,
      [
        dados.nome,
        dados.email,
        dados.telefone ?? null,
        dados.cpf ?? null,
        dados.data_nascimento ?? null,
        dados.endereco ?? null,
        dados.genero ?? null,
        dados.renda_inicial ?? null,
      ]
    );
    return rows[0];
  } catch (e) {
    // 23505 (unique) / 23503 (FK) mapeados para AppError; demais repropagados.
    mapearErroPg(e, 'email já cadastrado');
  }
}

export async function atualizar(
  id: number,
  dados: JovemAtualizacao
): Promise<Jovem | null> {
  const sets: string[] = [];
  const valores: unknown[] = [];

  const adicionar = (coluna: string, valor: unknown): void => {
    valores.push(valor);
    sets.push(`${coluna} = $${valores.length}`);
  };

  if (dados.nome !== undefined) adicionar('nome', dados.nome);
  if (dados.email !== undefined) adicionar('email', dados.email);
  if (dados.telefone !== undefined) adicionar('telefone', dados.telefone);
  if (dados.endereco !== undefined) adicionar('endereco', dados.endereco);
  if (dados.genero !== undefined) adicionar('genero', dados.genero);
  if (dados.data_nascimento !== undefined) adicionar('data_nascimento', dados.data_nascimento);
  // renda_inicial excluída intencionalmente — imutável após criação (RN05).
  if (dados.categoria_atual !== undefined) adicionar('categoria_atual', dados.categoria_atual);
  if (dados.status_global !== undefined) adicionar('status_global', dados.status_global);

  if (sets.length === 0) return buscarPorId(id);

  sets.push('atualizado_em = NOW()');

  valores.push(id);
  const { rows } = await pool.query<Jovem>(
    `UPDATE jovem
        SET ${sets.join(', ')}
      WHERE id = $${valores.length}
     RETURNING ${COLUNAS}`,
    valores
  );
  return rows[0] ?? null;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE jovem
        SET status_global = 'Inativo', atualizado_em = NOW()
      WHERE id = $1`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}
