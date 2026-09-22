import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 15000,
  setupFiles: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};

export default config;
