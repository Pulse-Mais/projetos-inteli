import { pool } from '../db/pool';
import type { Categoria, CategoriaCriacao } from '../models/categoria';
import type { PoolClient } from 'pg';

export async function inserir(
  dados: CategoriaCriacao,
  client?: PoolClient
): Promise<Categoria> {
  const executor = client ?? pool;

  const { rows } = await executor.query<Categoria>(
    `INSERT INTO categoria (id_jovem, id_usuario, categoria_adquirida, categoria_anterior, data_inclusao)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, id_jovem, id_usuario, categoria_adquirida, categoria_anterior, data_inclusao`,
    [
      dados.id_jovem,
      dados.id_usuario ?? null,
      dados.categoria_adquirida,
      dados.categoria_anterior ?? null,
    ]
  );
  return rows[0];
}

export async function listarPorJovem(idJovem: number): Promise<Categoria[]> {
  const { rows } = await pool.query<Categoria>(
    `SELECT id, id_jovem, id_usuario, categoria_adquirida, categoria_anterior, data_inclusao
       FROM categoria
      WHERE id_jovem = $1
      ORDER BY data_inclusao ASC`,
    [idJovem]
  );
  return rows;
}
