import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('CONFIG DB:', {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_SSL: process.env.DB_SSL,
  NODE_ENV: process.env.NODE_ENV,
});

type ConfigCamposSeparados = {
  host?: string;
  port: number;
  database?: string;
  user?: string;
  password?: string;
};

const extrairHost = (valor?: string): string | undefined => {
  if (!valor) return undefined;

  const supabaseHost = valor.match(/db\.[a-z0-9-]+\.supabase\.co/i)?.[0];

  if (supabaseHost) return supabaseHost;

  return valor;
};

const extrairConfigDeConnectionStringInvalida = (
  valor?: string,
): ConfigCamposSeparados | undefined => {
  if (!valor?.startsWith('postgres')) return undefined;

  const resultado = valor.match(
    /^postgres(?:ql)?:\/\/([^:]+):([\s\S]+)@(db\.[a-z0-9-]+\.supabase\.co)(?::(\d+))?\/([^?]+)/i,
  );

  if (!resultado) return undefined;

  return {
    user: resultado[1],
    password: resultado[2],
    host: resultado[3],
    port: Number(resultado[4] ?? 5432),
    database: resultado[5],
  };
};

const obterConnectionString = (): string | undefined => {
  if (process.env.DATABASE_URL) {
    try {
      new URL(process.env.DATABASE_URL);
      return process.env.DATABASE_URL;
    } catch {
      return undefined;
    }
  }

  const host = process.env.DB_HOST;

  if (!host?.startsWith('postgres://') && !host?.startsWith('postgresql://')) {
    return undefined;
  }

  try {
    new URL(host);
    return host;
  } catch {
    return undefined;
  }
};

const connectionString = obterConnectionString();
const configExtraida = extrairConfigDeConnectionStringInvalida(process.env.DATABASE_URL);

const usarSsl =
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  Boolean(connectionString?.includes('supabase')) ||
  Boolean(configExtraida?.host?.includes('supabase')) ||
  Boolean(process.env.DB_HOST?.includes('supabase'));

const opcoesComuns = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: usarSsl ? { rejectUnauthorized: false } : false,
};

export const pool = connectionString
  ? new Pool({
    connectionString,
    ...opcoesComuns,
  })
  : configExtraida
    ? new Pool({
      ...configExtraida,
      ...opcoesComuns,
    })
    : new Pool({
      host: extrairHost(process.env.DB_HOST),
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ...opcoesComuns,
    });

console.log('DIAGNOSTICO SSL:', {
  DB_SSL: process.env.DB_SSL,
  dbSslIsTrue: process.env.DB_SSL === 'true',

  NODE_ENV: process.env.NODE_ENV,
  nodeEnvIsProduction: process.env.NODE_ENV === 'production',

  connectionString,
  connectionHasSupabase: Boolean(connectionString?.includes('supabase')),

  configExtraida,
  configHasSupabase: Boolean(configExtraida?.host?.includes('supabase')),

  DB_HOST: process.env.DB_HOST,
  dbHostHasSupabase: Boolean(process.env.DB_HOST?.includes('supabase')),
});


export default pool;
