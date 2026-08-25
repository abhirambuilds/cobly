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

    // Safety net: if the graceful close hangs (e.g. a stuck keep-alive
    // connection), force-exit rather than block the platform's shutdown
    // indefinitely. unref() so this timer never keeps the process alive on its own.
    const forceExit = setTimeout(() => {
      console.error('[Server] Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async () => {
      console.log('[Server] HTTP server closed');
      await disconnectDatabase();
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
