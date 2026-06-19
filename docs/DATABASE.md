# Database Reference
**Lohithadharma Lead Scoring Dashboard — PostgreSQL Schema**

Full DDL in: `database/schema.sql`

---

## Tables Overview

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `roles` | Role definitions | name, description |
| `users` | User accounts | email, role, failed_logins, locked_until |
| `leads` | Lead records | full_name, status, current_score, pipeline_stage |
| `lead_scores` | Score calculation history | lead_id, score, category, calculated_at |
| `lead_activities` | Activity timeline | lead_id, user_id, type, description |
| `follow_ups` | Scheduled follow-ups | lead_id, scheduled_at, type, priority |
| `notifications` | User notification queue | user_id, type, is_read |
| `audit_logs` | Immutable action log | user_id, action, entity_type, old_data, new_data, ip |
| `lead_intelligence` | AI scoring metadata | lead_id, conversion_probability, priority |
| `lead_ai_insights` | Generated AI content | summary, outreach messages, risk/opportunity flags |
| `report_schedules` | Scheduled report config | name, report_type, frequency, recipients |
| `report_history` | Report generation log | type, format, status, generated_by |
| `system_settings` | Persistent config KV | key, value, category |
| `system_metrics` | Metric snapshots | metric_name, metric_value, recorded_at |

---

## Lead Status Values

| Status | Pipeline Stage |
|--------|---------------|
| `new` | New Lead |
| `qualified` | Qualified |
| `contacted` | Contacted |
| `site_visit_scheduled` | Site Visit Scheduled |
| `negotiation` | Negotiation |
| `proposal_sent` | Proposal Sent |
| `booked` | Converted |
| `lost` | Lost |

---

## Roles

| Role | Value |
|------|-------|
| Super Admin | `super_admin` |
| Admin | `admin` |
| Manager | `manager` |
| Agent | `agent` |
| Viewer | `viewer` |

---

## Key Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_leads_category` | leads | Filter by HOT/WARM/COLD |
| `idx_leads_score` | leads | ORDER BY score DESC |
| `idx_leads_pipeline_stage` | leads | Kanban column grouping |
| `idx_leads_assigned_to` | leads | Agent-filtered views |
| `idx_lead_scores_lead_id` | lead_scores | Score history per lead |
| `idx_activities_lead_id` | lead_activities | Activity timeline |
| `idx_notifs_user_id` | notifications | User notification feed |
| `idx_audit_logs_action` | audit_logs | Filter audit by action |
| `idx_audit_logs_created_at` | audit_logs | Time-range queries |
| `idx_settings_category` | system_settings | Settings by category |

---

## Audit Log Actions

| Action | Trigger |
|--------|---------|
| `USER_LOGIN` | Successful login |
| `USER_LOGOUT` | Explicit logout |
| `USER_CREATED` | Admin creates new user |
| `LEAD_CREATED` | New lead submitted |
| `LEAD_UPDATED` | Lead fields changed |
| `LEAD_DELETED` | Lead soft-deleted |
| `LEAD_ASSIGNED` | Agent assigned to lead |
| `LEAD_STAGE_CHANGED` | Pipeline stage moved |
| `SETTINGS_UPDATED` | System settings modified |

---

## System Settings Keys

| Key | Category | Default | Description |
|-----|----------|---------|-------------|
| `company.name` | company | Lohithadharma Projects | Company display name |
| `company.timezone` | company | Asia/Kolkata | Report timezone |
| `company.currency` | company | INR | Revenue currency |
| `notifications.email_enabled` | notifications | true | Email alert toggle |
| `notifications.whatsapp_enabled` | notifications | false | WhatsApp toggle |
| `ai.provider` | ai | mock | Active AI provider |
| `ai.fallback_enabled` | ai | true | Auto-fallback to mock |
| `security.max_failed_logins` | security | 5 | Lockout threshold |
| `security.session_timeout_minutes` | security | 480 | Session duration |
| `system.maintenance_mode` | system | false | Maintenance flag |
| `system.log_level` | system | info | Winston log level |
