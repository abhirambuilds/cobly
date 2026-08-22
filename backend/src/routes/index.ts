import { Router } from 'express';
import healthRoutes from './health';

const router = Router();

// Mount all API routes here
router.use('/', healthRoutes);

export default router;
