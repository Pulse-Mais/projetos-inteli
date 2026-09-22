import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não definida no .env');
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('connect', (client) => {
  client.query("SET client_encoding = 'UTF8'").catch((err) => {
    console.error('[pool] Falha ao definir client_encoding UTF8:', err);
  });
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do Postgres:', err);
});