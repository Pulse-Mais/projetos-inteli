/**
 * tests/setup.ts
 * Executado por jest antes de qualquer módulo ser carregado (setupFiles).
 * Define variáveis de ambiente mínimas para que pool.ts não lance na
 * inicialização — o pool real nunca é chamado nos testes (jest.mock).
 */
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_pulse';
