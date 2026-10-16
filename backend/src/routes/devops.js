const router = require('express').Router();
const prisma = require('../db');
const config = require('../config');
const { asyncHandler } = require('../middleware/errors');

/** MOCK pipeline data, shown when GITHUB_REPO / GITHUB_TOKEN are not configured. */
const MOCK = {
  mock: true, build: 42, status: 'success', tests: { passed: 46, total: 46 }, docker: 'success',
  deployment: 'success', commit: 'a82f91', message: 'Improve budget calculations', live: true,
  deployedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
};

/** Real GitHub Actions status (public REST API). Needs GITHUB_REPO=owner/repo and optionally GITHUB_TOKEN. */
async function fetchGithub() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'finbuddy' };
  if (config.githubToken) headers.Authorization = `Bearer ${config.githubToken}`;
  const res = await fetch(`https://api.github.com/repos/${config.githubRepo}/actions/runs?per_page=5`, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const { workflow_runs: runs } = await res.json();
  const run = runs[0];
  if (!run) return null;
  const ok = run.conclusion === 'success';
  return {
    mock: false, build: run.run_number, status: run.conclusion || run.status,
    tests: { passed: ok ? null : 0, total: null }, docker: ok ? 'success' : run.conclusion || 'running',
    deployment: ok ? 'success' : 'pending', commit: run.head_sha.slice(0, 6), message: run.head_commit?.message?.split('\n')[0] || run.display_title,
    live: ok, deployedAt: run.updated_at, workflow: run.name, url: run.html_url,
  };
}

router.get('/status', asyncHandler(async (req, res) => {
  let database = 'online';
  try { await prisma.$queryRaw`SELECT 1`; } catch (e) { database = 'offline'; }
  let pipeline = MOCK;
  if (config.githubRepo) {
    try { pipeline = (await fetchGithub()) || MOCK; } catch (e) { pipeline = { ...MOCK, note: `GitHub lookup failed (${e.message}); showing mock data.` }; }
  }
  const [users, transactions] = await Promise.all([prisma.user.count(), prisma.transaction.count()]);
  res.json({
    services: { frontend: 'online', backend: 'online', database },
    system: { node: process.version, uptimeSeconds: Math.round(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1048576), env: process.env.NODE_ENV || 'development', aiMode: config.aiApiKey ? 'AI API' : 'Rule-based fallback' },
    stats: { users, transactions },
    pipeline,
  });
}));

module.exports = router;
