const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redisService = require('../services/redis.service');
const { createApiError } = require('../utils/api-error');

const createLimiter = () => {
  if (redisService.client) {
    return new RateLimiterRedis({
      storeClient: redisService.client,
      keyPrefix: 'global_rl',
      points: Number(process.env.RATE_LIMIT_POINTS) || 120,
      duration: Number(process.env.RATE_LIMIT_DURATION) || 60,
      insuranceLimiter: new RateLimiterMemory({
        points: Number(process.env.RATE_LIMIT_POINTS) || 120,
        duration: Number(process.env.RATE_LIMIT_DURATION) || 60
      })
    });
  }
  return new RateLimiterMemory({
    keyPrefix: 'global_rl',
    points: Number(process.env.RATE_LIMIT_POINTS) || 120,
    duration: Number(process.env.RATE_LIMIT_DURATION) || 60
  });
};

let limiter = null;

const getLimiter = () => {
  if (!limiter) {
    limiter = createLimiter();
  }
  return limiter;
};

const globalRateLimit = async (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  try {
    await getLimiter().consume(key);
    return next();
  } catch (rejRes) {
    const err = createApiError(429, 'RATE_LIMIT_EXCEEDED', 'RATE_LIMIT', 'Too many requests. Please try later.');
    return res.status(429).json(err.payload);
  }
};

module.exports = { globalRateLimit };
