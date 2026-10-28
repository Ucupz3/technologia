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

    // ✅ KETAT: Hanya ambil assignment milik user ini
    const assignments = await prisma.order_assignments.findMany({
      where: {
        team_members: { user_id: userId }
      },
      include: {
        jobs: true,
        orders: { select: { order_number: true, customer_name_snapshot: true, end_date_project: true } },
        progress_order: { 
          orderBy: { created_at: 'desc' },
          include: { progress_attachments: true }
        }
      },
      orderBy: { assigned_at: 'desc' }
    });

    let allTasks = [];
    const today = new Date();

    assignments.forEach(assignment => {
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
            status: task.status,
            progress: task.progress_percentage,
            deadline: assignment.orders?.end_date_project ? new Date(assignment.orders.end_date_project).toISOString().split('T')[0] : '-',
            is_overdue: task.status !== 'completed' && assignment.orders?.end_date_project && new Date(assignment.orders.end_date_project) < today,
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
          status: 'pending',
          progress: 0,
          deadline: assignment.orders?.end_date_project ? new Date(assignment.orders.end_date_project).toISOString().split('T')[0] : '-',
          is_overdue: false,
          notes: null,
          attachments: []
        });
      }
    });

    allTasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    res.json({ success: true, data: allTasks });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, progress_percentage, notes } = req.body;
    let targetId = id;

    if (isNaN(id)) {
      const assignmentId = BigInt(id.replace('assign-', ''));
      const assignment = await prisma.order_assignments.findUnique({ where: { id: assignmentId }, include: { jobs: true } });
      
      const newProgress = await prisma.progress_order.create({
        data: {
          assignment_id: assignmentId,
          title: `Pengerjaan ${assignment.jobs.name}`,
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