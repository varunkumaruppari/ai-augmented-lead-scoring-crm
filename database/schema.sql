-- Lead Scoring Dashboard - PostgreSQL Schema
-- Lohithadharma Projects Pvt Ltd
-- Run: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── ROLES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(50) DEFAULT 'agent' REFERENCES roles(name) ON UPDATE CASCADE,
  is_active       BOOLEAN DEFAULT TRUE,
  failed_logins   INT DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  refresh_token   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ─── LEADS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name             VARCHAR(255) NOT NULL,
  email                 VARCHAR(255),
  phone                 VARCHAR(20) NOT NULL,
  source                VARCHAR(50) NOT NULL DEFAULT 'web',
  status                VARCHAR(50) NOT NULL DEFAULT 'new',
  -- Score & Category
  current_score         INT DEFAULT 0,
  category              VARCHAR(10) DEFAULT 'COLD',
  -- Scoring factor inputs
  budget_tier           VARCHAR(20) DEFAULT 'low',
  budget_min            NUMERIC(12,2),
  budget_max            NUMERIC(12,2),
  urgency_level         INT DEFAULT 1 CHECK (urgency_level BETWEEN 1 AND 5),
  questions_asked       INT DEFAULT 0,
  site_visit_interest   BOOLEAN DEFAULT FALSE,
  site_visit_done       BOOLEAN DEFAULT FALSE,
  engagement_count      INT DEFAULT 0,
  response_time_hrs     NUMERIC(5,1) DEFAULT 24,
  followup_count        INT DEFAULT 0,
  -- Lead profile
  property_type         VARCHAR(100),
  preferred_location    VARCHAR(255),
  preferred_area_sqyd   NUMERIC(8,2),
  timeline_months       INT,
  notes                 TEXT,
  -- Assignment
  assigned_to           UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at           TIMESTAMPTZ,
  pipeline_stage        VARCHAR(100) DEFAULT 'New Lead',
  stage_updated_at      TIMESTAMPTZ DEFAULT NOW(),
  expected_revenue      NUMERIC(12,2) DEFAULT 0.00,
  -- Metadata
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leads_category    ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_score       ON leads(current_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at  ON leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm  ON leads USING GIN (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_leads_name_trgm   ON leads USING GIN (full_name gin_trgm_ops);

-- ─── LEAD SCORES (History) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  score           INT NOT NULL,
  category        VARCHAR(10) NOT NULL,
  budget_score    INT DEFAULT 0,
  urgency_score   INT DEFAULT 0,
  questions_score INT DEFAULT 0,
  site_visit_score INT DEFAULT 0,
  engagement_score INT DEFAULT 0,
  response_score  INT DEFAULT 0,
  followup_score  INT DEFAULT 0,
  calculated_by   VARCHAR(50) DEFAULT 'engine',
  override_reason TEXT,
  calculated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_calc_at ON lead_scores(calculated_at DESC);

-- ─── LEAD ACTIVITIES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type        VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id  ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type     ON lead_activities(type);

-- ─── FOLLOW-UPS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_ups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  type            VARCHAR(50) DEFAULT 'call',
  priority        VARCHAR(50) NOT NULL DEFAULT 'Medium',
  notes           TEXT,
  outcome         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_lead_id      ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to  ON follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_at ON follow_ups(scheduled_at);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  lead_id    UUID REFERENCES leads(id) ON DELETE CASCADE,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user_id  ON notifications(user_id, is_read);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEAD INTELLIGENCE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_intelligence (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id                 UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  score                   INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  conversion_probability  INT NOT NULL CHECK (conversion_probability BETWEEN 0 AND 100),
  priority                VARCHAR(50) NOT NULL,
  quality                 VARCHAR(50) NOT NULL,
  recommendation          TEXT NOT NULL,
  explanation             TEXT NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_lead ON lead_intelligence(lead_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_probability ON lead_intelligence(conversion_probability DESC);

-- ─── LEAD AI INSIGHTS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_ai_insights (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id               UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  summary_overview      TEXT NOT NULL,
  summary_intent        TEXT NOT NULL,
  summary_risk          TEXT NOT NULL,
  summary_opportunity   TEXT NOT NULL,
  outreach_followup     JSONB NOT NULL DEFAULT '{}', -- holds first_contact, follow_up, site_visit_reminder, proposal_reminder, closing
  outreach_email        JSONB NOT NULL DEFAULT '{}', -- holds subject, body, cta
  outreach_whatsapp     TEXT NOT NULL,
  next_action           VARCHAR(255) NOT NULL,
  risk_detection        JSONB NOT NULL DEFAULT '[]', -- list of risk alerts
  opportunity_detection JSONB NOT NULL DEFAULT '[]', -- list of opportunity flags
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_lead ON lead_ai_insights(lead_id);

-- ─── REPORTING TABLES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- lead, revenue, pipeline, agent, conversion, executive, ai
  frequency   VARCHAR(50) NOT NULL,   -- daily, weekly, monthly, quarterly
  recipients  TEXT NOT NULL,          -- comma-separated emails
  is_active   BOOLEAN DEFAULT TRUE,
  last_run    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id   UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(50) NOT NULL,
  format        VARCHAR(20) NOT NULL, -- pdf, excel, csv, print
  generated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status        VARCHAR(50) DEFAULT 'success',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_delivery_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  history_id      UUID NOT NULL REFERENCES report_history(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  status          VARCHAR(50) NOT NULL, -- delivered, failed
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES ('super_admin', 'Full system access') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description) VALUES ('admin', 'Lead and user management') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description) VALUES ('manager', 'Team and report management') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description) VALUES ('agent', 'Lead management only') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name, description) VALUES ('viewer', 'Read-only access') ON CONFLICT (name) DO NOTHING;

-- Default admin: admin@lohithadharma.com / Admin@1234
-- Password hash generated with bcrypt cost 12
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@lohithadharma.com',
   '$2b$12$5pAkFqyVa65Pvv.YofrF7eitKHeSZfUliWTv5EYfQck5x4hGKSNeC',
   'System Administrator',
   'admin')
ON CONFLICT (email) DO NOTHING;

-- ─── AUDIT LOG INDEX ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);

