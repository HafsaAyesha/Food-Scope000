const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const redisService = require('./redis.service');

const getRateLimitConfig = () => {
  const points = Number(process.env.RATE_LIMIT_POINTS) || 120;
  const duration = Number(process.env.RATE_LIMIT_DURATION) || 60;
  if (!Number.isFinite(points) || !Number.isFinite(duration)) {
    throw new Error('Invalid rate limit config');
  }
  return { points, duration };
};

/**
 * rate-limiter-flexible@2.4.x calls storeClient.eval(script, numKeys, key, points, sec, cb)
 * which matches node-redis v3. redis v4+ requires { keys, arguments } — adapt without upgrading packages.
 */
const wrapRedisStoreClient = (client) => {
  if (!client || client.__rateLimiterWrapped) {
    return client;
  }

  const wrapped = {
    __rateLimiterWrapped: true,
    isOpen: client.isOpen,
    status: client.status,
    isReady: () => (typeof client.isReady === 'function' ? client.isReady() : Boolean(client.isOpen)),
    multi: (...args) => client.multi(...args),
    defineCommand(name, definition) {
      if (typeof client.defineCommand !== 'function') {
        return;
      }
      client.defineCommand(name, definition);
      wrapped[name] = (key, points, secDuration, callback) => {
        const commandPromise = client[name](String(key), String(points), String(secDuration));
        Promise.resolve(commandPromise)
          .then((result) => {
            if (callback) callback(null, result);
          })
          .catch((err) => {
            if (callback) callback(err);
          });
      };
    },
    eval(script, numKeys, key, points, secDuration, callback) {
      const options = {
        keys: [String(key)],
        arguments: [String(points), String(secDuration)]
      };
      Promise.resolve(client.eval(script, options))
        .then((result) => {
          if (callback) callback(null, result);
        })
        .catch((err) => {
          if (callback) callback(err);
        });
    }
  };

  return wrapped;
};

const createLimiter = (keyPrefix, points, duration, blockDuration) => {
  const memoryLimiter = new RateLimiterMemory({ keyPrefix, points, duration, blockDuration });

  if (!redisService.client) {
    return memoryLimiter;
  }

  try {
    return new RateLimiterRedis({
      storeClient: wrapRedisStoreClient(redisService.client),
      keyPrefix,
      points,
      duration,
      blockDuration,
      inmemoryBlockOnConsumed: points * 2,
      inmemoryBlockDuration: blockDuration,
      insuranceLimiter: memoryLimiter
    });
  } catch (err) {
    console.warn('Rate limiter falling back to memory:', err.message);
    return memoryLimiter;
  }
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
  getRateLimitConfig,
  wrapRedisStoreClient,
  consumeLogin,
  consumeRegister,
  consumeForgotPassword,
  consumeResendVerification,
  getRateLimitRemaining
};
