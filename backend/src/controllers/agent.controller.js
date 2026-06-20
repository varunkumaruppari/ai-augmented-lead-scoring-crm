const db = require('../config/database');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getPerformance = async (req, res, next) => {
  try {
    const { rows: users } = await db.query("SELECT id, full_name, email, role, is_active FROM users WHERE role = 'agent' AND deleted_at IS NULL");
    
    const scoredAgents = [];
    for (const agent of users) {
      // Get leads metrics
      const { rows: leadsRes } = await db.query(`
        SELECT COUNT(id)::int as leads_assigned,
               COUNT(id) FILTER (WHERE status IN ('contacted', 'qualified', 'site_visit_scheduled', 'negotiation', 'proposal_sent', 'booked'))::int as leads_contacted,
               COUNT(id) FILTER (WHERE status = 'booked')::int as leads_converted,
               COALESCE(SUM((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) FILTER (WHERE status = 'booked'), 0.0)::float as revenue_generated,
               COALESCE(ROUND(AVG(response_time_hrs) FILTER (WHERE response_time_hrs IS NOT NULL), 1), 24.0)::float as avg_response_time
        FROM leads
        WHERE assigned_to = $1 AND deleted_at IS NULL
      `, [agent.id]);
      
      const leadMetrics = leadsRes[0] || { leads_assigned: 0, leads_contacted: 0, leads_converted: 0, revenue_generated: 0, avg_response_time: 24.0 };
      
      // Get followups metrics
      const { rows: fuRes } = await db.query(`
        SELECT COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int as followups_completed,
               COUNT(*) FILTER (WHERE completed_at IS NULL)::int as open_tasks
        FROM follow_ups
        WHERE assigned_to = $1
      `, [agent.id]);
      
      const fuMetrics = fuRes[0] || { followups_completed: 0, open_tasks: 0 };
      
      const leadsAssigned = leadMetrics.leads_assigned;
      const leadsConverted = leadMetrics.leads_converted;
      const followupsCompleted = fuMetrics.followups_completed;
      const openTasks = fuMetrics.open_tasks;
      const avgResponseTime = leadMetrics.avg_response_time;
      
      const conversionRate = leadsAssigned > 0 
        ? parseFloat(((leadsConverted / leadsAssigned) * 100).toFixed(1))
        : 0.0;

      // 1. Conversion Score (Max 40 points)
      const conversionScore = Math.min(40, (conversionRate / 50) * 40);

      // 2. Response Time Score (Max 30 points)
      let responseScore = 0;
      if (avgResponseTime <= 2) responseScore = 30;
      else if (avgResponseTime <= 6) responseScore = 25;
      else if (avgResponseTime <= 12) responseScore = 20;
      else if (avgResponseTime <= 24) responseScore = 10;
      else responseScore = 0;

      // 3. Follow-Up Completion Score (Max 30 points)
      const totalFollowups = followupsCompleted + openTasks;
      const completionRate = totalFollowups > 0 ? (followupsCompleted / totalFollowups) * 100 : 100;
      const followupScore = (completionRate / 100) * 30;

      const performanceScore = Math.round(conversionScore + responseScore + followupScore);

      scoredAgents.push({
        ...agent,
        leads_assigned: leadsAssigned,
        leads_contacted: leadMetrics.leads_contacted,
        leads_converted: leadsConverted,
        followups_completed: followupsCompleted,
        open_tasks: openTasks,
        avg_response_time: avgResponseTime,
        conversion_rate: conversionRate,
        revenue_generated: leadMetrics.revenue_generated,
        performance_score: performanceScore
      });
    }

    scoredAgents.sort((a, b) => b.performance_score - a.performance_score);
    respond(res, { data: scoredAgents });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPerformance };
