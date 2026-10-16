const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const f = require('../services/finance');
const { AppError, asyncHandler } = require('../middleware/errors');
const { checkBudgetAlerts } = require('../services/notify');

const INCOME_SOURCES = ['Salary', 'Allowance', 'Scholarship', 'Freelancing', 'Part-time Job', 'Gift', 'Other'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

const base = {
  amount: z.coerce.number({ invalid_type_error: 'Enter an amount' }).positive('Amount must be greater than 0').max(100000000),
  description: z.string().trim().max(200).optional().default(''),
  date: z.coerce.date({ invalid_type_error: 'Pick a date' }),
};
const expenseSchema = z.object({
  ...base,
  type: z.literal('expense').optional().default('expense'),
  category: z.enum(f.EXPENSE_CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Cash'),
});
const incomeSchema = z.object({
  ...base,
  type: z.literal('income').optional().default('income'),
  category: z.enum(INCOME_SOURCES, { errorMap: () => ({ message: 'Choose a source' }) }),
  paymentMethod: z.string().optional().nullable(),
});
const pick = (type, body) => ((type || body.type) === 'income' ? incomeSchema : expenseSchema).parse(body);

/** Builds a CRUD router. fixedType = 'expense' | 'income' | null (null = any, taken from body.type). */
function makeRouter(fixedType) {
  const router = express.Router();

  router.get('/', asyncHandler(async (req, res) => {
    const { type, category, from, to, q, sort = 'date_desc' } = req.query;
    const where = { userId: req.user.id };
    const t = fixedType || (type && type !== 'all' ? type : null);
    if (t) where.type = t;
    if (category) where.category = String(category);
    if (from || to) where.transactionDate = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(`${to}T23:59:59`) }) };
    if (q) where.description = { contains: String(q), mode: 'insensitive' };
    const orderBy = {
      date_desc: { transactionDate: 'desc' }, date_asc: { transactionDate: 'asc' },
      amount_desc: { amount: 'desc' }, amount_asc: { amount: 'asc' },
    }[sort] || { transactionDate: 'desc' };
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const items = await prisma.transaction.findMany({ where, orderBy, take: limit });
    res.json({ items });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const d = pick(fixedType, req.body);
    const item = await prisma.transaction.create({
      data: { userId: req.user.id, type: d.type, amount: d.amount, category: d.category, description: d.description, paymentMethod: d.paymentMethod || null, transactionDate: d.date },
    });
    if (d.type === 'expense') await checkBudgetAlerts(req.user.id).catch((e) => console.warn('alerts failed', e.message));
    res.status(201).json({ item });
  }));

  router.put('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    // authorization: the row must belong to the logged-in user (and match the route type)
    const existing = await prisma.transaction.findFirst({ where: { id, userId: req.user.id, ...(fixedType && { type: fixedType }) } });
    if (!existing) throw new AppError(404, 'Transaction not found.');
    const d = pick(existing.type, { ...req.body, type: existing.type });
    const item = await prisma.transaction.update({
      where: { id },
      data: { amount: d.amount, category: d.category, description: d.description, paymentMethod: d.paymentMethod || null, transactionDate: d.date },
    });
    if (d.type === 'expense') await checkBudgetAlerts(req.user.id).catch(() => {});
    res.json({ item });
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { count } = await prisma.transaction.deleteMany({ where: { id, userId: req.user.id, ...(fixedType && { type: fixedType }) } });
    if (!count) throw new AppError(404, 'Transaction not found.');
    res.json({ ok: true });
  }));

  return router;
}

module.exports = { makeRouter, INCOME_SOURCES, PAYMENT_METHODS };
