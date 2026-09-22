/**
 * Configuracao Jest da Pulse Mais.
 *
 * - testMatch aceita duas convencoes para evitar quebrar testes legados:
 *     * *.spec.ts            -> arquivos antigos (compatibilidade)
 *     * *.service.test.ts    -> testes unitarios de servicos
 *     * *.controller.test.ts -> testes de controller com Supertest
 *     * *.integration.test.ts -> fluxos end-to-end contra banco de teste
 *
 * - setupFiles roda antes de qualquer importacao, garantindo env vars
 *   determinasticas (ver jest.setup.ts).
 *
 * - collectCoverageFrom exclui arquivos de teste e tipos puros do
 *   relatorio de cobertura para nao inflar a metrica.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  testMatch: [
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts',
  ],

  setupFiles: ['<rootDir>/src/backend/tests/jest.setup.ts'],

  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', esModuleInterop: true } },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/types.ts',
    '!**/node_modules/**',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Limpa mocks (mock.calls, mock.results, mock.instances) antes de cada
  // teste para evitar vazamento de estado entre os blocos.
  clearMocks: true,
};