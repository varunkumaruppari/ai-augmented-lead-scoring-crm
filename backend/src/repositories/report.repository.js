/**
 * Report Repository
 * Handles DB operations for report_schedules, report_history, and report_delivery_logs
 */

const db = require('../config/database');

const getSchedules = async () => {
  const { rows } = await db.query(
    'SELECT * FROM report_schedules ORDER BY created_at DESC'
  );
  return rows;
};

const createSchedule = async ({ name, report_type, frequency, recipients }) => {
  const { rows } = await db.query(
    `INSERT INTO report_schedules (name, report_type, frequency, recipients, last_run, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NULL, NOW(), NOW())
     RETURNING *`,
    [name, report_type, frequency, recipients]
  );
  return rows[0];
};

const updateScheduleRun = async (scheduleId) => {
  await db.query(
    'UPDATE report_schedules SET last_run = NOW(), updated_at = NOW() WHERE id = $1',
    [scheduleId]
  );
};

const getHistory = async () => {
  const { rows } = await db.query(
    `SELECT rh.*, u.full_name as generator_name, rs.name as schedule_name 
     FROM report_history rh
     LEFT JOIN users u ON rh.generated_by = u.id
     LEFT JOIN report_schedules rs ON rh.schedule_id = rs.id
     ORDER BY rh.created_at DESC`
  );
  return rows;
};

const createHistoryEntry = async ({ schedule_id, name, type, format, generated_by, status }) => {
  const { rows } = await db.query(
    `INSERT INTO report_history (schedule_id, name, type, format, generated_by, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [schedule_id || null, name, type, format, generated_by || null, status || 'success']
  );
  return rows[0];
};

const getDeliveryLogs = async () => {
  const { rows } = await db.query(
    `SELECT rdl.*, rh.name as report_name, rh.type as report_type 
     FROM report_delivery_logs rdl
     JOIN report_history rh ON rdl.history_id = rh.id
     ORDER BY rdl.sent_at DESC`
  );
  return rows;
};

const createDeliveryLog = async ({ history_id, recipient_email, status }) => {
  const { rows } = await db.query(
    `INSERT INTO report_delivery_logs (history_id, recipient_email, status, sent_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [history_id, recipient_email, status]
  );
  return rows[0];
};

module.exports = {
  getSchedules,
  createSchedule,
  updateScheduleRun,
  getHistory,
  createHistoryEntry,
  getDeliveryLogs,
  createDeliveryLog
};
