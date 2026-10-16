const router = require('express').Router();
const { z } = require('zod');
const { asyncHandler } = require('../middleware/errors');
const { buildSnapshot } = require('../services/data');
const ai = require('../services/ai');

const schema = z.object({
  message: z.string().trim().min(1, 'Type a question first').max(500),
  history: z.array(z.object({ role: z.string(), text: z.string() })).max(20).optional().default([]),
});

router.post('/', asyncHandler(async (req, res) => {
  const { message, history } = schema.parse(req.body);
  const snap = await buildSnapshot(req.user.id);
  const { reply, source } = await ai.answer(message, snap, history);
  res.json({ reply, source, mood: snap.finny.mood, disclaimer: ai.DISCLAIMER });
}));

module.exports = router;
