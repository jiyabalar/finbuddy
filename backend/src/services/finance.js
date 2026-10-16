/**
 * Pure financial calculations. No database access, so everything here is easy to unit test
 * and easy to change (e.g. swap the health-score algorithm).
 */
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Education', 'Entertainment', 'Shopping', 'Rent', 'Bills', 'Other'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const sum = (list, pick = (x) => x) => round(list.reduce((acc, x) => acc + Number(pick(x) || 0), 0));
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/* ---------- date helpers ---------- */
const monthStart = (year, month) => new Date(year, month - 1, 1);
const monthEnd = (year, month) => new Date(year, month, 1); // exclusive
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

function periodRange(period, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (period === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }
  if (period === 'lastMonth') {
    const ly = m === 1 ? y - 1 : y;
    const lm = m === 1 ? 12 : m - 1;
    return { start: monthStart(ly, lm), end: monthEnd(ly, lm) };
  }
  return { start: monthStart(y, m), end: monthEnd(y, m) };
}

/* ---------- aggregates ---------- */
function overview(transactions) {
  const income = sum(transactions.filter((t) => t.type === 'income'), (t) => t.amount);
  const expenses = sum(transactions.filter((t) => t.type === 'expense'), (t) => t.amount);
  const remaining = round(income - expenses);
  const savings = remaining; // per spec: Savings = Income - Expenses
  const savingsRate = income > 0 ? round((savings / income) * 100) : 0;
  return { income, expenses, remaining, savings, savingsRate };
}

function spendingByCategory(transactions) {
  const map = {};
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    map[t.category] = round((map[t.category] || 0) + t.amount);
  });
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/* ---------- budgets ---------- */
const utilization = (spent, allocated) => (allocated > 0 ? round((spent / allocated) * 100) : 0);
const budgetStatus = (pct) => (pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'ok');

function budgetRows(budgetCategories, expenseTransactions) {
  const spentMap = Object.fromEntries(spendingByCategory(expenseTransactions).map((s) => [s.category, s.total]));
  return budgetCategories.map((c) => {
    const spent = spentMap[c.category] || 0;
    const percent = utilization(spent, c.allocatedAmount);
    return {
      id: c.id,
      category: c.category,
      allocated: c.allocatedAmount,
      spent,
      remaining: round(c.allocatedAmount - spent),
      percent,
      status: budgetStatus(percent),
    };
  });
}

/* ---------- health score (modular: swap this function to change the algorithm) ---------- */
function healthScore({ income, expenses, savingsRate, rows = [] }) {
  const factors = [];
  // 1) spending vs income (40 pts): <=70% of income is full marks, 100%+ is zero
  const ratio = income > 0 ? expenses / income : expenses > 0 ? 1 : 0;
  const spendPts = ratio <= 0.7 ? 40 : clamp(40 * (1 - (ratio - 0.7) / 0.3), 0, 40);
  factors.push({ name: 'Spending vs income', points: round(spendPts), max: 40 });
  // 2) savings rate (25 pts): 20%+ is full marks
  const savePts = clamp((savingsRate / 20) * 25, 0, 25);
  factors.push({ name: 'Savings rate', points: round(savePts), max: 25 });
  // 3) budget adherence (25 pts): share of categories still within budget
  const within = rows.filter((r) => r.percent < 100).length;
  const adherePts = rows.length ? (within / rows.length) * 25 : 15;
  factors.push({ name: 'Budget adherence', points: round(adherePts), max: 25 });
  // 4) overspending categories (10 pts): -5 for each overspent category
  const over = rows.filter((r) => r.percent >= 100).length;
  factors.push({ name: 'Overspending categories', points: Math.max(0, 10 - over * 5), max: 10 });

  const score = Math.round(clamp(factors.reduce((a, f) => a + f.points, 0), 0, 100));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs attention' : 'At risk';
  const explanation =
    score >= 80 ? 'Your spending, savings and budgets are in great shape.'
    : score >= 60 ? 'Solid habits. A little more savings would push you higher.'
    : score >= 40 ? 'Some categories are running hot. Trim a few expenses to recover.'
    : 'Spending is outpacing income. Let’s rebuild your budget together.';
  return { score, label, explanation, factors };
}

/* ---------- predictions & projections ---------- */
function predictMonthEnd(spentSoFar, dayOfMonth, totalDays) {
  if (dayOfMonth <= 0) return 0;
  return round((spentSoFar / dayOfMonth) * totalDays);
}

