import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Authentication Flow', () => {
  it('registers a valid user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('john@example.com');
    expect(res.body.user.passwordHash).toBeUndefined(); // Should not expose passwordHash
  });

  it('rejects duplicate email registration', async () => {
    await createTestUser('Jane Doe', 'jane@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Clone',
        email: 'jane@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('rejects invalid registration (missing fields)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid@example.com'
      });

    expect(res.status).toBe(400);
  });

  it('logs in a valid user', async () => {
    await createTestUser('Alice', 'alice@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.token).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password', async () => {
    await createTestUser('Bob', 'bob@example.com', 'password123');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });

  it('rejects nonexistent user login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
  });

  it('rejects missing JWT for protected route', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('rejects invalid JWT for protected route', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid.token.here');
    
    expect(res.status).toBe(401);
  });

  it('allows valid JWT profile request', async () => {
    const { token } = await createTestUser('Charlie', 'charlie@example.com', 'password123');

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Charlie');
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});
