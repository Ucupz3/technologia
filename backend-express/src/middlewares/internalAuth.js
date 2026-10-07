export function internalAuth(req, res, next) {
  const token = req.header('X-Internal-Token');

  if (!token || token !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized service',
    });
  }

  next();
}
