const db = require('../config/database');

const buildFilters = (filters) => {
  const conditions = ["l.deleted_at IS NULL"];
  const params = [];
  let idx = 1;

  if (filters.category) { conditions.push(`l.category = $${idx++}`); params.push(filters.category); }
  if (filters.status) { conditions.push(`l.status = $${idx++}`); params.push(filters.status); }
  if (filters.assigned_to) { conditions.push(`l.assigned_to = $${idx++}`); params.push(filters.assigned_to); }
  if (filters.search) {
    conditions.push(`(l.full_name ILIKE $${idx} OR l.phone ILIKE $${idx} OR l.email ILIKE $${idx})`);
    params.push(`%${filters.search}%`); idx++;
  }

  return { where: conditions.join(' AND '), params, idx };
};

const findAll = async (filters = {}, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { where, params, idx } = buildFilters(filters);

  const countRes = await db.query(
    `SELECT COUNT(*) FROM leads l WHERE ${where}`, params
  );

  const { rows } = await db.query(
    `SELECT l.*, u.full_name as agent_name 
     FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
     WHERE ${where}
     ORDER BY l.current_score DESC, l.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  return { leads: rows, total: parseInt(countRes.rows[0].count), page, limit };
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT l.*, u.full_name as agent_name, u.email as agent_email
     FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.id = $1 AND l.deleted_at IS NULL`,
    [id]
  );
  return rows[0];
};

const create = async (data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await db.query(
    `INSERT INTO leads (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return rows[0];
};

const update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const { rows } = await db.query(
    `UPDATE leads SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} AND deleted_at IS NULL RETURNING *`,
    [...values, id]
  );
  return rows[0];
};

const softDelete = async (id) => {
  const { rows } = await db.query(
    'UPDATE leads SET deleted_at = NOW() WHERE id = $1 RETURNING id', [id]
  );
  return rows[0];
};

const getScoreHistory = async (leadId) => {
  const { rows } = await db.query(
    'SELECT * FROM lead_scores WHERE lead_id = $1 ORDER BY calculated_at DESC LIMIT 20', [leadId]
  );
  return rows;
};

const addScoreRecord = async (leadId, scoreData) => {
  const { score, category, breakdown, calculated_by } = scoreData;
  const { rows } = await db.query(
    `INSERT INTO lead_scores (lead_id, score, category, budget_score, urgency_score, questions_score,
      site_visit_score, engagement_score, response_score, followup_score, calculated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [leadId, score, category,
     breakdown.budget, breakdown.urgency, breakdown.questions,
     breakdown.site_visit, breakdown.engagement, breakdown.response,
     breakdown.followup, calculated_by || 'engine']
  );
  return rows[0];
};

const getActivities = async (leadId) => {
  const { rows } = await db.query(
    `SELECT la.*, u.full_name as user_name FROM lead_activities la
     LEFT JOIN users u ON la.user_id = u.id
     WHERE la.lead_id = $1 ORDER BY la.created_at DESC LIMIT 50`,
    [leadId]
  );
  return rows;
};

const addActivity = async ({ lead_id, user_id, type, description, meta }) => {
  const { rows } = await db.query(
    'INSERT INTO lead_activities (lead_id, user_id, type, description, meta) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [lead_id, user_id, type, description, meta || {}]
  );
  return rows[0];
};

const getDashboardStats = async () => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
      COUNT(*) FILTER (WHERE category='HOT' AND deleted_at IS NULL) as hot,
      COUNT(*) FILTER (WHERE category='WARM' AND deleted_at IS NULL) as warm,
      COUNT(*) FILTER (WHERE category='COLD' AND deleted_at IS NULL) as cold,
      COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE AND deleted_at IS NULL) as today,
      COUNT(*) FILTER (WHERE status='booked' AND deleted_at IS NULL) as converted,
      ROUND(AVG(current_score) FILTER (WHERE deleted_at IS NULL), 1) as avg_score,
      COALESCE(SUM(
        ((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) * 
        CASE 
          WHEN status = 'new' THEN 0.10
          WHEN status = 'contacted' THEN 0.30
          WHEN status = 'qualified' THEN 0.70
          WHEN status = 'booked' THEN 1.00
          ELSE 0.00
        END
      ) FILTER (WHERE deleted_at IS NULL), 0) as projected_revenue,
      COALESCE(SUM(
        (COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2
      ) FILTER (WHERE deleted_at IS NULL), 0) as total_pipeline,
      COALESCE(SUM(
        (COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2
      ) FILTER (WHERE status='booked' AND deleted_at IS NULL), 0) as closed_revenue,
      (SELECT COUNT(*) FROM follow_ups WHERE completed_at IS NULL) as open_follow_ups
    FROM leads
  `);
  return rows[0];
};

const getRecentActivities = async (limit = 5) => {
  const { rows } = await db.query(
    `SELECT la.*, u.full_name as user_name, l.full_name as lead_name
     FROM lead_activities la
     LEFT JOIN users u ON la.user_id = u.id
     LEFT JOIN leads l ON la.lead_id = l.id
     WHERE l.deleted_at IS NULL
     ORDER BY la.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

const getTopLeads = async (limit = 10) => {
  const { rows } = await db.query(
    `SELECT l.id, l.full_name, l.phone, l.category, l.current_score, l.status, l.source,
            u.full_name as agent_name
     FROM leads l LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.deleted_at IS NULL
     ORDER BY l.current_score DESC LIMIT $1`,
    [limit]
  );
  return rows;
};

const getPipelineStats = async () => {
  const { rows } = await db.query(`
    SELECT status, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL
    GROUP BY status ORDER BY count DESC
  `);
  return rows;
};

const getSourceStats = async () => {
  const { rows } = await db.query(`
    SELECT source, COUNT(*) as count
    FROM leads WHERE deleted_at IS NULL
    GROUP BY source ORDER BY count DESC
  `);
  return rows;
};

const getAgentStats = async () => {
  const { rows } = await db.query(`
    SELECT u.full_name, u.id,
           COUNT(l.id) as total_leads,
           COUNT(l.id) FILTER (WHERE l.category='HOT') as hot_leads,
           COUNT(l.id) FILTER (WHERE l.status='booked') as converted
    FROM users u LEFT JOIN leads l ON u.id = l.assigned_to AND l.deleted_at IS NULL
    WHERE u.role = 'agent' AND u.deleted_at IS NULL
    GROUP BY u.id, u.full_name
    ORDER BY total_leads DESC
  `);
  return rows;
};

module.exports = {
  findAll, findById, create, update, softDelete,
  getScoreHistory, addScoreRecord,
  getActivities, addActivity,
  getDashboardStats, getRecentActivities, getTopLeads, getPipelineStats, getSourceStats, getAgentStats
};
