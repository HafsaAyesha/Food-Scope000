const { createClient } = require('redis');
const config = require('../config');

const client = createClient({ url: config.REDIS_URL });

client.on('error', (error) => {
  console.error('Redis error:', error);
});

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
};

module.exports = {
  client,
  connectRedis
};
