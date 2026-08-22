import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';

const router = Router();

// Mount all API routes here
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
