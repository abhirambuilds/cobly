import app from './app';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = config.port;

const startServer = async () => {
  // Connect to Database first
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
