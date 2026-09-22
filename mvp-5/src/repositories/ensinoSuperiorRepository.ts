import { pool } from '../db/pool';
import { EnsinoSuperior } from '../models/ensinoSuperior';
import { SituacaoEnsinoSuperior } from '../models/enums';

const COLUNAS = `id, id_jovem, ingressou, situacao, instituicao, data_registro`;

export async function buscarPorJovem(id_jovem: number): Promise<EnsinoSuperior[]> {
  const { rows } = await pool.query<EnsinoSuperior>(
    `SELECT ${COLUNAS} FROM ensino_superior WHERE id_jovem = $1 ORDER BY data_registro DESC`,
    [id_jovem]
  );
  return rows;
}

export async function inserir(dados: {
  id_jovem: number;
  ingressou: boolean;
  situacao: SituacaoEnsinoSuperior | null;
  instituicao: string | null;
}): Promise<EnsinoSuperior> {
  const { rows } = await pool.query<EnsinoSuperior>(
    `INSERT INTO ensino_superior (id_jovem, ingressou, situacao, instituicao, data_registro)
     VALUES ($1, $2, $3, $4, CURRENT_DATE)
     RETURNING ${COLUNAS}`,
    [dados.id_jovem, dados.ingressou ? 1 : 0, dados.situacao, dados.instituicao]
  );
  return rows[0];
}

export async function contarComIngressoSuperior(): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    `SELECT COUNT(DISTINCT id_jovem) AS total
       FROM ensino_superior
      WHERE ingressou = 1`
  );
  return Number(rows[0]?.total ?? 0);
}
