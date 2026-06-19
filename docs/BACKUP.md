# Backup & Recovery Guide
**Lohithadharma Lead Scoring Dashboard**

---

## Database Backup

### Full Backup (Neon PostgreSQL)
```bash
# Full logical dump
pg_dump $DATABASE_URL \
  --format=custom \
  --no-acl \
  --no-owner \
  -f backup_$(date +%Y%m%d_%H%M%S).dump

# Readable SQL dump
pg_dump $DATABASE_URL \
  --format=plain \
  -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Schema-Only Backup
```bash
pg_dump $DATABASE_URL --schema-only -f schema_backup.sql
```

### Data-Only Backup (excluding schema)
```bash
pg_dump $DATABASE_URL --data-only -f data_backup.sql
```

### Specific Tables
```bash
pg_dump $DATABASE_URL -t leads -t lead_activities -t audit_logs -f critical_tables.dump
```

---

## Restore

### From Custom Format
```bash
pg_restore \
  --dbname $DATABASE_URL \
  --no-acl \
  --no-owner \
  --clean \
  backup_20260619_120000.dump
```

### From SQL File
```bash
psql $DATABASE_URL -f backup_20260619_120000.sql
```

---

## Backup Schedule Recommendations

| Frequency | Method | Retention |
|-----------|--------|-----------|
| Daily | Automated pg_dump | 30 days |
| Weekly | Full custom dump | 3 months |
| Monthly | Offsite cold storage | 1 year |
| Before every deploy | Schema + data snapshot | Indefinite |

---

## Neon Built-in Backups

Neon automatically creates:
- **Point-in-time recovery (PITR):** 7 days (free tier) / 30 days (pro)
- **Branch backups:** Instant restore via Neon branching

To create a manual restore point in Neon:
```
Neon Console → Project → Branches → Create Branch from main
```

---

## Critical Data Recovery Scenarios

### Accidental Lead Deletion
Leads use soft-delete (`deleted_at` column). Recover with:
```sql
UPDATE leads SET deleted_at = NULL WHERE id = '<uuid>';
```

### Reset Admin Password
```bash
# Generate bcrypt hash with cost 12 for 'NewPassword@123'
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('NewPassword@123',12).then(h=>console.log(h));"

# Update in DB
psql $DATABASE_URL -c "UPDATE users SET password_hash='<new_hash>' WHERE email='admin@lohithadharma.com';"
```

### Restore Audit Log Only
```bash
pg_dump $DATABASE_URL -t audit_logs -f audit_backup.dump
pg_restore --dbname $DATABASE_URL -t audit_logs audit_backup.dump
```

---

## Disaster Recovery Plan

1. **Stop** backend server
2. **Create** emergency backup of current state
3. **Restore** from last known good backup
4. **Apply** any missing schema migrations
5. **Restart** backend server
6. **Verify** `/api/admin/system-health` returns `healthy`
7. **Check** audit logs for last known good state
