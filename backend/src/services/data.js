/** Database-backed aggregation. Combines Prisma queries with the pure finance helpers. */
const prisma = require('../db');
const f = require('./finance');

async function monthTransactions(userId, year, month) {
  return prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: f.monthStart(year, month), lt: f.monthEnd(year, month) } },
    orderBy: { transactionDate: 'desc' },
  });
}

async function rangeTransactions(userId, start, end) {
  return prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: start, lt: end } },
    orderBy: { transactionDate: 'desc' },
  });
}

async function budgetWithRows(userId, year, month, txs) {
  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: { categories: { orderBy: { id: 'asc' } } },
  });
  if (!budget) return { budget: null, rows: [], totals: null };
  const rows = f.budgetRows(budget.categories, txs.filter((t) => t.type === 'expense'));
  const spent = f.sum(rows, (r) => r.spent);
  const allocated = f.sum(rows, (r) => r.allocated);
  return {
    budget: { id: budget.id, month, year, totalBudget: budget.totalBudget },
    rows,
    totals: {
      allocated,
      spent,
      remaining: f.round(budget.totalBudget - spent),
      percent: f.utilization(spent, budget.totalBudget),
    },
  };
}

/** Everything the dashboard, insights, notifications and chatbot need, in one place. */
async function buildSnapshot(userId, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };

  const [txs, lastTxs, user, goalsRaw] = await Promise.all([
    monthTransactions(userId, y, m),
    monthTransactions(userId, prev.y, prev.m),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);
  const { budget, rows, totals } = await budgetWithRows(userId, y, m, txs);

  const summary = f.overview(txs);
  const byCategory = f.spendingByCategory(txs);
  const lastByCategory = f.spendingByCategory(lastTxs);
  const monthlySaving = Math.max(0, summary.savings);
  const dayOfMonth = now.getDate();
  const prediction = f.predictMonthEnd(summary.expenses, dayOfMonth, f.daysInMonth(y, m));
  const health = f.healthScore({ ...summary, rows });
  const goals = goalsRaw.map((g) => ({ ...g, projection: f.goalProjection(g, monthlySaving, now) }));
  const insights = f.generateInsights({
    thisMonth: byCategory, lastMonth: lastByCategory, rows, goals: goalsRaw, monthlySaving, prediction,
    totalBudgetRemaining: totals ? totals.remaining : null,
  });
  const finny = f.finnyMood({ rows, savingsRate: summary.savingsRate, income: summary.income, expenses: summary.expenses, hasData: txs.length > 0 });
  if (goals.some((g) => g.projection.completed && g.targetAmount > 0)) {
    finny.mood = 'celebrating';
    finny.message = `You did it! 🎯 "${goals.find((g) => g.projection.completed).name}" is fully funded.`;
  }

  // Savings-goal / budget recommendations (simple & explainable)
  const recommendation = f.recommendBudget(
    Object.fromEntries(byCategory.map((c) => [c.category, c.total])), user?.monthlyIncome || 0
  ).slice(0, 3);

  return {
    user, now, year: y, month: m, transactions: txs, summary, byCategory, lastByCategory,
    budget, rows, totals, health, goals, insights, finny, prediction, recommendation,
  };
}

module.exports = { monthTransactions, rangeTransactions, budgetWithRows, buildSnapshot };
