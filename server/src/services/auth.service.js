const config = require('../config');
const RefreshToken = require('../models/refresh-token.model');
const { generateRandomToken, hashToken, createAccessToken } = require('./token.service');

const parseDuration = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().toLowerCase();
  const match = normalized.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${value}`);
  const amount = Number(match[1]);
  switch (match[2]) {
    case 's': return amount * 1000;
    case 'm': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    case 'd': return amount * 24 * 60 * 60 * 1000;
    default: throw new Error(`Invalid duration unit: ${match[2]}`);
  }
};

const createRefreshToken = async (user, { ip, userAgent }) => {
  const plainToken = generateRandomToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + parseDuration(config.JWT_REFRESH_EXPIRATION));

  await RefreshToken.create({
    tokenHash,
    user: user._id,
    expiresAt,
    createdByIp: ip || null,
    userAgent: userAgent || null
  });

  return plainToken;
};

const rotateRefreshToken = async (tokenDoc, { ip, userAgent }) => {
  const newToken = await createRefreshToken({ _id: tokenDoc.user }, { ip, userAgent });
  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.revokedReason = 'rotated';
  tokenDoc.replacedByTokenHash = hashToken(newToken);
  await tokenDoc.save();
  return newToken;
};

const revokeRefreshToken = async (tokenDoc, reason = 'revoked') => {
  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.revokedReason = reason;
  await tokenDoc.save();
};

const revokeUserRefreshTokens = async (userId, reason = 'security') => {
  await RefreshToken.updateMany({ user: userId, isRevoked: false }, {
    $set: { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
  });
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const tests = [
    /[A-Z]/,
    /[a-z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/
  ];
  if (!tests.every((test) => test.test(password))) {
    throw new Error('Password must include uppercase, lowercase, number, and special character.');
  }
  return true;
};

const generateVerificationToken = async (user) => {
  const token = generateRandomToken();
  user.emailVerificationToken = hashToken(token);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  return token;
};

const generatePasswordResetToken = async (user) => {
  const token = generateRandomToken();
  user.passwordResetToken = hashToken(token);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  return token;
};

module.exports = {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  validatePassword,
  generateVerificationToken,
  generatePasswordResetToken,
  createAccessToken
};
