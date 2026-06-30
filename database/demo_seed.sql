-- Demo Seed Data
-- Lohithadharma Lead Scoring Dashboard
-- Run: psql $DATABASE_URL -f demo_seed.sql

-- ─── SEED DEMO USERS ──────────────────────────────────────────────────────────
-- All passwords are "Admin@1234" (bcrypt hash: $2b$12$5pAkFqyVa65Pvv.YofrF7eitKHeSZfUliWTv5EYfQck5x4hGKSNeC)

INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES
  ('44444444-4444-4444-4444-444444444444',
   'manager@lohithadharma.com',
   '$2b$12$5pAkFqyVa65Pvv.YofrF7eitKHeSZfUliWTv5EYfQck5x4hGKSNeC',
   'Nancy Manager',
   'manager',
   TRUE),
  ('55555555-5555-5555-5555-555555555555',
   'agent@lohithadharma.com',
   '$2b$12$5pAkFqyVa65Pvv.YofrF7eitKHeSZfUliWTv5EYfQck5x4hGKSNeC',
   'Arthur Agent',
   'agent',
   TRUE),
  ('66666666-6666-6666-6666-666666666666',
   'viewer@lohithadharma.com',
   '$2b$12$5pAkFqyVa65Pvv.YofrF7eitKHeSZfUliWTv5EYfQck5x4hGKSNeC',
   'Valerie Viewer',
   'viewer',
   TRUE)
ON CONFLICT (email) DO NOTHING;

-- ─── SEED DEMO LEADS ──────────────────────────────────────────────────────────
INSERT INTO leads (
  id, full_name, email, phone, source, status,
  current_score, category, budget_tier, budget_min, budget_max, urgency_level,
  questions_asked, site_visit_interest, site_visit_done, engagement_count, response_time_hrs,
  followup_count, property_type, preferred_location, preferred_area_sqyd, timeline_months,
  notes, assigned_to, pipeline_stage, expected_revenue
) VALUES
  -- HOT Leads
  ('11111111-1111-1111-1111-111111111111', 'Rahul Sharma', 'rahul.sharma@example.com', '+919876543210', 'website', 'working',
   95, 'HOT', 'premium', 15000000.00, 20000000.00, 5,
   6, TRUE, TRUE, 8, 0.5, 3, '4BHK Villa', 'Whitefield, Bangalore', 300.00, 1,
   'Extremely interested, budget approved, immediate site visit completed. Ready for booking.', '55555555-5555-5555-5555-555555555555', 'Proposal Sent', 180000.00),

  ('11111111-1111-1111-1111-111111111112', 'Priya Patel', 'priya.patel@example.com', '+918765432109', 'google', 'new',
   82, 'HOT', 'high', 10000000.00, 14000000.00, 4,
   4, TRUE, FALSE, 5, 1.2, 1, '3BHK Apartment', 'Gachibowli, Hyderabad', 180.00, 2,
   'High intent from website inquiry, requested layout plans and pricing sheets.', '55555555-5555-5555-5555-555555555555', 'Contacted', 120000.00),

  -- WARM Leads
  ('11111111-1111-1111-1111-111111111113', 'Amit Verma', 'amit.verma@example.com', '+917654321098', 'facebook', 'working',
   62, 'WARM', 'medium', 6000000.00, 9000000.00, 3,
   3, TRUE, FALSE, 4, 3.5, 2, '2BHK Apartment', 'Kharadi, Pune', 120.00, 3,
   'Looking for resale or newly launched properties. Needs home loan assistance.', '55555555-5555-5555-5555-555555555555', 'Meeting Scheduled', 80000.00),

  ('11111111-1111-1111-1111-111111111114', 'Sneha Reddy', 'sneha.reddy@example.com', '+916543210987', 'instagram', 'new',
   52, 'WARM', 'medium', 5000000.00, 8000000.00, 3,
   2, TRUE, FALSE, 2, 4.0, 1, 'Plot', 'Vijayawada Highway, Hyderabad', 250.00, 4,
   'Inquired via Instagram lead ad. Prefers gated community plots.', NULL, 'New Lead', 75000.00),

  -- COLD Leads
  ('11111111-1111-1111-1111-111111111115', 'Vikram Singh', 'vikram.singh@example.com', '+915432109876', 'referral', 'nurturing',
   35, 'COLD', 'low', 3000000.00, 4500000.00, 2,
   1, FALSE, FALSE, 1, 14.5, 0, '1BHK Apartment', 'New Town, Kolkata', 60.00, 6,
   'Low response frequency, but referred by existing client. Keep in email loops.', '55555555-5555-5555-5555-555555555555', 'New Lead', 40000.00),

  ('11111111-1111-1111-1111-111111111116', 'Rohan Mehta', 'rohan.mehta@example.com', '+914321098765', 'whatsapp', 'qualified',
   68, 'WARM', 'high', 11000000.00, 13000000.00, 3,
   4, TRUE, FALSE, 3, 2.0, 2, 'Office Space', 'SGPGI Road, Lucknow', 150.00, 3,
   'Commercial property buyer, WhatsApp chat active.', '55555555-5555-5555-5555-555555555555', 'Contacted', 130000.00)
ON CONFLICT (id) DO NOTHING;

-- ─── SEED LEAD SCORES HISTORY ──────────────────────────────────────────────────
INSERT INTO lead_scores (lead_id, score, category, budget_score, urgency_score, questions_score, site_visit_score, engagement_score, response_score, followup_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 95, 'HOT', 25, 20, 15, 15, 10, 10, 5),
  ('11111111-1111-1111-1111-111111111112', 82, 'HOT', 20, 16, 10, 8, 10, 10, 2),
  ('11111111-1111-1111-1111-111111111113', 62, 'WARM', 12, 12, 10, 8, 7, 7, 3),
  ('11111111-1111-1111-1111-111111111114', 52, 'WARM', 12, 12, 5, 8, 4, 7, 2),
  ('11111111-1111-1111-1111-111111111115', 35, 'COLD', 5, 8, 5, 0, 4, 1, 0)
ON CONFLICT (id) DO NOTHING;

-- ─── SEED LEAD ACTIVITIES ─────────────────────────────────────────────────────
INSERT INTO lead_activities (lead_id, user_id, type, description, meta) VALUES
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'call_completed', 'Spoke to Rahul, confirmed budget details and arranged site visit', '{"duration_sec": 320}'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'site_visit_completed', 'Site visit completed. Customer loved Phase 1 villa plots.', '{"rating": 5}'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'proposal_sent', 'Shared detailed pricing plan and custom payment milestone chart', '{"revenue": 180000}'),
  ('11111111-1111-1111-1111-111111111112', '55555555-5555-5555-5555-555555555555', 'email_sent', 'Sent project brochures and unit availability sheet', '{}')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED FOLLOW-UPS ──────────────────────────────────────────────────────────
INSERT INTO follow_ups (id, lead_id, assigned_to, scheduled_at, completed_at, type, priority, notes, outcome) VALUES
  -- Completed follow-up
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'site_visit', 'High', 'Conduct site visit for Phase 1 plots', 'Successful, client ready to book'),
  -- Scheduled future follow-up
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', NOW() + INTERVAL '2 days', NULL, 'call', 'High', 'Call for closing booking deposit token', NULL),
  -- Overdue follow-up
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111113', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '1 days', NULL, 'call', 'Medium', 'Send loan calculator details sheet', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── SEED LEAD INTELLIGENCE ────────────────────────────────────────────────────
INSERT INTO lead_intelligence (lead_id, score, conversion_probability, priority, quality, recommendation, explanation) VALUES
  ('11111111-1111-1111-1111-111111111111', 95, 92, 'Critical', 'Excellent', 'Proceed directly to booking. Send booking contract immediately.', 'Lead matches all premium customer indicators. Verified budget availability, completed physical site visit, high response velocity.'),
  ('11111111-1111-1111-1111-111111111112', 82, 80, 'High', 'Good', 'Follow up within 4 hours. Deliver site layouts.', 'Highly active lead. High engagement count but site visit not yet scheduled. Schedule immediately.')
