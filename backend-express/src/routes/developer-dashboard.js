import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const userIdStr = req.query.user_id;
    if (!userIdStr) {
      return res.status(401).json({ success: false, message: 'User ID wajib disertakan' });
    }
    const userId = BigInt(userIdStr);

    const assignments = await prisma.order_assignments.findMany({
      where: {
        team_members: { user_id: userId }
      },
      include: {
        jobs: true,
        orders: {
          select: {
            order_number: true,
            customer_name_snapshot: true,
            end_date_project: true
          }
        },
        progress_order: {
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { assigned_at: 'desc' }
    });

    let allTasks = [];
    let stats = { total_active: 0, total_completed: 0, total_pending: 0, total_overdue: 0 };
    const today = new Date();

    assignments.forEach(assignment => {
      if (assignment.progress_order && assignment.progress_order.length > 0) {
        assignment.progress_order.forEach(task => {
          const isOverdue = task.status !== 'completed' &&
            assignment.orders?.end_date_project &&
            new Date(assignment.orders.end_date_project) < today;

          allTasks.push({
            id: task.id,
            title: task.title,
            job_name: assignment.jobs.name,
            order_number: assignment.orders?.order_number || '-',
            customer: assignment.orders?.customer_name_snapshot || '-',
            status: task.status,
            progress: task.progress_percentage,
            deadline: assignment.orders?.end_date_project
              ? new Date(assignment.orders.end_date_project).toISOString().split('T')[0]
              : '-',
            is_overdue: isOverdue
          });

          if (task.status === 'completed') stats.total_completed++;
          else if (task.status === 'in_progress') stats.total_active++;
          else if (task.status === 'pending') stats.total_pending++;

          if (isOverdue) stats.total_overdue++;
        });
      } else {
        allTasks.push({
          id: `assign-${assignment.id}`,
          title: `Pengerjaan ${assignment.jobs.name}`,
          job_name: assignment.jobs.name,
          order_number: assignment.orders?.order_number || '-',
          customer: assignment.orders?.customer_name_snapshot || '-',
          status: 'pending',
          progress: 0,
          deadline: assignment.orders?.end_date_project
            ? new Date(assignment.orders.end_date_project).toISOString().split('T')[0]
            : '-',
          is_overdue: false
        });
        stats.total_pending++;
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        tasks: allTasks
      }
    });
  } catch (err) {
    next(err);
  }
});

export { router as developerDashboardRouter };
