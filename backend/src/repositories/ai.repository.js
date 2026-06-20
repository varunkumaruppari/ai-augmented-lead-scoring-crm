/**
 * AI Insights Repository
 * Handles database operations for lead_ai_insights table
 */

const db = require('../config/database');

const findByLeadId = async (leadId) => {
  const { rows } = await db.query(
    'SELECT * FROM lead_ai_insights WHERE lead_id = $1',
    [leadId]
  );
  return rows[0];
};

const upsert = async ({
  lead_id,
  summary_overview,
  summary_intent,
  summary_risk,
  summary_opportunity,
  outreach_followup,
  outreach_email,
  outreach_whatsapp,
  next_action,
  risk_detection,
  opportunity_detection
}) => {
  const { rows } = await db.query(
    `INSERT INTO lead_ai_insights (
      lead_id,
      summary_overview,
      summary_intent,
      summary_risk,
      summary_opportunity,
      outreach_followup,
      outreach_email,
      outreach_whatsapp,
      next_action,
      risk_detection,
      opportunity_detection,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (lead_id) DO UPDATE SET
      summary_overview = EXCLUDED.summary_overview,
      summary_intent = EXCLUDED.summary_intent,
      summary_risk = EXCLUDED.summary_risk,
      summary_opportunity = EXCLUDED.summary_opportunity,
      outreach_followup = EXCLUDED.outreach_followup,
      outreach_email = EXCLUDED.outreach_email,
      outreach_whatsapp = EXCLUDED.outreach_whatsapp,
      next_action = EXCLUDED.next_action,
      risk_detection = EXCLUDED.risk_detection,
      opportunity_detection = EXCLUDED.opportunity_detection,
      updated_at = NOW()
    RETURNING *`,
    [
      lead_id,
      summary_overview,
      summary_intent,
      summary_risk,
      summary_opportunity,
      JSON.stringify(outreach_followup),
      JSON.stringify(outreach_email),
      outreach_whatsapp,
      next_action,
      JSON.stringify(risk_detection),
      JSON.stringify(opportunity_detection)
    ]
  );
  return rows[0];
};

const getAllInsights = async () => {
  const { rows } = await db.query(
    `SELECT ai.*, l.full_name as lead_name, l.current_score, l.expected_revenue, u.full_name as agent_name
     FROM lead_ai_insights ai
     JOIN leads l ON ai.lead_id = l.id
     LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.deleted_at IS NULL`
  );
  return rows;
};

module.exports = {
  findByLeadId,
  upsert,
  getAllInsights
};
