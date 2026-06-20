const db = require('../config/database');
const followupRepo = require('../repositories/followup.repository');
const leadRepo = require('../repositories/lead.repository');
const { calculateLeadScore } = require('./scoring.service');
const notifService = require('./notification.service');

const getPending = async (userId) => followupRepo.findPending(userId);

const getOverdue = async () => followupRepo.findOverdue();

const create = async (leadId, data, userId) => {
  const lead = await leadRepo.findById(leadId);
  if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404, code: 'NOT_FOUND' });
  
  const followup = await followupRepo.create({ 
    lead_id: leadId, 
    assigned_to: data.assigned_to || userId, 
    scheduled_at: data.scheduled_at,
    type: data.type,
    priority: data.priority || 'Medium',
    notes: data.notes
  });

  await leadRepo.addActivity({
    lead_id: leadId, user_id: userId,
    type: 'followup_scheduled',
    description: `Follow-up scheduled for ${new Date(data.scheduled_at).toLocaleString('en-IN')}`
  });

  // Push immediate notification if High or Critical priority
  if (data.priority === 'High' || data.priority === 'Critical') {
    await notifService.create(
      data.assigned_to || userId,
      'followup_due',
      `🔥 ${data.priority} Priority Task`,
      `New follow-up scheduled for lead: ${lead.full_name}`,
      leadId
    );
  }

  return followup;
};

const createDirect = async (data, userId) => {
  const leadId = data.leadId || data.lead_id;
  return create(leadId, data, userId);
};

const update = async (id, data, userId) => {
  const updated = await followupRepo.update(id, data);
  
  await leadRepo.addActivity({
    lead_id: updated.lead_id, user_id: userId,
    type: 'followup_updated',
    description: `Follow-up updated/rescheduled`
  });

  return updated;
};

const complete = async (id, outcome, userId) => {
  const followup = await followupRepo.complete(id, outcome);

  // Increment follow-up count on lead and recalculate score
  const lead = await leadRepo.findById(followup.lead_id);
  if (lead) {
    await leadRepo.update(lead.id, { followup_count: (lead.followup_count || 0) + 1 });
    const updatedLead = await leadRepo.findById(lead.id);
    const scoreResult = calculateLeadScore(updatedLead);
    await leadRepo.addScoreRecord(lead.id, scoreResult);
    await leadRepo.update(lead.id, { current_score: scoreResult.score, category: scoreResult.category });
  }

  await leadRepo.addActivity({
    lead_id: followup.lead_id, user_id: userId,
    type: 'followup_completed', description: `Follow-up completed. Outcome: ${outcome || 'None recorded'}`
  });

  return followup;
};

const checkAndRemindFollowups = async () => {
  try {
    const now = new Date();
    // Query active uncompleted follow-ups
    const { rows } = await db.query(`
      SELECT f.*, l.full_name as lead_name
      FROM follow_ups f
      JOIN leads l ON f.lead_id = l.id
      WHERE f.completed_at IS NULL AND l.deleted_at IS NULL
    `);

    for (const fu of rows) {
      const scheduledTime = new Date(fu.scheduled_at);
      const diffMs = scheduledTime - now;
      const diffMins = diffMs / (1000 * 60);

      // 1. Check if overdue (scheduled in past by more than 1 minute)
      if (diffMs < -60000) {
        const alreadyNotified = await db.query(
          "SELECT 1 FROM notifications WHERE type = 'followup_overdue' AND lead_id = $1 AND message LIKE $2",
          [fu.lead_id, `%${fu.id}%`]
        );
        if (alreadyNotified.rows.length === 0) {
          await notifService.create(
            fu.assigned_to,
            'followup_overdue',
            '⚠️ Overdue Follow-up',
            `Scheduled task for lead "${fu.lead_name}" (ID: ${fu.id}) is overdue. Please action.`,
            fu.lead_id
          );
        }
      }
      // 2. Check if due today within next 15 minutes
      else if (diffMins >= 0 && diffMins <= 15) {
        const alreadyNotified = await db.query(
          "SELECT 1 FROM notifications WHERE type = 'followup_due' AND lead_id = $1 AND message LIKE $2",
          [fu.lead_id, `%${fu.id}%`]
        );
        if (alreadyNotified.rows.length === 0) {
          await notifService.create(
            fu.assigned_to,
            'followup_due',
            '⏳ Follow-Up Due Today',
            `Follow-up task for "${fu.lead_name}" (ID: ${fu.id}) starts in less than 15 minutes.`,
            fu.lead_id
          );
        }
      }
    }
  } catch (err) {
    console.error('[Scheduler] Follow-up reminder check failed:', err.message);
  }
};

module.exports = { getPending, getOverdue, create, createDirect, update, complete, checkAndRemindFollowups };
