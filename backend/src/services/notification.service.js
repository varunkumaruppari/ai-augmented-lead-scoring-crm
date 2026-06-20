const db = require('../config/database');
const socketService = require('./socket.service');

const create = async (userId, type, title, message, leadId = null) => {
  try {
    const { rows } = await db.query(
      'INSERT INTO notifications (user_id, type, title, message, lead_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, type, title, message, leadId]
    );
    const notification = rows[0];
    
    // Push real-time event to socket room
    socketService.sendToUser(userId, 'notification', notification);
    
    return notification;
  } catch (err) {
    // Non-critical: log and continue
    console.error('Notification insert failed:', err.message);
  }
};

const getForUser = async (userId, unreadOnly = false) => {
  const condition = unreadOnly ? 'AND is_read = false' : '';
  const { rows } = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ${condition} ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return rows;
};

const markRead = async (id, userId) => {
  await db.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [id, userId]);
};

const markAllRead = async (userId) => {
  await db.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [userId]);
};

const getUnreadCount = async (userId) => {
  const { rows } = await db.query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [userId]);
  return parseInt(rows[0].count);
};

module.exports = { create, getForUser, markRead, markAllRead, getUnreadCount };
