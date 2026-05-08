const { query } = require('../config/database');

const parseJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const toNotification = (row) =>
  row && {
    _id: String(row.id),
    user: String(row.user_id),
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    metadata: parseJson(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const create = async ({ user, title, message, type = 'system', metadata = {} }) => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, is_read, metadata)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [user, type, title, message, JSON.stringify(metadata)]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const rows = await query('SELECT * FROM notifications WHERE id = ?', [id]);
  return toNotification(rows[0]);
};

const listByUser = async (userId, { unreadOnly = false, limit = 20 } = {}) => {
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 20);
  const rows = await query(
    `SELECT * FROM notifications WHERE user_id = ?${unreadOnly ? ' AND is_read = 0' : ''}
     ORDER BY created_at DESC LIMIT ${safeLimit}`,
    [userId]
  );
  return rows.map(toNotification);
};

const markRead = async (id, userId) => {
  await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  const notification = await findById(id);
  return notification?.user === String(userId) ? notification : null;
};

module.exports = {
  create,
  listByUser,
  markRead,
  toNotification,
};
