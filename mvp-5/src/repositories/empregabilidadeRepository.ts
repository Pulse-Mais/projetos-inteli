import { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { Empregabilidade } from '../models/empregabilidade';
import { SituacaoEmpregabilidade, TipoContrato } from '../models/enums';

const COLUNAS = `id, id_jovem, situacao, vinculo, empresa, area_atuacao,
  renda_atual, data_registro, encerrado, data_final`;

export async function buscarPorJovem(id_jovem: number): Promise<Empregabilidade[]> {
  const { rows } = await pool.query<Empregabilidade>(
    `SELECT ${COLUNAS} FROM empregabilidade WHERE id_jovem = $1 ORDER BY data_registro DESC`,
    [id_jovem]
  );
  return rows;
}

export async function encerrarAtivos(client: PoolClient, id_jovem: number): Promise<void> {
  await client.query(
    'UPDATE empregabilidade SET encerrado = 1 WHERE id_jovem = $1 AND encerrado = 0',
    [id_jovem]
  );
}

export async function inserir(
  client: PoolClient,
  dados: {
    id_jovem: number;
    situacao: SituacaoEmpregabilidade;
    vinculo: TipoContrato | null;
    empresa: string | null;
    area_atuacao: string | null;
    renda_atual: number | null;
  }
): Promise<Empregabilidade> {
  const { rows } = await client.query<Empregabilidade>(
    `INSERT INTO empregabilidade (id_jovem, situacao, vinculo, empresa, area_atuacao, renda_atual, data_registro, encerrado)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 0)
     RETURNING ${COLUNAS}`,
    [dados.id_jovem, dados.situacao, dados.vinculo, dados.empresa, dados.area_atuacao, dados.renda_atual]
  );
  return rows[0];
}

export async function contarEmpregados(): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT id_jovem) AS total
       FROM empregabilidade
      WHERE encerrado = 0 AND situacao = 'Empregado'`
  );
  return Number(rows[0]?.total ?? 0);
}

export async function calcularIncrementoRendaMedio(): Promise<number> {
  const { rows } = await pool.query<{ media: string | null }>(
    `SELECT AVG(e.renda_atual - j.renda_inicial) AS media
       FROM empregabilidade e
       JOIN jovem j ON e.id_jovem = j.id
      WHERE e.encerrado = 0
        AND e.renda_atual IS NOT NULL
        AND j.renda_inicial IS NOT NULL`
  );
  return parseFloat(rows[0]?.media ?? '0') || 0;
}
