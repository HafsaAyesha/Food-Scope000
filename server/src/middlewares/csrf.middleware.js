const csrf = require('csurf');

const createCsrfMiddleware = () => {
  return csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  });
};

module.exports = createCsrfMiddleware;
