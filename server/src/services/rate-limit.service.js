const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redisService = require('./redis.service');

const createLimiter = (keyPrefix, points, duration, blockDuration) => {
  if (redisService.client) {
    return new RateLimiterRedis({
      storeClient: redisService.client,
      keyPrefix,
      points,
      duration,
      blockDuration,
      inmemoryBlockOnConsumed: points * 2,
      inmemoryBlockDuration: blockDuration,
      insuranceLimiter: new RateLimiterMemory({ keyPrefix, points, duration, blockDuration })
    });
  }
  return new RateLimiterMemory({ keyPrefix, points, duration, blockDuration });
};

const loginLimiter = createLimiter('login', 10, 15 * 60, 15 * 60);
const registerLimiter = createLimiter('register', 5, 15 * 60, 15 * 60);
const forgotPasswordLimiter = createLimiter('forgot_password', 5, 15 * 60, 15 * 60);
const resendVerificationLimiter = createLimiter('resend_verification', 5, 15 * 60, 15 * 60);

const consumeLogin = async (key) => loginLimiter.consume(key);
const consumeRegister = async (key) => registerLimiter.consume(key);
const consumeForgotPassword = async (key) => forgotPasswordLimiter.consume(key);
const consumeResendVerification = async (key) => resendVerificationLimiter.consume(key);

const getRateLimitRemaining = async (limiter, key) => {
  const res = await limiter.get(key);
  if (!res) return null;
  return { remainingPoints: res.remainingPoints, msBeforeNext: res.msBeforeNext };
};

module.exports = {
  consumeLogin,
  consumeRegister,
  consumeForgotPassword,
  consumeResendVerification,
  getRateLimitRemaining
};
