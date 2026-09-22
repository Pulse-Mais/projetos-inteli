/**
 * scripts/criar-aluno.js
 * Cria um usuário Aluno de teste no banco do Supabase.
 *
 * Uso:
 *   node scripts/criar-aluno.js
 *   node scripts/criar-aluno.js "Maria Silva" "maria@email.com" "minhasenha"
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool }  = require('pg');
const bcrypt    = require('bcrypt');
const { resolvePgSSL } = require('../database/ssl');

/* ── Dados padrão (pode sobrescrever via argumentos) ── */
const [, , nomeArg, emailArg, senhaArg] = process.argv;

const NOME  = nomeArg  || 'Beatriz Santos';
const EMAIL = emailArg || 'beatriz.aluna@pulsemais.org.br';
const SENHA = senhaArg || 'senha123';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolvePgSSL(),
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('\n🔧 Criando usuário Aluno de teste...\n');

    const senhaHash = await bcrypt.hash(SENHA, 10);

    // As colunas data_inicio_mentoria e jovem_id vivem nas migrations 027 e 029
    // — DDL versionada. Rode as migrations antes deste script.

    await client.query('BEGIN');

    /* 1. Cria o registro em jovens (campos obrigatórios) */
    const jovemRes = await client.query(
      `INSERT INTO jovens
         (nome, email, data_nascimento, status_jornada, ativo)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET nome = EXCLUDED.nome
       RETURNING id`,
      [NOME, EMAIL, '2005-01-01', 'Capacitado']
    );
    const jovem_id = jovemRes.rows[0].id;

    /* 2. Cria o registro em usuarios vinculado ao jovem */
    const usuarioRes = await client.query(
      `INSERT INTO usuarios
         (nome, email, senha_hash, perfil, jovem_id, ativo)
       VALUES ($1, $2, $3, 'Aluno', $4, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET senha_hash = EXCLUDED.senha_hash,
             jovem_id   = EXCLUDED.jovem_id,
             ativo      = TRUE
       RETURNING id`,
      [NOME, EMAIL, senhaHash, jovem_id]
    );
    const usuario_id = usuarioRes.rows[0].id;

    await client.query('COMMIT');

    console.log('✅ Usuário criado com sucesso!\n');
    console.log('─────────────────────────────────');
    console.log(`  Nome     : ${NOME}`);
    console.log(`  Email    : ${EMAIL}`);
    console.log(`  Senha    : ${SENHA}`);
    console.log(`  Perfil   : Aluno`);
    console.log(`  ID       : ${usuario_id}`);
    console.log(`  jovem_id : ${jovem_id}`);
    console.log('─────────────────────────────────\n');
    console.log('Acesse: http://localhost:3000/pages/aluno/login.html\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro ao criar usuário:', err.message, '\n');
    if (err.message.includes('duplicate') || err.message.includes('unique')) {
      console.log('💡 Dica: o email já existe. Tente outro email ou rode novamente (o script atualiza a senha automaticamente).\n');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
