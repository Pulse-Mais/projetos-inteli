import { pool } from '../db/migrations/connection';

jest.setTimeout(20000);

describe('PostgreSQL de testes', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('deve conectar ao PostgreSQL de teste', async () => {
    const resultado = await pool.query(
      'SELECT id_usuario FROM usuario LIMIT 1',
    );

    expect(Array.isArray(resultado.rows)).toBe(true);
  });
});