function goalProjection(goal, monthlySaving, now = new Date()) {
  const remaining = Math.max(0, round(goal.targetAmount - goal.currentAmount));
  const percent = goal.targetAmount > 0 ? clamp(round((goal.currentAmount / goal.targetAmount) * 100), 0, 100) : 0;
  const completed = remaining === 0;
  let monthsLeft = null;
  let estimatedDate = null;
  if (!completed && monthlySaving > 0) {
    monthsLeft = Math.ceil(remaining / monthlySaving);
    estimatedDate = new Date(now.getFullYear(), now.getMonth() + monthsLeft, now.getDate());
  }
  // "Saving ₹500 more per month" what-if
  let monthsIfExtra = null;
  if (!completed && monthlySaving + 500 > 0) monthsIfExtra = Math.ceil(remaining / (monthlySaving + 500));
  return { remaining, percent, completed, monthsLeft, estimatedDate, monthsIfExtra };
}

/* ---------- budget recommendation ---------- */
function recommendBudget(avgSpendByCategory, monthlyIncome) {
  // Simple, explainable: average of past spending + 5% buffer, rounded up to nearest 100.
  return Object.entries(avgSpendByCategory).map(([category, avg]) => ({
    category,
    amount: Math.ceil((avg * 1.05) / 100) * 100,
  })).filter((r) => r.amount > 0 && r.amount <= (monthlyIncome || Infinity));
}

/* ---------- insights ---------- */
function pctChange(curr, prev) {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function generateInsights({ thisMonth, lastMonth, rows, goals, monthlySaving, prediction, totalBudgetRemaining }) {
  const out = [];
  const lastMap = Object.fromEntries(lastMonth.map((c) => [c.category, c.total]));
  thisMonth.slice(0, 4).forEach((c) => {
    const ch = pctChange(c.total, lastMap[c.category]);
    if (ch === null || Math.abs(ch) < 5) return;
    out.push({
      tone: ch > 0 ? 'warn' : 'good',
      text: ch > 0
        ? `You spent ${ch}% more on ${c.category.toLowerCase()} than last month.`
        : `Your ${c.category.toLowerCase()} spending decreased by ${Math.abs(ch)}%.`,
    });
  });
  if (totalBudgetRemaining !== null && totalBudgetRemaining !== undefined) {
    out.push(totalBudgetRemaining >= 0
      ? { tone: 'good', text: `You have ${inr(totalBudgetRemaining)} remaining in your monthly budget.` }
      : { tone: 'warn', text: `You are ${inr(Math.abs(totalBudgetRemaining))} over your monthly budget.` });
  }
  rows.filter((r) => r.status === 'warning').forEach((r) => out.push({ tone: 'warn', text: `${r.category} is at ${Math.round(r.percent)}% of its budget.` }));
  const active = goals.map((g) => ({ g, p: goalProjection(g, monthlySaving) })).find((x) => !x.p.completed && x.p.monthsLeft);
  if (active) {
    out.push({ tone: 'info', text: `At your current savings rate, you'll reach your ${active.g.name.toLowerCase()} goal in approximately ${active.p.monthsLeft} month${active.p.monthsLeft > 1 ? 's' : ''}.` });
    if (active.p.monthsIfExtra && active.p.monthsIfExtra < active.p.monthsLeft) {
      const diff = active.p.monthsLeft - active.p.monthsIfExtra;
      out.push({ tone: 'info', text: `Saving ₹500 more per month could help you reach your goal ${diff} month${diff > 1 ? 's' : ''} earlier.` });
    }
  }
  if (prediction > 0) out.push({ tone: 'info', text: `At your current spending rate, you'll spend approximately ${inr(prediction)} this month.` });
  return out;
}

function finnyMood({ rows, savingsRate, income, expenses, hasData }) {
  if (!hasData) return { mood: 'neutral', message: 'Hi! Add your first income and expense and I’ll start cheering you on.' };
  const over = rows.filter((r) => r.status === 'danger');
  const warn = rows.filter((r) => r.status === 'warning');
  if (over.length >= 2 || expenses > income) return { mood: 'sad', message: `Ouch — ${over[0] ? over[0].category + ' is over budget' : 'spending is above income'}. Let’s tighten up together.` };
  if (over.length === 1) return { mood: 'worried', message: `Uh-oh! Your ${over[0].category.toLowerCase()} budget is finished.` };
  if (warn.length) return { mood: 'worried', message: `Uh-oh! Your ${warn[0].category.toLowerCase()} budget is almost finished.` };
  if (savingsRate >= 20) return { mood: 'happy', message: `You're doing great! 🎉 You're saving ${Math.round(savingsRate)}% of your income.` };
  return { mood: 'neutral', message: 'Steady as she goes. Small savings add up fast!' };
}

module.exports = {
  EXPENSE_CATEGORIES, MONTHS, round, sum, inr, clamp,
  monthStart, monthEnd, daysInMonth, periodRange,
  overview, spendingByCategory, utilization, budgetStatus, budgetRows,
  healthScore, predictMonthEnd, goalProjection, recommendBudget, generateInsights, finnyMood, pctChange,
};
