import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';

import { config } from '../config';

const router = Router();

// Security: Auth specific rate limiter (stricter to prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'test' ? 1000 : 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts, please try again after 15 minutes' } }
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), AuthController.login);

export default router;
