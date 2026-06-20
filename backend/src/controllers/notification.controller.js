const notifService = require('../services/notification.service');

const respond = (res, data, status = 200) => res.status(status).json({ success: true, ...data });

const getAll = async (req, res, next) => {
  try {
    const data = await notifService.getForUser(req.user.id);
    const count = await notifService.getUnreadCount(req.user.id);
    respond(res, { data, meta: { unread: count } });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await notifService.markRead(req.params.id, req.user.id);
    respond(res, { message: 'Marked as read' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await notifService.markAllRead(req.user.id);
    respond(res, { message: 'All marked as read' });
  } catch (err) { next(err); }
};

module.exports = { getAll, markRead, markAllRead };
