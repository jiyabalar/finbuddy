/**
 * Chat abstraction. `answer(question, context)` receives the user's real financial snapshot and returns text.
 * - If AI_API_KEY is set, it calls the Anthropic Messages API (key stays on the server).
 * - Otherwise (or on any failure) it uses the rule-based fallback below.
 */
const config = require('../config');
const f = require('./finance');

const DISCLAIMER = 'FinBuddy provides educational budgeting assistance and is not a substitute for professional financial advice.';

function buildContext(snap) {
  return {
    name: snap.user?.name,
    month: `${f.MONTHS[snap.month - 1]} ${snap.year}`,
    summary: snap.summary,
    spendingByCategory: snap.byCategory,
    budget: snap.rows.map((r) => ({ category: r.category, allocated: r.allocated, spent: r.spent, remaining: r.remaining, percent: r.percent })),
    totalBudget: snap.budget?.totalBudget ?? null,
    predictedMonthSpend: snap.prediction,
    goals: snap.goals.map((g) => ({ name: g.name, target: g.targetAmount, saved: g.currentAmount, monthsLeft: g.projection.monthsLeft })),
    recentTransactions: snap.transactions.slice(0, 8).map((t) => ({ type: t.type, category: t.category, amount: t.amount, description: t.description })),
  };
}

const findCategory = (q) => f.EXPENSE_CATEGORIES.find((c) => q.includes(c.toLowerCase())) || (q.includes('saving') ? 'Savings' : null);
const findAmount = (q) => {
  const m = q.replace(/,/g, '').match(/(?:₹|rs\.?\s*|inr\s*)?(\d{2,7})/i);
  return m ? Number(m[1]) : null;
};

