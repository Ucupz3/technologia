import { Router } from 'express';
import { z } from 'zod';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';

export const progressRouter = Router();
export const orderProgressRouter = Router({ mergeParams: true });

// ============ SCHEMAS ============
const createProgressSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  progress_percentage: z.coerce.number().int().min(0).max(100),
  assignment_id: z.coerce.number().int().positive().optional().nullable(),
  user_id: z.coerce.number().int().positive().optional().nullable(),
  team_member_id: z.coerce.number().int().positive().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().nullable(),
  notes: z.string().optional().nullable(),
  attachment_file: z.string().optional().nullable(),
});

function computeProgressStatus(percentage) {
  if (percentage === 100) return 'completed';
  if (percentage > 0) return 'in_progress';
  return 'pending';
}

function formatProgress(p) {
  const user = p.order_assignments?.team_members?.users || null;
  const job = p.order_assignments?.jobs || null;
  const assignment = p.order_assignments || null;

  return {
    id: p.id,
    assignment_id: p.assignment_id,
    order_id: assignment?.order_id || null,
    title: p.title,
    description: p.description,
    status: p.status,
    progress_percentage: p.progress_percentage,
    notes: p.notes,
    started_at: p.started_at,
    completed_at: p.completed_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
    user_id: user?.id || null,
    user_name: user?.name || 'Unknown',
    user_email: user?.email || null,
    job_name: job?.name || null,
    role_in_order: job?.name || null,
    users: user,
    order_assignments: assignment,
    attachments: p.progress_attachments || [],
  };
}

// ============ ORDER-SCOPED PROGRESS ============
// GET /api/v1/orders/:orderId/progress
orderProgressRouter.get('/', async (req, res, next) => {
  try {
    const orderId = BigInt(req.params.orderId);
    const order = await prisma.orders.findFirst({
      where: { id: orderId, deleted_at: null },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    const progressList = await prisma.progress_order.findMany({
      where: {
        order_assignments: { order_id: orderId },
        deleted_at: null,
      },
      include: {
        order_assignments: {
          include: {
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true } },
              },
            },
            jobs: { select: { id: true, name: true } },
          },
        },
        progress_attachments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: progressList.map(formatProgress) });
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:orderId/progress
orderProgressRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createProgressSchema.safeParse(req.body);
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

    const {
      title, description, progress_percentage, assignment_id,
      notes, attachment_file, user_id, team_member_id, status,
    } = parsed.data;

    let targetAssignment = null;

    if (assignment_id) {
      targetAssignment = await prisma.order_assignments.findFirst({
        where: { id: BigInt(assignment_id), order_id: orderId },
        include: { team_members: { include: { users: true } }, jobs: true },
      });
    } else if (team_member_id) {
      targetAssignment = await prisma.order_assignments.findFirst({
        where: { team_member_id: BigInt(team_member_id), order_id: orderId },
        include: { team_members: { include: { users: true } }, jobs: true },
      });
    } else if (user_id) {
      targetAssignment = await prisma.order_assignments.findFirst({
        where: {
          order_id: orderId,
          team_members: { user_id: BigInt(user_id) },
        },
        include: { team_members: { include: { users: true } }, jobs: true },
      });
    } else {
      targetAssignment = await prisma.order_assignments.findFirst({
        where: { order_id: orderId },
        include: { team_members: { include: { users: true } }, jobs: true },
      });
    }

    if (!targetAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Penugasan tim tidak ditemukan untuk order ini. Pastikan tim sudah ditugaskan ke order terlebih dahulu.',
      });
    }

    const calculatedStatus = status || computeProgressStatus(progress_percentage);

    const result = await prisma.$transaction(async (tx) => {
      const progressRecord = await tx.progress_order.create({
        data: {
          assignment_id: targetAssignment.id,
          title,
          description: description || null,
          status: calculatedStatus,
          progress_percentage,
          notes: notes || null,
          started_at: progress_percentage > 0 ? new Date() : null,
          completed_at: progress_percentage === 100 ? new Date() : null,
        },
      });

      let attachment = null;
      if (attachment_file) {
        attachment = await tx.progress_attachments.create({
          data: {
            progress_id: progressRecord.id,
            file_path: attachment_file,
            file_name: path.basename(attachment_file),
            file_type: path.extname(attachment_file).replace('.', '') || 'unknown',
          },
        });
      }

      return {
        ...progressRecord,
        order_assignments: targetAssignment,
        progress_attachments: attachment ? [attachment] : [],
      };
    });

    res.status(201).json({
      success: true,
      data: formatProgress(result),
      message: 'Progres pengerjaan berhasil dicatat',
    });
  } catch (err) { next(err); }
});

// ============ DIRECT PROGRESS ROUTES ============
// GET /api/v1/progress/:id
progressRouter.get('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const progress = await prisma.progress_order.findFirst({
      where: { id, deleted_at: null },
      include: {
        order_assignments: {
          include: {
            orders: { select: { id: true, order_number: true, status: true } },
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true } },
              },
            },
            jobs: { select: { id: true, name: true } },
          },
        },
        progress_attachments: true,
      },
    });

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Catatan progres tidak ditemukan' });
    }

    res.json({ success: true, data: formatProgress(progress) });
  } catch (err) { next(err); }
});

// DELETE /api/v1/progress/:id (soft delete)
progressRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const progress = await prisma.progress_order.findFirst({
      where: { id, deleted_at: null },
    });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Catatan progres tidak ditemukan' });
    }

    await prisma.progress_order.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, message: 'Catatan progres berhasil dihapus' });
  } catch (err) { next(err); }
});
