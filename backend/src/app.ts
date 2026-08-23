import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import apiRoutes from './routes';
import { config } from './config';

const app = express();

// Security: Trust Proxy (useful if behind a reverse proxy like Nginx, AWS ELB, etc.)
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Security: Helmet for secure HTTP headers
app.use(helmet());

// Security: CORS Configuration
const corsOptions = {
  origin: config.nodeEnv === 'production' ? config.frontendUrl : '*',
  credentials: true, // Allow cookies/auth headers if needed by the frontend
};
app.use(cors(corsOptions));

// Security: General API Rate Limiting (in-memory store, not suitable for multi-instance without Redis)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'test' ? 10000 : 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests from this IP, please try again after 15 minutes' } }
});

// Apply general rate limiter to all /api routes
app.use('/api', apiLimiter);

// Middleware: Request Logger
app.use(requestLogger);

// Middleware: JSON Body Parser with explicit size limit to prevent large payload attacks
app.use(express.json({ limit: '100kb' }));

// API Routes
app.use('/api', apiRoutes);

// Middleware: 404 Not Found Handler
app.use(notFoundHandler);

// Middleware: Error Handler (must be registered last)
app.use(errorHandler);

export default app;
