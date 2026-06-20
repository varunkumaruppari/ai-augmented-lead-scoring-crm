const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const { pool } = require('./config/database');
const socketService = require('./services/socket.service');

const PORT = process.env.PORT || 5000;

// ─── GLOBAL EXCEPTION HANDLERS ────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error({ event: 'uncaughtException', message: err.message, stack: err.stack });
  // Give logger time to flush, then exit — PM2/Docker will restart
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    event: 'unhandledRejection',
    message: reason?.message || String(reason),
    stack: reason?.stack || null,
  });
  // Do NOT exit on unhandled rejection in production — log and continue
});

// ─── SERVER STARTUP ───────────────────────────────────────────────────────────
let server;

const start = async () => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');

    server = http.createServer(app);
    socketService.init(server);

    // Follow-up checker
    const followupService = require('./services/followup.service');
    setInterval(() => { followupService.checkAndRemindFollowups(); }, 30000);
    setTimeout(() => { followupService.checkAndRemindFollowups(); }, 2000);

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`Health: http://localhost:${PORT}/health`);
      logger.info(`API:    http://localhost:${PORT}/api/v1`);
      logger.info(`Admin:  http://localhost:${PORT}/api/admin/system-health`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info(`${signal} received — gracefully shutting down...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. Draining DB pool...');
      try {
        await pool.end();
        logger.info('Database pool drained. Exiting cleanly.');
      } catch (err) {
        logger.error('Error draining DB pool:', err.message);
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.warn('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

start();
