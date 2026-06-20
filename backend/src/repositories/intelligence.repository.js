const db = require('../config/database');

const findByLeadId = async (leadId) => {
  const { rows } = await db.query(
    'SELECT * FROM lead_intelligence WHERE lead_id = $1',
    [leadId]
  );
  return rows[0];
};

const upsert = async ({ lead_id, score, conversion_probability, priority, quality, recommendation, explanation }) => {
  const { rows } = await db.query(
    `INSERT INTO lead_intelligence (lead_id, score, conversion_probability, priority, quality, recommendation, explanation, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (lead_id) DO UPDATE SET
       score = EXCLUDED.score,
       conversion_probability = EXCLUDED.conversion_probability,
       priority = EXCLUDED.priority,
       quality = EXCLUDED.quality,
       recommendation = EXCLUDED.recommendation,
       explanation = EXCLUDED.explanation,
       updated_at = NOW()
     RETURNING *`,
    [lead_id, score, conversion_probability, priority, quality, recommendation, explanation]
  );
  return rows[0];
};

const getSummary = async () => {
  const [highRes, avgRes, potRes, bestRes] = await Promise.all([
    // 1. High Priority Leads Count
    db.query(
      `SELECT COUNT(*)::int as count FROM lead_intelligence li 
       JOIN leads l ON li.lead_id = l.id 
       WHERE li.priority IN ('Critical', 'High') AND l.deleted_at IS NULL`
    ),
    // 2. Average Conversion Probability
    db.query(
      `SELECT COALESCE(ROUND(AVG(li.conversion_probability), 1), 0)::float as avg_prob 
       FROM lead_intelligence li 
       JOIN leads l ON li.lead_id = l.id 
       WHERE l.deleted_at IS NULL`
    ),
    // 3. Potential Revenue (unweighted sum of budgets)
    db.query(
      `SELECT COALESCE(SUM((COALESCE(l.budget_min, 0) + COALESCE(l.budget_max, 0)) / 2), 0)::float as potential_revenue 
       FROM leads l 
       WHERE l.deleted_at IS NULL`
    ),
    // 4. Best Lead Source by Average Conversion Probability
    db.query(
      `SELECT l.source FROM leads l 
       JOIN lead_intelligence li ON l.id = li.lead_id 
       WHERE l.deleted_at IS NULL 
       GROUP BY l.source 
       ORDER BY AVG(li.conversion_probability) DESC 
       LIMIT 1`
    )
  ]);

  return {
    high_priority_leads: highRes.rows[0]?.count || 0,
    avg_conversion_probability: avgRes.rows[0]?.avg_prob || 0.0,
    potential_revenue: potRes.rows[0]?.potential_revenue || 0,
    best_lead_source: bestRes.rows[0]?.source || 'N/A'
  };
};

const getTopOpportunities = async (limit = 5) => {
  const { rows } = await db.query(
    `SELECT l.id, l.full_name, l.source, l.status, l.current_score,
            li.conversion_probability, li.priority, li.quality, li.recommendation,
            u.full_name as agent_name
     FROM leads l
     JOIN lead_intelligence li ON l.id = li.lead_id
     LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.deleted_at IS NULL
     ORDER BY li.conversion_probability DESC, l.current_score DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

// For chart probability distribution
const getProbabilityGroups = async () => {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE li.conversion_probability >= 75) as high,
       COUNT(*) FILTER (WHERE li.conversion_probability >= 40 AND li.conversion_probability < 75) as medium,
       COUNT(*) FILTER (WHERE li.conversion_probability < 40) as low
     FROM lead_intelligence li
     JOIN leads l ON li.lead_id = l.id
     WHERE l.deleted_at IS NULL`
  );
  return rows[0];
};

module.exports = {
  findByLeadId,
  upsert,
  getSummary,
  getTopOpportunities,
  getProbabilityGroups
};
