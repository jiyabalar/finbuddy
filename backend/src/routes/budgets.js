const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const f = require('../services/finance');
const { AppError, asyncHandler } = require('../middleware/errors');
const { monthTransactions, budgetWithRows } = require('../services/data');
const { checkBudgetAlerts } = require('../services/notify');

const schema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  totalBudget: z.coerce.number().positive('Total budget must be greater than 0'),
  categories: z.array(z.object({
    category: z.string().trim().min(1),
    allocatedAmount: z.coerce.number().min(0),
  })).min(1, 'Add at least one category'),
});

router.get('/', asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const txs = await monthTransactions(req.user.id, year, month);
  const data = await budgetWithRows(req.user.id, year, month, txs);
  const summary = f.overview(txs);
  const byCategory = f.spendingByCategory(txs);
  const recommendation = f.recommendBudget(Object.fromEntries(byCategory.map((c) => [c.category, c.total])), summary.income || Infinity).slice(0, 4);
  const health = f.healthScore({ ...summary, rows: data.rows });
  res.json({ ...data, summary, recommendation, health });
}));

async function save(userId, d, existingId) {
  const allocated = f.sum(d.categories, (c) => c.allocatedAmount);
  if (allocated > d.totalBudget) throw new AppError(400, `Category amounts (₹${allocated}) exceed the total budget (₹${d.totalBudget}).`);
  return prisma.$transaction(async (tx) => {
    const budget = existingId
      ? await tx.budget.update({ where: { id: existingId }, data: { totalBudget: d.totalBudget, month: d.month, year: d.year } })
      : await tx.budget.upsert({
          where: { userId_month_year: { userId, month: d.month, year: d.year } },
          update: { totalBudget: d.totalBudget }, create: { userId, month: d.month, year: d.year, totalBudget: d.totalBudget },
        });
    await tx.budgetCategory.deleteMany({ where: { budgetId: budget.id } });
    await tx.budgetCategory.createMany({ data: d.categories.map((c) => ({ budgetId: budget.id, category: c.category, allocatedAmount: c.allocatedAmount })) });
    return budget;
  });
}

router.post('/', asyncHandler(async (req, res) => {
  const budget = await save(req.user.id, schema.parse(req.body));
  await checkBudgetAlerts(req.user.id).catch(() => {});
  res.status(201).json({ budget });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const own = await prisma.budget.findFirst({ where: { id, userId: req.user.id } });
  if (!own) throw new AppError(404, 'Budget not found.');
  const budget = await save(req.user.id, schema.parse(req.body), id);
  await checkBudgetAlerts(req.user.id).catch(() => {});
  res.json({ budget });
}));

module.exports = router;
