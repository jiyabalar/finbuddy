require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret_change_me',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean),
  aiApiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'claude-sonnet-4-5',
  githubRepo: process.env.GITHUB_REPO || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  isTest: process.env.NODE_ENV === 'test',
};
