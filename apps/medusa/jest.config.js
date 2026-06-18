const { loadEnv } = require('@medusajs/utils');
loadEnv('test', process.cwd());

if (process.env.TEST_TYPE === 'integration:http') {
  loadEnv('development', process.cwd());

  if (
    typeof process.env.DATABASE_URL === 'string' &&
    process.env.DATABASE_URL.includes('${DB_NAME}') &&
    process.env.DB_NAME
  ) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
      '${DB_NAME}',
      process.env.DB_NAME,
    );
  }

  if (typeof process.env.DATABASE_URL === 'string') {
    try {
      const url = new URL(process.env.DATABASE_URL);
      process.env.DB_USERNAME ??= url.username || 'postgres';
      process.env.DB_PASSWORD ??= url.password || '';
      process.env.DB_HOST ??= url.hostname || 'localhost';
    } catch {
      // keep existing DB_* values
    }
  }
}

module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  modulePathIgnorePatterns: ['dist/', '<rootDir>/.medusa/server/'],
};

if (process.env.TEST_TYPE === 'integration:http') {
  module.exports.testMatch = ['**/integration-tests/http/*.spec.[jt]s'];
} else if (process.env.TEST_TYPE === 'integration:modules') {
  module.exports.testMatch = ['**/src/modules/*/__tests__/**/*.[jt]s'];
} else if (process.env.TEST_TYPE === 'unit') {
  module.exports.testMatch = ['**/src/**/__tests__/**/*.unit.spec.[jt]s'];
}
