class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Please check the form and try again.',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'P2002') return res.status(409).json({ error: 'That record already exists.' });
  console.error('[error]', err); // full details stay in server logs only
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { AppError, asyncHandler, errorHandler };
