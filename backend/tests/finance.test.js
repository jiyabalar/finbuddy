const f = require('../src/services/finance');
const { ruleBased, buildContext } = require('../src/services/ai');

const tx = (type, amount, category) => ({ type, amount, category });

describe('overview / savings calculations', () => {
  const txs = [tx('income', 12000, 'Allowance'), tx('income', 3000, 'Salary'), tx('expense', 2850, 'Food'), tx('expense', 1900, 'Entertainment'), tx('expense', 1200, 'Transport')];
  test('income, expenses, remaining, savings', () => {
    const o = f.overview(txs);
    expect(o.income).toBe(15000);
    expect(o.expenses).toBe(5950);
    expect(o.remaining).toBe(9050);
    expect(o.savings).toBe(9050);
  });
  test('savings rate = savings / income x 100', () => {
    expect(f.overview(txs).savingsRate).toBeCloseTo(60.33, 1);
    expect(f.overview([]).savingsRate).toBe(0);
  });
  test('spending by category is sorted high to low', () => {
    const s = f.spendingByCategory(txs);
    expect(s[0]).toEqual({ category: 'Food', total: 2850 });
    expect(s.map((x) => x.category)).toEqual(['Food', 'Entertainment', 'Transport']);
  });
});

describe('budget calculations', () => {
  test('utilization and status thresholds', () => {
    expect(f.utilization(2400, 3000)).toBe(80);
    expect(f.budgetStatus(50)).toBe('ok');
    expect(f.budgetStatus(80)).toBe('warning');
    expect(f.budgetStatus(95)).toBe('warning');
    expect(f.budgetStatus(100)).toBe('danger');
    expect(f.utilization(10, 0)).toBe(0);
  });
  test('budgetRows computes spent / remaining / percent', () => {
    const rows = f.budgetRows([{ id: 1, category: 'Food', allocatedAmount: 3000 }, { id: 2, category: 'Transport', allocatedAmount: 1500 }], [tx('expense', 2400, 'Food'), tx('expense', 750, 'Transport')]);
    expect(rows[0]).toMatchObject({ spent: 2400, remaining: 600, percent: 80, status: 'warning' });
    expect(rows[1]).toMatchObject({ spent: 750, remaining: 750, percent: 50, status: 'ok' });
  });
});

describe('health score', () => {
  test('is bounded 0-100 and rewards good habits', () => {
    const good = f.healthScore({ income: 15000, expenses: 6000, savingsRate: 60, rows: [{ percent: 40 }, { percent: 50 }] });
    const bad = f.healthScore({ income: 10000, expenses: 14000, savingsRate: -40, rows: [{ percent: 130 }, { percent: 120 }] });
    expect(good.score).toBeLessThanOrEqual(100);
    expect(good.score).toBeGreaterThan(85);
    expect(bad.score).toBeGreaterThanOrEqual(0);
    expect(bad.score).toBeLessThan(25);
    expect(good.factors).toHaveLength(4);
  });
});

describe('goals & predictions', () => {
  test('goal projection', () => {
    const p = f.goalProjection({ targetAmount: 8000, currentAmount: 5200 }, 1000);
    expect(p).toMatchObject({ remaining: 2800, percent: 65, completed: false, monthsLeft: 3 });
    expect(p.monthsIfExtra).toBe(2);
  });
  test('completed goal and zero saving rate', () => {
    expect(f.goalProjection({ targetAmount: 100, currentAmount: 100 }, 0).completed).toBe(true);
    expect(f.goalProjection({ targetAmount: 100, currentAmount: 10 }, 0).estimatedDate).toBeNull();
  });
  test('month-end prediction', () => {
    expect(f.predictMonthEnd(3000, 10, 30)).toBe(9000);
  });
});

describe('insights & mood', () => {
  test('insights compare with last month', () => {
    const ins = f.generateInsights({
      thisMonth: [{ category: 'Food', total: 1180 }], lastMonth: [{ category: 'Food', total: 1000 }],
      rows: [], goals: [], monthlySaving: 0, prediction: 0, totalBudgetRemaining: 1450,
    });
    expect(ins.map((i) => i.text)).toEqual(expect.arrayContaining(['You spent 18% more on food than last month.', 'You have ₹1,450 remaining in your monthly budget.']));
  });
  test('mood reacts to budget state', () => {
    expect(f.finnyMood({ rows: [{ status: 'ok' }], savingsRate: 40, income: 100, expenses: 60, hasData: true }).mood).toBe('happy');
    expect(f.finnyMood({ rows: [{ status: 'warning', category: 'Food' }], savingsRate: 40, income: 100, expenses: 60, hasData: true }).mood).toBe('worried');
    expect(f.finnyMood({ rows: [{ status: 'danger', category: 'A' }, { status: 'danger', category: 'B' }], savingsRate: 0, income: 100, expenses: 90, hasData: true }).mood).toBe('sad');
  });
});

describe('rule-based chatbot uses real data', () => {
  const now = new Date(2026, 9, 7);
  const snap = {
    now, year: 2026, month: 10, user: { name: 'Jiya Patel' },
    summary: { income: 15000, expenses: 7250, remaining: 7750, savings: 7750, savingsRate: 51.7 },
    byCategory: [{ category: 'Food', total: 2850 }, { category: 'Entertainment', total: 1900 }],
    budget: { totalBudget: 10000 }, prediction: 9800, goals: [],
    rows: [{ category: 'Food', allocated: 3000, spent: 2850, remaining: 150, percent: 95 }, { category: 'Shopping', allocated: 1000, spent: 0, remaining: 1000, percent: 0 }],
    transactions: [],
  };
  const ask = (q) => ruleBased(q, buildContext(snap), snap);
  test('spent this month', () => expect(ask('How much did I spend this month?')).toContain('₹7,250'));
  test('top category', () => expect(ask('Where did I spend the most?')).toContain('Food'));
  test('savings', () => expect(ask('How much have I saved?')).toContain('₹7,750'));
  test('afford within budget', () => expect(ask('Can I afford ₹200 shopping this week?')).toMatch(/^Yes/));
  test('afford over budget', () => expect(ask('Can I afford ₹5000 shopping this week?')).toMatch(/Not quite/));
  test('declines investment advice', () => expect(ask('Which stocks should I buy?')).toContain("can't give investment advice"));
});
