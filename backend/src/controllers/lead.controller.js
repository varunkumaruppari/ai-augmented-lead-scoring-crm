const leadService = require('../services/lead.service');
const { logAuditEvent } = require('../middlewares/audit.middleware');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, status, assigned_to, search } = req.query;
    const result = await leadService.getAll(
      { category, status, assigned_to, search },
      parseInt(page), parseInt(limit)
    );
    respond(res, { data: result.leads, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const lead = await leadService.getById(req.params.id);
    respond(res, { data: lead });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const lead = await leadService.create(req.body, req.user.id);
    await logAuditEvent(req, {
      action: 'LEAD_CREATED',
      entityType: 'lead',
      entityId: lead.id,
      newData: { full_name: lead.full_name, status: lead.status, score: lead.current_score },
    });
    respond(res, { data: lead, message: 'Lead created and scored successfully' }, 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    // Capture old data before update
    const leadRepo = require('../repositories/lead.repository');
    const oldLead = await leadRepo.findById(req.params.id);
    const lead = await leadService.update(req.params.id, req.body, req.user.id);
    await logAuditEvent(req, {
      action: 'LEAD_UPDATED',
      entityType: 'lead',
      entityId: req.params.id,
      oldData: oldLead ? { status: oldLead.status, score: oldLead.current_score, pipeline_stage: oldLead.pipeline_stage } : null,
      newData: { status: lead.status, score: lead.current_score, pipeline_stage: lead.pipeline_stage },
    });
    respond(res, { data: lead, message: 'Lead updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const leadRepo = require('../repositories/lead.repository');
    const oldLead = await leadRepo.findById(req.params.id);
    await leadService.remove(req.params.id);
    await logAuditEvent(req, {
      action: 'LEAD_DELETED',
      entityType: 'lead',
      entityId: req.params.id,
      oldData: oldLead ? { full_name: oldLead.full_name, status: oldLead.status } : null,
    });
    respond(res, { message: 'Lead deleted' });
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const lead = await leadService.assign(req.params.id, req.body.agent_id, req.user.id);
    await logAuditEvent(req, {
      action: 'LEAD_ASSIGNED',
      entityType: 'lead',
      entityId: req.params.id,
      newData: { assigned_to: req.body.agent_id },
    });
    respond(res, { data: lead, message: 'Lead assigned' });
  } catch (err) { next(err); }
};

const addActivity = async (req, res, next) => {
  try {
    const activity = await leadService.addActivity(
      req.params.id, req.user.id, req.body.type, req.body.description, req.body.meta
    );
    respond(res, { data: activity, message: 'Activity logged' }, 201);
  } catch (err) { next(err); }
};

const getActivities = async (req, res, next) => {
  try {
    const leadRepo = require('../repositories/lead.repository');
    const activities = await leadRepo.getActivities(req.params.id);
    respond(res, { data: activities });
  } catch (err) { next(err); }
};

const getScoreHistory = async (req, res, next) => {
  try {
    const leadRepo = require('../repositories/lead.repository');
    const history = await leadRepo.getScoreHistory(req.params.id);
    respond(res, { data: history });
  } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
  try {
    const data = await leadService.getDashboard();
    respond(res, { data });
  } catch (err) { next(err); }
};

const getAnalytics = async (req, res, next) => {
  try {
    const data = await leadService.getAnalytics();
    respond(res, { data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, assign, addActivity, getActivities, getScoreHistory, getDashboard, getAnalytics };
