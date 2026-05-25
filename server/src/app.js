const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const config = require('./config');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { httpLogger } = require('./services/logger.service');
const { globalRateLimit } = require('./middlewares/rate.middleware');
const healthCheckService = require('./services/health-check.service');

const app = express();

// Security headers
app.use(helmet());

// CORS: allow only configured frontend origins (comma-separated)
const allowedOrigins = (String(config.FRONTEND_URL || '')).split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server or same-origin
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS not allowed'), false);
  },
  optionsSuccessStatus: 200
}));

// Response compression
app.use(compression());

// Structured request logging (adds req.id)
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || require('crypto').randomUUID();
  res.setHeader('X-Request-Id', req.headers['x-request-id']);
  next();
});
app.use(httpLogger);

// Body parsers with safe limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// global rate limiting
app.use(globalRateLimit);

// API versioning: mount all routes under /api/v1
const API_ROOT = '/api/v1';
app.use(`${API_ROOT}/auth`, require('./routes/auth.routes'));
app.use(`${API_ROOT}/users`, require('./routes/users.routes'));
app.use(`${API_ROOT}/restaurants`, require('./routes/restaurants.routes'));
app.use(`${API_ROOT}/reviews`, require('./routes/reviews.routes'));
// comments.routes defines paths like '/:id/comments' and will resolve under /api/v1/reviews/:id/comments
app.use(`${API_ROOT}/reviews`, require('./routes/comments.routes'));
app.use(`${API_ROOT}/search`, require('./routes/search.routes'));
app.use(`${API_ROOT}/geo`, require('./routes/geo.routes'));
app.use(`${API_ROOT}/tags`, require('./routes/tags.routes'));
app.use(`${API_ROOT}/admin`, require('./routes/admin.routes'));

// Health endpoints (not versioned)
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheckService.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/ready', async (req, res) => {
  try {
    const readiness = await healthCheckService.checkReadiness();
    const statusCode = readiness.ready ? 200 : 503;
    res.status(statusCode).json(readiness);
  } catch (err) {
    res.status(503).json({ ready: false, error: err.message });
  }
});

app.get('/alive', async (req, res) => {
  try {
    const liveness = await healthCheckService.checkLiveness();
    res.json(liveness);
  } catch (err) {
    res.status(500).json({ alive: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('API running');
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