ON CONFLICT (lead_id) DO NOTHING;

-- ─── SEED LEAD AI INSIGHTS ─────────────────────────────────────────────────────
INSERT INTO lead_ai_insights (lead_id, summary_overview, summary_intent, summary_risk, summary_opportunity, outreach_followup, outreach_email, outreach_whatsapp, next_action, risk_detection, opportunity_detection) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'Rahul Sharma is a high-net-worth individual looking for 4BHK Villa plots in Whitefield. He has approved the premium pricing tier.',
   'Intent is extremely high. Wants to build a residential villa within 6 months. Budget confirmed at 2.0 Cr.',
   'Low risk. Minor delay in home loan approval from private banks.',
   'Opportunity to cross-sell construction partner services.',
   '{"first_contact": "Hello Rahul, thank you for showing interest in Lohithadharma Projects. We have premium plots ready in Whitefield.", "follow_up": "Hi Rahul, following up on our conversation, would you like to review availability sheets?", "site_visit_reminder": "Reminder: Your site visit for Whitefield Villas is scheduled tomorrow at 10 AM.", "proposal_reminder": "Hi Rahul, let us know if you have questions regarding the custom payment plan.", "closing": "Dear Rahul, we are ready to seal the booking. Let us finalize the registration date."}',
   '{"subject": "Exclusive Premium Villa Plots - Whitefield, Bangalore", "body": "Dear Rahul, Thank you for completing the site visit. As discussed, please find attached the official price quote and payment schedules.", "cta": "Confirm Booking"}',
   'Hello Rahul, it was great showing you the villa plots today. Let me know if we can block plot No. 42 for you.',
   'Initiate booking contract preparation',
   '["Home loan approval bottleneck"]',
   '["Construction partner cross-sell opportunity"]')
ON CONFLICT (lead_id) DO NOTHING;

-- ─── SEED REPORT SCHEDULES ─────────────────────────────────────────────────────
INSERT INTO report_schedules (id, name, report_type, frequency, recipients, is_active) VALUES
  ('33333333-3333-3333-3333-333333333331', 'Executive Daily Digest', 'executive', 'daily', 'ceo@lohithadharma.com,coo@lohithadharma.com', TRUE),
  ('33333333-3333-3333-3333-333333333332', 'Weekly Sales Performance', 'agent', 'weekly', 'sales-head@lohithadharma.com', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Monthly Revenue Report', 'revenue', 'monthly', 'finance@lohithadharma.com', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─── SEED REPORT HISTORY ────────────────────────────────────────────────────────
INSERT INTO report_history (id, schedule_id, name, type, format, generated_by, status) VALUES
  ('33333333-3333-3333-3333-333333333341', '33333333-3333-3333-3333-333333333331', 'Executive Daily Digest - 2026-06-18', 'executive', 'pdf', '44444444-4444-4444-4444-444444444444', 'success'),
  ('33333333-3333-3333-3333-333333333342', '33333333-3333-3333-3333-333333333332', 'Weekly Sales Performance - W24', 'agent', 'excel', '44444444-4444-4444-4444-444444444444', 'success')
ON CONFLICT (id) DO NOTHING;

-- ─── SEED SYSTEM METRICS ───────────────────────────────────────────────────────
INSERT INTO system_metrics (metric_name, metric_value, tags) VALUES
  ('http.request.count', 24892.0000, '{"env": "production"}'),
  ('http.error.4xx.count', 123.0000, '{"env": "production"}'),
  ('http.error.5xx.count', 12.0000, '{"env": "production"}'),
  ('db.connection.latency_ms', 14.2000, '{"host": "neon-postgresql"}');
