import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initSocketServer } from './sockets';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const httpServer = http.createServer(app);

  initSocketServer(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Manufacturing ERP API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📚 API docs available at ${env.API_URL}/api-docs`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server closed. Goodbye!');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.stack : reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.stack });
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap application', { error: error instanceof Error ? error.stack : error });
  process.exit(1);
});
