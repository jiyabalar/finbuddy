const router = require('express').Router();
const prisma = require('../db');
const { AppError, asyncHandler } = require('../middleware/errors');

router.get('/', asyncHandler(async (req, res) => {
  const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ items, unread: items.filter((n) => !n.isRead).length });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ ok: true });
}));

router.put('/:id/read', asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({ where: { id: Number(req.params.id), userId: req.user.id }, data: { isRead: true } });
  if (!count) throw new AppError(404, 'Notification not found.');
  res.json({ ok: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  if (!count) throw new AppError(404, 'Notification not found.');
  res.json({ ok: true });
}));

module.exports = router;
