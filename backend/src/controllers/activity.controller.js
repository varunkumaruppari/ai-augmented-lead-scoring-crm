const leadRepo = require('../repositories/lead.repository');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || 50);
    const activities = await leadRepo.getRecentActivities(limit);
    respond(res, { data: activities });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivities };
