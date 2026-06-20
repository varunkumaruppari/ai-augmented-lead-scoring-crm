const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Audit Log Repository
 * Reads and writes to the audit_logs table.
 */

const create = async ({ user_id, action, entity_type, entity_id, old_data, new_data, ip_address }) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user_id || null,
        action,
        entity_type || null,
        entity_id || null,
        old_data ? JSON.stringify(old_data) : null,
        new_data ? JSON.stringify(new_data) : null,
        ip_address || null,
      ]
    );
  } catch (err) {
    // Audit failures must not interrupt the main request
    logger.warn(`Audit log write failed: ${err.message}`, { action, entity_type, entity_id });
  }
};

const findAll = async ({ user_id, action, entity_type, start_date, end_date } = {}, page = 1, limit = 50) => {
  const conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (user_id) { conditions.push(`al.user_id = $${idx++}`); params.push(user_id); }
  if (action)  { conditions.push(`al.action ILIKE $${idx++}`); params.push(`%${action}%`); }
  if (entity_type) { conditions.push(`al.entity_type = $${idx++}`); params.push(entity_type); }
  if (start_date)  { conditions.push(`al.created_at >= $${idx++}`); params.push(start_date); }
  if (end_date)    { conditions.push(`al.created_at <= $${idx++}`); params.push(end_date); }

  const offset = (page - 1) * limit;
  const where = conditions.join(' AND ');

  const [dataRes, countRes] = await Promise.all([
    db.query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id,
              al.old_data, al.new_data, al.ip_address, al.created_at,
              u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    ),
    db.query(
      `SELECT COUNT(*) FROM audit_logs al WHERE ${where}`,
      params
    ),
  ]);

  return {
    logs: dataRes.rows,
    total: parseInt(countRes.rows[0].count),
    page,
    limit,
  };
};

module.exports = { create, findAll };
