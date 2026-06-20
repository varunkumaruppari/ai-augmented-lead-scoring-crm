require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/error.middleware');
const requestId = require('./middlewares/requestId.middleware');
const sanitize = require('./middlewares/sanitize.middleware');
const { metricsMiddleware } = require('./services/metrics.service');

const app = express();

// ─── REQUEST ID TRACING ────────────────────────────────────────────────────────
// Must be first — attaches req.requestId to every request for log correlation
app.use(requestId);

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for frontend assets in dev
}));

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests (curl, Postman, server-to-server) in dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// Strict limit on auth endpoints
app.use('/api/v1/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' } },
}));

// General API limit
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
}));

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── INPUT SANITIZATION (XSS) ─────────────────────────────────────────────────
// Applied after body parsing — strips all HTML/script tags from req.body/query/params
app.use(sanitize);

// ─── METRICS COLLECTION ───────────────────────────────────────────────────────
app.use(metricsMiddleware);

// ─── REQUEST LOGGING ──────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => ['/health', '/status', '/system'].includes(req.path), // Suppress health check noise
}));

// ─── HEALTH & MONITORING ENDPOINTS ────────────────────────────────────────────
app.use('/', require('./routes/health.routes'));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',          require('./routes/auth.routes'));
app.use('/api/v1/leads',         require('./routes/lead.routes'));
app.use('/api/v1/follow-ups',    require('./routes/followup.routes'));
app.use('/api/v1/followups',     require('./routes/followup.routes'));
app.use('/api/followups',        require('./routes/followup.routes'));
app.use('/api/v1/users',         require('./routes/user.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/intelligence/ai', require('./routes/ai.routes'));
app.use('/api/intelligence/ai',    require('./routes/ai.routes'));
app.use('/api/v1/intelligence',    require('./routes/intelligence.routes'));
app.use('/api/intelligence',       require('./routes/intelligence.routes'));
app.use('/api/v1/analytics',     require('./routes/analytics.routes'));
app.use('/api/analytics',        require('./routes/analytics.routes'));
app.use('/api/v1/reports',       require('./routes/report.routes'));
app.use('/api/reports',          require('./routes/report.routes'));
app.use('/api/v1/pipeline',      require('./routes/pipeline.routes'));
app.use('/api/pipeline',         require('./routes/pipeline.routes'));
app.use('/api/v1/activities',    require('./routes/activity.routes'));
app.use('/api/activities',       require('./routes/activity.routes'));
app.use('/api/v1/agents',        require('./routes/agent.routes'));
app.use('/api/agents',           require('./routes/agent.routes'));

// ─── NEW PHASE 9 ROUTES ───────────────────────────────────────────────────────
app.use('/api/admin',            require('./routes/admin.routes'));
app.use('/api/v1/admin',         require('./routes/admin.routes'));
app.use('/api/settings',         require('./routes/settings.routes'));
app.use('/api/v1/settings',      require('./routes/settings.routes'));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({
  success: false,
  error: { code: 'NOT_FOUND', message: 'Route not found' },
  meta: { requestId: req.requestId, path: req.path },
}));

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
