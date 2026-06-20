const request = require('supertest');
const app = require('../../src/app');

describe('Health and Monitoring API Endpoints', () => {
  test('GET /health should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.requestId).toBeDefined();
  });

  test('GET /status should return 200 and health check payload', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBeDefined();
    expect(res.body.subsystems).toBeDefined();
    expect(res.body.subsystems.realtime.status).toBe('online');
  });

  test('GET /system without credentials should return 401 Unauthorized', async () => {
    const res = await request(app).get('/system');
    expect(res.statusCode).toBe(401);
  });
});
