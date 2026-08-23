import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing or insecurely short (must be at least 32 characters).');
  process.exit(1);
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cobly',
  jwtSecret: jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development'
};
