import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

const uploadDir = './public/uploads/progress';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res, next) => {
  try {
    const userIdStr = req.query.user_id;
    if (!userIdStr) return res.status(401).json({ success: false, message: 'User ID tidak ditemukan' });
    const userId = BigInt(userIdStr);

    const assignments = await prisma.order_assignments.findMany({
      where: {
        team_members: { user_id: userId }
      },
      include: {
        jobs: true,
        orders: { select: { order_number: true, customer_name_snapshot: true, end_date_project: true, status: true } },
        progress_order: { 
          orderBy: { created_at: 'desc' },
          include: { progress_attachments: true }
        }
      },
      orderBy: { assigned_at: 'desc' }
    });

    const orderIds = [...new Set(assignments.map(a => a.order_id))];
    const siblingAssignments = await prisma.order_assignments.findMany({
      where: { order_id: { in: orderIds } },
      include: {
        jobs: true,
        progress_order: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    let allTasks = [];
    const today = new Date();

    assignments.forEach(assignment => {
      const orderStatus = assignment.orders?.status || 'pending';
      const phaseOrder = assignment.phase_order || 1;

      let isLocked = false;
      let lockReason = null;

      if (phaseOrder > 1) {
        const priorPhases = siblingAssignments.filter(
          s => s.order_id === assignment.order_id && (s.phase_order || 1) < phaseOrder
        );

        const unfinished = priorPhases.find(p => {
          const prog = p.progress_order?.[0];
          return !prog || prog.status !== 'completed' || prog.progress_percentage < 100;
        });

        if (unfinished) {
          isLocked = true;
          lockReason = `Menunggu fase ${unfinished.phase_order || 1} (${unfinished.jobs?.name || 'Tugas Sebelumnya'}) selesai 100%`;
        }
      }

      const effectiveDeadline = assignment.end_date || assignment.orders?.end_date_project;
      const deadlineStr = effectiveDeadline ? new Date(effectiveDeadline).toISOString().split('T')[0] : '-';
      const startDateStr = assignment.start_date ? new Date(assignment.start_date).toISOString().split('T')[0] : null;

      if (assignment.progress_order && assignment.progress_order.length > 0) {
        assignment.progress_order.forEach(task => {
          allTasks.push({
            id: task.id,
            assignment_id: assignment.id,
            title: task.title,
            job_name: assignment.jobs.name,
            order_id: assignment.order_id,
            order_number: assignment.orders?.order_number || '-',
            customer: assignment.orders?.customer_name_snapshot || '-',
            order_status: orderStatus,
            phase_order: phaseOrder,
            start_date: startDateStr,
            end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : null,
            is_locked: isLocked,
            lock_reason: lockReason,
            status: task.status,
            progress: task.progress_percentage,
            deadline: deadlineStr,
            is_overdue: task.status !== 'completed' && effectiveDeadline && new Date(effectiveDeadline) < today,
            notes: task.notes,
            attachments: task.progress_attachments || []
          });
        });
      } else {
        allTasks.push({
          id: `assign-${assignment.id}`,
          assignment_id: assignment.id,
          title: `Pengerjaan ${assignment.jobs.name}`,
          job_name: assignment.jobs.name,
          order_id: assignment.order_id,
          order_number: assignment.orders?.order_number || '-',
          customer: assignment.orders?.customer_name_snapshot || '-',
          order_status: orderStatus,
          phase_order: phaseOrder,
          start_date: startDateStr,
          end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : null,
          is_locked: isLocked,
          lock_reason: lockReason,
          status: 'pending',
          progress: 0,
          deadline: deadlineStr,
          is_overdue: false,
          notes: null,
          attachments: []
        });
      }
    });

    allTasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (!a.is_locked && b.is_locked) return -1;
      if (a.is_locked && !b.is_locked) return 1;
      return (a.phase_order || 1) - (b.phase_order || 1);
    });

    res.json({ success: true, data: allTasks });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, progress_percentage, notes } = req.body;
    let targetId = id;
    let assignmentId;

    if (isNaN(id)) {
      assignmentId = BigInt(id.replace('assign-', ''));
    } else {
      const currentProgress = await prisma.progress_order.findUnique({
        where: { id: BigInt(id) },
        select: { assignment_id: true }
      });
      assignmentId = currentProgress?.assignment_id;
    }

    if (assignmentId) {
      const currentAssignment = await prisma.order_assignments.findUnique({
        where: { id: assignmentId },
        include: { orders: true, jobs: true }
      });

      if (!currentAssignment) {
        return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
      }

      if (currentAssignment.orders?.status === 'completed') {
        return res.status(403).json({ success: false, message: 'Proyek ini sudah berstatus Selesai (Completed), progress tidak dapat diubah.' });
      }

      const phaseOrder = currentAssignment.phase_order || 1;
      if (phaseOrder > 1) {
        const priorPhases = await prisma.order_assignments.findMany({
          where: {
            order_id: currentAssignment.order_id,
            phase_order: { lt: phaseOrder }
          },
          include: {
            jobs: true,
            progress_order: { orderBy: { created_at: 'desc' }, take: 1 }
          }
        });

        const unfinished = priorPhases.find(p => {
          const prog = p.progress_order?.[0];
          return !prog || prog.status !== 'completed' || prog.progress_percentage < 100;
        });

        if (unfinished) {
          return res.status(403).json({
            success: false,
            message: `Tugas ini belum dapat dikerjakan karena fase ${unfinished.phase_order || 1} (${unfinished.jobs?.name || 'sebelumnya'}) belum selesai 100%.`
          });
        }
      }
    }

    if (isNaN(id)) {
      const assign = await prisma.order_assignments.findUnique({
        where: { id: assignmentId },
        include: { jobs: true }
      });

      const newProgress = await prisma.progress_order.create({
        data: {
          assignment_id: assignmentId,
          title: `Pengerjaan ${assign.jobs.name}`,
          status,
          progress_percentage,
          notes,
          started_at: status === 'in_progress' ? new Date() : null,
          completed_at: status === 'completed' ? new Date() : null,
        }
      });
      targetId = newProgress.id;
    } else {
      await prisma.progress_order.update({
        where: { id: BigInt(id) },
        data: {
          status,
          progress_percentage,
          notes,
          started_at: status === 'in_progress' && !req.body.started_at ? new Date() : undefined,
          completed_at: status === 'completed' ? new Date() : null,
        }
      });
    }

    const isCompleted = status === 'completed' || Number(progress_percentage) === 100;

    if (isCompleted && assignmentId) {
      const assignData = await prisma.order_assignments.findUnique({
        where: { id: assignmentId },
        include: { jobs: true, orders: true },
      });

      if (assignData) {
        const allAssignments = await prisma.order_assignments.findMany({
          where: { order_id: assignData.order_id },
          include: {
            progress_order: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        });

        const allFinished = allAssignments.length > 0 && allAssignments.every((a) => {
          if (a.id === assignmentId) return true;
          const p = a.progress_order?.[0];
          return p && (p.status === 'completed' || p.progress_percentage === 100);
        });

        if (allFinished && assignData.orders?.status !== 'completed') {
          await prisma.orders.update({
            where: { id: assignData.order_id },
            data: { status: 'completed' },
          });

          await prisma.order_status_history.create({
            data: {
              order_id: assignData.order_id,
              from_status: assignData.orders?.status || 'in_progress',
              to_status: 'completed',
              notes: 'Seluruh fase dan tugas pengerjaan developer telah selesai 100%. Status order menjadi selesai.',
            },
          });
        }
      }
    }

    res.json({ success: true, message: 'Progress berhasil diupdate', new_id: targetId });
  } catch (err) { next(err); }
});

router.post('/:id/attachments', upload.array('files', 5), async (req, res, next) => {
  try {
    const progressId = BigInt(req.params.id);
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada file' });

    const savedFiles = [];
    for (const file of files) {
      const attachment = await prisma.progress_attachments.create({
        data: {
          progress_id: progressId,
          file_path: `/uploads/progress/${file.filename}`,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size,
        }
      });
      savedFiles.push(attachment);
    }

    res.json({ success: true, message: 'File berhasil diupload', data: savedFiles });
  } catch (err) { next(err); }
});

export { router as developerTasksRouter };
