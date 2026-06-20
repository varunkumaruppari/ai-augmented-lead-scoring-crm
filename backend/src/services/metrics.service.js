/**
 * In-Memory Metrics Service
 * Tracks API request counts, error rates, and response times.
 * Resets on server restart — for production, connect to Prometheus/Datadog.
 */

const metrics = {
  startTime: Date.now(),
  totalRequests: 0,
  errors4xx: 0,
  errors5xx: 0,
  routeStats: {}, // { 'GET /api/v1/leads': { count, totalMs, errors } }
};

const record = (method, path, statusCode, durationMs) => {
  metrics.totalRequests++;
  if (statusCode >= 400 && statusCode < 500) metrics.errors4xx++;
  if (statusCode >= 500) metrics.errors5xx++;

  // Normalize path — strip UUIDs for grouping
  const normalized = path.replace(/[0-9a-f-]{36}/g, ':id');
  const key = `${method} ${normalized}`;
  if (!metrics.routeStats[key]) {
    metrics.routeStats[key] = { count: 0, totalMs: 0, errors: 0 };
  }
  metrics.routeStats[key].count++;
  metrics.routeStats[key].totalMs += durationMs;
  if (statusCode >= 400) metrics.routeStats[key].errors++;
};

const getSnapshot = () => {
  const uptimeSec = Math.round((Date.now() - metrics.startTime) / 1000);
  const topRoutes = Object.entries(metrics.routeStats)
    .map(([route, stat]) => ({
      route,
      count: stat.count,
      avgMs: stat.count > 0 ? Math.round(stat.totalMs / stat.count) : 0,
      errors: stat.errors,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    uptime_seconds: uptimeSec,
    uptime_human: formatUptime(uptimeSec),
    total_requests: metrics.totalRequests,
    errors_4xx: metrics.errors4xx,
    errors_5xx: metrics.errors5xx,
    error_rate_pct: metrics.totalRequests > 0
      ? parseFloat(((metrics.errors4xx + metrics.errors5xx) / metrics.totalRequests * 100).toFixed(2))
      : 0,
    top_routes: topRoutes,
    memory_mb: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

/**
 * Express middleware that records metrics for every request.
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    record(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
};

module.exports = { getSnapshot, metricsMiddleware };
