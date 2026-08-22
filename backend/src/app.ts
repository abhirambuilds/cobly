import express, { Request, Response } from 'express';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware: Request Logger
app.use(requestLogger);

// Middleware: JSON Body Parser
app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Cobly backend is running' });
});

// Middleware: Error Handler (must be registered last)
app.use(errorHandler);

export default app;
