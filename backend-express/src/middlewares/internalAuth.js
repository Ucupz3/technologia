export function internalAuth(req, res, next) {
  // Pengecualian rute publik: dokumentasi Swagger UI dan spesifikasi OpenAPI
  if (
    req.path.startsWith('/docs') ||
    req.path === '/openapi.json' ||
    req.originalUrl.startsWith('/api/docs') ||
    req.originalUrl.startsWith('/api/openapi.json')
  ) {
    return next();
  }

  const token = req.header('X-Internal-Token');
  const expectedToken = process.env.INTERNAL_TOKEN || 'tekna-internal-secret-2026';

  if (!token || token !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized service: Header X-Internal-Token wajib diisi dan sesuai dengan konfigurasi INTERNAL_TOKEN.',
    });
  }

  next();
}
