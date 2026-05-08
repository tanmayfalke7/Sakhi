const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const emptyProfile = {
  city: '',
  cycleRegularity: '',
  lifestyle: '',
  symptoms: '',
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toUser = (row, includePassword = false) => {
  if (!row) return null;

  const user = {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    avatarUrl: row.avatar_url || '',
    profile: { ...emptyProfile, ...parseJson(row.profile, {}) },
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) {
    user.password = row.password;
    user.matchPassword = (enteredPassword) => bcrypt.compare(enteredPassword, row.password);
  }

  return user;
};

const findById = async (id, { includePassword = false } = {}) => {
  const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
  return toUser(rows[0], includePassword);
};

const findByEmail = async (email, { includePassword = false } = {}) => {
  const rows = await query('SELECT * FROM users WHERE email = ?', [String(email).toLowerCase()]);
  return toUser(rows[0], includePassword);
};

const create = async ({ name, email, password, role = 'patient', phone = '', avatarUrl = '', profile = {} }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password, role, phone, avatar_url, profile)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      String(name).trim(),
      String(email).toLowerCase().trim(),
      hashedPassword,
      role,
      phone || '',
      avatarUrl || '',
      JSON.stringify({ ...emptyProfile, ...profile }),
    ]
  );

  return findById(result.insertId);
};

const updateById = async (id, updates) => {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.avatarUrl !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatarUrl);
  }
  if (updates.profile !== undefined) {
    fields.push('profile = ?');
    values.push(JSON.stringify(updates.profile));
  }
  if (updates.role !== undefined) {
    fields.push('role = ?');
    values.push(updates.role);
  }
  if (updates.lastLoginAt !== undefined) {
    fields.push('last_login_at = ?');
    values.push(updates.lastLoginAt);
  }

  if (!fields.length) {
    return findById(id);
  }

  values.push(id);
  await query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

const listPatients = async ({ selectAgeOnly = false } = {}) => {
  const rows = await query('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', ['patient']);
  const users = rows.map((row) => toUser(row));
  return selectAgeOnly ? users.map((user) => ({ _id: user._id, profile: { age: user.profile?.age } })) : users;
};

const countPatients = async () => {
  const rows = await query('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['patient']);
  return rows[0].count;
};

const findDoctor = async () => {
  const rows = await query('SELECT * FROM users WHERE role = ? ORDER BY created_at ASC LIMIT 1', ['doctor']);
  return toUser(rows[0]);
};

module.exports = {
  create,
  findById,
  findByEmail,
  updateById,
  listPatients,
  countPatients,
  findDoctor,
  toUser,
};
