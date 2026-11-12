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
            id: true,
            order_number: true,
            customer_name_snapshot: true,
            start_date_project: true,
            end_date_project: true,
            status: true,
            order_services: {
              select: {
                service_name_snapshot: true
              }
            }
          }
        },
        progress_order: {
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: [
        { assigned_at: 'desc' },
        { id: 'desc' }
      ]
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

    const today = new Date();
    const projectsMap = new Map();
    let allTasks = [];
    let stats = {
      total_projects: 0,
      total_active: 0,
      total_completed: 0,
      total_pending: 0,
      total_overdue: 0
    };

    assignments.forEach(assignment => {
      const order = assignment.orders;
      if (!order) return;
      const orderIdStr = String(order.id);

      if (!projectsMap.has(orderIdStr)) {
        const serviceName = order.order_services?.[0]?.service_name_snapshot || 'Layanan Proyek';
        projectsMap.set(orderIdStr, {
          order_id: orderIdStr,
          order_number: order.order_number,
          customer_name: order.customer_name_snapshot || '-',
          service_name: serviceName,
          status: order.status,
          start_date_project: order.start_date_project ? new Date(order.start_date_project).toISOString().split('T')[0] : null,
          end_date_project: order.end_date_project ? new Date(order.end_date_project).toISOString().split('T')[0] : null,
          assigned_at: assignment.assigned_at,
          created_at: order.created_at,
          jobs: []
        });
      }

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
          lockReason = `Menunggu fase ${unfinished.phase_order || 1} (${unfinished.jobs?.name || 'sebelumnya'}) selesai 100%`;
        }
      }

      const effectiveDeadline = assignment.end_date || order.end_date_project;
      const deadlineStr = effectiveDeadline ? new Date(effectiveDeadline).toISOString().split('T')[0] : '-';
      const startDateStr = assignment.start_date ? new Date(assignment.start_date).toISOString().split('T')[0] : null;

      const latestProgress = assignment.progress_order?.[0];
      const progStatus = latestProgress?.status || 'pending';
      const progPercent = latestProgress?.progress_percentage ?? 0;
      const isOverdue = progStatus !== 'completed' && !isLocked && effectiveDeadline && new Date(effectiveDeadline) < today;

      const jobItem = {
        assignment_id: String(assignment.id),
        task_id: latestProgress ? latestProgress.id : null,
        job_id: String(assignment.job_id),
        job_name: assignment.jobs?.name || '-',
        is_lead: Boolean(assignment.is_lead),
        phase_order: phaseOrder,
        start_date: startDateStr,
        end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : null,
        deadline: deadlineStr,
        is_locked: isLocked,
        lock_reason: lockReason,
        status: progStatus,
        progress: progPercent,
        notes: latestProgress?.notes || null,
        is_overdue: isOverdue
      };

      projectsMap.get(orderIdStr).jobs.push(jobItem);

      allTasks.push({
        id: latestProgress ? latestProgress.id : `assign-${assignment.id}`,
        title: latestProgress?.title || `Pengerjaan ${assignment.jobs.name}`,
        job_name: assignment.jobs.name,
        order_number: order.order_number,
        customer: order.customer_name_snapshot || '-',
        phase_order: phaseOrder,
        start_date: startDateStr,
        end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : null,
        is_locked: isLocked,
        lock_reason: lockReason,
        status: progStatus,
        progress: progPercent,
        deadline: deadlineStr,
        is_overdue: isOverdue
      });

      if (progStatus === 'completed') stats.total_completed++;
      else if (progStatus === 'in_progress' && !isLocked) stats.total_active++;
      else stats.total_pending++;

      if (isOverdue) stats.total_overdue++;
    });

    const projects = Array.from(projectsMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.assigned_at || a.created_at || 0).getTime();
        const dateB = new Date(b.assigned_at || b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .map(proj => ({
        ...proj,
        jobs: proj.jobs.sort((a, b) => a.phase_order - b.phase_order)
      }));

    stats.total_projects = projects.length;

    // 1. Chart Aktivitas Setoran 30 Hari Terakhir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const assignmentIds = assignments.map(a => a.id);
    const progressLogs = await prisma.progress_order.findMany({
      where: {
        assignment_id: { in: assignmentIds },
        deleted_at: null,
        created_at: { gte: thirtyDaysAgo }
      },
      select: {
        id: true,
        progress_percentage: true,
        created_at: true,
        updated_at: true
      }
    });

    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }

    progressLogs.forEach(p => {
      const d = p.updated_at || p.created_at;
      if (d) {
        const key = new Date(d).toISOString().slice(0, 10);
        if (dailyMap[key] !== undefined) {
          dailyMap[key] += 1;
        }
      }
    });

    const activity_chart = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count
    }));

    // 2. Daftar Tiket Kendala Maintenance Terkini
    const maintenanceTickets = await prisma.maintenances.findMany({
      where: {
        deleted_at: null,
        orders: {
          deleted_at: null,
          order_assignments: {
            some: { team_members: { user_id: userId } }
          }
        }
      },
      include: {
        orders: {
          include: {
            parent_order: { select: { order_number: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 4
    });

    const recent_maintenance = maintenanceTickets.map(m => ({
      id: m.id.toString(),
      title: m.title,
      status: m.status,
      order_number: m.orders?.order_number,
      parent_order_number: m.orders?.parent_order?.order_number || null,
      created_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '-'
    }));

    res.json({
      success: true,
      data: {
        stats,
        projects,
        tasks: allTasks,
        activity_chart,
        recent_maintenance
      }
    });
  } catch (err) {
    next(err);
  }
});

export { router as developerDashboardRouter };
