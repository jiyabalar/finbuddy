const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('./errors');

const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'Please log in to continue.'));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (e) {
    return next(new AppError(401, 'Your session has expired. Please log in again.'));
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return next(new AppError(403, 'Admins only.'));
  return next();
}

module.exports = { signToken, requireAuth, requireAdmin };
