const { pool } = require('../config/database');
const auditRepo = require('../repositories/audit.repository');
const settingsRepo = require('../repositories/settings.repository');
const metricsService = require('../services/metrics.service');
const logger = require('../config/logger');

/**
 * GET /api/admin/system-health
 * Returns server uptime, memory, DB ping, Node version.
 */
const getSystemHealth = async (req, res, next) => {
  try {
    const dbStart = Date.now();
    let dbStatus = 'healthy';
    let dbPingMs = 0;
    try {
      await pool.query('SELECT 1');
      dbPingMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'degraded';
    }

    const metrics = metricsService.getSnapshot();

    res.json({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        database: { status: dbStatus, ping_ms: dbPingMs },
        server: {
          node_version: process.version,
          environment: process.env.NODE_ENV || 'development',
          uptime_seconds: metrics.uptime_seconds,
          uptime_human: metrics.uptime_human,
          memory_mb: metrics.memory_mb,
          pid: process.pid,
        },
        requests: {
          total: metrics.total_requests,
          errors_4xx: metrics.errors_4xx,
          errors_5xx: metrics.errors_5xx,
          error_rate_pct: metrics.error_rate_pct,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/audit-logs
 * Paginated, filterable audit log browser.
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { user_id, action, entity_type, start_date, end_date, page = 1, limit = 50 } = req.query;
    const result = await auditRepo.findAll(
      { user_id, action, entity_type, start_date, end_date },
      parseInt(page),
      parseInt(limit)
    );
    res.json({
      success: true,
      data: result.logs,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/metrics
 * Returns rolling API metrics snapshot.
 */
const getMetrics = async (req, res, next) => {
  try {
    const snapshot = metricsService.getSnapshot();
    res.json({ success: true, data: snapshot });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/status
 * Subsystem status: DB, AI provider, Socket.io, Notification queue.
 */
const getStatus = async (req, res, next) => {
  try {
    // DB
    let dbOk = false;
    try { await pool.query('SELECT 1'); dbOk = true; } catch {}

    // AI
    const aiProvider = process.env.AI_PROVIDER || 'mock';
    const aiKeySet = aiProvider === 'openai'
      ? !!(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-key'))
      : aiProvider === 'gemini'
        ? !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your'))
        : true; // mock is always ok

    const snapshot = metricsService.getSnapshot();

    res.json({
      success: true,
      data: {
        database:     { status: dbOk ? 'online' : 'offline', label: 'PostgreSQL' },
        ai:           { status: aiKeySet ? 'online' : 'fallback', provider: aiProvider, label: 'AI Service' },
        notifications:{ status: 'online', label: 'Notification Engine' },
        realtime:     { status: 'online', label: 'Socket.io' },
        api:          { status: 'online', requests: snapshot.total_requests, error_rate: snapshot.error_rate_pct, label: 'REST API' },
        uptime:       snapshot.uptime_human,
        environment:  process.env.NODE_ENV || 'development',
        version:      process.version,
        timestamp:    new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/settings
 * Returns all system settings.
 */
const getSettings = async (req, res, next) => {
  try {
    const { map, rows } = await settingsRepo.getAll();
    res.json({ success: true, data: { settings: map, rows } });
  } catch (err) { next(err); }
};

/**
 * PUT /api/admin/settings
 * Bulk-upserts settings. Body: [{ key, value, category }]
 */
const updateSettings = async (req, res, next) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: { message: 'Body must be an array of {key, value, category} objects' } });
    }
    await settingsRepo.upsertMany(entries);

    // Audit log
    const { logAuditEvent } = require('../middlewares/audit.middleware');
    await logAuditEvent(req, { action: 'SETTINGS_UPDATED', entityType: 'system_settings', newData: entries });

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) { next(err); }
};

module.exports = { getSystemHealth, getAuditLogs, getMetrics, getStatus, getSettings, updateSettings };
