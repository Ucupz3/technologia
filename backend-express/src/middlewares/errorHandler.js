export function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan server'
      : err.message || 'Internal error';

  res.status(status).json({
    success: false,
    message,
  });
}
