const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/auth.model');
const RefreshToken = require('../models/refresh-token.model');
const UserToken = require('../models/user-token.model');
const { createApiError, handleError } = require('../utils/api-error');
const { runTransaction } = require('../services/db.service');
const { hashToken, createAccessToken } = require('../services/token.service');
const { logAuditEvent } = require('../services/audit.service');

const registerAttemptStore = new Map();
const forgotPasswordStore = new Map();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');
const createRefreshToken = (user, rememberMe = false) =>
  jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? '30d' : '7d' }
  );

const trackWindowAttempts = (store, key, maxAttempts, windowMs) => {
  const now = Date.now();
  const state = store.get(key);
  if (!state || state.windowEndsAt < now) {
    store.set(key, { count: 1, windowEndsAt: now + windowMs });
    return 1;
  }
  state.count += 1;
  store.set(key, state);
  return state.count;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const ipAddress = req.ip || 'unknown';

    if (!name || !email || !password) {
      const attempts = trackWindowAttempts(registerAttemptStore, ipAddress, 5, 15 * 60 * 1000);
      if (attempts > 5) throw createApiError(429, 'AUTH_REGISTER_RATE_LIMIT', 'TOO_MANY_REQUESTS', 'Too many failed registration attempts.');
      throw createApiError(400, 'AUTH_REGISTER_INVALID_INPUT', 'VALIDATION_ERROR', 'Missing required fields.');
    }

    if (!validateEmail(email)) throw createApiError(400, 'AUTH_REGISTER_INVALID_EMAIL', 'VALIDATION_ERROR', 'Invalid email format.');
    if (password.length < 8) throw createApiError(422, 'AUTH_WEAK_PASSWORD', 'VALIDATION_ERROR', 'Password must be at least 8 characters.');
    if (role && !['user', 'reviewer'].includes(role)) throw createApiError(400, 'AUTH_INVALID_ROLE', 'VALIDATION_ERROR', 'Role must be user or reviewer.');

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const attempts = trackWindowAttempts(registerAttemptStore, ipAddress, 5, 15 * 60 * 1000);
      if (attempts > 5) throw createApiError(429, 'AUTH_REGISTER_RATE_LIMIT', 'TOO_MANY_REQUESTS', 'Too many failed registration attempts.');
      throw createApiError(409, 'AUTH_EMAIL_EXISTS', 'CONFLICT_ERROR', 'Email already registered.');
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password, role: role || 'user' });

    res.status(201).json({
      message: 'Account created. Check email for verification.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt }
    });
  } catch (err) {
    handleError(res, err);
  }
};

const login = async (req, res) => {
  try {
    const { email, password, remember_me } = req.body;

    if (!email || !password) throw createApiError(400, 'AUTH_LOGIN_MISSING_FIELDS', 'VALIDATION_ERROR', 'Missing email or password.');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw createApiError(401, 'AUTH_INVALID_CREDENTIALS', 'AUTH_ERROR', 'Invalid credentials.');

    if (user.lockUntil && user.lockUntil > new Date()) throw createApiError(429, 'AUTH_ACCOUNT_LOCKED', 'TOO_MANY_REQUESTS', 'Account temporarily locked for 15 minutes.');

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      if (user.failedLoginAttempts >= 5) throw createApiError(429, 'AUTH_ACCOUNT_LOCKED', 'TOO_MANY_REQUESTS', 'Account temporarily locked for 15 minutes.');
      throw createApiError(401, 'AUTH_INVALID_CREDENTIALS', 'AUTH_ERROR', 'Invalid credentials.');
    }

    if (user.isSuspended) throw createApiError(423, 'AUTH_ACCOUNT_SUSPENDED', 'AUTH_ERROR', 'Account suspended by admin.');
    if (!user.isVerified) throw createApiError(403, 'AUTH_ACCOUNT_NOT_VERIFIED', 'AUTH_ERROR', 'Account not verified.');

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user, Boolean(remember_me));
    const refreshTokenHash = hashToken(refreshToken);
    
    let decodedRefresh;
    try {
      decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw createApiError(500, 'AUTH_TOKEN_ERROR', 'AUTH_ERROR', 'Failed to process token.');
    }

    await runTransaction(async (session) => {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save({ session });

      await RefreshToken.create([{
        tokenHash: refreshTokenHash,
        user: user._id,
        expiresAt: new Date(decodedRefresh.exp * 1000),
        isRevoked: false
      }], { session });
    });

    await logAuditEvent({ actorId: user._id, actionType: 'user_login', targetEntity: 'User', targetId: user._id, metadata: { ip: req.ip } });

    res.json({ access_token: accessToken, refresh_token: refreshToken, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    handleError(res, err);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) throw createApiError(401, 'AUTH_UNAUTHORIZED', 'AUTH_ERROR', 'Unauthorized.');
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
};

const logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw createApiError(400, 'AUTH_REFRESH_TOKEN_REQUIRED', 'VALIDATION_ERROR', 'Refresh token missing.');

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      if (decoded.type !== 'refresh') throw new Error('Invalid refresh token payload.');
      if (decoded.sub !== req.user.id) throw createApiError(401, 'AUTH_INVALID_REFRESH_TOKEN', 'AUTH_ERROR', 'Invalid refresh token.');
    } catch (error) {
      throw createApiError(401, 'AUTH_INVALID_REFRESH_TOKEN', 'AUTH_ERROR', 'Invalid or expired refresh token.');
    }

    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(refresh_token) });
    if (tokenDoc && !tokenDoc.isRevoked) {
      tokenDoc.isRevoked = true;
      tokenDoc.revokedAt = new Date();
      tokenDoc.revokedReason = 'logout';
      await tokenDoc.save();
    }

    await logAuditEvent({ actorId: req.user.id, actionType: 'user_logout', targetEntity: 'User', targetId: req.user.id, metadata: { ip: req.ip } });

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    handleError(res, err);
  }
};

const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) throw createApiError(400, 'AUTH_REFRESH_TOKEN_REQUIRED', 'VALIDATION_ERROR', 'Missing refresh token.');

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      if (decoded.type !== 'refresh') throw new Error('Invalid refresh token payload.');
    } catch {
      throw createApiError(401, 'AUTH_INVALID_REFRESH_TOKEN', 'AUTH_ERROR', 'Expired or invalid refresh token.');
    }

    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(refresh_token), isRevoked: false });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) throw createApiError(401, 'AUTH_INVALID_REFRESH_TOKEN', 'AUTH_ERROR', 'Expired or invalid refresh token.');

    const user = await User.findById(decoded.sub);
    if (!user) throw createApiError(401, 'AUTH_INVALID_REFRESH_TOKEN', 'AUTH_ERROR', 'Expired or invalid refresh token.');

    const rememberMe = decoded.exp - decoded.iat > 14 * 24 * 60 * 60;
    const newRefreshToken = createRefreshToken(user, rememberMe);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    
    let decodedNew;
    try {
      decodedNew = jwt.verify(newRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw createApiError(500, 'AUTH_TOKEN_ERROR', 'AUTH_ERROR', 'Failed to process token.');
    }

    await runTransaction(async (session) => {
      tokenDoc.isRevoked = true;
      tokenDoc.revokedAt = new Date();
      tokenDoc.revokedReason = 'rotated';
      tokenDoc.replacedByTokenHash = newRefreshTokenHash;
      await tokenDoc.save({ session });

      await RefreshToken.create([{
        tokenHash: newRefreshTokenHash,
        user: user._id,
        expiresAt: new Date(decodedNew.exp * 1000),
        isRevoked: false
      }], { session });
    });

    const accessToken = createAccessToken(user);
    res.json({ access_token: accessToken, refresh_token: newRefreshToken });
  } catch (err) {
    handleError(res, err);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || 'unknown';

    if (!email) throw createApiError(400, 'AUTH_EMAIL_REQUIRED', 'VALIDATION_ERROR', 'Missing email.');

    const key = `${ipAddress}:${email.toLowerCase()}`;
    const attempts = trackWindowAttempts(forgotPasswordStore, key, 5, 15 * 60 * 1000);
    if (attempts > 5) throw createApiError(429, 'AUTH_RESET_RATE_LIMIT', 'TOO_MANY_REQUESTS', 'Too many reset requests.');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const rawToken = generateSecureToken();
      const tokenHash = hashToken(rawToken);
      await UserToken.create({
        user: user._id,
        type: 'password_reset',
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        createdByIp: ipAddress,
        metadata: { user_agent: req.headers['user-agent'] || null }
      });

      await logAuditEvent({ actorId: user._id, actionType: 'password_reset_requested', targetEntity: 'User', targetId: user._id, metadata: { ip: ipAddress } });
    }

    res.json({ message: 'Reset link sent if email exists.' });
  } catch (err) {
    handleError(res, err);
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) throw createApiError(400, 'AUTH_RESET_MISSING_FIELDS', 'VALIDATION_ERROR', 'Missing token or new_password.');
    if (new_password.length < 8) throw createApiError(422, 'AUTH_WEAK_PASSWORD', 'VALIDATION_ERROR', 'New password is too weak.');

    const tokenHash = hashToken(token);

    await runTransaction(async (session) => {
      // Atomically fetch and mark as used in one operation
      const userToken = await UserToken.findOneAndUpdate(
        { tokenHash, type: 'password_reset', revoked: false, usedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { usedAt: new Date(), revoked: true } },
        { session, new: true }
      );

      if (!userToken) {
        throw createApiError(401, 'AUTH_RESET_TOKEN_EXPIRED', 'VALIDATION_ERROR', 'Expired, invalid, or already used reset token.');
      }

      const user = await User.findById(userToken.user).session(session);
      if (!user) throw createApiError(404, 'AUTH_USER_NOT_FOUND', 'NOT_FOUND_ERROR', 'User not found.');

      user.password = new_password;
      await user.save({ session });

      await RefreshToken.updateMany({ user: user._id, isRevoked: false }, { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_reset' } }, { session });

      return { user, userToken };
    }).then(async (result) => {
      if (result && result.userToken) {
        await logAuditEvent({ actorId: result.userToken.user, actionType: 'password_reset_completed', targetEntity: 'User', targetId: result.userToken.user, metadata: { ip: req.ip } });
      }
    });

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    handleError(res, err);
  }
};

module.exports = { register, login, logout, refresh, forgotPassword, resetUserPassword, getMe };
