const prisma = require('../db');
const f = require('./finance');
const { monthTransactions, budgetWithRows } = require('./data');

async function createOnce(userId, { title, message, type }, since) {
  const exists = await prisma.notification.findFirst({ where: { userId, title, createdAt: { gte: since } } });
  if (exists) return null;
  return prisma.notification.create({ data: { userId, title, message, type } });
}

async function prefsOf(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  return { notifications: true, budgetAlerts: true, ...(u?.preferences || {}) };
}

/** Called after expenses / budgets change. Creates 80% / 100% / under-budget alerts once per month. */
async function checkBudgetAlerts(userId, now = new Date()) {
  const prefs = await prefsOf(userId);
  if (!prefs.notifications || !prefs.budgetAlerts) return [];
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const since = f.monthStart(y, m);
  const txs = await monthTransactions(userId, y, m);
  const { rows, budget } = await budgetWithRows(userId, y, m, txs);
  if (!budget) return [];
  const created = [];
  for (const r of rows) {
    if (r.percent >= 100) {
      created.push(await createOnce(userId, {
        title: `${r.category} budget exceeded`, type: 'budget_exceeded',
        message: `You've exceeded your ${r.category} budget (${f.inr(r.spent)} of ${f.inr(r.allocated)}).`,
      }, since));
    } else if (r.percent >= 80) {
      created.push(await createOnce(userId, {
        title: `${r.category} budget at 80%`, type: 'budget_warning',
        message: `You've used ${Math.round(r.percent)}% of your ${r.category} budget.`,
      }, since));
    }
  }
  const anyHigh = rows.some((r) => r.percent >= 80);
  if (!anyHigh && rows.length && txs.some((t) => t.type === 'expense')) {
    created.push(await createOnce(userId, {
      title: 'Under budget this month', type: 'insight',
      message: "You're doing great! You're under budget this month.",
    }, since));
  }
  return created.filter(Boolean);
}

async function goalProgress(userId, goal, previousAmount) {
  if (goal.targetAmount <= 0) return;
  const was = Math.floor((previousAmount / goal.targetAmount) * 4);
  const now = Math.floor((goal.currentAmount / goal.targetAmount) * 4);
  if (goal.currentAmount >= goal.targetAmount && previousAmount < goal.targetAmount) {
    await prisma.notification.create({ data: { userId, type: 'goal_completed', title: 'Goal completed! 🎯', message: `You did it! "${goal.name}" is fully funded.` } });
  } else if (now > was) {
    await prisma.notification.create({ data: { userId, type: 'goal_progress', title: `${goal.name}: ${Math.min(now * 25, 100)}% there`, message: `Nice! You've saved ${f.inr(goal.currentAmount)} of ${f.inr(goal.targetAmount)}.` } });
  }
}

module.exports = { checkBudgetAlerts, goalProgress };
