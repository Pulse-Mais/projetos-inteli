import { pool } from '../db/pool';
import type {
  Aula,
  AulaFiltros,
  AtualizarAulaDTO,
  CriarAulaDTO,
} from '../models/aula';

export async function listar(filtros: AulaFiltros = {}): Promise<Aula[]> {
  const valores: unknown[] = [];
  const condicoes: string[] = [];

  if (filtros.id_programa !== undefined) {
    valores.push(filtros.id_programa);
    condicoes.push(`id_programa = $${valores.length}`);
  }

  if (filtros.busca?.trim()) {
    valores.push(`%${filtros.busca.trim()}%`);
    condicoes.push(`nome ILIKE $${valores.length}`);
  }

  if (filtros.data) {
    valores.push(filtros.data);
    condicoes.push(`data::date = $${valores.length}::date`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const { rows } = await pool.query<Aula>(
    `SELECT id, id_programa, nome, data
       FROM aula
       ${where}
      ORDER BY data ASC`,
    valores
  );
  return rows;
}

export async function buscarPorId(id: number): Promise<Aula | null> {
  const { rows } = await pool.query<Aula>(
    'SELECT id, id_programa, nome, data FROM aula WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function criar(dados: CriarAulaDTO): Promise<Aula> {
  const { rows } = await pool.query<Aula>(
    `INSERT INTO aula (id_programa, nome, data)
     VALUES ($1, $2, $3)
     RETURNING id, id_programa, nome, data`,
    [dados.id_programa, dados.nome.trim(), dados.data]
  );
  return rows[0];
}

export async function atualizar(
  id: number,
  dados: AtualizarAulaDTO
): Promise<Aula | null> {
  const { rows } = await pool.query<Aula>(
    `UPDATE aula
        SET id_programa = COALESCE($1, id_programa),
            nome = COALESCE($2, nome),
            data = COALESCE($3, data)
      WHERE id = $4
      RETURNING id, id_programa, nome, data`,
    [
      dados.id_programa ?? null,
      dados.nome?.trim() ?? null,
      dados.data ?? null,
      id,
    ]
  );
  return rows[0] ?? null;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM aula WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
