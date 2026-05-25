/**
 * Health Check Service
 * Provides comprehensive health monitoring for all critical services
 */

const mongoose = require('mongoose');
const redis = require('./redis.service');
const { logger } = require('./logger.service');

class HealthCheckService {
  /**
   * Check database connectivity
   */
  async checkDatabase() {
    try {
      const ping = await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        message: 'MongoDB connected',
        responseTime: ping ? 'ok' : 'delayed'
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        message: `MongoDB error: ${err.message}`
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    try {
      const pong = await redis.ping();
      return {
        status: pong === 'PONG' ? 'healthy' : 'unhealthy',
        message: pong === 'PONG' ? 'Redis connected' : 'Redis ping failed'
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        message: `Redis error: ${err.message}`
      };
    }
  }

  /**
   * Comprehensive health check
   */
  async checkHealth() {
    const checks = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check all services
    checks.services.database = await this.checkDatabase();
    checks.services.redis = await this.checkRedis();

    // Overall health status
    const allHealthy = Object.values(checks.services).every(s => s.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'degraded';

    // Log unhealthy services
    Object.entries(checks.services).forEach(([service, check]) => {
      if (check.status !== 'healthy') {
        logger.warn({ service, ...check }, 'Service health check failed');
      }
    });

    return checks;
  }

  /**
   * Readiness check (strict - all services must be healthy)
   */
  async checkReadiness() {
    const health = await this.checkHealth();
    const isReady = health.status === 'healthy';

    return {
      ready: isReady,
      timestamp: health.timestamp,
      services: health.services
    };
  }

  /**
   * Liveness check (loose - API must be responding)
   */
  async checkLiveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new HealthCheckService();
