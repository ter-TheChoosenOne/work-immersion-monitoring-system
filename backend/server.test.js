const request = require('supertest');
const app = require('./server');

let studentToken;
let adminToken;

// Test Data
const studentData = {
  studentId: 'STU001',
  fullName: 'Test Student',
  email: 'student@test.com',
  password: 'password123',
  confirmPassword: 'password123',
  role: 'student'
};

const teacherData = {
  teacherId: 'TCH001',
  fullName: 'Test Teacher',
  email: 'teacher@test.com',
  password: 'password123',
  confirmPassword: 'password123',
  role: 'teacher'
};

const adminData = {
  fullName: 'Admin User',
  email: 'admin@test.com',
  password: 'adminpass',
  confirmPassword: 'adminpass',
  role: 'admin'
};

beforeAll(async () => {
  // Register student
  await request(app).post('/api/v1/auth/register').send(studentData);

  // Register teacher
  await request(app).post('/api/v1/auth/register').send(teacherData);

  // Register admin
  await request(app).post('/api/v1/auth/register').send(adminData);

  // Login student
  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: studentData.email,
      password: studentData.password
    });

  studentToken = studentLogin.body.token;

  // Login admin
  const adminLogin = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({
      email: adminData.email,
      password: adminData.password
    });

  adminToken = adminLogin.body.token;
});

describe('Root Endpoint', () => {
  it('GET / should return API running', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('API is running...');
  });
});

describe('Auth Routes', () => {

  it('Register - duplicate email should fail', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(studentData);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('User already exists');
  });

  it('Register - password mismatch', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...studentData,
        email: 'new@test.com',
        confirmPassword: 'wrong'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Passwords do not match');
  });

  it('Register - missing role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...studentData,
        email: 'norole@test.com',
        role: ''
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Role is required');
  });

  it('Login - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentData.email,
        password: studentData.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('Login - wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: studentData.email,
        password: 'wrong'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Wrong password');
  });

  it('Login - missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('Admin Login - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({
        email: adminData.email,
        password: adminData.password
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Admin login successful');
  });

});

describe('Protected Admin Routes', () => {

  it('GET students - no token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/students');

    expect(res.status).toBe(401);
  });

  it('GET students - invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/admin/students')
      .set('Authorization', 'Bearer invalid');

    expect(res.status).toBe(401);
  });

  it('GET students - success', async () => {
    const res = await request(app)
      .get('/api/v1/admin/students')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('GET teachers - success', async () => {
    const res = await request(app)
      .get('/api/v1/admin/teachers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('GET users - success', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('GET attendance reports - success', async () => {
    const res = await request(app)
      .get('/api/v1/admin/attendance/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

});

describe('Edge Cases', () => {

  it('GET login route should return 405', async () => {
    const res = await request(app)
      .get('/api/v1/auth/login');

    expect(res.status).toBe(405);
  });

  it('Malformed JSON should return 400', async () => {
    const res = await request(app)
      .post('/')
      .set('Content-Type', 'application/json')
      .send('invalid json');

    expect(res.status).toBe(400);
  });

  it('Unknown route should return 404', async () => {
    const res = await request(app)
      .delete('/unknown');

    expect(res.status).toBe(404);
  });

});
