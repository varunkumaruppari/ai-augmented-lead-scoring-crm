# Administration Guide
**Lohithadharma Lead Scoring Dashboard**

This guide provides instructions for system administrators to manage users, configure settings, audit system logs, and monitor performance.

---

## 1. Role-Based Access Control (RBAC) Management

The platform enforces strict role isolation. Permissions are defined as follows:

- **Super Admin**: Complete platform ownership. Can update settings, view system health, browse audit logs, and deactivate users.
- **Admin**: Can manage leads, view audit logs, adjust settings, and view user status. Cannot delete audit logs.
- **Manager**: Can view leads, generate reports, schedule reports, and read analytics. Cannot access settings or audit logs.
- **Sales Agent**: Can edit assigned leads, update follow-ups, and receive notifications. Restricted to their own pipeline workspace.
- **Viewer**: Read-only dashboard view. Cannot edit leads, adjust pipeline stages, or schedule reports.

---

## 2. Settings Configuration Center

Access the **Settings Center** via the sidebar (Admins/Super Admins only). The configuration options are persisted in the database:

### Company Tab
- **Company Name**: Configures the platform header.
- **Timezone**: Affects date formats in generated executive reports.
- **Currency**: Standardizes display (INR, USD, etc.) in pipeline metrics.

### Security Tab
- **Max Failed Logins**: Set maximum password entry failures (default `5`) before an account is locked out for 15 minutes to prevent brute-force attacks.
- **Session Timeout**: Duration in minutes (default `480`) for active token sessions.

### AI Configuration Tab
- **AI Provider**: Switch between `mock` (fallback mode), `openai`, and `gemini`.
- **Fallback Switch**: Enable fallback to the mock provider if the primary API (OpenAI/Gemini) returns errors.

### Notifications Tab
- **Channels**: Toggle SMS/WhatsApp notifications and email delivery on/off globally.

---

## 3. Reviewing Audit Logs

Audit logs capture all state-mutating actions to maintain security compliance:
- **Captured Event Attributes**: Timestamp, acting User ID, Action Type (e.g. `LOGIN`, `LEAD_DELETED`), Entity ID, IP Address, and Pre/Post mutation JSON data payload.
- **How to review**: Open the `/admin` dashboard panel, select **Audit Logs**, and filter by User Email, Action Type, or Date Range.
- **Alert Indicators**: Watch for frequent `LOGIN_FAILED` events from a single IP, indicating brute-force targets.

---

## 4. Subsystem Monitoring

The system status dashboard displays checks from root endpoints:
- **Green status**: Normal operation.
- **Yellow / Degraded status**: AI key is missing or fallback is active; notification engines are online but mail servers are unreachable.
- **Red status**: Database is offline or connection latency exceeds 2000ms. Check host environment logs immediately.
