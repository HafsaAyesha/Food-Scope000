const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redisService = require('../services/redis.service');
const { getRateLimitConfig, wrapRedisStoreClient } = require('../services/rate-limit.service');
const { createApiError } = require('../utils/api-error');

const buildRateLimitKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const raw = req.ip || forwardedIp || req.socket?.remoteAddress;
  return (raw || 'unknown').toString().replace('::ffff:', '').split(',')[0].trim();
};

const createLimiter = () => {
  const { points, duration } = getRateLimitConfig();
  const memoryLimiter = new RateLimiterMemory({
    keyPrefix: 'global_rl',
    points,
    duration
  });

  if (!redisService.client) {
    return memoryLimiter;
  }

  try {
    return new RateLimiterRedis({
      storeClient: wrapRedisStoreClient(redisService.client),
      keyPrefix: 'global_rl',
      points,
      duration,
      insuranceLimiter: memoryLimiter
    });
  } catch (err) {
    console.warn('Rate limiter falling back to memory:', err.message);
    return memoryLimiter;
  }
};

let limiter = null;

const getLimiter = () => {
  if (!limiter) {
    limiter = createLimiter();
  }
  return limiter;
};

const isRateLimitRejection = (rejRes) =>
  rejRes && typeof rejRes === 'object' && typeof rejRes.msBeforeNext === 'number';

const globalRateLimit = async (req, res, next) => {
  const key = buildRateLimitKey(req);
  try {
    await getLimiter().consume(key);
    return next();
  } catch (rejRes) {
    if (isRateLimitRejection(rejRes)) {
      const err = createApiError(429, 'RATE_LIMIT_EXCEEDED', 'RATE_LIMIT', 'Too many requests. Please try later.');
      return res.status(429).json(err.payload);
    }

    console.warn('Rate limiter falling back to memory:', rejRes?.message || rejRes);
    const { points, duration } = getRateLimitConfig();
    limiter = new RateLimiterMemory({ keyPrefix: 'global_rl', points, duration });
    try {
      await limiter.consume(key);
      return next();
    } catch (retryRej) {
      if (isRateLimitRejection(retryRej)) {
        const err = createApiError(429, 'RATE_LIMIT_EXCEEDED', 'RATE_LIMIT', 'Too many requests. Please try later.');
        return res.status(429).json(err.payload);
      }
      return next();
    }
  }
};

module.exports = { globalRateLimit };
