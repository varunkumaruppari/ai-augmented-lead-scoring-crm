const { pool } = require('../config/database');
const metricsService = require('../services/metrics.service');

/**
 * GET /health
 * Public lightweight ping.
 */
const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
};

/**
 * GET /status
 * Public subsystem status check (safe details).
 */
const getStatus = async (req, res, next) => {
  try {
    let dbStatus = 'online';
    let dbPingMs = 0;
    const dbStart = Date.now();
    try {
      await pool.query('SELECT 1');
      dbPingMs = Date.now() - dbStart;
    } catch (err) {
      dbStatus = 'offline';
    }

    const aiProvider = process.env.AI_PROVIDER || 'mock';
    const aiKeySet = aiProvider === 'openai'
      ? !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-key'))
      : aiProvider === 'gemini'
        ? !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your'))
        : true; // mock is always online

    res.json({
      status: dbStatus === 'online' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      subsystems: {
        database: { status: dbStatus, ping_ms: dbPingMs, label: 'PostgreSQL' },
        ai: { status: aiKeySet ? 'online' : 'fallback', provider: aiProvider, label: 'AI Service' },
        realtime: { status: 'online', label: 'Socket.io' },
        notifications: { status: 'online', label: 'Notification Engine' }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /system
 * Admin-protected process statistics and performance indicators.
 */
const getSystem = async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    const uptime = process.uptime();
    const snapshot = metricsService.getSnapshot();

    res.json({
      status: 'ok',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        node_version: process.version,
        platform: process.platform,
        uptime_seconds: Math.floor(uptime),
        memory: {
          rss_mb: Math.round(memory.rss / 1024 / 1024 * 100) / 100,
          heap_total_mb: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
          heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
          external_mb: Math.round(memory.external / 1024 / 1024 * 100) / 100
        },
        cpu_usage: {
          user_ms: Math.round(cpu.user / 1000),
          system_ms: Math.round(cpu.system / 1000)
        }
      },
      metrics: {
        total_requests: snapshot.total_requests,
        errors_4xx: snapshot.errors_4xx,
        errors_5xx: snapshot.errors_5xx,
        error_rate_pct: snapshot.error_rate_pct,
        average_latency_ms: snapshot.average_latency_ms
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHealth,
  getStatus,
  getSystem
};
