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

const toPrediction = (row) =>
  row && {
    _id: String(row.id),
    user: String(row.user_id),
    assessmentType: row.assessment_type,
    inputPayload: parseJson(row.input_payload),
    riskPercentage: Number(row.risk_percentage),
    riskLevel: row.risk_level,
    recommendation: row.recommendation,
    modelVersion: row.model_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

const create = async ({ user, assessmentType, inputPayload, riskPercentage, riskLevel, recommendation, modelVersion = 'python-service-v1' }) => {
  const result = await query(
    `INSERT INTO predictions
      (user_id, assessment_type, input_payload, risk_percentage, risk_level, recommendation, model_version)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user, assessmentType, JSON.stringify(inputPayload), riskPercentage, riskLevel, recommendation, modelVersion]
  );
  return findById(result.insertId);
};

const findById = async (id) => {
  const rows = await query('SELECT * FROM predictions WHERE id = ?', [id]);
  return toPrediction(rows[0]);
};

const listByUser = async (userId, limit) => {
  const safeLimit = limit ? Math.max(1, Number.parseInt(limit, 10) || 25) : null;
  const sql = `SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC${safeLimit ? ` LIMIT ${safeLimit}` : ''}`;
  const rows = await query(sql, [userId]);
  return rows.map(toPrediction);
};

const latestByUser = async (userId) => {
  const rows = await query('SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
  return toPrediction(rows[0]);
};

const countByUser = async (userId) => {
  const rows = await query('SELECT COUNT(*) AS count FROM predictions WHERE user_id = ?', [userId]);
  return rows[0].count;
};

const riskDistribution = async () => {
  const rows = await query(
    `SELECT risk_level AS _id, COUNT(*) AS count
     FROM predictions
     WHERE assessment_type = 'pcos'
     GROUP BY risk_level`
  );
  return rows.map((row) => ({ _id: row._id, count: row.count }));
};

module.exports = {
  create,
  findById,
  listByUser,
  latestByUser,
  countByUser,
  riskDistribution,
  toPrediction,
};
