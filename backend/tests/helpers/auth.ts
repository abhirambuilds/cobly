import request from 'supertest';
import { createApp } from './app';

const app = createApp();

export const createTestUser = async (name = 'Test User', email = 'test@example.com', password = 'password123') => {
  await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });
  
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
    
  return res.body;
};

export const loginTestUser = async (email = 'test@example.com', password = 'password123') => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body; // { user, token }
};
