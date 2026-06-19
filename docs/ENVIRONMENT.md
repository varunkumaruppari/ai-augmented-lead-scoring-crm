# Environment Variables Reference
**Lohithadharma Lead Scoring Dashboard — Backend**

All variables go in `backend/.env` (copy from `backend/.env.example`).

---

## Core

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `development` | Yes | `development` or `production`. Controls log format, error verbosity, CSP. |
| `PORT` | `5000` | No | Port the backend server listens on. |

---

## Database

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | *(none)* | No | PostgreSQL connection string. If omitted or set to `in-memory`, pg-mem is used. |

**Production format:** `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

> **Note:** In production, always set `DATABASE_URL`. pg-mem is ephemeral and resets on server restart.

---

## JWT & Authentication

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `JWT_SECRET` | *(must set)* | **Yes** | 64-char random secret for access token signing. Generate with: `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | *(must set)* | **Yes** | Separate 64-char secret for refresh token signing. Must differ from `JWT_SECRET`. |
| `JWT_EXPIRES_IN` | `15m` | No | Access token lifetime. Use short values: `5m`, `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | No | Refresh token lifetime. |

> **Security:** Never use the default secrets in production. Rotate secrets by changing these values and restarting the server (all sessions will be invalidated).

---

## AI Provider

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `AI_PROVIDER` | `mock` | No | Which AI backend to use: `mock`, `openai`, `gemini`. |
| `OPENAI_API_KEY` | *(none)* | If `AI_PROVIDER=openai` | OpenAI API key from platform.openai.com. |
| `GEMINI_API_KEY` | *(none)* | If `AI_PROVIDER=gemini` | Google AI Studio key. |

---

## CORS

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `FRONTEND_URL` | `http://localhost:5173` | No | Comma-separated list of allowed frontend origins. E.g.: `https://app.yourdomain.com,https://staging.yourdomain.com` |

---

## Phase 9 — Security & Monitoring

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `SESSION_TIMEOUT_MINUTES` | `480` | No | Informational — displayed in Settings. Actual enforcement is by JWT expiry. |
| `MAX_FAILED_LOGINS` | `5` | No | Informational — displayed in Settings. Actual enforcement is in `auth.service.js`. |
| `ENABLE_AUDIT_LOGS` | `true` | No | Reserved for future middleware-level audit toggle. |
| `AUTH_RATE_LIMIT_MAX` | `20` | No | Max login attempts per 15-min window. |
| `API_RATE_LIMIT_MAX` | `500` | No | Max general API requests per 15-min window. |

---

## Email / SMTP

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `SMTP_HOST` | *(none)* | No | SMTP server host for report delivery. |
| `SMTP_PORT` | `587` | No | SMTP port (587 for TLS, 465 for SSL). |
| `SMTP_USER` | *(none)* | No | SMTP username/email. |
| `SMTP_PASS` | *(none)* | No | SMTP password or app password. |
| `SMTP_FROM` | *(none)* | No | From address displayed in sent emails. |

---

## Optional External Monitoring

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `SENTRY_DSN` | *(none)* | No | Sentry error tracking DSN. Add `@sentry/node` if using. |
| `DATADOG_API_KEY` | *(none)* | No | Datadog metrics API key. |

---

## Security Checklist for Production

- [ ] Generate unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `DATABASE_URL` to Neon PostgreSQL (not in-memory)
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to exact production domain
- [ ] Do not commit `.env` to version control (it's in `.gitignore`)
- [ ] Rotate secrets annually or after any suspected breach
