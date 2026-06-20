const db = require('../config/database');
const leadRepo = require('../repositories/lead.repository');
const { calculateLeadScore } = require('../services/scoring.service');
const intelligenceService = require('../services/intelligence.service');
const { logAuditEvent } = require('../middlewares/audit.middleware');

// Maps pipeline stages to database status strings
const STAGE_STATUS_MAP = {
  'New Lead': 'new',
  'Qualified': 'qualified',
  'Contacted': 'contacted',
  'Site Visit Scheduled': 'site_visit_scheduled',
  'Negotiation': 'negotiation',
  'Proposal Sent': 'proposal_sent',
  'Converted': 'booked',
  'Lost': 'lost'
};

const getPipeline = async (req, res, next) => {
  try {
    console.log('DEBUG: GET /api/v1/pipeline - executing query');
    const { rows } = await db.query(`
      SELECT l.id, l.full_name, l.source, l.status, l.current_score, l.category,
             l.budget_tier, l.budget_min, l.budget_max, l.pipeline_stage,
             l.expected_revenue, l.created_at, l.assigned_to,
             li.conversion_probability, li.priority, li.quality,
             u.full_name as agent_name,
             f.next_followup_at
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN (
        SELECT lead_id, MIN(scheduled_at) as next_followup_at
        FROM follow_ups
        WHERE completed_at IS NULL
        GROUP BY lead_id
      ) f ON l.id = f.lead_id
      WHERE l.deleted_at IS NULL
      ORDER BY l.current_score DESC, l.created_at DESC
    `);
    console.log(`DEBUG: GET /api/v1/pipeline - query returned ${rows.length} rows`);

    const stages = {
      'New Lead': [],
      'Qualified': [],
      'Contacted': [],
      'Site Visit Scheduled': [],
      'Negotiation': [],
      'Proposal Sent': [],
      'Converted': [],
      'Lost': []
    };

    rows.forEach(row => {
      const stage = row.pipeline_stage || 'New Lead';
      if (stages[stage]) {
        stages[stage].push(row);
      } else {
        stages['New Lead'].push(row);
      }
    });

    console.log('DEBUG: GET /api/v1/pipeline - responding success');
    res.status(200).json({
      success: true,
      data: stages
    });
  } catch (err) {
    console.error('DEBUG ERROR: GET /api/v1/pipeline failed:', err);
    next(err);
  }
};

const moveLead = async (req, res, next) => {
  try {
    const { leadId, stage } = req.body;
    
    if (!STAGE_STATUS_MAP[stage]) {
      return res.status(400).json({ success: false, error: { message: 'Invalid pipeline stage' } });
    }

    const lead = await leadRepo.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: { message: 'Lead not found' } });
    }

    // Get probability to update expected revenue
    let probability = 0;
    try {
      const intel = await intelligenceService.getIntelligenceForLead(leadId);
      probability = intel ? intel.conversion_probability : 0;
    } catch (e) {
      // Recalculate on-the-fly
      const calcs = intelligenceService.calculateIntelligence(lead);
      probability = calcs.conversion_probability;
    }

    const budget = (parseFloat(lead.budget_min || 0) + parseFloat(lead.budget_max || 0)) / 2;
    const expectedRevenue = (probability / 100) * budget;

    // Update database status
    const status = STAGE_STATUS_MAP[stage];
    await db.query(
      `UPDATE leads 
       SET pipeline_stage = $1, status = $2, stage_updated_at = NOW(), expected_revenue = $3, updated_at = NOW() 
       WHERE id = $4`,
      [stage, status, expectedRevenue, leadId]
    );

    // Recalculate and update score
    const updatedLead = await leadRepo.findById(leadId);
    const scoreResult = calculateLeadScore(updatedLead);
    await leadRepo.addScoreRecord(leadId, scoreResult);
    const finalLead = await leadRepo.update(leadId, {
      current_score: scoreResult.score,
      category: scoreResult.category
    });

    // Write activity log
    await leadRepo.addActivity({
      lead_id: leadId,
      user_id: req.user.id,
      type: 'status_change',
      description: `Status changed to ${stage}`,
      meta: { from_stage: lead.pipeline_stage, to_stage: stage }
    });

    // Sync AI lead intelligence
    await intelligenceService.upsertIntelligenceForLead(finalLead);

    // Audit: stage change
    await logAuditEvent(req, {
      action: 'LEAD_STAGE_CHANGED',
      entityType: 'lead',
      entityId: leadId,
      oldData: { pipeline_stage: lead.pipeline_stage, status: lead.status },
      newData: { pipeline_stage: stage, status },
    });

    res.status(200).json({
      success: true,
      message: `Lead moved to ${stage} stage successfully`,
      data: finalLead
    });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const [totalRes, leadsRes, valRes] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM leads WHERE deleted_at IS NULL"),
      db.query("SELECT pipeline_stage, stage_updated_at, created_at FROM leads WHERE deleted_at IS NULL"),
      db.query(`
        SELECT 
          COALESCE(SUM((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2), 0) as potential_revenue,
          COALESCE(SUM(expected_revenue), 0) as expected_revenue,
          COALESCE(SUM((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) FILTER (WHERE status='booked'), 0) as closed_revenue
        FROM leads 
        WHERE deleted_at IS NULL
      `)
    ]);

    const totalLeads = parseInt(totalRes.rows[0]?.count || 0);
    const budgetStats = valRes.rows[0] || {};

    const stageGroups = {};
    leadsRes.rows.forEach(lead => {
      const stage = lead.pipeline_stage || 'New Lead';
      if (!stageGroups[stage]) {
        stageGroups[stage] = { count: 0, totalMs: 0 };
      }
      stageGroups[stage].count += 1;
      const createdDate = new Date(lead.created_at);
      const stageDate = lead.stage_updated_at ? new Date(lead.stage_updated_at) : createdDate;
      const diffMs = Math.max(0, new Date() - stageDate);
      stageGroups[stage].totalMs += diffMs;
    });

    const leadsPerStage = Object.entries(stageGroups).map(([stage, info]) => {
      const avgDays = info.count > 0 ? (info.totalMs / (1000 * 60 * 60 * 24 * info.count)) : 0.0;
      return {
        stage,
        count: info.count,
        avg_days: parseFloat(avgDays.toFixed(1)),
        conversion_pct: totalLeads > 0 ? Math.round((info.count / totalLeads) * 100) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total_leads: totalLeads,
        pipeline_value: parseFloat(budgetStats.potential_revenue || 0),
        expected_revenue: parseFloat(budgetStats.expected_revenue || 0),
        closed_revenue: parseFloat(budgetStats.closed_revenue || 0),
        stages: leadsPerStage
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPipeline,
  moveLead,
  getAnalytics
};
