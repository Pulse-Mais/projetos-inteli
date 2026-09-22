import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const res = await pool.query('SELECT name FROM migrations');
  return new Set(res.rows.map(r => r.name));
}

async function migrate() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Ignorando ${file} (já aplicada)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');

    console.log(`Aplicando ${file}...`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');

      console.log(`${file} aplicada com sucesso`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Erro em ${file}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('Migrations concluídas.');
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});