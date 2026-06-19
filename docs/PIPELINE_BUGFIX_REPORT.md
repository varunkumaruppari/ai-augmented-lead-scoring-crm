# Pipeline Bug Fix Report

## Root Cause
The backend route `GET /api/v1/pipeline` returned a `500 Internal Server Error` due to a query execution error in the `getPipeline` controller when running against the in-memory `pg-mem` emulation layer:
```
Error: column "l.id" does not exist
```
This was caused by a correlated subquery inside the `SELECT` list:
```sql
(SELECT MIN(scheduled_at) FROM follow_ups WHERE lead_id = l.id AND completed_at IS NULL) as next_followup_at
```
While standard PostgreSQL supports referencing the outer table alias (`l.id`) in correlated subqueries, the `pg-mem` parser/executor failed to resolve the correlation alias correctly, throwing an execution error.

---

## Files Modified
1. **[pipeline.controller.js](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/backend/src/controllers/pipeline.controller.js)**: Rewrote the query to replace the correlated subquery in the `SELECT` list with a standard `LEFT JOIN` on a subquery grouped by `lead_id`.
2. **[pipeline.test.js](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/backend/tests/api/pipeline.test.js) [NEW]**: Created an API test suite to verify the pipeline GET, movement PUT, and analytics GET endpoints.

---

## Fix Applied
We modified `backend/src/controllers/pipeline.controller.js` to change the query structure to a JOIN-based lookup:

```diff
-             (SELECT MIN(scheduled_at) FROM follow_ups WHERE lead_id = l.id AND completed_at IS NULL) as next_followup_at
+             f.next_followup_at
       FROM leads l
       LEFT JOIN lead_intelligence li ON l.id = li.lead_id
       LEFT JOIN users u ON l.assigned_to = u.id
+      LEFT JOIN (
+        SELECT lead_id, MIN(scheduled_at) as next_followup_at
+        FROM follow_ups
+        WHERE completed_at IS NULL
+        GROUP BY lead_id
+      ) f ON l.id = f.lead_id
       WHERE l.deleted_at IS NULL
```
This query is 100% syntactically identical in its return format and results, is highly compatible across both standard PostgreSQL and the `pg-mem` emulator, and resolves the 500 error immediately.

---

## Tests Added
Created [pipeline.test.js](file:///c:/Users/uvaru/Downloads/lead-scoring-dashboard/lead-scoring-dashboard/backend/tests/api/pipeline.test.js) in the `tests/api` directory:
- **`GET /api/v1/pipeline`**: Verifies that pipeline stages are loaded and that the test lead falls into the correct stage.
- **`GET /api/v1/pipeline/analytics`**: Validates the retrieval of pipeline totals, values, and expected revenue stats.
- **`PUT /api/v1/pipeline/move`**: Validates moving a lead through stages, ensuring properties updates (`pipeline_stage`, `status`) succeed.

---

## Verification Results
All tests passed with a 100% success rate:
```bash
> jest --runInBand --detectOpenHandles --forceExit

PASS  tests/api/pipeline.test.js
  Pipeline API Endpoints
    ✓ GET /api/v1/pipeline should return 200 and the stages mapping (25 ms)
    ✓ GET /api/v1/pipeline/analytics should return 200 and pipeline stats (19 ms)
    ✓ PUT /api/v1/pipeline/move should change lead pipeline stage (26 ms)

PASS  tests/integration/auth.test.js
PASS  tests/api/health.test.js
PASS  tests/smoke/db.test.js
PASS  tests/unit/scoring.test.js

Test Suites: 5 passed, 5 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        2.511 s
Ran all test suites.
```
