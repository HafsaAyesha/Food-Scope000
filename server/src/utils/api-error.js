const createApiError = (status, code, type, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.payload = { success: false, error: { code, type, message, details } };
  return error;
};

const handleError = (res, err) => {
  if (err.payload) {
    return res.status(err.status || 500).json(err.payload);
  }
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      type: 'SERVER_ERROR',
      message: err.message || 'Something went wrong.',
      details: null
    }
  });
};

module.exports = { createApiError, handleError };
