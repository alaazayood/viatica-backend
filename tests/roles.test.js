// Basic skeleton tests (to be expanded)
const request = require('supertest');
const app = require('../app');

describe('Role-based access', () => {
  it('should block non-admin from listing users', async () => {
    const res = await request(app).get('/api/v1/users');
    expect([401,403]).toContain(res.statusCode);
  });
});
