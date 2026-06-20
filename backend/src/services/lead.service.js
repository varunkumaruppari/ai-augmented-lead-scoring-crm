const leadRepo = require('../repositories/lead.repository');
const { calculateLeadScore } = require('./scoring.service');
const notifService = require('./notification.service');
const intelligenceService = require('./intelligence.service');

const getAll = async (filters, page, limit) => {
  return leadRepo.findAll(filters, page, limit);
};

const getById = async (id) => {
  const lead = await leadRepo.findById(id);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });
  const [scoreHistory, activities] = await Promise.all([
    leadRepo.getScoreHistory(id),
    leadRepo.getActivities(id)
  ]);
  return { ...lead, score_history: scoreHistory, activities };
};

const create = async (data, createdBy) => {
  const leadData = { ...data, created_by: createdBy };
  const lead = await leadRepo.create(leadData);
  
  // Score immediately after creation
  const scoreResult = calculateLeadScore(lead);
  await leadRepo.addScoreRecord(lead.id, scoreResult);
  const updated = await leadRepo.update(lead.id, {
    current_score: scoreResult.score,
    category: scoreResult.category
  });

  // Calculate and sync AI Lead Intelligence
  await intelligenceService.upsertIntelligenceForLead(updated);

  // Log activity
  await leadRepo.addActivity({
    lead_id: lead.id, user_id: createdBy,
    type: 'created', description: `Lead created via ${lead.source}. Score: ${scoreResult.score} (${scoreResult.category})`
  });

  // Alert if HOT
  if (scoreResult.category === 'HOT' && lead.assigned_to) {
    await notifService.create(lead.assigned_to, 'hot_lead_alert', 'HOT Lead Alert!',
      `New HOT lead: ${lead.full_name} (Score: ${scoreResult.score})`, lead.id);
  }

  return { ...updated, score_breakdown: scoreResult.breakdown };
};

const update = async (id, data, userId) => {
  const existing = await leadRepo.findById(id);
  if (!existing) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });

  const updated = await leadRepo.update(id, data);

  // Recalculate score
  const scoreResult = calculateLeadScore(updated);
  await leadRepo.addScoreRecord(updated.id, scoreResult);
  const final = await leadRepo.update(id, {
    current_score: scoreResult.score,
    category: scoreResult.category
  });

  // Calculate and sync AI Lead Intelligence
  await intelligenceService.upsertIntelligenceForLead(final);

  await leadRepo.addActivity({
    lead_id: id, user_id: userId,
    type: 'updated', description: `Lead updated. New score: ${scoreResult.score} (${scoreResult.category})`
  });

  return { ...final, score_breakdown: scoreResult.breakdown };
};

const remove = async (id) => {
  const lead = await leadRepo.findById(id);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });
  return leadRepo.softDelete(id);
};

const assign = async (leadId, agentId, adminId) => {
  const lead = await leadRepo.findById(leadId);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });
  
  const updated = await leadRepo.update(leadId, { assigned_to: agentId, assigned_at: new Date() });
  await leadRepo.addActivity({
    lead_id: leadId, user_id: adminId,
    type: 'assigned', description: `Lead assigned to agent`
  });
  await notifService.create(agentId, 'lead_assigned', 'New Lead Assigned',
    `Lead "${lead.full_name}" has been assigned to you.`, leadId);
  return updated;
};

const addActivity = async (leadId, userId, type, description, meta) => {
  const lead = await leadRepo.findById(leadId);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });
  
  // Update engagement count
  if (['call','email','visit','whatsapp'].includes(type)) {
    await leadRepo.update(leadId, { engagement_count: (lead.engagement_count || 0) + 1 });
    // Recalculate score
    const updated = await leadRepo.findById(leadId);
    const scoreResult = calculateLeadScore(updated);
    await leadRepo.addScoreRecord(leadId, scoreResult);
    const final = await leadRepo.update(leadId, { current_score: scoreResult.score, category: scoreResult.category });
    
    // Calculate and sync AI Lead Intelligence
    await intelligenceService.upsertIntelligenceForLead(final);
  }

  return leadRepo.addActivity({ lead_id: leadId, user_id: userId, type, description, meta });
};

const getDashboard = async () => {
  const [stats, topLeads, recentActivities] = await Promise.all([
    leadRepo.getDashboardStats(),
    leadRepo.getTopLeads(10),
    leadRepo.getRecentActivities(5)
  ]);
  return { stats, top_leads: topLeads, recent_activities: recentActivities };
};

const getAnalytics = async () => {
  const [pipeline, bySource, byAgent] = await Promise.all([
    leadRepo.getPipelineStats(),
    leadRepo.getSourceStats(),
    leadRepo.getAgentStats()
  ]);
  return { pipeline, by_source: bySource, by_agent: byAgent };
};

module.exports = { getAll, getById, create, update, remove, assign, addActivity, getDashboard, getAnalytics };
