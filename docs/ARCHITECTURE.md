# Architecture Reference
**Lohithadharma Lead Scoring Dashboard**

---

## System Overview

A full-stack CRM and lead scoring SaaS platform for real estate sales management.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  React 18 + Vite + React Router + Socket.io Client       │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS + WebSocket
┌─────────────────────────▼───────────────────────────────┐
│                   BACKEND (Node.js)                      │
│  Express 5 · JWT Auth · Helmet · CORS · Rate Limit       │
│  XSS Sanitize · Request ID Tracing · Audit Logging       │
├─────────────────────────────────────────────────────────┤
│  Routes → Controllers → Services → Repositories         │
│                         ↓                               │
│              AI Service (OpenAI / Gemini / Mock)         │
│              Socket.io (Real-time Notifications)         │
│              Metrics Service (In-memory rolling)         │
└─────────────────────────┬───────────────────────────────┘
                          │ pg / pg-mem
┌─────────────────────────▼───────────────────────────────┐
│                    DATABASE                              │
│  PostgreSQL (Neon) / pg-mem (in-memory for dev)         │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express 5 |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Database Client | pg (PostgreSQL) + pg-mem (development) |
| Real-time | Socket.io 4 |
| Security | Helmet, express-rate-limit, xss |
| Logging | Winston + Morgan |
| Validation | Joi |
| Environment | dotenv |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Real-time | Socket.io Client |
| Charts | Recharts |
| Icons | Lucide React |
| Drag-and-Drop | @dnd-kit |
| Styling | Tailwind CSS |

### Database
| Component | Detail |
|-----------|--------|
| Engine | PostgreSQL 15+ |
| Hosting | Neon (serverless PostgreSQL) |
| Dev Mode | pg-mem (in-memory, no setup required) |
| ORM | Raw SQL (parameterized via pg) |

---

## Backend Architecture

### Request Lifecycle
```
Request
  → requestId middleware     (attaches X-Request-ID)
  → helmet                   (security headers)
  → cors                     (origin validation)
  → rate-limit               (per-window throttle)
  → express.json             (body parsing)
  → sanitize                 (XSS strip)
  → metricsMiddleware        (request counter)
  → morgan                   (access log)
  → authenticate             (JWT verify)
  → authorize/requirePerm    (RBAC check)
  → Controller               (business logic)
  → Service                  (domain logic)
  → Repository               (DB query)
  → logAuditEvent (async)    (audit trail)
  → Response
  → errorHandler             (structured error JSON)
```

### Layer Responsibilities
| Layer | Responsibility |
|-------|---------------|
| **Routes** | HTTP method binding, middleware chain |
| **Controllers** | Request parsing, response formatting, audit calls |
| **Services** | Business rules, scoring engine, AI calls |
| **Repositories** | All database queries (parameterized SQL) |
| **Middlewares** | Cross-cutting: auth, validation, sanitization, audit |
| **Config** | Database connection, logger, environment |

---

## Security Architecture (Phase 9)

| Threat | Mitigation |
|--------|-----------|
| XSS injection | xss library recursively strips HTML from all req.body/query/params |
| SQL injection | 100% parameterized queries via pg |
| CSRF | Stateless JWT — no cookies, no CSRF surface |
| Brute force | Rate limiting (20 req/15min on auth) + account lockout after 5 failures |
| Token theft | Short-lived access tokens (15m) + DB-stored refresh token |
| Privilege escalation | RBAC on every route (authorize middleware) |
| Information leak | Production errors return generic message only |
| Request tracing | UUID X-Request-ID on every request for correlation |
| Audit | All mutations logged to audit_logs with user, IP, old/new data |

---

## RBAC Role Hierarchy

```
super_admin → admin → manager → agent → viewer
```

| Role | Key Permissions |
|------|----------------|
| super_admin | All — bypasses all role checks |
| admin | Full lead management, user creation, settings, audit |
| manager | Lead management, team view, report generation |
| agent | Own leads, pipeline moves, follow-ups |
| viewer | Read-only across all data |

---

## Real-time Architecture

Socket.io runs on the same HTTP server as Express.

**Events emitted by server:**
- `notification:new` — new notification for user
- `lead:created` — new lead in system
- `lead:stage_changed` — pipeline move
- `lead:converted` — revenue milestone
- `followup:due` — follow-up reminder

**Client connection:** JWT passed as socket handshake auth token.

---

## AI Service Architecture

```
aiService.js
  ├── provider: 'openai'  → OpenAI GPT-4o (if key configured)
  ├── provider: 'gemini'  → Google Gemini Pro
  └── provider: 'mock'    → Rule-based deterministic responses (default)
```

All providers implement the same interface: `generate(prompt) → string`

Fallback: If provider fails → automatic fallback to mock.

---

## Database Schema Overview

See [DATABASE.md](./DATABASE.md) for full schema.

**Core tables:**
- `users` — accounts with RBAC roles
- `leads` — lead data + scoring fields
- `lead_scores` — score calculation history
- `lead_activities` — timeline events
- `lead_intelligence` — AI scoring metadata
- `lead_ai_insights` — generated AI content
- `follow_ups` — scheduled actions
- `notifications` — user alerts
- `audit_logs` — immutable action trail
- `system_settings` — persisted configuration
- `report_schedules` / `report_history` — reporting

---

## Directory Structure

```
lead-scoring-dashboard/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app, middleware chain
│   │   ├── server.js           # HTTP + Socket.io server, graceful shutdown
│   │   ├── config/             # database.js, logger.js
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic, AI, scoring, metrics
│   │   ├── repositories/       # Database queries
│   │   ├── middlewares/        # auth, validate, sanitize, audit, requestId, error
│   │   ├── routes/             # Express routers
│   │   └── validators/         # Joi schemas
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Routes (lazy-loaded)
│   │   ├── pages/              # Route-level components
│   │   ├── components/         # Shared UI components
│   │   ├── context/            # AuthContext
│   │   └── services/           # API client functions
│   └── index.html
├── database/
│   └── schema.sql              # Full DDL + seed data
└── docs/                       # This documentation
```
