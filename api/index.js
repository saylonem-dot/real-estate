const app = require('../server');

module.exports = (req, res) => {
  // Normalize req.url for Express
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    req.url = req.originalUrl;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