function ruleBased(question, ctx, snap) {
  const q = question.toLowerCase();
  const { summary } = ctx;
  const cat = findCategory(q);
  const catRow = cat ? ctx.budget.find((r) => r.category === cat) : null;
  const now = snap.now;
  const daysLeft = f.daysInMonth(snap.year, snap.month) - now.getDate() + 1;
  const weeksLeft = Math.max(1, daysLeft / 7);

  if (/^(hi|hello|hey)\b/.test(q)) return `Hi ${ctx.name?.split(' ')[0] || 'there'}! I'm Finny 👋 Ask me things like "How much did I spend this month?" or "Can I afford ₹1,000 shopping?"`;

  if (/afford|can i buy|can i spend \d/.test(q)) {
    const amt = findAmount(q);
    if (!amt) return 'Tell me the amount, for example "Can I afford ₹1,000 shopping this week?"';
    if (catRow) {
      const weekly = Math.max(0, catRow.remaining) / weeksLeft;
      if (amt > catRow.remaining) return `Not quite — you only have ${f.inr(Math.max(0, catRow.remaining))} left in your ${cat} budget, so ${f.inr(amt)} would put you over.`;
      if (amt <= weekly) return `Yes! You have ${f.inr(catRow.remaining)} left in ${cat} (about ${f.inr(weekly)} per week), so ${f.inr(amt)} fits comfortably.`;
      return `You can, but it's above your usual weekly pace (~${f.inr(weekly)}) and would use ${Math.round((amt / catRow.remaining) * 100)}% of the ${f.inr(catRow.remaining)} left in ${cat}. Careful!`;
    }
    const left = ctx.totalBudget !== null ? ctx.totalBudget - summary.expenses : summary.remaining;
    return amt <= left
      ? `Yes, ${f.inr(amt)} fits: you have ${f.inr(left)} available this month.`
      : `That would be tight: you only have ${f.inr(Math.max(0, left))} available this month.`;
  }

  if (/(how much|what).*(spend|spent)|total spent|expenses/.test(q) && !/most|highest/.test(q) && !cat) {
    return `You've spent ${f.inr(summary.expenses)} this month (${ctx.month}).`;
  }

  if (/most|highest|biggest|top/.test(q)) {
    const top = ctx.spendingByCategory[0];
    return top ? `${top.category} is your highest spending category at ${f.inr(top.total)} this month.` : 'You have no expenses yet this month.';
  }

  if (cat && /week|left|remain|budget|spend/.test(q)) {
    if (!catRow) {
      const spent = ctx.spendingByCategory.find((c) => c.category === cat)?.total || 0;
      return `You've spent ${f.inr(spent)} on ${cat} this month. Set a ${cat} budget on the Budget page and I can tell you what's left.`;
    }
    const weekly = Math.max(0, catRow.remaining) / weeksLeft;
    return `${cat}: ${f.inr(catRow.spent)} of ${f.inr(catRow.allocated)} used (${Math.round(catRow.percent)}%). ${catRow.remaining > 0 ? `You can spend about ${f.inr(weekly)} per week for the rest of the month.` : 'You are over budget in this category.'}`;
  }

  if (/save|saving|saved/.test(q) && !/goal/.test(q)) {
    return `This month you've earned ${f.inr(summary.income)} and spent ${f.inr(summary.expenses)}, so you've saved ${f.inr(summary.savings)} (${Math.round(summary.savingsRate)}% of income).`;
  }

  if (/goal|headphone|laptop|trip/.test(q)) {
    if (!ctx.goals.length) return 'You have no savings goals yet — create one on the Goals page!';
    return ctx.goals.map((g) => `• ${g.name}: ${f.inr(g.saved)} / ${f.inr(g.target)}${g.monthsLeft ? ` (~${g.monthsLeft} month${g.monthsLeft > 1 ? 's' : ''} left)` : ''}`).join('\n');
  }

  if (/budget|remaining|left/.test(q)) {
    if (ctx.totalBudget === null) return `You haven't set a budget for ${ctx.month}. Your income minus expenses leaves ${f.inr(summary.remaining)}.`;
    return `Your monthly budget is ${f.inr(ctx.totalBudget)}; you've spent ${f.inr(summary.expenses)}, leaving ${f.inr(ctx.totalBudget - summary.expenses)}.`;
  }

  if (/predict|forecast|end of (the )?month|will i spend/.test(q)) {
    return `At your current pace you'll spend roughly ${f.inr(ctx.predictedMonthSpend)} this month.`;
  }

  if (/income|earn/.test(q)) return `You've recorded ${f.inr(summary.income)} of income this month.`;

  if (/invest|stock|crypto|mutual fund/.test(q)) {
    return `I'm a student budgeting assistant, so I can't give investment advice. I can help you budget, track spending and build savings habits! ${DISCLAIMER}`;
  }

  return 'I can answer questions about your spending, budgets, savings and goals. Try: "Where did I spend the most?" or "How much can I spend on food this week?"';
}

async function callLLM(question, ctx, history = []) {
  const system = `You are Finny, a friendly student budgeting assistant inside the FinBuddy app. Answer ONLY using the JSON financial data provided. Currency is Indian rupees (₹). Keep answers under 80 words, warm and practical. Never give investment, tax or legal advice; if asked, politely decline and offer budgeting help. Do the arithmetic carefully.\n\nUSER FINANCIAL DATA:\n${JSON.stringify(ctx)}`;
  const messages = [...history.slice(-6).map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: String(m.text).slice(0, 1000) })), { role: 'user', content: question }];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': config.aiApiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: config.aiModel, max_tokens: 300, system, messages }),
  });
  if (!res.ok) throw new Error(`AI provider responded ${res.status}`);
  const data = await res.json();
  return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

async function answer(question, snap, history) {
  const ctx = buildContext(snap);
  if (config.aiApiKey) {
    try {
      const reply = await callLLM(question, ctx, history);
      if (reply) return { reply, source: 'ai' };
    } catch (e) {
      console.warn('[ai] falling back to rule-based:', e.message);
    }
  }
  return { reply: ruleBased(question, ctx, snap), source: 'rules' };
}

module.exports = { answer, ruleBased, buildContext, DISCLAIMER };
