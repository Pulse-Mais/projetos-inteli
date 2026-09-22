import fs from 'fs';
import path from 'path';
import { pool } from './connection';

async function migrate() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf-8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  await pool.end();
  console.log('Migrations completed successfully');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
