const request = require('supertest');
const app = require('../../src/app');

describe('Authentication API Integration Tests', () => {
  test('POST /api/v1/auth/login with correct credentials should return 200 and JWT tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@lohithadharma.com',
        password: 'Admin@1234'
      });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@lohithadharma.com');
    expect(res.body.data.user.role).toBe('admin');
  });

  test('POST /api/v1/auth/login with incorrect credentials should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@lohithadharma.com',
        password: 'WrongPassword'
      });
      
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid credentials');
  });

  test('POST /api/v1/auth/login with missing password should return 422 Unprocessable Entity', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@lohithadharma.com'
      });
      
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
