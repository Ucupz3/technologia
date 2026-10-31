import { prisma } from './prisma.js';

/**
 * Create custom audit log with detailed message
 */
export async function createAuditLog({ userId, action, entityType, entityId, module, details, data, req }) {
  try {
    const rawUserId = userId || req?.headers?.['x-user-id'] || req?.header?.('x-user-id') || null;
    await prisma.audit_logs.create({
      data: {
        user_id: rawUserId ? BigInt(rawUserId) : null,
        action,
        entity_type: entityType,
        entity_id: entityId ? BigInt(entityId) : null,
        after_data: JSON.stringify({ module, details, ...data }),
        ip_address: req?.ip || req?.connection?.remoteAddress || null,
        user_agent: req?.headers?.['user-agent']?.substring(0, 255) || null,
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

/**
 * Format date untuk audit log Indonesia
 */
export function formatDateIndo(date) {
  return new Date(date).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}
