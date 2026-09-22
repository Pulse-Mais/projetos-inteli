// Traz as importações e a conexão com o banco 
import { pool } from '../db/pool';
import type { HistoricoAcoes, RegistrarAcaoInput } from '../models/historicoAcoes';

const COLUNAS = `h.id, h.id_usuario, h.id_jovem_afetado, h.acao,
  h.tabela_afetada, h.valor_anterior, h.data_hora`;

export async function listar(limit = 20): Promise<HistoricoAcoes[]> {
  const { rows } = await pool.query<HistoricoAcoes>(
    `SELECT ${COLUNAS}, j.nome AS nome_jovem
     FROM historico_acoes h
     LEFT JOIN jovem j ON j.id = h.id_jovem_afetado
     ORDER BY h.data_hora DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

// Função que grava um novo registro de auditoria no banco
export async function inserir(input: RegistrarAcaoInput): Promise<HistoricoAcoes> {
  const { rows } = await pool.query<HistoricoAcoes>(
    `INSERT INTO historico_acoes
       (id_usuario, id_jovem_afetado, acao, tabela_afetada, valor_anterior, data_hora)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, id_usuario, id_jovem_afetado, acao, tabela_afetada, valor_anterior, data_hora`,
    [
      input.id_usuario,
      input.id_jovem_afetado ?? null,
      input.acao,
      input.tabela_afetada,
      input.valor_anterior ?? null,
    ]
  );
  return rows[0];
}