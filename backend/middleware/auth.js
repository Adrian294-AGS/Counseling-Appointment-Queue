const jwt = require('jsonwebtoken');
const config = require('../config/app');
const logger = require('./logger');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: Missing or invalid authorization header', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('Authentication failed: Invalid token', {
      ip: req.ip,
      path: req.path,
      error: err.message,
    });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn('Authorization failed: Insufficient role', {
        userId: req.user?.id,
        requiredRoles: roles,
        userRole: req.user?.role,
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };