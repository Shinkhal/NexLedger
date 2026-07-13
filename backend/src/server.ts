import 'dotenv/config';
import app from './app';
import { getEnv } from './config/env.config';
import { logger } from './utils/logger.util';
import DatabaseConfig from './config/database.config';
import ResendConfig from './config/resend.config';
import { Server } from 'http';

let server: Server;

const startServer = async () => {
  try {
    await DatabaseConfig.connect();
    logger.info('🚀 Database connected successfully');

    ResendConfig.init();
    logger.info('📧 Email service initialized');

    server = app.listen(getEnv.app.port(), () => {
      logger.info(`✨ Server listening on http://localhost:${getEnv.app.port()}`);
      logger.info(`🔍 Health check: http://localhost:${getEnv.app.port()}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info('🛑 Received shutdown signal. Closing server...');

  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP server closed.');
      await DatabaseConfig.disconnect();
      ResendConfig.shutdown();
      logger.info('✅ Email service shut down.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  setTimeout(() => {
    logger.error('⚠️ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason: Error | unknown) => {
  logger.error('💥 Unhandled Rejection:', reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('uncaughtException', (error: Error) => {
  logger.error('💥 Uncaught Exception:', error);
  shutdown();
});

startServer();
