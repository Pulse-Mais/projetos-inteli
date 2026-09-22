import { pool } from '../db/pool';
import type {
  AtualizarEventoDTO,
  CriarEventoDTO,
  Evento,
  EventoFiltros,
  EventoResumo,
} from '../models/evento';

type EventoResumoRow = Omit<EventoResumo, 'total_inscritos' | 'taxa_presenca'> & {
  total_inscritos: number | string;
  taxa_presenca: number | string;
};

function mapearResumo(row: EventoResumoRow): EventoResumo {
  return {
    ...row,
    total_inscritos: Number(row.total_inscritos),
    taxa_presenca: Number(row.taxa_presenca),
  };
}

const resumoSql = `
  SELECT
    e.id,
    e.nome,
    e.data,
    e.descricao,
    COUNT(pe.id)::INTEGER AS total_inscritos,
    COALESCE(
      ROUND(
        COUNT(pe.id) FILTER (WHERE pe.presente = true)::NUMERIC
        / NULLIF(COUNT(pe.id), 0) * 100,
        2
      ),
      0
    ) AS taxa_presenca
  FROM evento e
  LEFT JOIN participacao_evento pe ON pe.id_evento = e.id
`;

export async function listar(
  filtros: EventoFiltros = {}
): Promise<EventoResumo[]> {
  const valores: unknown[] = [];
  const condicoes: string[] = [];

  if (filtros.busca?.trim()) {
    valores.push(`%${filtros.busca.trim()}%`);
    condicoes.push(
      `(e.nome ILIKE $${valores.length} OR COALESCE(e.descricao, '') ILIKE $${valores.length})`
    );
  }

  if (filtros.data) {
    valores.push(filtros.data);
    condicoes.push(`e.data::date = $${valores.length}::date`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const { rows } = await pool.query<EventoResumoRow>(
    `${resumoSql}
     ${where}
     GROUP BY e.id, e.nome, e.data, e.descricao
     ORDER BY e.data ASC`,
    valores
  );
  return rows.map(mapearResumo);
}

export async function buscarPorId(id: number): Promise<EventoResumo | null> {
  const { rows } = await pool.query<EventoResumoRow>(
    `${resumoSql}
     WHERE e.id = $1
     GROUP BY e.id, e.nome, e.data, e.descricao`,
    [id]
  );
  return rows[0] ? mapearResumo(rows[0]) : null;
}

export async function criar(dados: CriarEventoDTO): Promise<Evento> {
  const { rows } = await pool.query<Evento>(
    `INSERT INTO evento (nome, data, descricao)
     VALUES ($1, $2, $3)
     RETURNING id, nome, data, descricao`,
    [dados.nome.trim(), dados.data, dados.descricao?.trim() || null]
  );
  return rows[0];
}

export async function atualizar(
  id: number,
  dados: AtualizarEventoDTO
): Promise<Evento | null> {
  const { rows } = await pool.query<Evento>(
    `UPDATE evento
        SET nome = COALESCE($1, nome),
            data = COALESCE($2, data),
            descricao = CASE WHEN $3::boolean THEN $4 ELSE descricao END
      WHERE id = $5
      RETURNING id, nome, data, descricao`,
    [
      dados.nome?.trim() ?? null,
      dados.data ?? null,
      dados.descricao !== undefined,
      dados.descricao?.trim() || null,
      id,
    ]
  );
  return rows[0] ?? null;
}

export async function remover(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM evento WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
