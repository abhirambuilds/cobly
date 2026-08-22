import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import userRoutes from './user';
import workspaceRoutes from './workspace';

const router = Router();

// Mount all API routes here
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);

export default router;
