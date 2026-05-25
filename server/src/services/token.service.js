const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateRandomToken = () => crypto.randomBytes(config.AUTH_TOKEN_LENGTH).toString('hex');

const createAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRATION }
  );
};

const verifyAccessToken = (token) => jwt.verify(token, config.JWT_ACCESS_SECRET);

module.exports = {
  hashToken,
  generateRandomToken,
  createAccessToken,
  verifyAccessToken
};
