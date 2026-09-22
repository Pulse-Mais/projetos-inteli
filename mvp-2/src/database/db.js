// Database/db.js

const { Pool, types } = require('pg');
const { databaseUrl, nodeEnv } = require('../config');
const { resolvePgSSL } = require('./ssl');

// Colunas `TIMESTAMP` (sem fuso) são gravadas em UTC pelo CURRENT_TIMESTAMP do
// Postgres/Supabase. Por padrão o pg interpreta esses valores no fuso do processo
// Node, o que desloca o horário (ex.: +3h no horário de Brasília). Forçamos a
// leitura como UTC para o Date representar o instante correto; o cliente converte
// para o fuso local ao exibir. (OID 1114 = timestamp without time zone)
types.setTypeParser(1114, (str) => (str ? new Date(str.replace(' ', 'T') + 'Z') : null));

const poolConfig = {
    connectionString: databaseUrl,
    max: nodeEnv === 'test' ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30_000,
    // SSL auto-detectado pela URL (Supabase exige; Postgres local não suporta).
    ssl: resolvePgSSL(databaseUrl),
};

const pool = new Pool(poolConfig);

module.exports = { pool };