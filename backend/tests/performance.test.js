const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');

describe('Performance Tests', () => {
  let token;

  beforeAll(async () => {
    const hash = await hashPassword('password123');
    await db.execute(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?',
      ['perfuser', hash, 'student', 'S-99999', hash]
    );
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'perfuser', password: 'password123' });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await db.execute('DELETE FROM users WHERE username = ?', ['perfuser']);
    await db.execute('DELETE FROM appointments WHERE student_id = ?', ['S-99999']);
    await db.end();
  });

  test('Response time < 200ms for appointment creation (p95)', async () => {
    const times = [];
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          studentId: 'S-99999',
          reasonCategory: 'Academic',
          requestedTime: new Date(Date.now() + 86400000).toISOString(),
        });
      times.push(Date.now() - start);
    }
    
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    console.log(`P95 response time: ${p95}ms`);
    expect(p95).toBeLessThan(200);
  });

  test('Throughput: 50 concurrent requests', async () => {
    const promises = [];
    const start = Date.now();
    
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .get('/api/appointments')
          .set('Authorization', `Bearer ${token}`)
      );
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    const successful = results.filter(r => r.statusCode === 200).length;
    console.log(`Throughput: ${successful} requests in ${duration}ms`);
    expect(successful).toBe(50);
  });

  test('Health endpoint response time < 50ms', async () => {
    const start = Date.now();
    const res = await request(app).get('/health');
    const duration = Date.now() - start;
    
    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThan(50);
  });
});