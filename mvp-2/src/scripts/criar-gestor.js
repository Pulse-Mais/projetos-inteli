/**
 * scripts/criar-gestor.js
 * Cria um usuário Gestor de teste no banco.
 *
 * Por padrão usa o perfil 'Coordenacao' (administrador: visualiza e altera).
 * Para criar com outro perfil de gestão, passe-o como 4º argumento.
 * Perfis de gestão válidos: GestaoGeral, Coordenacao, Assistente, Psicologa.
 *
 * Uso:
 *   node src/scripts/criar-gestor.js
 *   node src/scripts/criar-gestor.js "Ana Gestora" "ana@pulse.org.br" "minhasenha"
 *   node src/scripts/criar-gestor.js "Ana Gestora" "ana@pulse.org.br" "minhasenha" "GestaoGeral"
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const bcrypt   = require('bcrypt');

const [, , nomeArg, emailArg, senhaArg, perfilArg] = process.argv;

const NOME   = nomeArg   || 'Denise Gestora';
const EMAIL  = emailArg  || 'denise.gestora@pulse.org.br';
const SENHA  = senhaArg  || 'senha123';
const PERFIL = perfilArg || 'Coordenacao';

const PERFIS_GESTAO = ['GestaoGeral', 'Coordenacao', 'Assistente', 'Psicologa'];

if (!PERFIS_GESTAO.includes(PERFIL)) {
  console.error(`\n❌ Perfil inválido: "${PERFIL}".`);
  console.error(`   Perfis de gestão válidos: ${PERFIS_GESTAO.join(', ')}\n`);
  process.exit(1);
}

const { resolvePgSSL } = require('../database/ssl');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolvePgSSL(),
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n🔧 Criando usuário Gestor de teste...\n');

    const senhaHash = await bcrypt.hash(SENHA, 10);

    /* Garante que o constraint aceita todos os perfis (bancos antigos podem não ter) */
    await client.query(`
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_perfil_check;
      ALTER TABLE usuarios ADD CONSTRAINT usuarios_perfil_check
        CHECK (perfil IN ('GestaoGeral','Coordenacao','Assistente','Psicologa','Aluno','Mentor'));
    `);

    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             perfil     = EXCLUDED.perfil,
             ativo      = TRUE
       RETURNING id`,
      [NOME, EMAIL, senhaHash, PERFIL]
    );

    const res = await client.query('SELECT id FROM usuarios WHERE email = $1', [EMAIL]);
    const usuario_id = res.rows[0].id;

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('─────────────────────────────────');
    console.log(`  Nome   : ${NOME}`);
    console.log(`  Email  : ${EMAIL}`);
    console.log(`  Senha  : ${SENHA}`);
    console.log(`  Perfil : ${PERFIL}`);
    console.log(`  ID     : ${usuario_id}`);
    console.log('─────────────────────────────────\n');
    console.log('Acesse: http://localhost:3000/pages/gestão/login.html\n');

  } catch (err) {
    console.error('\n❌ Erro ao criar usuário:', err.message, '\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
