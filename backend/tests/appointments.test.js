const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');

describe('Appointments API', () => {
  let studentToken;
  let staffToken;

  beforeAll(async () => {
    await db.execute('DELETE FROM users WHERE username IN (?, ?)', ['teststudent2', 'teststaff']);
    
    const studentHash = await hashPassword('password123');
    await db.execute(
      'INSERT INTO users (username, password_hash, role, student_id) VALUES (?, ?, ?, ?)',
      ['teststudent2', studentHash, 'student', 'S-22222']
    );
    
    const staffHash = await hashPassword('password123');
    await db.execute(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['teststaff', staffHash, 'intake_staff']
    );

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststudent2', password: 'password123' });
    studentToken = studentLogin.body.token;

    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teststaff', password: 'password123' });
    staffToken = staffLogin.body.token;
  });

  afterAll(async () => {
    await db.execute('DELETE FROM users WHERE username IN (?, ?)', ['teststudent2', 'teststaff']);
    await db.execute('DELETE FROM appointments WHERE student_id = ?', ['S-22222']);
    await db.end();
  });

  test('POST /api/appointments - create appointment (student)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'S-22222',
        reasonCategory: 'Academic',
        requestedTime: new Date(Date.now() + 86400000).toISOString(),
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('pending');
  });

  test('POST /api/appointments - invalid student ID format', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: '12345',
        reasonCategory: 'Academic',
        requestedTime: new Date().toISOString(),
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/appointments - invalid reason category', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'S-22222',
        reasonCategory: 'InvalidCategory',
        requestedTime: new Date().toISOString(),
      });
    
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/appointments - unauthenticated', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({
        studentId: 'S-22222',
        reasonCategory: 'Academic',
        requestedTime: new Date().toISOString(),
      });
    
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/appointments - student sees only own appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(appt => {
      expect(appt.student_id).toBe('S-22222');
    });
  });

  test('GET /api/appointments - staff sees all appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/appointments/manual-review - staff access', async () => {
    const res = await request(app)
      .get('/api/appointments/manual-review')
      .set('Authorization', `Bearer ${staffToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/appointments/manual-review - student denied', async () => {
    const res = await request(app)
      .get('/api/appointments/manual-review')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.statusCode).toBe(403);
  });

  test('PATCH /api/appointments/:id - update status (staff)', async () => {
    const createRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'S-22222',
        reasonCategory: 'Career',
        requestedTime: new Date(Date.now() + 172800000).toISOString(),
      });
    
    const apptId = createRes.body.id;
    
    const res = await request(app)
      .patch(`/api/appointments/${apptId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'confirmed' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });
});