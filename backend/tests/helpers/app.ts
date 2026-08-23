import express from 'express';
import routes from '../../src/routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { notFoundHandler } from '../../src/middleware/notFoundHandler';

export const createApp = () => {
  const app = express();
  app.use(express.json());
  
  app.use('/api', routes);
  
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};
