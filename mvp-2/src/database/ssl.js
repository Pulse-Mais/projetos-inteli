// src/database/ssl.js

// Decide se a conexão pg deve usar SSL — SEM amarrar ao NODE_ENV.
// Postgres gerenciado (ex.: Supabase) exige SSL; Postgres local normalmente
// não suporta e quebra com "The server does not support SSL connections".
//
// Regra de detecção:
//   - DATABASE_SSL=true            → força SSL (override explícito)
//   - URL contém "supabase.co"     → cobre supabase.co e supabase.com (pooler incluso)
//   - URL contém "sslmode=require" → respeita o que o próprio DSN pede
//   - caso contrário               → sem SSL (local)
function resolvePgSSL(databaseUrl = process.env.DATABASE_URL || '') {
    const url = databaseUrl || '';
    const useSSL =
        process.env.DATABASE_SSL === 'true' ||
        url.includes('supabase.co') ||
        url.includes('sslmode=require');

    return useSSL ? { rejectUnauthorized: false } : false;
}

module.exports = { resolvePgSSL };
