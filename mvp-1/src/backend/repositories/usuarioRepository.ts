import { pool } from '../db/migrations/connection';

export interface CoordData {
  area: string;
  telefone?: string | null;
  cargo?: string | null;
  data_admissao?: string | null;
  cidade_nascimento?: string | null;
  estado_nascimento?: string | null;
}

export interface MentorData {
  especialidade?: string | null;
  tipo_vinculo?: string | null;
  disponibilidade?: string | null;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  senha?: string;
  cpf: string;
  foto_url?: string | null;
  coordenador?: CoordData | null;
  mentor?: MentorData | null;
}

export interface CreateUsuarioData {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  foto_url?: string | null;
}

/**
 * SELECT * FROM usuario ORDER BY id_usuario.
 */
export async function findAll(): Promise<Usuario[]> {
  const result = await pool.query<Usuario>(
    `
    SELECT
      id_usuario,
      nome,
      email,
      senha,
      cpf,
      foto_url
    FROM usuario
    ORDER BY id_usuario
    `
  );

  return result.rows;
}

/**
 * SELECT usuario WHERE id_usuario = id.
 */
export async function findById(
  id: number
): Promise<Usuario | null> {
  const result = await pool.query<Usuario>(
    `
    SELECT
      id_usuario,
      nome,
      email,
      cpf,
      foto_url
    FROM usuario
    WHERE id_usuario = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

/**
 * SELECT usuario JOIN coordenador WHERE email = email.
 */
export async function findCoordByEmail(
  email: string
): Promise<Usuario | null> {
  const result = await pool.query<Usuario>(
    `
    SELECT
      u.id_usuario,
      u.nome,
      u.email,
      u.cpf,
      u.foto_url
    FROM usuario u
    INNER JOIN coordenador c
      ON c.id_usuario = u.id_usuario
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

/**
 * UPDATE coordenador WHERE id_usuario = id.
 */
export async function updateCoord(
  id: number,
  fields: Partial<CoordData>
): Promise<void> {
  const allowedFields = [
    'area',
    'telefone',
    'cargo',
    'data_admissao',
    'cidade_nascimento',
    'estado_nascimento',
  ];

  const entries = Object.entries(fields).filter(
    ([field]) => allowedFields.includes(field)
  );

  if (entries.length === 0) {
    return;
  }

  const setClauses = entries.map(
    ([field], index) => `${field} = $${index + 1}`
  );

  const values: any[] = entries.map(([, value]) => value);

  values.push(id);

  await pool.query(
    `
    UPDATE coordenador
    SET ${setClauses.join(', ')}
    WHERE id_usuario = $${values.length}
    `,
    values
  );
}

/**
 * UPDATE mentor WHERE id_usuario = id.
 */
export async function updateMentor(
  id: number,
  fields: Partial<MentorData>
): Promise<void> {
  const allowedFields = [
    'especialidade',
    'tipo_vinculo',
    'disponibilidade',
  ];

  const entries = Object.entries(fields).filter(
    ([field]) => allowedFields.includes(field)
  );

  if (entries.length === 0) {
    return;
  }

  const setClauses = entries.map(
    ([field], index) => `${field} = $${index + 1}`
  );

  const values: any[] = entries.map(([, value]) => value);

  values.push(id);

  await pool.query(
    `
    UPDATE mentor
    SET ${setClauses.join(', ')}
    WHERE id_usuario = $${values.length}
    `,
    values
  );
}

/**
 * SELECT usuario WHERE email case-insensitive.
 */
export async function findByEmail(
  email: string
): Promise<Usuario | null> {
  const result = await pool.query<Usuario>(
    `
    SELECT
      id_usuario,
      nome,
      email,
      senha,
      cpf,
      foto_url
    FROM usuario
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

/**
 * SELECT usuario WHERE cpf = cpf.
 */
export async function findByCpf(
  cpf: string
): Promise<Usuario | null> {
  const result = await pool.query<Usuario>(
    `
    SELECT
      id_usuario,
      nome,
      email,
      senha,
      cpf,
      foto_url
    FROM usuario
    WHERE cpf = $1
    LIMIT 1
    `,
    [cpf]
  );

  return result.rows[0] ?? null;
}

/**
 * INSERT INTO usuario.
 */
export async function create(
  data: CreateUsuarioData
): Promise<Usuario> {
  const result = await pool.query<Usuario>(
    `
    INSERT INTO usuario (
      nome,
      email,
      senha,
      cpf,
      foto_url
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id_usuario,
      nome,
      email,
      senha,
      cpf,
      foto_url
    `,
    [
      data.nome,
      data.email,
      data.senha,
      data.cpf,
      data.foto_url ?? null,
    ]
  );

  return result.rows[0];
}

/**
 * UPDATE usuario WHERE id_usuario = id.
 */
export async function update(
  id: number,
  data: Partial<Omit<Usuario, 'id_usuario'>>
): Promise<Usuario | null> {
  const allowedFields = [
    'nome',
    'email',
    'senha',
    'cpf',
    'foto_url',
  ];

  const entries = Object.entries(data).filter(
    ([field]) => allowedFields.includes(field)
  );

  if (entries.length === 0) {
    return findById(id);
  }

  const setClauses = entries.map(
    ([field], index) => `${field} = $${index + 1}`
  );

  const values: any[] = entries.map(([, value]) => value);

  values.push(id);

  const result = await pool.query<Usuario>(
    `
    UPDATE usuario
    SET ${setClauses.join(', ')}
    WHERE id_usuario = $${values.length}
    RETURNING
      id_usuario,
      nome,
      email,
      senha,
      cpf,
      foto_url
    `,
    values
  );

  return result.rows[0] ?? null;
}

/**
 * DELETE FROM usuario WHERE id_usuario = id.
 */
export async function remove(
  id: number
): Promise<boolean> {
  const result = await pool.query(
    `
    DELETE FROM usuario
    WHERE id_usuario = $1
    `,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}