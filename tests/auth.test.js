const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  it('should register a new pharmacist', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Pharmacist',
        email: 'pharmacist@test.com',
        phone: '1234567890',
        role: 'pharmacist',
        password: 'password123',
        passwordConfirm: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should not register with invalid data', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'invalid-email',
        role: 'pharmacist',
        password: '123'
      });
    
    expect(res.statusCode).toEqual(400);
  });
});