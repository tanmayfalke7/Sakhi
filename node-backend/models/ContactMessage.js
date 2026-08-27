const { query } = require('../config/database');

const create = async ({ name, email, subject, message }) => {
  const result = await query(
    `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name, email, subject, message]
  );
  return {
    _id: String(result.insertId),
    name,
    email,
    subject,
    message,
  };
};

module.exports = { create };
