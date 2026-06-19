# Lohithadharma Lead Scoring Dashboard
AI-Augmented CRM & Sales Intelligence Platform (Production Release Candidate)

---

## 1. Overview

The **Lead Scoring Dashboard** is an enterprise-grade, AI-augmented Customer Relationship Management (CRM) application designed for **Lohithadharma Projects Pvt Ltd**. It qualifies, scores, and prioritizes real estate leads using an automated 7-factor scoring engine and generates structured AI summaries, risk profiles, and email/WhatsApp copy templates.

---

## 2. Core Features & Phase 10 Highlights

- **Lead Scoring Engine**: Weighted 7-factor algorithmic score (0-100) classifying leads into **HOT**, **WARM**, or **COLD** priority pools.
- **AI Outreach & Insights**: Integrated OpenAI and Gemini provider abstractions with automatic mock fallback systems.
- **Executive Reporting & Scheduler**: Custom reports engine supporting PDF, Excel, and CSV export, with scheduled email deliveries.
- **Application Monitoring**: Diagnostic endpoints (`/health`, `/status`, and protected `/system`) exposing system indicators and process metrics.
- **Enterprise Security**: Helmet headers, CORS policies, Express Rate Limiter, and recursive XSS input sanitization.
- **Dockerization Orchestration**: Multi-stage `Dockerfiles` and local orchestrator `docker-compose.yml`.
- **CI/CD Pipeline**: GitHub Actions testing and deployment workflows for automated Vercel & Render shipping.
- **Testing Suite**: Unit, Integration, API, and connection Smoke tests using Jest and Supertest.

---

## 3. Technology Stack

- **Frontend**: React 19 + Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, Socket.io-client.
- **Backend**: Node.js, Express, PostgreSQL driver (`pg`), Socket.io, Winston Logger, Joi, bcryptjs, JSON Web Tokens.
- **Database**: PostgreSQL (Neon database or standard local PG server).
- **Hosting Topology**: Vercel (Frontend Client) + Render/Railway (Backend API Node) + Neon (Serverless PostgreSQL DB).

---

## 4. Documentation Directory

Detailed operations, developer, and design resources are located in the `/docs` directory:

| Document | Target Audience | Key Contents |
|---|---|---|
| 📖 [System Architecture Diagrams](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/DIAGRAMS.md) | Developers, Architects | System diagrams, ERDs, authentication, and request flow charts. |
| 📖 [API Documentation](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/API.md) | Frontend & Integration Devs | Complete REST endpoint payload schemas, parameters, and responses. |
| 📖 [Database Schema Dictionary](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/DATABASE.md) | Database Admins, Backend Devs | Table descriptions, indexes, audit logs, and default settings keys. |
| 📖 [Deployment & DevOps Guide](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/DEPLOYMENT.md) | Devops Engineers, SREs | Multi-cloud step-by-step setup (Neon/Vercel/Render), backups, and recovery. |
| 📖 [Developer Setup Guide](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/DEVELOPER.md) | Active Developers | Setup commands, folder mappings, coding standards, and pre-commit checks. |
| 📖 [Administrator Operations Guide](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/ADMIN.md) | System Admins, SREs | Role matrices, settings adjusting, audit log browsing, and failed log lockout rules. |
| 📖 [User Operations Manual](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/USER_MANUAL.md) | End-Users, Managers | Kanban updates guide, reporting scheduler inputs, and alert management. |
| 📖 [Sandbox Demo Guide](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/DEMO_GUIDE.md) | Recruiters, Investors | Demo credentials, script walkthrough steps, and recruiter review prompts. |
| 📖 [Audit & Security Report](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/AUDIT_REPORT.md) | QA, Security Auditors | Performance checks, XSS audit details, security scores, and final checklist. |
| 📖 [Environment Reference](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/ENVIRONMENT.md) | DevOps | Core config values, CORS domains, Sentry logging hooks, and security checklists. |
| 📖 [Secrets Management](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/SECRETS.md) | DevOps, System Admins | Keystore generations, rotation schedules, and cloud-provider dashboard setups. |
| 📖 [Testing Guide](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/docs/TESTING.md) | QA Engineers | Setup steps, test configurations, coverage details, and Jest reports. |

---

## 5. Quick Start (Development & Local Setup)

### Option A: Local Dev Mode
1. **Initialize Database**:
   Ensure a local PostgreSQL instance is running. Run:
   ```bash
   node database/migrate.js
   psql $DATABASE_URL -f database/demo_seed.sql
   ```
2. **Start Backend Server**:
   ```bash
   cd backend
   cp .env.example .env   # Update DATABASE_URL and JWT_SECRET
   npm install
   npm run dev
   ```
3. **Start Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Option B: Docker Compose (All Services Containerized)
Build and run database, API, and Nginx reverse proxy containers:
```bash
docker-compose up --build
```
Access the client dashboard at `http://localhost:8080` (API points to `http://localhost:5000/api/v1`).

---

## 6. Running Tests
Run Jest unit, API, integration, and smoke test suites:
```bash
cd backend
npm run test
```
To collect coverage statistics:
```bash
npm run test:coverage
```