-- ─── SYSTEM SETTINGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(100) UNIQUE NOT NULL,  -- e.g. 'company.name'
  value       TEXT NOT NULL,
  category    VARCHAR(50) NOT NULL DEFAULT 'system', -- company, notifications, ai, security, system
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);

-- Default system settings
INSERT INTO system_settings (key, value, category, description) VALUES
  ('company.name',               'Lohithadharma Projects',  'company',       'Company display name'),
  ('company.timezone',           'Asia/Kolkata',             'company',       'Default timezone for reports'),
  ('company.currency',           'INR',                      'company',       'Currency code for revenue display'),
  ('notifications.email_enabled','true',                     'notifications', 'Enable email notifications'),
  ('notifications.whatsapp_enabled','false',                 'notifications', 'Enable WhatsApp notifications'),
  ('ai.provider',                'mock',                     'ai',            'Active AI provider: mock, openai, gemini'),
  ('ai.fallback_enabled',        'true',                     'ai',            'Fall back to mock if provider unavailable'),
  ('security.max_failed_logins', '5',                        'security',      'Max failed logins before account lockout'),
  ('security.session_timeout_minutes','480',                 'security',      'Session timeout in minutes'),
  ('system.maintenance_mode',    'false',                    'system',        'Put platform in maintenance mode'),
  ('system.log_level',           'info',                     'system',        'Winston log level: error, warn, info, debug')
ON CONFLICT (key) DO NOTHING;

-- ─── SYSTEM METRICS ───────────────────────────────────────────────────────────
-- Stores periodic metric snapshots (populated by a scheduled job if needed)
CREATE TABLE IF NOT EXISTS system_metrics (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name  VARCHAR(100) NOT NULL,
  metric_value NUMERIC(12,4) NOT NULL,
  tags         JSONB DEFAULT '{}',
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);

