// src/tests/jest.setup.js
//
// Executado antes de cada arquivo de teste (setupFiles do Jest), antes de qualquer
// require dos modulos de producao. Garante valores padrao para as variaveis de
// ambiente exigidas por src/config/index.js, de modo que a suite rode em qualquer
// ambiente (CI, clone novo) sem depender de um arquivo .env.test local — que e
// ignorado pelo controle de versao.
//
// Nenhuma conexao real e aberta: o pool e os repositorios sao substituidos por
// mocks nos testes. Estes valores servem apenas para satisfazer a validacao de
// presenca de configuracao e a assinatura/verificacao dos tokens JWT.

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/pulse_mais_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_de_teste_para_jwt';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
process.env.BCRYPT_COST = process.env.BCRYPT_COST || '10';
