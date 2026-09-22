/**
 * scripts/migrar.js
 * Aplica todas as migrations da pasta src/database/migrations/ em ordem.
 * Seguro para rodar várias vezes (todas usam IF NOT EXISTS).
 *
 * Uso:
 *   node scripts/migrar.js
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

const MIGRATIONS_DIR = path.resolve(__dirname, '../database/migrations');

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n🔧 Aplicando migrations...\n');

    const arquivos = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ordem numérica pelo prefixo 001_, 002_, ...

    let aplicadas = 0;

    for (const arquivo of arquivos) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, arquivo), 'utf8');
      try {
        await client.query(sql);
        console.log(`  ✅ ${arquivo}`);
        aplicadas++;
      } catch (err) {
        // Erros que indicam que a migration já foi aplicada são ignorados
        const ignorar = [
          'already exists',
          'duplicate column',
          'already exists, skipping',
        ];
        const deveIgnorar = ignorar.some(msg => err.message.toLowerCase().includes(msg));

        if (deveIgnorar) {
          console.log(`  ⏭  ${arquivo} (já aplicada)`);
        } else {
          console.warn(`  ⚠️  ${arquivo}: ${err.message}`);
        }
      }
    }

    console.log(`\n✅ ${aplicadas} migration(s) aplicada(s) com sucesso.\n`);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
