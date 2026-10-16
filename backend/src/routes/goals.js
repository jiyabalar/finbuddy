const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../db');
const f = require('../services/finance');
const { AppError, asyncHandler } = require('../middleware/errors');
const { monthTransactions } = require('../services/data');
const { goalProgress } = require('../services/notify');

const schema = z.object({
  name: z.string().trim().min(2, 'Give your goal a name'),
  targetAmount: z.coerce.number().positive('Target must be greater than 0'),
  currentAmount: z.coerce.number().min(0).optional().default(0),
  targetDate: z.preprocess((v) => (v ? v : null), z.coerce.date().nullable()).optional(),
  category: z.string().trim().optional().nullable(),
});

async function monthlySaving(userId) {
  const now = new Date();
  const txs = await monthTransactions(userId, now.getFullYear(), now.getMonth() + 1);
  return Math.max(0, f.overview(txs).savings);
}
const withProjection = (g, saving) => ({ ...g, projection: f.goalProjection(g, saving) });

router.get('/', asyncHandler(async (req, res) => {
  const saving = await monthlySaving(req.user.id);
  const goals = await prisma.savingsGoal.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  res.json({ items: goals.map((g) => withProjection(g, saving)), monthlySaving: saving });
}));

router.post('/', asyncHandler(async (req, res) => {
  const d = schema.parse(req.body);
  const goal = await prisma.savingsGoal.create({ data: { ...d, userId: req.user.id } });
  res.status(201).json({ item: withProjection(goal, await monthlySaving(req.user.id)) });
}));

async function owned(req) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id: Number(req.params.id), userId: req.user.id } });
  if (!goal) throw new AppError(404, 'Goal not found.');
  return goal;
}

router.put('/:id', asyncHandler(async (req, res) => {
  await owned(req);
  const d = schema.parse(req.body);
  const goal = await prisma.savingsGoal.update({ where: { id: Number(req.params.id) }, data: d });
  res.json({ item: withProjection(goal, await monthlySaving(req.user.id)) });
}));

router.post('/:id/contribute', asyncHandler(async (req, res) => {
  const existing = await owned(req);
  const { amount } = z.object({ amount: z.coerce.number().positive('Enter an amount') }).parse(req.body);
  const goal = await prisma.savingsGoal.update({ where: { id: existing.id }, data: { currentAmount: f.round(existing.currentAmount + amount) } });
  await goalProgress(req.user.id, goal, existing.currentAmount);
  res.json({ item: withProjection(goal, await monthlySaving(req.user.id)) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await owned(req);
  await prisma.savingsGoal.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
}));

module.exports = router;
