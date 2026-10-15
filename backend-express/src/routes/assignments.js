import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const assignmentsRouter = Router();
export const orderAssignmentsRouter = Router({ mergeParams: true });

// ============ SCHEMAS ============
const createAssignmentSchema = z.object({
  team_member_id: z.coerce.number().int().positive().optional().nullable(),
  user_id: z.coerce.number().int().positive().optional().nullable(),
  job_id: z.coerce.number().int().positive().optional().nullable(),
  role_in_order: z.string().max(100).optional().nullable(),
  is_lead: z.boolean().default(false),
  module_name: z.string().max(255).optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

function computeAssignmentStatus(progressList = []) {
  if (!progressList || progressList.length === 0) return 'pending';
  const active = progressList.filter((p) => !p.deleted_at);
  if (active.length === 0) return 'pending';

  const completed = active.filter((p) => p.status === 'completed');
  if (completed.length === active.length) return 'completed';

  const cancelled = active.filter((p) => p.status === 'cancelled');
  if (cancelled.length === active.length) return 'cancelled';

  if (completed.length + cancelled.length === active.length && completed.length > 0) {
    return 'completed';
  }

  const inProgress = active.some((p) => p.status === 'in_progress' || p.progress_percentage > 0);
  if (inProgress) return 'in_progress';

  return 'pending';
}

function formatAssignment(a) {
  const status = computeAssignmentStatus(a.progress_order || []);
  const user = a.team_members?.users || null;
  const job = a.jobs || null;
  const team = a.team_members?.teams || null;

  return {
    id: a.id,
    order_id: a.order_id,
    team_member_id: a.team_member_id,
    job_id: a.job_id,
    is_lead: Boolean(a.is_lead),
    assigned_at: a.assigned_at,
    status,
    role_in_order: job?.name || 'Staff',
    job_name: job?.name || null,
    user_id: user?.id || null,
    user_name: user?.name || 'Unknown',
    user_email: user?.email || null,
    user_phone: user?.phone || null,
    team_id: a.team_members?.team_id || null,
    team_name: team?.name || null,
    users: user,
    jobs: job,
    team_members: a.team_members,
    progress_order: a.progress_order || [],
  };
}

// ============ ORDER-SCOPED ASSIGNMENTS ============
// GET /api/v1/orders/:orderId/assignments
orderAssignmentsRouter.get('/', async (req, res, next) => {
  try {
    const orderId = BigInt(req.params.orderId);
    const order = await prisma.orders.findFirst({
      where: { id: orderId, deleted_at: null },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    const assignments = await prisma.order_assignments.findMany({
      where: { order_id: orderId },
      include: {
        team_members: {
          include: {
            users: { select: { id: true, name: true, email: true, phone: true } },
            teams: { select: { id: true, name: true } },
          },
        },
        jobs: { select: { id: true, name: true, description: true } },
        progress_order: {
          where: { deleted_at: null },
          select: { id: true, title: true, progress_percentage: true, status: true, created_at: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json({ success: true, data: assignments.map(formatAssignment) });
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:orderId/assignments
orderAssignmentsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const orderId = BigInt(req.params.orderId);
    const order = await prisma.orders.findFirst({
      where: { id: orderId, deleted_at: null },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    if (order.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Penugasan tim hanya dapat dibuat pada order yang sedang berjalan (in_progress)',
      });
    }

    let teamMemberId = parsed.data.team_member_id;

    // Resolve team_member_id if user_id was given
    if (!teamMemberId && parsed.data.user_id) {
      const tm = await prisma.team_members.findFirst({
        where: { user_id: BigInt(parsed.data.user_id), status: 'active' },
      });
      if (tm) {
        teamMemberId = Number(tm.id);
      } else {
        // Fallback: check if user exists
        const user = await prisma.users.findFirst({
          where: { id: BigInt(parsed.data.user_id), deleted_at: null },
        });
        if (!user) {
          return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        // Auto-assign to first team or order.team_id
        const teamId = order.team_id || (await prisma.teams.findFirst({ where: { status: 'active' } }))?.id || 1n;
        const newTm = await prisma.team_members.create({
          data: {
            team_id: BigInt(teamId),
            user_id: user.id,
            status: 'active',
          },
        });
        teamMemberId = Number(newTm.id);
      }
    }

    if (!teamMemberId) {
      return res.status(422).json({
        success: false,
        message: 'team_member_id atau user_id wajib diisi',
      });
    }

    const teamMember = await prisma.team_members.findFirst({
      where: { id: BigInt(teamMemberId) },
      include: { users: true },
    });
    if (!teamMember) {
      return res.status(404).json({ success: false, message: 'Anggota tim (team member) tidak ditemukan' });
    }

    // Resolve job_id
    let jobId = parsed.data.job_id;
    if (!jobId && parsed.data.role_in_order) {
      const job = await prisma.jobs.findFirst({
        where: { name: { contains: parsed.data.role_in_order }, status: 'active' },
      });
      if (job) jobId = Number(job.id);
    }
    if (!jobId) {
      // Find from user's primary job or first job
      const userJob = await prisma.user_jobs.findFirst({
        where: { user_id: teamMember.user_id },
        orderBy: { is_primary: 'desc' },
      });
      if (userJob) {
        jobId = Number(userJob.job_id);
      } else {
        const firstJob = await prisma.jobs.findFirst({ where: { status: 'active' } });
        jobId = firstJob ? Number(firstJob.id) : 1;
      }
    }

    // Check duplicate assignment on this order
    const existing = await prisma.order_assignments.findUnique({
      where: {
        order_id_team_member_id: {
          order_id: orderId,
          team_member_id: BigInt(teamMemberId),
        },
      },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Anggota tim ini sudah ditugaskan pada order ini' });
    }

    const created = await prisma.order_assignments.create({
      data: {
        order_id: orderId,
        team_member_id: BigInt(teamMemberId),
        job_id: BigInt(jobId),
        is_lead: parsed.data.is_lead || false,
        assigned_at: new Date(),
      },
      include: {
        team_members: {
          include: {
            users: { select: { id: true, name: true, email: true, phone: true } },
            teams: { select: { id: true, name: true } },
          },
        },
        jobs: { select: { id: true, name: true } },
        progress_order: true,
      },
    });

    res.status(201).json({
      success: true,
      data: formatAssignment(created),
      message: 'Penugasan tim berhasil dibuat',
    });
  } catch (err) { next(err); }
});

// ============ DIRECT ASSIGNMENT ROUTES ============
// GET /api/v1/assignments/:id
assignmentsRouter.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const assignment = await prisma.order_assignments.findFirst({
      where: { id },
      include: {
        orders: { select: { id: true, order_number: true, status: true } },
        team_members: {
          include: {
            users: { select: { id: true, name: true, email: true, phone: true } },
            teams: { select: { id: true, name: true } },
          },
        },
        jobs: { select: { id: true, name: true } },
        progress_order: {
          where: { deleted_at: null },
          select: { id: true, title: true, progress_percentage: true, status: true, created_at: true },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    res.json({ success: true, data: formatAssignment(assignment) });
  } catch (err) { next(err); }
});

// PATCH /api/v1/assignments/:id/status
assignmentsRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Status tidak valid',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const existing = await prisma.order_assignments.findFirst({
      where: { id },
      include: {
        progress_order: { where: { deleted_at: null } },
      },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    const currentStatus = computeAssignmentStatus(existing.progress_order);
    if (currentStatus === 'completed' && parsed.data.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Penugasan yang sudah selesai tidak dapat diubah kembali ke status sebelumnya',
      });
    }

    // Sync progress_order status
    if (parsed.data.status === 'completed') {
      if (existing.progress_order.length > 0) {
        await prisma.progress_order.updateMany({
          where: { assignment_id: id, deleted_at: null },
          data: { status: 'completed', progress_percentage: 100, completed_at: new Date() },
        });
      } else {
        await prisma.progress_order.create({
          data: {
            assignment_id: id,
            title: 'Penyelesaian Tugas',
            status: 'completed',
            progress_percentage: 100,
            completed_at: new Date(),
          },
        });
      }
    } else if (parsed.data.status === 'in_progress') {
      if (existing.progress_order.length > 0) {
        await prisma.progress_order.updateMany({
          where: { assignment_id: id, deleted_at: null, status: 'pending' },
          data: { status: 'in_progress', started_at: new Date() },
        });
      } else {
        await prisma.progress_order.create({
          data: {
            assignment_id: id,
            title: 'Mulai Pengerjaan',
            status: 'in_progress',
            progress_percentage: 10,
            started_at: new Date(),
          },
        });
      }
    }

    const updated = await prisma.order_assignments.findFirst({
      where: { id },
      include: {
        team_members: {
          include: {
            users: { select: { id: true, name: true, email: true } },
            teams: { select: { id: true, name: true } },
          },
        },
        jobs: { select: { id: true, name: true } },
        progress_order: { where: { deleted_at: null } },
      },
    });

    res.json({
      success: true,
      data: formatAssignment(updated),
      message: 'Status penugasan berhasil diubah',
    });
  } catch (err) { next(err); }
});

// DELETE /api/v1/assignments/:id
assignmentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.order_assignments.findFirst({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    const progressCount = await prisma.progress_order.count({
      where: { assignment_id: id, deleted_at: null },
    });
    if (progressCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Penugasan masih memiliki ${progressCount} catatan progres pengerjaan dan tidak dapat dihapus`,
      });
    }

    await prisma.order_assignments.delete({ where: { id } });
    res.json({ success: true, message: 'Penugasan berhasil dihapus' });
  } catch (err) { next(err); }
});
