const db = require('../config/database');

const findByLead = async (leadId) => {
  const { rows } = await db.query(
    `SELECT f.*, u.full_name as agent_name FROM follow_ups f
     LEFT JOIN users u ON f.assigned_to = u.id
     WHERE f.lead_id = $1 ORDER BY f.scheduled_at ASC`,
    [leadId]
  );
  return rows;
};

const findPending = async (userId) => {
  const { rows } = await db.query(
    `SELECT f.*, l.full_name as lead_name, l.phone as lead_phone, l.category
     FROM follow_ups f
     JOIN leads l ON f.lead_id = l.id
     WHERE f.assigned_to = $1 AND f.completed_at IS NULL
     ORDER BY f.scheduled_at ASC`,
    [userId]
  );
  return rows;
};

const findOverdue = async () => {
  const { rows } = await db.query(
    `SELECT f.*, l.full_name as lead_name, l.category, u.full_name as agent_name
     FROM follow_ups f
     JOIN leads l ON f.lead_id = l.id
     LEFT JOIN users u ON f.assigned_to = u.id
     WHERE f.completed_at IS NULL AND f.scheduled_at < NOW()
     ORDER BY f.scheduled_at ASC`
  );
  return rows;
};

const create = async ({ lead_id, assigned_to, scheduled_at, type, priority, notes }) => {
  const { rows } = await db.query(
    'INSERT INTO follow_ups (lead_id, assigned_to, scheduled_at, type, priority, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [lead_id, assigned_to, scheduled_at, type || 'call', priority || 'Medium', notes]
  );
  return rows[0];
};

const complete = async (id, outcome) => {
  const { rows } = await db.query(
    'UPDATE follow_ups SET completed_at=NOW(), outcome=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [outcome, id]
  );
  return rows[0];
};

const update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((f, i) => `${f} = $${i+1}`).join(', ');
  const { rows } = await db.query(
    `UPDATE follow_ups SET ${setClause}, updated_at=NOW() WHERE id=$${fields.length+1} RETURNING *`,
    [...values, id]
  );
  return rows[0];
};

module.exports = { findByLead, findPending, findOverdue, create, complete, update };
