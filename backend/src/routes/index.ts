import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import userRoutes from './user';

const router = Router();

// Mount all API routes here
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
