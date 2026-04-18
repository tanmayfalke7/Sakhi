const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRE || '7d';

  const token = jwt.sign({ id: userId }, secret, {
    expiresIn: expiresIn,
  });

  return token;
};

module.exports = generateToken;
