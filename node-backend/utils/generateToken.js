const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

module.exports = generateToken;
