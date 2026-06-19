# Testing Documentation
**Lohithadharma Lead Scoring Dashboard**

This document outlines the testing strategy, test suite structure, execution commands, and pipeline integration rules.

---

## 1. Testing Strategy

We follow a multi-tier testing approach to ensure stability and reliability for each release candidate:

```
┌─────────────────────────────────────────────────────────┐
│                     Smoke Testing                       │  <-- Verify core connections (DB, Services)
├─────────────────────────────────────────────────────────┤
│                     Unit Testing                        │  <-- Verify independent logic (Scoring Engine)
├─────────────────────────────────────────────────────────┤
│                  Integration Testing                    │  <-- Verify middleware, RBAC, DB transactions
├─────────────────────────────────────────────────────────┤
│                     API Testing                         │  <-- Verify endpoint inputs/outputs & health checks
└─────────────────────────────────────────────────────────┘
```

---

## 2. Test Suite Breakdown

All tests are located in `backend/tests/` and use **Jest** with **Supertest** for endpoint mocking.

- **Smoke Tests (`backend/tests/smoke/db.test.js`)**: Verifies that pg-mem is loaded or the Postgres pool initializes correctly.
- **Unit Tests (`backend/tests/unit/scoring.test.js`)**: Runs tests against the 7-factor weighted scoring engine directly. Validates category boundaries (HOT, WARM, COLD).
- **Integration Tests (`backend/tests/integration/auth.test.js`)**: Tests database state operations, JWT token signing, validation, and error responses.
- **API Tests (`backend/tests/api/health.test.js`)**: Validates that root `/health`, `/status`, and `/system` endpoints return diagnostic details and reject unauthorized calls.

---

## 3. Running Tests

### Prerequisites
Ensure dev dependencies are installed:
```bash
cd backend
npm install
```

### Execution Commands

Run the full suite:
```bash
npm run test
```

Run tests with coverage metrics:
```bash
npm run test:coverage
```

---

## 4. Test Execution Summary

The test execution returns the following success metrics:

```
PASS  tests/unit/scoring.test.js
  Lead Scoring Engine Unit Tests
    ✓ should return 0 score and COLD category for an empty lead profile
    ✓ should score a high value HOT lead correctly
    ✓ should classify WARM category for mid-tier scoring

PASS  tests/smoke/db.test.js
  Database Connectivity Smoke Test
    ✓ should initialize the database pool object

PASS  tests/integration/auth.test.js
  Authentication API Integration Tests
    ✓ POST /api/v1/auth/login with correct credentials should return 200 and JWT tokens
    ✓ POST /api/v1/auth/login with incorrect credentials should return 401 Unauthorized
    ✓ POST /api/v1/auth/login with missing password should return 422 Unprocessable Entity

PASS  tests/api/health.test.js
  Health and Monitoring API Endpoints
    ✓ GET /health should return 200 and status ok
    ✓ GET /status should return 200 and health check payload
    ✓ GET /system without credentials should return 401 Unauthorized

Test Suites: 4 passed, 4 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        2.067 s
```

### Coverage targets:
- Core services (Scoring, Security, Validation): **>90%**
- Middlewares: **>85%**
- Route handlers: **>80%**
