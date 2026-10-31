import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const auditLogsRouter = Router();

// GET /api/v1/audit-logs
auditLogsRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const action = req.query.action || '';
    const entity_type = req.query.entity_type || '';
    const user_id = req.query.user_id || '';
    const date_from = req.query.date_from || '';
    const date_to = req.query.date_to || '';

    // Build where clause
    const where = {};

    if (action) {
      where.action = action;
    }

    if (entity_type) {
      where.entity_type = entity_type;
    }

    if (user_id) {
      where.user_id = BigInt(user_id);
    }

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        where.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    // Search di user name (join), action, entity_type
    let userIdsFromSearch = [];
    if (search) {
      const users = await prisma.users.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
          deleted_at: null,
        },
        select: { id: true },
      });
      userIdsFromSearch = users.map((u) => u.id);
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entity_type: { contains: search } },
        { ip_address: { contains: search } },
      ];
      if (userIdsFromSearch.length > 0) {
        where.OR.push({ user_id: { in: userIdsFromSearch } });
      }
    }

    // Total count
    const total = await prisma.audit_logs.count({ where });

    // Fetch logs
    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        ip_address: true,
        created_at: true,
        user_id: true,
        after_data: true,
      },
    });

    // Join user names & emails & roles
    const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
    const userList = userIds.length
      ? await prisma.users.findMany({
          where: { id: { in: userIds } },
          select: { 
            id: true, 
            name: true, 
            email: true,
            roles: {
              select: { name: true }
            }
          },
        })
      : [];
    const userMap = Object.fromEntries(userList.map((u) => [String(u.id), { 
      name: u.name, 
      email: u.email,
      role: u.roles?.name || null
    }]));

    const result = logs.map((l) => {
      let details = null;
      try {
        const parsed = JSON.parse(l.after_data || '{}');
        details = parsed.details || null;
      } catch (e) {
        // ignore
      }
      
      return {
        id: l.id,
        action: l.action,
        created_at: l.created_at,
        user_name: userMap[String(l.user_id)]?.name || 'System',
        user_email: userMap[String(l.user_id)]?.email || null,
        user_role: userMap[String(l.user_id)]?.role || null,
        entity_type: l.entity_type,
        entity_id: l.entity_id,
        ip_address: l.ip_address,
        details,
        after_data: l.after_data,
      };
    });

    res.json({
      success: true,
      data: {
        logs: result,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});
