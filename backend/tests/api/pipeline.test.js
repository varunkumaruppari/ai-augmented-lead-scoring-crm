const request = require('supertest');
const app = require('../../src/app');

describe('Pipeline API Endpoints', () => {
  let token;
  let leadId;

  beforeAll(async () => {
    // Login to get a token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@lohithadharma.com',
        password: 'Admin@1234'
      });
    token = res.body.data.access_token;

    // Create a test lead
    const leadRes = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        full_name: 'Test Pipeline Lead',
        phone: '12345678901',
        source: 'web',
        budget_tier: 'medium',
        budget_min: 1000000,
        budget_max: 2000000
      });
    leadId = leadRes.body.data.id;
  });

  test('GET /api/v1/pipeline should return 200 and the stages mapping', async () => {
    const res = await request(app)
      .get('/api/v1/pipeline')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    // Validate stages list
    expect(res.body.data['New Lead']).toBeDefined();
    expect(res.body.data['Qualified']).toBeDefined();
    // Verify our test lead is in 'New Lead' stage
    const testLead = res.body.data['New Lead'].find(l => l.id === leadId);
    expect(testLead).toBeDefined();
    expect(testLead.full_name).toBe('Test Pipeline Lead');
  });

  test('GET /api/v1/pipeline/analytics should return 200 and pipeline stats', async () => {
    const res = await request(app)
      .get('/api/v1/pipeline/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_leads).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pipeline_value).toBeGreaterThan(0);
  });

  test('PUT /api/v1/pipeline/move should change lead pipeline stage', async () => {
    const res = await request(app)
      .put('/api/v1/pipeline/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leadId: leadId,
        stage: 'Qualified'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pipeline_stage).toBe('Qualified');
    expect(res.body.data.status).toBe('qualified');
  });
});
