/**
 * Job Worker Process
 * Run this in a separate process to handle background jobs
 * Command: node src/workers/job-worker.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const jobQueue = require('../services/job-queue.service');
const { registerJobHandlers } = require('../services/job-handlers.service');
const { logger } = require('../services/logger.service');

/**
 * Initialize worker
 */
const initializeWorker = async () => {
  try {
    logger.info('Job Worker: Starting...');

    // Register all job handlers
    registerJobHandlers();

    // Start processing jobs
    logger.info('Job Worker: Listening for jobs...');
    await jobQueue.processJobs();
  } catch (err) {
    logger.error({ err: err.message }, 'Job Worker: Fatal error');
    process.exit(1);
  }
};

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  logger.info('Job Worker: Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Job Worker: Terminating...');
  process.exit(0);
});

// Start worker
initializeWorker().catch((err) => {
  logger.error({ err }, 'Job Worker: Initialization failed');
  process.exit(1);
});
