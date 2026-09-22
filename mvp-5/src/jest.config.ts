module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // rootDir é a pasta src/ (onde vivem package.json e node_modules).
  rootDir: '.',
  // Os testes ficam fora de src/, em documentos/tests/ (evidências do projeto).
  roots: ['<rootDir>/../documentos/tests'],
  // Permite que os testes (fora de src/) resolvam as dependências de src/node_modules.
  modulePaths: ['<rootDir>/node_modules'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  // Evita que checkouts em worktrees (.claude/worktrees/*) dupliquem as suítes.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/../.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/../.claude/'],
  setupFiles: ['<rootDir>/../documentos/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'services/**/*.ts',
  ],
};
