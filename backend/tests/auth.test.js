const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');

describe('Auth API', () => {
  beforeAll(async () => {
    await db.execute('DELETE FROM users WHERE username = ?', ['teststudent']);
    const hash = await hashPassword('password123');
    await db.execute(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
      ['teststudent', hash, 'student', 'S-12345']
    );
  });

  afterAll(async () => {
    await db.execute('DELETE FROM users WHERE username = ?', ['teststudent']);
    await db.end();
  });

  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststudent', password: 'password123' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('role', 'student');
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststudent', password: 'wrongpassword' });
    
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login - missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststudent' });
    
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/auth/me - authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststudent', password: 'password123' });
    
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username', 'teststudent');
  });

  test('GET /api/auth/me - unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});