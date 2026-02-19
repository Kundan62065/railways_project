import { httpServer, io } from './app.js';
import config from './config/config.js';
import logger from './utils/logger.js';
import connectDB from './config/database.js';
import seedDatabase from './utils/seed.js';
import { startShiftMonitoring, stopShiftMonitoring } from './jobs/shiftMonitor.job.js';

let monitoringIntervalId = null;

async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();

    // Seed default users
    if (config.features.seedOnStartup) {
      await seedDatabase();
    }

    // Start shift monitoring job
    if (config.features.monitoringEnabled && io) {
      monitoringIntervalId = startShiftMonitoring(io);
    } else {
      logger.info('Monitoring disabled (set MONITORING_ENABLED=true to enable)');
    }

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info('='.repeat(50));
      logger.info('🚂 Railway Shift Management System (MERN)');
      logger.info('='.repeat(50));
      logger.info(`Environment : ${config.env}`);
      logger.info(`Port        : ${config.port}`);
      logger.info(`API         : http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`Health      : http://localhost:${config.port}/health`);
      logger.info(`Socket.IO   : ${config.features.socketEnabled ? 'Enabled ✅' : 'Disabled'}`);
      logger.info(`Monitoring  : ${config.features.monitoringEnabled ? 'Enabled ✅' : 'Disabled'}`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`\n${signal} received. Shutting down...`);
  if (monitoringIntervalId) stopShiftMonitoring(monitoringIntervalId);
  httpServer.close(() => logger.info('HTTP server closed'));
  process.exit(0);
}

process.on('uncaughtException', (error) => { logger.error('UNCAUGHT EXCEPTION:', error); process.exit(1); });
process.on('unhandledRejection', (error) => { logger.error('UNHANDLED REJECTION:', error); process.exit(1); });
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

startServer();
