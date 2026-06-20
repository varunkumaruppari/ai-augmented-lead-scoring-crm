const { pool } = require('../../src/config/database');

describe('Database Connectivity Smoke Test', () => {
  test('should initialize the database pool object', () => {
    expect(pool).toBeDefined();
    expect(typeof pool.query).toBe('function');
  });
});
