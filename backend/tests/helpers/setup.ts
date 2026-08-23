import { connectDB, closeDB, clearDB } from './db';
import dotenv from 'dotenv';

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = 'super-secret-test-key-32-chars-long';
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
});
