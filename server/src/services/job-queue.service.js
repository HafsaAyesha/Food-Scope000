/**
 * Job Queue Service using Redis
 * Provides background job processing for async tasks
 */

const redis = require('../services/redis.service');
const { logger } = require('./logger.service');

class JobQueue {
  constructor() {
    this.queueName = 'foodscope:jobs';
    this.processingKey = 'foodscope:processing';
    this.jobs = new Map(); // In-memory registry of job handlers
  }

  /**
   * Register a job processor/handler
   */
  registerHandler(jobType, handler) {
    this.jobs.set(jobType, handler);
    logger.info({ jobType }, 'Job handler registered');
  }

  /**
   * Enqueue a job for background processing
   */
  async enqueue(jobType, data, options = {}) {
    try {
      const {
        priority = 0,
        delay = 0,
        maxRetries = 3,
        retryDelay = 5000
      } = options;

      const jobId = `${jobType}:${Date.now()}:${Math.random()}`;
      const jobData = {
        id: jobId,
        type: jobType,
        data,
        status: 'pending',
        priority,
        delay,
        maxRetries,
        retryDelay,
        attempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store job data
      await redis.setex(
        `${this.queueName}:${jobId}`,
        86400, // 24h expiry
        JSON.stringify(jobData)
      );

      // Add to queue with priority (higher number = higher priority)
      await redis.zadd(this.queueName, -priority, jobId);

      logger.info({ jobId, jobType }, 'Job enqueued');
      return jobId;
    } catch (err) {
      logger.error({ err: err.message, jobType }, 'Failed to enqueue job');
      throw err;
    }
  }

  /**
   * Process jobs from queue
   * Call this in a worker process
   */
  async processJobs() {
    try {
      // Continuously process jobs
      while (true) {
        const jobId = await redis.zpopmin(this.queueName, 1);

        if (!jobId || jobId.length === 0) {
          // No jobs, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        try {
          const jobKey = `${this.queueName}:${jobId[0]}`;
          const jobDataStr = await redis.get(jobKey);

          if (!jobDataStr) {
            logger.warn({ jobId: jobId[0] }, 'Job data not found');
            continue;
          }

          const jobData = JSON.parse(jobDataStr);

          // Mark as processing
          await redis.setex(`${this.processingKey}:${jobData.id}`, 300, '1');

          // Check if handler exists
          if (!this.jobs.has(jobData.type)) {
            logger.warn({ jobType: jobData.type }, 'No handler for job type');
            await redis.del(jobKey);
            continue;
          }

          // Execute job
          const handler = this.jobs.get(jobData.type);
          jobData.status = 'processing';
          jobData.attempts += 1;
          jobData.updatedAt = new Date().toISOString();
          await redis.setex(jobKey, 86400, JSON.stringify(jobData));

          logger.info({ jobId: jobData.id, jobType: jobData.type, attempt: jobData.attempts }, 'Processing job');

          try {
            await handler(jobData.data);

            // Job succeeded
            jobData.status = 'completed';
            jobData.completedAt = new Date().toISOString();
            await redis.setex(jobKey, 86400, JSON.stringify(jobData));
            logger.info({ jobId: jobData.id, jobType: jobData.type }, 'Job completed');
          } catch (err) {
            logger.error({ jobId: jobData.id, jobType: jobData.type, err: err.message, attempt: jobData.attempts }, 'Job failed');

            // Check if we should retry
            if (jobData.attempts < jobData.maxRetries) {
              jobData.status = 'pending';
              jobData.nextRetry = new Date(Date.now() + jobData.retryDelay).toISOString();
              await redis.setex(jobKey, 86400, JSON.stringify(jobData));

              // Re-queue with delay
              await new Promise(resolve => setTimeout(resolve, jobData.retryDelay));
              await redis.zadd(this.queueName, -jobData.priority, jobData.id);
              logger.info({ jobId: jobData.id, jobType: jobData.type, nextRetry: jobData.nextRetry }, 'Job re-queued');
            } else {
              // Max retries exceeded
              jobData.status = 'failed';
              jobData.failedAt = new Date().toISOString();
              jobData.error = err.message;
              await redis.setex(jobKey, 604800, JSON.stringify(jobData)); // Keep for 7 days
              logger.error({ jobId: jobData.id, jobType: jobData.type }, 'Job max retries exceeded');
            }
          }

          // Clean up processing flag
          await redis.del(`${this.processingKey}:${jobData.id}`);
        } catch (err) {
          logger.error({ err: err.message, jobId: jobId[0] }, 'Error processing job');
        }
      }
    } catch (err) {
      logger.error({ err: err.message }, 'Job processor error');
      // Restart processor after delay
      setTimeout(() => this.processJobs(), 5000);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    try {
      const jobDataStr = await redis.get(`${this.queueName}:${jobId}`);
      if (!jobDataStr) return null;
      return JSON.parse(jobDataStr);
    } catch (err) {
      logger.error({ jobId, err: err.message }, 'Failed to get job status');
      return null;
    }
  }

  /**
   * Get queue stats
   */
  async getQueueStats() {
    try {
      const pendingCount = await redis.zcard(this.queueName);
      const keys = await redis.keys(`${this.queueName}:*`);
      const completedCount = (await Promise.all(
        keys.map(async (key) => {
          const data = await redis.get(key);
          return JSON.parse(data).status === 'completed' ? 1 : 0;
        })
      )).reduce((a, b) => a + b, 0);

      return {
        pending: pendingCount,
        completed: completedCount,
        total: keys.length
      };
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to get queue stats');
      return { pending: 0, completed: 0, total: 0 };
    }
  }

  /**
   * Clear all jobs
   */
  async clear() {
    try {
      const keys = await redis.keys(`${this.queueName}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.del(this.queueName);
      logger.info('Queue cleared');
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to clear queue');
    }
  }
}

module.exports = new JobQueue();
