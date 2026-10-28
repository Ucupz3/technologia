import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const VALID_STATUS = ['active', 'inactive'];

/**
 * GET /api/v1/jobs
 */
router.get('/', async (req, res, next) => {
  try {
    const { search = '', status, page = 1, per_page = 100 } = req.query;
    const take = Math.min(parseInt(per_page, 10) || 100, 200);
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (currentPage - 1) * take;

    const where = {
      deleted_at: null,
      ...(status && VALID_STATUS.includes(status) ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.jobs.findMany({
        where,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        take,
        skip,
      }),
      prisma.jobs.count({ where }),
    ]);

    // Enrich dengan _count (user_jobs & order_assignments) — aman tanpa asumsi nama relasi Prisma
    const enriched = await Promise.all(
      items.map(async (item) => {
        const [userCount, assignmentCount] = await Promise.all([
          prisma.user_jobs.count({ where: { job_id: item.id } }),
          prisma.order_assignments.count({ where: { job_id: item.id } }),
        ]);
        return {
          ...item,
          _count: {
            user_jobs: userCount,
            order_assignments: assignmentCount,
          },
        };
      })
    );

    res.json({
      success: true,
      data: enriched,
      meta: { total, page: currentPage, per_page: take },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/jobs/:id — detail + relasi users & order_assignments
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const job = await prisma.jobs.findFirst({
      where: { id, deleted_at: null },
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });
    }

    // ==== Users yang punya job ini (via user_jobs) ====
    const userJobs = await prisma.user_jobs.findMany({
      where: { job_id: id },
      orderBy: { created_at: 'desc' },
    });
    const userIds = [...new Set(userJobs.map((uj) => uj.user_id).filter(Boolean))];
    const usersData = userIds.length
      ? await prisma.users.findMany({
          where: { id: { in: userIds }, deleted_at: null },
          select: { id: true, name: true, email: true, status: true },
        })
      : [];
    const userMap = Object.fromEntries(usersData.map((u) => [String(u.id), u]));

    const users = userJobs.map((uj) => ({
      id: uj.id,
      is_primary: !!uj.is_primary,
      created_at: uj.created_at,
      user: userMap[String(uj.user_id)] || null,
    }));

    // ==== Order assignments yang memakai job ini ====
    const assignments = await prisma.order_assignments.findMany({
      where: { job_id: id },
      orderBy: { assigned_at: 'desc' },
    });

    const orderIds = [...new Set(assignments.map((a) => a.order_id).filter(Boolean))];
    const teamMemberIds = [...new Set(assignments.map((a) => a.team_member_id).filter(Boolean))];

    const [ordersData, teamMembersData] = await Promise.all([
      orderIds.length
        ? prisma.orders.findMany({
            where: { id: { in: orderIds } },
            select: {
              id: true,
              order_number: true,
              customer_name_snapshot: true,
              status: true,
              start_date_project: true,
              end_date_project: true,
            },
          })
        : [],
      teamMemberIds.length
        ? prisma.team_members.findMany({
            where: { id: { in: teamMemberIds } },
            select: { id: true, team_id: true, user_id: true },
          })
        : [],
    ]);

    const orderMap = Object.fromEntries(ordersData.map((o) => [String(o.id), o]));

    const tmUserIds = [...new Set(teamMembersData.map((tm) => tm.user_id).filter(Boolean))];
    const tmUsersData = tmUserIds.length
      ? await prisma.users.findMany({
          where: { id: { in: tmUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const tmUserMap = Object.fromEntries(tmUsersData.map((u) => [String(u.id), u]));

    const tmMap = Object.fromEntries(
      teamMembersData.map((tm) => [
        String(tm.id),
        { ...tm, user: tmUserMap[String(tm.user_id)] || null },
      ])
    );

    const assignmentsWithMeta = assignments.map((a) => ({
      id: a.id,
      order_id: a.order_id,
      team_member_id: a.team_member_id,
      is_lead: !!a.is_lead,
      assigned_at: a.assigned_at,
      order: orderMap[String(a.order_id)] || null,
      team_member: tmMap[String(a.team_member_id)] || null,
    }));

    res.json({
      success: true,
      data: {
        ...job,
        users,
        assignments: assignmentsWithMeta,
        stats: {
          total_users: userJobs.length,
          primary_users: userJobs.filter((uj) => uj.is_primary).length,
          total_orders: orderIds.length,
          total_assignments: assignments.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/jobs
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, status = 'active' } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(422).json({ success: false, message: 'Nama job wajib diisi' });
    }
    if (!VALID_STATUS.includes(status)) {
      return res.status(422).json({ success: false, message: 'Status tidak valid' });
    }
    const exists = await prisma.jobs.findFirst({
      where: { name: String(name).trim(), deleted_at: null },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Nama job sudah ada' });
    }
    const created = await prisma.jobs.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        status,
      },
    });
    res.status(201).json({ success: true, data: created, message: 'Job berhasil dibuat' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/jobs/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { name, description, status } = req.body || {};
    const existing = await prisma.jobs.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });
    }
    if (status !== undefined && !VALID_STATUS.includes(status)) {
      return res.status(422).json({ success: false, message: 'Status tidak valid' });
    }
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(422).json({ success: false, message: 'Nama job wajib diisi' });
      }
      const dup = await prisma.jobs.findFirst({
        where: { name: trimmed, deleted_at: null, NOT: { id } },
      });
      if (dup) {
        return res.status(409).json({ success: false, message: 'Nama job sudah ada' });
      }
    }
    const updated = await prisma.jobs.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined
          ? { description: description ? String(description).trim() : null }
          : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    res.json({ success: true, data: updated, message: 'Job berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/jobs/:id (soft delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.jobs.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job tidak ditemukan' });
    }
    const used = await prisma.order_assignments.count({ where: { job_id: id } });
    if (used > 0) {
      return res.status(409).json({
        success: false,
        message: `Job masih dipakai pada ${used} assignment. Nonaktifkan saja daripada menghapus.`,
      });
    }
    await prisma.jobs.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Job berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

export { router as jobsRouter };