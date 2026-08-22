import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// Retrieve the currently authenticated user's profile
router.get('/me', requireAuth, UserController.getMe);

export default router;
