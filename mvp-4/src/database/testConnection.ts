// Arquivo para testar a conexao com o banco 
// saida do terminal:
// PS C:\Users\Inteli\Documents\Modulo2\g04> npx ts-node src/database/testConnection.ts
// ✅ Conexão OK!
// Hora do banco: { now: 2026-05-25T18:24:13.497Z }
// PS C:\Users\Inteli\Documents\Modulo2\g04> 

import { pool } from './connection';

async function test() {
  try {
    const result = await pool.query('SELECT NOW()');
    
    console.log('✅ Conexão OK!');
    console.log('Hora do banco:', result.rows[0]);
  } catch (err) {
    console.error('❌ Erro na conexão:', err);
  } finally {
    await pool.end();
  }
}

test();