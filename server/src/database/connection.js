const mongoose = require('mongoose');
const config = require('../config');
const { logger } = require('../services/logger.service');

const defaultOptions = {
  maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 20,
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 45000,
  family: 4,
  autoIndex: false
};

const connectWithRetry = async (maxAttempts = 5) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      await mongoose.connect(process.env.MONGO_URI, defaultOptions);
      logger.info({ event: 'mongo_connected' }, 'MongoDB connected');
      return;
    } catch (err) {
      const delay = Math.min(30000, 500 * 2 ** attempt);
      logger.warn({ attempt, err: err.message }, `MongoDB connection attempt ${attempt} failed, retrying in ${delay}ms`);
      // wait
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error('MongoDB connection failed after retries, exiting');
  process.exit(1);
};

const connectDB = async () => connectWithRetry();

const gracefulShutdown = async () => {
  try {
    logger.info('Shutting down: closing MongoDB connection');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error({ err: err.message }, 'Error during MongoDB shutdown');
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;
