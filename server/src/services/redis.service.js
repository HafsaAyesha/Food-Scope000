const { createClient } = require('redis');
const config = require('../config');

let client = null;

if (config.REDIS_URL) {
  client = createClient({ url: config.REDIS_URL });

  client.on('error', (error) => {
    console.warn('Redis error (non-fatal):', error.message);
  });
}

const connectRedis = async () => {
  if (!client) {
    console.warn('Redis URL not configured — skipping Redis connection, using in-memory fallback.');
    return;
  }
  if (!client.isOpen) {
    await client.connect();
  }
};

module.exports = {
  client,
  connectRedis
};
