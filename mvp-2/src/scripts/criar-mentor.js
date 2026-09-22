/**
 * scripts/criar-mentor.js
 * Cria um usuário Mentor de teste no banco.
 *
 * Uso:
 *   node src/scripts/criar-mentor.js
 *   node src/scripts/criar-mentor.js "João Silva" "joao@pulse.org.br" "minhasenha"
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const bcrypt   = require('bcrypt');
const { resolvePgSSL } = require('../database/ssl');

const [, , nomeArg, emailArg, senhaArg] = process.argv;

const NOME  = nomeArg  || 'Mateo Sousa';
const EMAIL = emailArg || 'mateo.mentor@pulse.org.br';
const SENHA = senhaArg || 'senha123';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolvePgSSL(),
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n🔧 Criando usuário Mentor de teste...\n');

    const senhaHash = await bcrypt.hash(SENHA, 10);

    // O CHECK de perfil (com 'Mentor') vive na migration 001 — DDL versionada.
    // Rode as migrations antes deste script se o banco estiver desatualizado.

    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
       VALUES ($1, $2, $3, 'Mentor', TRUE)
       ON CONFLICT (email) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             perfil     = 'Mentor',
             ativo      = TRUE
       RETURNING id`,
      [NOME, EMAIL, senhaHash]
    );

    const res = await client.query('SELECT id FROM usuarios WHERE email = $1', [EMAIL]);
    const usuario_id = res.rows[0].id;

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('─────────────────────────────────');
    console.log(`  Nome   : ${NOME}`);
    console.log(`  Email  : ${EMAIL}`);
    console.log(`  Senha  : ${SENHA}`);
    console.log(`  Perfil : Mentor`);
    console.log(`  ID     : ${usuario_id}`);
    console.log('─────────────────────────────────\n');
    console.log('Acesse: http://localhost:3000/pages/login.html\n');

  } catch (err) {
    console.error('\n❌ Erro ao criar usuário:', err.message, '\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
