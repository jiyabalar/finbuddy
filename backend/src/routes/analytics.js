const router = require('express').Router();
const prisma = require('../db');
const f = require('../services/finance');
const { asyncHandler } = require('../middleware/errors');
const { buildSnapshot, rangeTransactions } = require('../services/data');

const PERIODS = ['week', 'month', 'lastMonth'];
const periodOf = (req) => (PERIODS.includes(req.query.period) ? req.query.period : 'month');

router.get('/overview', asyncHandler(async (req, res) => {
  const snap = await buildSnapshot(req.user.id);
  const period = periodOf(req);
  const { start, end } = f.periodRange(period);
  const periodTxs = await rangeTransactions(req.user.id, start, end);
  const recent = await prisma.transaction.findMany({ where: { userId: req.user.id }, orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }], take: 6 });
  const unread = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
  res.json({
    user: { name: snap.user.name, currency: snap.user.currency },
    summary: snap.summary,
    health: snap.health,
    spending: { period, byCategory: f.spendingByCategory(periodTxs), total: f.sum(periodTxs.filter((t) => t.type === 'expense'), (t) => t.amount) },
    budget: { rows: snap.rows, totals: snap.totals, hasBudget: !!snap.budget },
    recent, insights: snap.insights, finny: snap.finny, prediction: snap.prediction,
    recommendation: snap.recommendation, goals: snap.goals.slice(0, 3), unread,
  });
}));

router.get('/spending', asyncHandler(async (req, res) => {
  const period = periodOf(req);
  const { start, end } = f.periodRange(period);
  const txs = await rangeTransactions(req.user.id, start, end);
  const byCategory = f.spendingByCategory(txs);
  res.json({ period, byCategory, top: byCategory.slice(0, 5), total: f.sum(byCategory, (c) => c.total) });
}));

router.get('/trends', asyncHandler(async (req, res) => {
  const months = Math.min(Number(req.query.months) || 6, 12);
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  const first = f.monthStart(buckets[0].year, buckets[0].month);
  const all = await rangeTransactions(req.user.id, first, f.monthEnd(now.getFullYear(), now.getMonth() + 1));
  const series = buckets.map(({ year, month }) => {
    const txs = all.filter((t) => t.transactionDate >= f.monthStart(year, month) && t.transactionDate < f.monthEnd(year, month));
    const o = f.overview(txs);
    return { label: f.MONTHS[month - 1], income: o.income, expenses: o.expenses, savings: o.savings };
  });
  const expenses = all.filter((t) => t.type === 'expense');
  const byDay = {};
  expenses.forEach((t) => { const k = t.transactionDate.toISOString().slice(0, 10); byDay[k] = f.round((byDay[k] || 0) + t.amount); });
  const days = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
  const thisMonth = f.overview(all.filter((t) => t.transactionDate >= f.monthStart(now.getFullYear(), now.getMonth() + 1)));
  const activeMonths = series.filter((s) => s.expenses > 0).length || 1;
  const monthTxs = all.filter((t) => t.type === 'expense' && t.transactionDate >= f.monthStart(now.getFullYear(), now.getMonth() + 1));
  res.json({
    series,
    categories: f.spendingByCategory(monthTxs),
    stats: {
      highestSpendingDay: days[0] ? { date: days[0][0], amount: days[0][1] } : null,
      averageDailySpending: f.round(f.sum(monthTxs, (t) => t.amount) / Math.max(1, now.getDate())),
      averageMonthlySpending: f.round(f.sum(series, (s) => s.expenses) / activeMonths),
      savingsPercentage: thisMonth.savingsRate,
    },
  });
}));

module.exports = router;
