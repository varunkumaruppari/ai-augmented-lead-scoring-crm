# Production Secrets & Keys Management Guide

This document details the strategies, security policies, and setup instructions for production secrets within the Lohithadharma Lead Scoring Dashboard.

---

## 1. Core Secrets Reference

The platform handles the following critical secrets that must never be exposed or committed to source control:

- **`DATABASE_URL`**: Contains PostgreSQL credentials. Exposing this grants full read/write access to user records, lead profiles, and audit tables.
- **`JWT_SECRET`**: Used to sign authentication access tokens. If compromised, attackers can forge admin identities.
- **`JWT_REFRESH_SECRET`**: Used to sign long-lived refresh tokens. Compromise allows offline session hijacking.
- **`OPENAI_API_KEY` / `GEMINI_API_KEY`**: Key to AI providers. Compromise allows bill runs on your account.
- **`SMTP_PASS`**: SMTP account access credentials for email delivery.

---

## 2. Platform Secret Injection Setup

### Render / Railway (Backend)
When deploying the Node.js API to Render or Railway:
1. Navigate to the **Variables** or **Environment** tab of the service.
2. Inject the following environment variables (do not upload `.env` directly):
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = `postgresql://[user]:[password]@[host]:5432/[db]?sslmode=require`
   - `JWT_SECRET` = *(Generate a 64-character random string)*
   - `JWT_REFRESH_SECRET` = *(Generate another unique 64-character random string)*
   - `FRONTEND_URL` = `https://your-frontend-vercel-url.vercel.app`
   - `AI_PROVIDER` = `gemini` (or `openai`)
   - `GEMINI_API_KEY` = `AIzaSy...`

### Vercel (Frontend)
When deploying the client application to Vercel:
1. Go to **Settings > Environment Variables**.
2. Add the following key:
   - `VITE_API_URL` = `https://your-backend-render-url.onrender.com/api/v1`

---

## 3. Secret Rotation Strategy

To maintain compliance and limit exposure windows, rotate secrets according to the following schedule:

| Secret | Frequency | Impact | Action Required |
|---|---|---|---|
| JWT Secrets | 90 Days | Users must re-login | Update `JWT_SECRET`/`JWT_REFRESH_SECRET` and restart servers. |
| DB Password | 180 Days | Temporary 30s downtime | Generate new password in Neon console, update `DATABASE_URL` on host, restart servers. |
| AI API Keys | As needed | AI features fall back | Swap API key in provider console, update config variable on host. |

---

## 4. Generating Secure Keys

Always generate cryptographically secure keys for JWT signing:
```bash
# Generate 64-byte hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never reuse keys between staging and production environments.
