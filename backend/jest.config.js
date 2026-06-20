module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  setupFiles: ['dotenv/config']
};
