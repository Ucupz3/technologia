import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const schedulesRouter = Router();

// Helper untuk format data order jadwal agar konsisten
function formatScheduleOrder(order, currentUserId = null) {
  // Kumpulkan semua penugasan & rekan tim
  const assignments = (order.order_assignments || []).map((oa) => {
    const user = oa.team_members?.users || null;
    const job = oa.jobs || null;
    return {
      assignment_id: oa.id,
      team_member_id: oa.team_member_id,
      user_id: user?.id || null,
      user_name: user?.name || 'Unknown',
      user_email: user?.email || null,
      user_phone: user?.phone || null,
      job_id: job?.id || null,
      job_name: job?.name || 'Developer',
      is_lead: Boolean(oa.is_lead),
      assigned_at: oa.assigned_at,
    };
  });

  // Cari apakah user yang sedang login ditugaskan di order ini
  let myAssignment = null;
  if (currentUserId) {
    const targetId = BigInt(currentUserId);
    myAssignment = assignments.find((a) => a.user_id && BigInt(a.user_id) === targetId) || null;
  }

  // Kumpulkan semua riwayat progres dari setiap penugasan
  const allProgress = (order.order_assignments || [])
    .flatMap((oa) => (oa.progress_order || []).map((p) => ({
      ...p,
      author_name: oa.team_members?.users?.name || 'Developer',
      author_job: oa.jobs?.name || null,
      is_lead: oa.is_lead,
    })))
    .sort((a, b) => {
      const timeDiff = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (timeDiff !== 0) return timeDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });

  // Hitung persentase progres terbaru (ambil dari entri paling mutakhir)
  let progressPercentage = 0;
  if (allProgress.length > 0) {
    progressPercentage = allProgress[0].progress_percentage ?? 0;
  } else if (order.status === 'completed') {
    progressPercentage = 100;
  }

  // Hitung sisa hari menuju deadline
  let daysRemaining = null;
  let isOverdue = false;
  if (order.end_date_project) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(order.end_date_project);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0 && order.status !== 'completed' && order.status !== 'cancelled') {
      isOverdue = true;
    }
  }

  // Ringkasan layanan/jasa
  const services = (order.order_services || []).map((s) => ({
    id: s.id,
    name: s.service_name_snapshot,
    category: s.category_name_snapshot,
    quantity: s.quantity,
    price: s.price_deal,
  }));

  return {
    id: order.id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    customer_name: order.customer_name_snapshot || order.customers?.name || 'Pelanggan',
    customer_name_snapshot: order.customer_name_snapshot || order.customers?.name || 'Pelanggan',
    customer_address: order.customer_address_snapshot,
    pic_name: order.pic_name_snapshot,
    pic_email: order.pic_email_snapshot,
    status: order.status,
    payment_status: order.payment_status,
    start_date_project: order.start_date_project,
    end_date_project: order.end_date_project,
    notes: order.notes,
    team_id: order.team_id,
    team_name: order.teams?.name || null,
    services,
    assignments,
    my_assignment: myAssignment,
    progress_percentage: progressPercentage,
    recent_progress: allProgress.slice(0, 5),
    maintenances: order.maintenances || [],
    days_remaining: daysRemaining,
    is_overdue: isOverdue,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

// =========================================================================
// 1. GET /api/v1/schedules
// Ambil jadwal proyek (didukung filter: user_id, status, search, month, year)
// Kompatibel penuh dengan SuperAdmin/Schedules & Developer/Schedule
// =========================================================================
schedulesRouter.get('/', async (req, res, next) => {
  try {
    const { user_id, status, search, month, year, scope } = req.query;

    const where = {
      deleted_at: null,
    };

    // Pastikan order memiliki tanggal proyek terdefinisi
    where.OR = [
      { start_date_project: { not: null } },
      { end_date_project: { not: null } },
    ];

    // Filter berdasarkan User ID (Developer) jika diberikan dan bukan scope 'all'
    if (user_id && scope !== 'all') {
      const uId = BigInt(user_id);
      where.order_assignments = {
        some: {
          team_members: {
            user_id: uId,
          },
        },
      };
    }

    // Filter status order
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter pencarian teks
    if (search && search.trim() !== '') {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { order_number: { contains: term } },
            { customer_name_snapshot: { contains: term } },
          ],
        },
      ];
    }

    // Filter berdasarkan bulan & tahun
    if (year) {
      const y = parseInt(year, 10);
      const m = month !== undefined ? parseInt(month, 10) : null;
      if (!isNaN(y)) {
        let dateStart, dateEnd;
        if (m !== null && !isNaN(m)) {
          dateStart = new Date(y, m, 1);
          dateEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
        } else {
          dateStart = new Date(y, 0, 1);
          dateEnd = new Date(y, 11, 31, 23, 59, 59, 999);
        }

        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { start_date_project: { gte: dateStart, lte: dateEnd } },
              { end_date_project: { gte: dateStart, lte: dateEnd } },
            ],
          },
        ];
      }
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        customers: { select: { id: true, name: true, email: true, phone: true } },
        teams: { select: { id: true, name: true } },
        order_services: {
          select: {
            id: true,
            service_name_snapshot: true,
            category_name_snapshot: true,
            price_deal: true,
            quantity: true,
          },
        },
        order_assignments: {
          include: {
            jobs: { select: { id: true, name: true, description: true } },
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true, phone: true } },
                teams: { select: { id: true, name: true } },
              },
            },
            progress_order: {
              where: { deleted_at: null },
              orderBy: { created_at: 'desc' },
              take: 5,
              include: {
                progress_attachments: true,
              },
            },
          },
        },
        maintenances: {
          where: { deleted_at: null },
          orderBy: { start_datetime: 'asc' },
        },
      },
      orderBy: { start_date_project: 'asc' },
    });

    const formatted = orders.map((order) => formatScheduleOrder(order, user_id));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 2. GET /api/v1/schedules/developer
