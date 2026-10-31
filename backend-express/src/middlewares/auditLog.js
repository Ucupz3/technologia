import { prisma } from '../lib/prisma.js';

/**
 * Middleware untuk log aktivitas ke audit_logs
 * Capture POST/PUT/PATCH/DELETE requests
 */
export async function auditLog(req, res, next) {
  // Skip untuk route tertentu
  const skipRoutes = ['/api/v1/auth/login', '/api/v1/auth/verify-otp', '/api/v1/audit-logs'];
  if (skipRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Hanya log untuk mutating operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Simpan original res.json
  const originalJson = res.json.bind(res);

  // Override res.json untuk capture response
  res.json = function (data) {
    // Log audit setelah request berhasil
    if (data && data.success) {
      // Background logging (jangan block response)
      setImmediate(async () => {
        try {
          console.log('🔍 Audit Headers:', {
            'x-user-id': req.headers['x-user-id'],
            'x-user-role': req.headers['x-user-role'],
            path: req.path,
            method: req.method
          });
          const userId = req.headers['x-user-id'] ? BigInt(req.headers['x-user-id']) : null;
          const action = getActionFromMethod(req.method);
          const { entityType, entityId } = extractEntity(req.path, data);
          
          await prisma.audit_logs.create({
            data: {
              user_id: userId,
              action,
              entity_type: entityType,
              entity_id: entityId,
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.headers['user-agent']?.substring(0, 255),
              after_data: JSON.stringify(data.data || data || {}),
            },
          });
        } catch (err) {
          console.error('Audit log error:', err);
        }
      });
    }

    // Kirim response asli
    return originalJson(data);
  };

  next();
}

function getActionFromMethod(method) {
  const map = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return map[method] || 'ACTION';
}

function extractEntity(path, data) {
  // Extract entity type from path: /api/v1/customers -> Customer
  const match = path.match(/\/api\/v1\/([^\/]+)/);
  if (!match) return { entityType: null, entityId: null };

  let entityType = match[1]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  // Singular form
  if (entityType.endsWith('ies')) {
    entityType = entityType.slice(0, -3) + 'y';
  } else if (entityType.endsWith('s')) {
    entityType = entityType.slice(0, -1);
  }

  // Extract ID dari response data atau path
  let entityId = null;
  if (data?.data?.id) {
    entityId = BigInt(data.data.id);
  } else {
    const idMatch = path.match(/\/(\d+)(?:\/|$)/);
    if (idMatch) {
      entityId = BigInt(idMatch[1]);
    }
  }

  return { entityType, entityId };
}
