// jest.config.js
module.exports = {
  // Define o ambiente de execução como Node.js
  testEnvironment: 'node',

  // Limpa chamadas e instâncias de mocks automaticamente antes de cada teste
  clearMocks: true,

  // Restaura o estado original de mocks modificados antes de cada teste
  restoreMocks: true,

  // Diretório onde o Jest vai gerar os relatórios de cobertura de código
  coverageDirectory: 'coverage',

  // Local dos arquivos de teste do projeto
  testMatch: ['**/src/tests/**/*.test.js'],

  // Garante variáveis de ambiente padrão (DATABASE_URL, JWT_SECRET) antes de cada
  // arquivo de teste, tornando a suíte executável sem depender de um .env.test local.
  setupFiles: ['<rootDir>/src/tests/jest.setup.js'],

  // Exibe logs detalhados para cada teste individual executado
  verbose: true,

  // Timeout padrão para testes assíncronos (em milissegundos)
  testTimeout: 10000,
};
