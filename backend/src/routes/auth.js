const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../db');
const config = require('../config');
const { AppError, asyncHandler } = require('../middleware/errors');
const { signToken, requireAuth } = require('../middleware/auth');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  college: z.string().trim().optional().default(''),
  monthlyIncome: z.coerce.number().min(0).optional().default(0),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
const profileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  college: z.string().trim().optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  avatar: z.string().max(10).nullable().optional(),
  preferences: z.object({ darkMode: z.boolean().optional(), notifications: z.boolean().optional(), budgetAlerts: z.boolean().optional() }).optional(),
});

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, college: u.college, monthlyIncome: u.monthlyIncome,
  currency: u.currency, avatar: u.avatar, role: u.role, preferences: u.preferences || {}, createdAt: u.createdAt,
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) throw new AppError(409, 'An account with this email already exists.');
  const passwordHash = await bcrypt.hash(data.password, 10);
  const role = config.adminEmails.includes(data.email) ? 'admin' : 'user';
  const user = await prisma.user.create({ data: { name: data.name, email: data.email, passwordHash, college: data.college, monthlyIncome: data.monthlyIncome, role } });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // same message for unknown email / wrong password so accounts can't be enumerated
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Invalid email or password.');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError(401, 'Please log in again.');
  res.json({ user: publicUser(user) });
}));

router.put('/me', requireAuth, asyncHandler(async (req, res) => {
  const data = profileSchema.parse(req.body);
  if (data.preferences) {
    const cur = await prisma.user.findUnique({ where: { id: req.user.id }, select: { preferences: true } });
    data.preferences = { ...(cur?.preferences || {}), ...data.preferences };
  }
  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ user: publicUser(user) });
}));

module.exports = router;
