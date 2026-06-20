const db = require('../config/database');
const followupService = require('../services/followup.service');
const followupRepo = require('../repositories/followup.repository');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getAllFollowups = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    let queryText = `
      SELECT f.*, l.full_name as lead_name, l.phone as lead_phone, l.category as lead_category,
             u.full_name as agent_name
      FROM follow_ups f
      JOIN leads l ON f.lead_id = l.id
      LEFT JOIN users u ON f.assigned_to = u.id
      WHERE l.deleted_at IS NULL
    `;
    const params = [];
    let idx = 1;

    if (!isAdmin) {
      queryText += ` AND f.assigned_to = $${idx++}`;
      params.push(req.user.id);
    }

    if (priority) {
      queryText += ` AND f.priority = $${idx++}`;
      params.push(priority);
    }

    if (status === 'completed') {
      queryText += ` AND f.completed_at IS NOT NULL`;
    } else if (status === 'overdue') {
      queryText += ` AND f.completed_at IS NULL AND f.scheduled_at < NOW()`;
    } else if (status === 'today') {
      queryText += ` AND f.completed_at IS NULL AND DATE(f.scheduled_at) = CURRENT_DATE`;
    } else if (status === 'upcoming') {
      queryText += ` AND f.completed_at IS NULL AND f.scheduled_at > NOW()`;
    } else if (status === 'pending') {
      queryText += ` AND f.completed_at IS NULL`;
    }

    queryText += ` ORDER BY f.scheduled_at ASC`;

    const { rows } = await db.query(queryText, params);
    respond(res, { data: rows });
  } catch (err) {
    next(err);
  }
};

const getPending = async (req, res, next) => {
  try {
    const data = await followupService.getPending(req.user.id);
    respond(res, { data });
  } catch (err) { next(err); }
};

const getByLead = async (req, res, next) => {
  try {
    const data = await followupRepo.findByLead(req.params.id);
    respond(res, { data });
  } catch (err) { next(err); }
};

const getOverdue = async (req, res, next) => {
  try {
    const data = await followupService.getOverdue();
    respond(res, { data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const fu = await followupService.create(req.params.id, req.body, req.user.id);
    respond(res, { data: fu, message: 'Follow-up scheduled' }, 201);
  } catch (err) { next(err); }
};

const createDirect = async (req, res, next) => {
  try {
    const fu = await followupService.createDirect(req.body, req.user.id);
    respond(res, { data: fu, message: 'Follow-up scheduled' }, 201);
  } catch (err) { next(err); }
};

const updateFollowup = async (req, res, next) => {
  try {
    const fu = await followupService.update(req.params.id, req.body, req.user.id);
    respond(res, { data: fu, message: 'Follow-up updated' });
  } catch (err) { next(err); }
};

const complete = async (req, res, next) => {
  try {
    const fu = await followupService.complete(req.params.id || req.params.fid, req.body.outcome, req.user.id);
    respond(res, { data: fu, message: 'Follow-up completed' });
  } catch (err) { next(err); }
};

module.exports = { getAllFollowups, getPending, getByLead, getOverdue, create, createDirect, updateFollowup, complete };
