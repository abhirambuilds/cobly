/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/tests/helpers/envSetup.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.ts'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/config/**']
};
