import express from 'express';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import apiRoutes from './routes';

const app = express();

// Middleware: Request Logger
app.use(requestLogger);

// Middleware: JSON Body Parser
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Middleware: 404 Not Found Handler
app.use(notFoundHandler);

// Middleware: Error Handler (must be registered last)
app.use(errorHandler);

export default app;
