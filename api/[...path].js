const app = require('../server');

module.exports = (req, res) => {
  // Normalize req.url so Express routes matching /api/* function properly
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
