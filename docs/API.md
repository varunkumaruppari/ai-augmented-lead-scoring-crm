# API Reference
**Lohithadharma Lead Scoring Dashboard — Backend API**  
Base URL: `http://localhost:5000/api`  
All protected routes require: `Authorization: Bearer <access_token>`

---

## Authentication

### POST `/v1/auth/login`
Login and receive JWT tokens.

**Request:**
```json
{ "email": "admin@lohithadharma.com", "password": "Admin@1234" }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "...", "full_name": "...", "role": "admin" },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```
**Rate Limit:** 20 requests / 15 min

---

### POST `/v1/auth/refresh`
Exchange refresh token for new token pair.

**Request:** `{ "refresh_token": "eyJ..." }` or header `X-Refresh-Token: eyJ...`

---

### GET `/v1/auth/me`
Returns current user profile. **Requires auth.**

---

### POST `/v1/auth/register`
Create new user. **Requires auth + admin/super_admin role.**

**Request:** `{ "email", "password", "full_name", "role": "agent|manager|admin|viewer" }`

---

### POST `/v1/auth/logout`
Logs out current session. **Requires auth.**

---

## Leads

All routes require authentication.

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/v1/leads` | List all leads (paginated) | Any |
| POST | `/v1/leads` | Create lead | Any |
| GET | `/v1/leads/:id` | Get lead by ID | Any |
| PUT | `/v1/leads/:id` | Update lead | Any |
| DELETE | `/v1/leads/:id` | Soft-delete lead | admin, super_admin |
| POST | `/v1/leads/:id/assign` | Assign lead to agent | admin, super_admin |
| GET | `/v1/leads/:id/activities` | Get lead activities | Any |
| POST | `/v1/leads/:id/activities` | Add activity | Any |
| GET | `/v1/leads/:id/score-history` | Get score history | Any |
| GET | `/v1/leads/dashboard/summary` | Dashboard stats | Any |
| GET | `/v1/leads/analytics` | Lead analytics | Any |

**Query Params for GET `/leads`:** `page`, `limit`, `category`, `status`, `assigned_to`, `search`

---

## Pipeline

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/pipeline` | Get all leads grouped by stage |
| PUT | `/v1/pipeline/move` | Move lead to new stage |
| GET | `/v1/pipeline/analytics` | Pipeline analytics |

**Move Request:** `{ "leadId": "uuid", "stage": "Qualified" }`

**Valid Stages:** New Lead, Qualified, Contacted, Site Visit Scheduled, Negotiation, Proposal Sent, Converted, Lost

---

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/revenue` | Revenue breakdown |
| GET | `/v1/analytics/leads` | Lead category stats |
| GET | `/v1/analytics/sources` | Lead source analysis |
| GET | `/v1/analytics/agents` | Agent performance |
| GET | `/v1/analytics/forecast` | Revenue forecast |
| GET | `/v1/analytics/insights` | AI business insights |

---

## Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/reports` | Report center metadata |
| POST | `/v1/reports/generate` | Generate a report |
| POST | `/v1/reports/schedule` | Schedule recurring report |
| GET | `/v1/reports/history` | Report history |
| GET | `/v1/reports/executive-summary` | AI executive summary |

---

## AI Intelligence

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/intelligence/:leadId` | Get lead intelligence score |
| GET | `/v1/intelligence/summary` | Global intelligence summary |
| GET | `/v1/intelligence/ai/:leadId` | Get AI insights for lead |
| POST | `/v1/intelligence/ai/:leadId/regenerate` | Regenerate AI insights |
| GET | `/v1/intelligence/ai/global` | Global AI insights |

---

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/notifications` | Get user notifications |
| POST | `/v1/notifications/:id/read` | Mark as read |
| POST | `/v1/notifications/read-all` | Mark all as read |

---

## Follow-Ups

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/followups` | List all follow-ups |
| POST | `/v1/followups` | Create follow-up |
| PUT | `/v1/followups/:id` | Update follow-up |
| PUT | `/v1/followups/:id/complete` | Complete follow-up |

---

## Agents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/agents/performance` | Agent performance stats |

---

## Users

| Method | Path | Required Role |
|--------|------|---------------|
| GET | `/v1/users` | admin, manager, super_admin |

---

## Settings (Phase 9)

| Method | Path | Description | Required Role |
|--------|------|-------------|---------------|
| GET | `/v1/settings` | Get all system settings | Any (authenticated) |
| PUT | `/v1/settings` | Update settings (bulk) | admin, manager, super_admin |

**PUT Body:** `[{ "key": "company.name", "value": "Acme Corp", "category": "company" }]`

---

## Admin (Phase 9)

All require **admin or super_admin** role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/admin/system-health` | DB ping, memory, uptime |
| GET | `/v1/admin/audit-logs` | Paginated audit log browser |
| GET | `/v1/admin/metrics` | Rolling API metrics |
| GET | `/v1/admin/status` | Subsystem status |
| GET | `/v1/admin/settings` | All settings (admin view) |
| PUT | `/v1/admin/settings` | Update settings |

**Audit Log Query Params:** `user_id`, `action`, `entity_type`, `start_date`, `end_date`, `page`, `limit`

---

## Error Format

All errors follow:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "category": "VALIDATION",
    "message": "...",
    "details": [{ "field": "email", "message": "must be a valid email" }]
  },
  "meta": { "requestId": "uuid", "timestamp": "2026-06-19T..." }
}
```

**Error Codes:** `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `EMAIL_EXISTS`, `ACCOUNT_LOCKED`, `RATE_LIMITED`, `SERVER_ERROR`
