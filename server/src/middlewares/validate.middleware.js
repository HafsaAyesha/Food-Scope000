const { createApiError } = require('../utils/api-error');

const validate = (validatorFn) => async (req, res, next) => {
  try {
    // allow validatorFn to be sync or return a Promise
    await Promise.resolve(validatorFn(req));
    return next();
  } catch (err) {
    if (err && err.payload) {
      return res.status(err.status || 500).json(err.payload);
    }

    const fallback = createApiError(400, 'VALIDATION_ERROR', 'VALIDATION_ERROR', err && err.message ? err.message : 'Invalid request.');
    return res.status(fallback.status).json(fallback.payload);
  }
};

module.exports = {
  validate
};
