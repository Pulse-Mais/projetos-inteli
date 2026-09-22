// src/config/index.js

const dotenv = require('dotenv');
const path = require('path');

// Carrega o .env correto dependendo do ambiente
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Atalhos úteis que outros arquivos vão consultar
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Validação: se não tem DATABASE_URL, o servidor não pode subir.
if (!config.databaseUrl) {
  console.error('FATAL: DATABASE_URL não definida. Crie um arquivo .env na raiz do projeto.');
  process.exit(1);
}

// Validação: sem JWT_SECRET a autenticação não funciona — falha rápido no startup
// em vez de quebrar só no primeiro login. Em testes o segredo é injetado pelos
// próprios specs, então não derrubamos o processo de teste.
if (!process.env.JWT_SECRET && config.nodeEnv !== 'test') {
  console.error('FATAL: JWT_SECRET não definido. Aplicação não pode iniciar.');
  process.exit(1);
}

module.exports = config;