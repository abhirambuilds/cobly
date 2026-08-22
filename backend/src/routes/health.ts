import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Liveness probe: checks if the application process is running
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'cobly-api',
    type: 'liveness',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe: checks if the application is ready to serve traffic (e.g., DB connected)
router.get('/readiness', (req: Request, res: Response) => {
  // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const isHealthy = mongoose.connection.readyState === 1;
  const dbStatus = isHealthy ? 'connected' : 'disconnected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    service: 'cobly-api',
    type: 'readiness',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

export default router;
