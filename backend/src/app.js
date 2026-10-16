const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middleware/errors');
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { makeRouter } = require('./routes/transactions');

const app = express();
app.use(helmet());
app.use(cors({ origin: config.frontendUrl.split(','), credentials: true }));
app.use(express.json({ limit: '100kb' }));

if (!config.isTest) {
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { error: 'Too many attempts. Try again in a few minutes.' } }));
  app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, message: { error: 'Too many sign-ups from this device. Try later.' } }));
  app.use('/api/chat', rateLimit({ windowMs: 60 * 1000, limit: 20, message: { error: 'Finny needs a breather. Try again in a minute.' } }));
}

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', requireAuth, makeRouter(null));
app.use('/api/income', requireAuth, makeRouter('income'));
app.use('/api/budgets', requireAuth, require('./routes/budgets'));
app.use('/api/goals', requireAuth, require('./routes/goals'));
app.use('/api/analytics', requireAuth, require('./routes/analytics'));
app.use('/api/notifications', requireAuth, require('./routes/notifications'));
app.use('/api/chat', requireAuth, require('./routes/chat'));
app.use('/api/devops', requireAuth, requireAdmin, require('./routes/devops'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

module.exports = app;
