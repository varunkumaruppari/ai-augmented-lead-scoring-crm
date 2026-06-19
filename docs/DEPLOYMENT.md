# Deployment Guide
**Lohithadharma Lead Scoring Dashboard**

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- npm v9+
- Git

### Steps

```powershell
# 1. Clone the repository
git clone https://github.com/your-org/lead-scoring-dashboard.git
cd lead-scoring-dashboard

# 2. Backend setup
cd backend
copy .env.example .env
# Edit .env — at minimum set JWT_SECRET and JWT_REFRESH_SECRET
npm install
npm run dev
# Server starts at http://localhost:5000

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
# Frontend starts at http://localhost:5173
```

### Default Login
- **Email:** admin@lohithadharma.com
- **Password:** Admin@1234

> In development, the in-memory database (pg-mem) is used automatically.
> Data resets on every server restart. All seed data (admin user, roles, settings) is applied on startup.

---

## Production Deployment (Neon + Railway / Render)

### Step 1: Set Up PostgreSQL (Neon)
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`
3. Run the schema: `psql $DATABASE_URL -f database/schema.sql`

### Step 2: Deploy Backend (Railway)

```bash
# Set environment variables in Railway dashboard:
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=<64-char random>
JWT_REFRESH_SECRET=<64-char random different>
AI_PROVIDER=mock
FRONTEND_URL=https://your-frontend.vercel.app
```

Railway auto-detects Node.js and runs `npm start`.

### Step 3: Deploy Frontend (Vercel)

```bash
# In Vercel dashboard, set:
VITE_API_URL=https://your-backend.railway.app/api
```

Update `frontend/src/services/api.js` base URL to use `VITE_API_URL` env var.

---

## Production Checklist

### Security
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are 64+ char random strings
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` is set to exact production domain
- [ ] `.env` is in `.gitignore` (never committed)
- [ ] `DATABASE_URL` points to production Neon, not local
- [ ] TLS/HTTPS enabled on both frontend and backend domains

### Database
- [ ] Schema applied to production DB: `psql $DATABASE_URL -f database/schema.sql`
- [ ] Admin user created (from schema seed)
- [ ] Admin password changed after first login

### Performance
- [ ] Frontend built for production: `npm run build`
- [ ] Static assets served via CDN (Vercel handles this)
- [ ] Backend behind a reverse proxy (Railway/Render handles this)

### Monitoring
- [ ] Check `/health` endpoint returns `{ status: "ok" }`
- [ ] Check `/api/admin/system-health` for DB connectivity
- [ ] Set up uptime monitoring (e.g., UptimeRobot, Better Uptime)

---

## Updating the Application

### Backend Update
```powershell
git pull
cd backend
npm install
# Restart the server (Railway/Render auto-restarts on push)
```

### Frontend Update
```powershell
git pull
cd frontend
npm install
npm run build
# Deploy dist/ to Vercel (auto-deploys on git push)
```

### Database Schema Migration
```bash
# For schema additions (Phase N upgrades):
psql $DATABASE_URL -f database/schema.sql
# Schema uses IF NOT EXISTS — safe to re-run
```

---

## Environment-Specific Configuration

| Setting | Development | Production |
|---------|------------|------------|
| Database | pg-mem (in-memory) | Neon PostgreSQL |
| Log format | Colorized console | JSON (stdout) |
| Error messages | Full stack trace | Generic message only |
| AI Provider | mock | mock (default) or openai/gemini |
| Rate limits | 20 auth, 500 API | Same (adjust in app.js) |
| CSP | Relaxed | Strict |
