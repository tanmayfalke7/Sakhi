const { query } = require('../config/database');
const User = require('./User');

const toPost = (row) =>
  row && {
    _id: String(row.id),
    author: String(row.author_id),
    content: row.content,
    imageUrl: row.image_url || '',
    likes: [],
    status: row.status,
    moderationReason: row.moderation_reason || '',
    moderatedBy: row.moderated_by ? String(row.moderated_by) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const hydrate = async (post, { author = true, likes = true } = {}) => {
  if (!post) return null;
  const item = { ...post };
  if (author) {
    item.author = await User.findById(post.author);
  }
  if (likes) {
    const rows = await query('SELECT user_id FROM community_post_likes WHERE post_id = ?', [post._id]);
    item.likes = rows.map((row) => ({ _id: String(row.user_id) }));
  }
  return item;
};

const listActive = async ({ limit } = {}) => {
  const safeLimit = limit ? Math.max(1, Number.parseInt(limit, 10) || 5) : null;
  const rows = await query(
    `SELECT * FROM community_posts WHERE status = 'active' ORDER BY created_at DESC${safeLimit ? ` LIMIT ${safeLimit}` : ''}`,
    []
  );
  return Promise.all(rows.map(toPost).map((post) => hydrate(post)));
};

const create = async ({ author, content, imageUrl = '' }) => {
  const result = await query(
    `INSERT INTO community_posts (author_id, content, image_url)
     VALUES (?, ?, ?)`,
    [author, content, imageUrl]
  );
  return findById(result.insertId, { hydratePost: true });
};

const findById = async (id, { hydratePost = false } = {}) => {
  const rows = await query('SELECT * FROM community_posts WHERE id = ?', [id]);
  const post = toPost(rows[0]);
  return hydratePost ? hydrate(post) : post;
};

const toggleLike = async (postId, userId) => {
  const rows = await query('SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
  if (rows.length) {
    await query('DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
  } else {
    await query('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
  }
  return findById(postId, { hydratePost: true });
};

const remove = async (postId) => {
  await query('DELETE FROM community_posts WHERE id = ?', [postId]);
};

const moderate = async (postId, { reason, moderatedBy }) => {
  await query(
    `UPDATE community_posts SET status = 'removed', moderation_reason = ?, moderated_by = ? WHERE id = ?`,
    [reason, moderatedBy, postId]
  );
  return findById(postId);
};

module.exports = {
  listActive,
  create,
  findById,
  toggleLike,
  remove,
  moderate,
};
