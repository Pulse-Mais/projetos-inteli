// Traz as importações e a conexão com o banco
import { pool } from '../db/pool';
import type {
  RegistroAcompanhamento,
  CriarRegistroInput,
  AtualizarRegistroInput,
} from '../models/registroAcompanhamento';
import type { Visibilidade } from '../models/enums';

const COLUNAS = `id, id_jovem, id_autor, tipo_registro, conteudo,
  visibilidade, data_registro`;

// Função que realiza uma consulta simples no banco para encontrar um registro de acompanhamento específico
export async function buscarPorId(id: number): Promise<RegistroAcompanhamento | null> {
  const { rows } = await pool.query<RegistroAcompanhamento>(
    `SELECT ${COLUNAS} FROM registro_acompanhamento WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

// Função que busca todos os registros de acompanhamento vinculados a um jovem específico
export async function listarPorJovem(
  idJovem: number,
  apenasPublico: boolean
): Promise<RegistroAcompanhamento[]> {
  if (apenasPublico) {
    const { rows } = await pool.query<RegistroAcompanhamento>(
      `SELECT ${COLUNAS} FROM registro_acompanhamento
       WHERE id_jovem = $1 AND visibilidade = $2
       ORDER BY data_registro DESC`,
      [idJovem, 'Publico_Equipe' satisfies Visibilidade]
    );
    return rows;
  }

  const { rows } = await pool.query<RegistroAcompanhamento>(
    `SELECT ${COLUNAS} FROM registro_acompanhamento
     WHERE id_jovem = $1
     ORDER BY data_registro DESC`,
    [idJovem]
  );
  return rows;
}

// Função que insere uma nova linha na tabela de registros de acompanhamento
export async function criar(
  idJovem: number,
  input: CriarRegistroInput
): Promise<RegistroAcompanhamento> {
  const { rows } = await pool.query<RegistroAcompanhamento>(
    `INSERT INTO registro_acompanhamento
       (id_jovem, id_autor, tipo_registro, visibilidade, conteudo, data_registro)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING ${COLUNAS}`,
    [idJovem, input.id_autor, input.tipo_registro, input.visibilidade, input.conteudo]
  );
  return rows[0];
}

// Função que atualiza parcialmente (PATCH) um registro existente.
export async function atualizar(
  id: number,
  input: AtualizarRegistroInput
): Promise<RegistroAcompanhamento | null> {
  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (input.tipo_registro !== undefined) {
    campos.push(`tipo_registro = $${i++}`);
    valores.push(input.tipo_registro);
  }
  if (input.visibilidade !== undefined) {
    campos.push(`visibilidade = $${i++}`);
    valores.push(input.visibilidade);
  }
  if (input.conteudo !== undefined) {
    campos.push(`conteudo = $${i++}`);
    valores.push(input.conteudo);
  }

  if (campos.length === 0) return buscarPorId(id);

  valores.push(id);
  const { rows } = await pool.query<RegistroAcompanhamento>(
    `UPDATE registro_acompanhamento
        SET ${campos.join(', ')}
      WHERE id = $${i}
     RETURNING ${COLUNAS}`,
    valores
  );
  return rows[0] ?? null;
}
