# Sandbox Demo Guide
**Lohithadharma Lead Scoring Dashboard**

---

## 1. Demo Credentials Matrix

The system includes preconfigured sandbox accounts for various roles. All accounts use the password: `Admin@1234`.

| Email | Role | Scope & Permissions |
|---|---|---|
| `admin@lohithadharma.com` | Super Admin / Admin | Full settings configuration, database health checks, audit logs, and user management. |
| `manager@lohithadharma.com` | Manager | Executive reporting suite, scheduler options, overview analytics, and read/write leads. |
| `agent@lohithadharma.com` | Sales Agent | Lead pipeline access, editing own leads, follow-up scheduler, notifications center. |
| `viewer@lohithadharma.com` | Read-only Viewer | View access only. Cannot perform mutations (write, edit, delete, schedule reports). |

---

## 2. Sandbox Setup & Seeding

To run this demo environment locally with the seeded data:
1. Initialize the schema:
   ```bash
   node database/migrate.js
   ```
2. Populate the demo dataset:
   ```bash
   psql $DATABASE_URL -f database/demo_seed.sql
   ```
   *(Or spin up using Docker Compose, which executes these files automatically on start).*

---

## 3. Investor Demo Walkthrough

### Goal: Show business intelligence capability, AI automation value-add, and revenue conversion prediction.

1. **Step 1: Executive Dashboard overview**
   - Log in as `manager@lohithadharma.com`.
   - Point out the **Monthly Revenue Growth** and **Conversion Rates** cards. Highlight how lead scores are aggregated to forecast potential pipeline value.
2. **Step 2: AI Lead Scoring Engine**
   - Navigate to the **Leads** list.
   - Click on the lead **Rahul Sharma**.
   - Show the **AI Insight Card** generated automatically. Highlight the conversion probability (92%) and the custom AI summary, risk assessment, and outreach generation. Explain how this saves agents 3 hours of writing messages every day.
3. **Step 3: Executive Reporting Suite**
   - Navigate to `/reports`.
   - Build a **Lead Report** and download it as **PDF/Excel**. Highlight how executives can configure automated weekly/monthly email deliveries directly to their inbox.

---

## 4. Recruiter Tech Review Guide

### Goal: Demonstrate architectural clean code, high security, role-based authorization, and DevOps readiness.

- **Security Focus**: Show the input sanitization middleware (`src/middlewares/sanitize.middleware.js`) which strips XSS scripts, helmet configuration, and Express-rate-limit implementation in `app.js`.
- **System Observability**: Highlight how `/health`, `/status`, and `/system` endpoints return diagnostic stats. Point out the admin health page fetching process uptime, memory consumption, and database connection latency.
- **Testing Coverage**: Explain the unit tests for the lead scoring engine (`tests/unit/scoring.test.js`) and API integration tests (`tests/api/health.test.js`), which run automatically in the CI/CD pipeline.
- **Dockerization**: Show the multi-stage docker-compose file that builds and structures the database, backend, and static Nginx frontend container securely.
