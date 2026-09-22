/**
 * scripts/seed-demo.js
 * MODO DEMONSTRAÇÃO — carrega dados fictícios (jovens, programas, eventos,
 * mentorias, etc.) para visualizar o sistema povoado.
 *
 * ⚠️  NÃO usar em produção. O Modo Produção sobe sem nenhum dado de negócio.
 *
 * Aplica todos os arquivos de src/database/seeds/ em ordem numérica. Os seeds
 * usam TRUNCATE ... RESTART IDENTITY CASCADE, então podem ser reaplicados.
 *
 * Uso:
 *   node src/scripts/seed-demo.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');
const { resolvePgSSL } = require('../database/ssl');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolvePgSSL(),
});

const SEEDS_DIR = path.resolve(__dirname, '../database/seeds');

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n🌱 MODO DEMONSTRAÇÃO — carregando dados fictícios (NÃO usar em produção)...\n');

    const arquivos = fs
      .readdirSync(SEEDS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ordem numérica pelo prefixo 001_, 002_, ...

    let aplicados = 0;

    for (const arquivo of arquivos) {
      const sql = fs.readFileSync(path.join(SEEDS_DIR, arquivo), 'utf8');
      try {
        await client.query(sql);
        console.log(`  ✅ ${arquivo}`);
        aplicados++;
      } catch (err) {
        console.warn(`  ⚠️  ${arquivo}: ${err.message}`);
      }
    }

    console.log(`\n✅ ${aplicados} seed(s) de demonstração aplicado(s).`);
    console.log('   Lembre-se: usuários do seed têm senha fictícia e não logam.');
    console.log('   Rode `npm run setup:gestor` para criar um login real.\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