// Endpoint khusus untuk Developer Schedule dengan ringkasan statistik & tasks
// =========================================================================
schedulesRouter.get('/developer', async (req, res, next) => {
  try {
    const { user_id, scope, status } = req.query;

    const where = {
      deleted_at: null,
      OR: [
        { start_date_project: { not: null } },
        { end_date_project: { not: null } },
      ],
    };

    let developerUser = null;
    if (user_id) {
      const uId = BigInt(user_id);
      developerUser = await prisma.users.findFirst({
        where: { id: uId, deleted_at: null },
        select: { id: true, name: true, email: true, phone: true },
      });

      if (scope !== 'all') {
        where.order_assignments = {
          some: {
            team_members: {
              user_id: uId,
            },
          },
        };
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        customers: { select: { id: true, name: true, email: true, phone: true } },
        teams: { select: { id: true, name: true } },
        order_services: {
          select: {
            id: true,
            service_name_snapshot: true,
            category_name_snapshot: true,
            price_deal: true,
            quantity: true,
          },
        },
        order_assignments: {
          include: {
            jobs: { select: { id: true, name: true, description: true } },
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true, phone: true } },
                teams: { select: { id: true, name: true } },
              },
            },
            progress_order: {
              where: { deleted_at: null },
              orderBy: { created_at: 'desc' },
              take: 5,
              include: {
                progress_attachments: true,
              },
            },
          },
        },
        maintenances: {
          where: { deleted_at: null },
          orderBy: { start_datetime: 'asc' },
        },
      },
      orderBy: { start_date_project: 'asc' },
    });

    const formattedProjects = orders.map((order) => formatScheduleOrder(order, user_id));

    // Kumpulkan maintenance/tasks mendatang dari proyek-proyek ini
    const upcomingTasks = [];
    formattedProjects.forEach((proj) => {
      (proj.maintenances || []).forEach((m) => {
        upcomingTasks.push({
          ...m,
          order_id: proj.id,
          order_number: proj.order_number,
          customer_name: proj.customer_name,
        });
      });
    });
    upcomingTasks.sort((a, b) => new Date(a.start_datetime || 0) - new Date(b.start_datetime || 0));

    // Hitung ringkasan statistik
    const stats = {
      total_projects: formattedProjects.length,
      in_progress: formattedProjects.filter((p) => p.status === 'in_progress').length,
      pending: formattedProjects.filter((p) => p.status === 'pending').length,
      completed: formattedProjects.filter((p) => p.status === 'completed').length,
      overdue: formattedProjects.filter((p) => p.is_overdue).length,
      upcoming_deadlines: formattedProjects.filter(
        (p) => p.days_remaining !== null && p.days_remaining >= 0 && p.days_remaining <= 7 && p.status !== 'completed'
      ).length,
    };

    res.json({
      success: true,
      data: {
        developer: developerUser,
        stats,
        projects: formattedProjects,
        upcoming_tasks: upcomingTasks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/schedules/developer/:userId
schedulesRouter.get('/developer/:userId', async (req, res, next) => {
  req.query.user_id = req.params.userId;
  return schedulesRouter.handle(req, res, next);
});

// =========================================================================
// 3. GET /api/v1/schedules/maintenances
// Ambil daftar maintenance terpisah beserta daftar order aktif untuk dropdown
// =========================================================================
schedulesRouter.get('/maintenances', async (_req, res, next) => {
  try {
    const schedules = await prisma.maintenances.findMany({
      where: { deleted_at: null },
      include: {
        orders: {
          select: {
            id: true,
            order_number: true,
            customer_name_snapshot: true,
            status: true,
          },
        },
      },
      orderBy: { start_datetime: 'desc' },
    });

    const orders = await prisma.orders.findMany({
      where: { deleted_at: null, status: { notIn: ['cancelled'] } },
      select: { id: true, order_number: true, customer_name_snapshot: true },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: schedules, orders });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 4. POST /api/v1/schedules
// Buat Jadwal Baru (Maintenances / Task)
// =========================================================================
const createScheduleSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  title: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  start_datetime: z.string(),
  end_datetime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { order_id, title, description, status, start_datetime, end_datetime, notes } = parsed.data;

    const schedule = await prisma.maintenances.create({
      data: {
        order_id: BigInt(order_id),
        title,
        description: description || null,
        status,
        start_datetime: new Date(start_datetime),
        end_datetime: end_datetime ? new Date(end_datetime) : null,
        notes: notes || null,
      },
    });

    res.status(201).json({ success: true, data: schedule, message: 'Jadwal berhasil dibuat' });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 5. PUT /api/v1/schedules/:id
// Update Jadwal
// =========================================================================
const updateScheduleSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  start_datetime: z.string().optional(),
  end_datetime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal' });
    }

    const id = BigInt(req.params.id);
    const data = { ...parsed.data };
    if (data.start_datetime) data.start_datetime = new Date(data.start_datetime);
    if (data.end_datetime !== undefined) {
      data.end_datetime = data.end_datetime ? new Date(data.end_datetime) : null;
    }

    const schedule = await prisma.maintenances.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: schedule, message: 'Jadwal berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 6. DELETE /api/v1/schedules/:id
// Soft delete jadwal
// =========================================================================
schedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.maintenances.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});
