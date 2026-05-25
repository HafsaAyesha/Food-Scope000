const redisService = require('./redis.service');

const inMemoryCache = new Map();

const serialize = (value) => JSON.stringify(value);
const deserialize = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const get = async (key) => {
  if (redisService.client?.isOpen) {
    try {
      const value = await redisService.client.get(key);
      return deserialize(value);
    } catch (error) {
      console.warn('Redis cache get failed:', error.message);
    }
  }
  const entry = inMemoryCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    inMemoryCache.delete(key);
    return null;
  }
  return entry.value;
};

const set = async (key, value, ttlSeconds) => {
  const payload = serialize(value);
  if (redisService.client?.isOpen) {
    try {
      await redisService.client.set(key, payload, { EX: ttlSeconds });
      return;
    } catch (error) {
      console.warn('Redis cache set failed:', error.message);
    }
  }
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
};

const del = async (key) => {
  if (redisService.client?.isOpen) {
    try {
      await redisService.client.del(key);
      return;
    } catch (error) {
      console.warn('Redis cache delete failed:', error.message);
    }
  }
  inMemoryCache.delete(key);
};

module.exports = {
  get,
  set,
  del
};
