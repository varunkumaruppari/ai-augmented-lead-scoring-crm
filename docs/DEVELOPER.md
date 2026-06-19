# Developer Guide
**Lohithadharma Lead Scoring Dashboard**

Welcome to the Lead Scoring Dashboard developer documentation. This guide will help you understand the architecture, project structure, coding standards, and development workflows.

---

## 1. Project Directory Structure

The project is structured as a monorepo containing distinct frontend, backend, and database subdirectories:

```
lead-scoring-dashboard/
├── .github/workflows/      # CI/CD pipeline definitions
├── backend/                # Express.js REST API
│   ├── src/
│   │   ├── config/         # Database and Winston logger configuration
│   │   ├── controllers/    # Route controllers (request handling)
│   │   ├── middlewares/    # Security, RBAC, logging, request tracing
│   │   ├── repositories/   # Data access layer (SQL queries)
│   │   ├── routes/         # Express router mapping definitions
│   │   ├── services/       # Core business logic (AI, scoring, reports)
│   │   └── validators/     # Joi validation schemas
│   ├── tests/              # Jest test suites (unit, integration, api, smoke)
│   └── Dockerfile          # Production backend Docker file
├── database/               # PostgreSQL schema & migration scripts
│   ├── schema.sql          # Primary DDL database schema
│   ├── demo_seed.sql       # Sandbox demo environment seed data
│   └── migrate.js          # Direct Node-based schema migration tool
├── docs/                   # Guides, API specs, database dictionaries
└── frontend/               # Vite + React Client
    ├── src/
    │   ├── components/     # UI components (Layouts, Dashboard cards, Charts)
    │   ├── context/        # React Context (Auth, Notifications)
    │   ├── pages/          # Layout page containers (Kanban, Analytics, Reports)
    │   └── services/       # API integration client services (Axios hooks)
    └── Dockerfile          # Multi-stage frontend Docker file
```

---

## 2. Core Coding Standards

### Backend Style Rules
- **Controller-Repository Pattern**: Keep controllers focused on HTTP parameters and routing logic. Delegate raw SQL execution to dedicated `repositories` and business operations to `services`.
- **Database Safety**: Never interpolate variables in raw SQL queries. Always use parameterized inputs:
  ```javascript
  // CORRECT:
  await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
  ```
- **Error Propagation**: Always wrap asynchronous controller code in try-catch blocks and forward errors via `next(err)` to ensure they are intercepted by the global error handler.

### Frontend Style Rules
- **Modular Imports**: Prefer modular React imports. Code-split heavy pages (e.g. Analytics, Reports) using `React.lazy` and `Suspense` inside `App.jsx`.
- **Axios Custom Client**: Do not call `axios` directly in components. Utilize the services layer (`frontend/src/services/`) to encapsulate base URLs, authentication header interception, and standard response formats.
- **Tailwind & CSS Harmony**: Styling follows custom Vanilla CSS overrides in `index.css` mixed with Tailwind classes to maintain executive aesthetics. Do not override design tokens.

---

## 3. Environment & Local Testing Workflow

### Running Tests Locally
To execute the test suite in the backend folder:
```bash
cd backend
npm run test
```

To run and compile a local code coverage report:
```bash
npm run test:coverage
```

### Pre-commit Verification Checklist
Before submitting a pull request to the `develop` or `main` branches, verify:
- [ ] Backend syntax check passes: `find src -name "*.js" -exec node --check {} \;`
- [ ] Frontend builds cleanly: `cd frontend && npm run build`
- [ ] No ESLint warnings remain unresolved: `cd frontend && npm run lint`
- [ ] All 4 test suites pass successfully.
- [ ] Secret files (`.env`) are not checked into the git staging tree.
