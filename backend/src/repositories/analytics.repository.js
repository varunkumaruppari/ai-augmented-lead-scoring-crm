/**
 * Analytics Repository
 * Handles database operations for Business Intelligence layer
 */

const db = require('../config/database');

const getAllLeadsData = async () => {
  const { rows } = await db.query(
    `SELECT l.*, 
            li.conversion_probability, li.priority, li.quality, li.recommendation, li.explanation,
            u.full_name as agent_name
     FROM leads l
     LEFT JOIN lead_intelligence li ON l.id = li.lead_id
     LEFT JOIN users u ON l.assigned_to = u.id
     WHERE l.deleted_at IS NULL`
  );
  return rows;
};

const getPipelineCounts = async () => {
  const { rows } = await db.query(
    `SELECT pipeline_stage, 
            COUNT(*)::int as count, 
            COALESCE(SUM(expected_revenue), 0)::float as value
     FROM leads
     WHERE deleted_at IS NULL
     GROUP BY pipeline_stage`
  );
  return rows;
};

const getAgentsTelemetry = async () => {
  // Query all agents and join with leads to calculate response times, conversions, etc.
  const { rows } = await db.query(
    `SELECT u.id, u.full_name, u.email,
            COUNT(l.id)::int as leads_assigned,
            COUNT(l.id) FILTER (WHERE l.status = 'booked')::int as leads_converted,
            COALESCE(SUM((COALESCE(l.budget_min, 0) + COALESCE(l.budget_max, 0)) / 2) FILTER (WHERE l.status = 'booked'), 0.0)::float as revenue_generated,
            COALESCE(ROUND(AVG(l.response_time_hrs) FILTER (WHERE l.response_time_hrs IS NOT NULL), 1), 24.0)::float as avg_response_time
     FROM users u
     LEFT JOIN leads l ON u.id = l.assigned_to AND l.deleted_at IS NULL
     WHERE u.role = 'agent' AND u.deleted_at IS NULL
     GROUP BY u.id, u.full_name, u.email`
  );
  return rows;
};

const getFollowupStatsByAgent = async () => {
  const { rows } = await db.query(
    `SELECT assigned_to as agent_id,
            COUNT(*)::int as total_followups,
            COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int as completed_followups,
            COUNT(*) FILTER (WHERE completed_at IS NULL AND scheduled_at < NOW())::int as overdue_followups
     FROM follow_ups
     GROUP BY assigned_to`
  );
  return rows;
};

module.exports = {
  getAllLeadsData,
  getPipelineCounts,
  getAgentsTelemetry,
  getFollowupStatsByAgent
};
