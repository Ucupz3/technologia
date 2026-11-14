import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createAuditLog, formatDateIndo } from '../lib/auditHelper.js';

export const schedulesRouter = Router();

// ============ HELPER FORMAT SCHEDULE ORDER ============
function formatScheduleOrder(order, currentUserId = null, conflicts = [], conflictedOrderIds = new Set()) {
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
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Hitung persentase progres terbaru atau rata-rata
  let progressPercentage = 0;
  if (order.status === 'completed') {
    progressPercentage = 100;
  } else if (allProgress.length > 0) {
    progressPercentage = Math.max(...allProgress.map((p) => p.progress_percentage || 0));
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

  // Field pelengkap untuk Admin Schedules
  const members = order.teams?.team_members || [];
  const leadMember = members.find((m) => m.users?.role_id === 1 || m.users?.role_id === 2) || members[0];
  const leadName = leadMember?.users?.name || 'Lead Teknisi';

  const primaryService = (order.order_services || [])[0];
  const serviceName = primaryService?.service_name_snapshot || 'Layanan IT & Infrastruktur';
  const projectDetail = primaryService?.services?.description || order.notes || 'Pengerjaan teknis operasional lapangan';

  let scheduledDate = 'Belum Dijadwalkan';
  let scheduledTime = '09:00 - 15:00 WIB';

  if (order.start_date_project) {
    const d = new Date(order.start_date_project);
    scheduledDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    if (order.end_date_project) {
      const dEnd = new Date(order.end_date_project);
      scheduledTime = `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${dEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    }
  }

  let progressStage = 'Preparation';
  if (order.status === 'completed') {
    progressStage = 'Selesai (B.A. Ditandatangani)';
  } else if (order.status === 'in_progress') {
    progressStage = 'Pengerjaan Lapangan';
  } else if (order.status === 'ready') {
    progressStage = 'Final Stage Testing';
  }

  const isConflicted = conflictedOrderIds.has(order.id.toString());
  const relevantConflict = conflicts.find((c) => c.orderA_id === order.id.toString() || c.orderB_id === order.id.toString());

  return {
    id: Number(order.id),
    order_number: order.order_number,
    customer_id: order.customer_id,
    customer_name: order.customer_name_snapshot || order.customers?.name || 'Pelanggan',
    customer_name_snapshot: order.customer_name_snapshot || order.customers?.name || 'Pelanggan',
    customer_address: order.customer_address_snapshot || order.customers?.address || 'Lokasi Klien',
    customer_pic: order.pic_name_snapshot || order.customers?.contact_person || 'PIC Klien',
    pic_name: order.pic_name_snapshot || order.customers?.contact_person || 'PIC Klien',
    pic_email: order.pic_email_snapshot || order.customers?.email || '—',
    pic_phone: order.customers?.phone || '—',
    service_name: serviceName,
    project_detail: projectDetail,
    status: order.status,
    status_label: order.status === 'completed' ? 'Selesai' : order.status === 'in_progress' ? 'Diproses' : order.status === 'ready' ? 'Siap' : 'Pending',
    payment_status: order.payment_status,
    start_date_project: order.start_date_project,
    end_date_project: order.end_date_project,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    notes: order.notes || '',
    team_id: order.team_id ? Number(order.team_id) : null,
    team_name: order.teams?.name || 'Belum Ditugaskan',
    team_initial: order.teams ? order.teams.name.substring(0, 2).toUpperCase() : 'TX',
    team_lead: leadName,
    team_members_count: members.length,
    team_members: members.map((m) => m.users?.name || 'Teknisi'),
    has_conflict: isConflicted,
    conflict_desc: relevantConflict?.description || null,
    services,
    assignments,
    my_assignment: myAssignment,
    progress_percentage: progressPercentage,
    progress_stage: progressStage,
    progress_percent: progressPercentage,
    recent_progress: allProgress.slice(0, 5),
    maintenances: order.maintenances || [],
    days_remaining: daysRemaining,
    is_overdue: isOverdue,
    created_at: order.created_at,
    updated_at: order.updated_at,
    order_services: order.order_services,
  };
}

// ============ HELPER CONFLICT DETECTION ============
function detectConflicts(items) {
  const conflicts = [];
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    if (!a.team_id || !a.start_date_project) continue;

    const startA = new Date(a.start_date_project).getTime();
    const endA = a.end_date_project ? new Date(a.end_date_project).getTime() : startA + (2 * 3600 * 1000);

    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (!b.team_id || !b.start_date_project) continue;

      if (a.team_id.toString() === b.team_id.toString() && a.id.toString() !== b.id.toString()) {
        const startB = new Date(b.start_date_project).getTime();
        const endB = b.end_date_project ? new Date(b.end_date_project).getTime() : startB + (2 * 3600 * 1000);

        if (startA < endB && endA > startB) {
          conflicts.push({
            orderA_id: a.id.toString(),
            orderA_number: a.order_number,
            orderA_customer: a.customer_name_snapshot,
            orderB_id: b.id.toString(),
            orderB_number: b.order_number,
            orderB_customer: b.customer_name_snapshot,
            team_id: a.team_id.toString(),
            team_name: a.teams?.name || 'Tim Lapangan',
            description: `${a.teams?.name || 'Tim Lapangan'} memiliki 2 tugas bersamaan pada waktu overlapping di ${a.customer_name_snapshot} & ${b.customer_name_snapshot}.`,
          });
        }
      }
    }
  }
  return conflicts;
}

// =========================================================================
// 1. GET /api/v1/schedules
// Daftar jadwal order & alokasi tim (untuk Admin dan Umum)
// =========================================================================
schedulesRouter.get('/', async (req, res, next) => {
  try {
    const { user_id, status, search, month, year, scope } = req.query;

    const where = {
      deleted_at: null,
    };

    // Filter status order jika bukan 'all'
    if (status && status !== 'all') {
      where.status = status;
    } else {
      where.status = { notIn: ['cancelled'] };
    }

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

    // Filter berdasarkan bulan & tahun jika diberikan
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
        customers: true,
        teams: {
          include: {
            team_members: {
              where: { status: 'active' },
              include: { users: true },
            },
          },
        },
        order_services: {
          where: { deleted_at: null },
          include: { services: true },
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
      orderBy: { created_at: 'desc' },
    });

    const teams = await prisma.teams.findMany({
      where: { deleted_at: null, status: 'active' },
      include: {
        team_members: {
          where: { status: 'active' },
          include: { users: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    const conflicts = detectConflicts(orders);
    const conflictedOrderIds = new Set();
    conflicts.forEach((c) => {
      conflictedOrderIds.add(c.orderA_id);
      conflictedOrderIds.add(c.orderB_id);
    });

    const formattedSchedules = orders.map((o) =>
      formatScheduleOrder(o, user_id, conflicts, conflictedOrderIds)
    );

    res.json({
      success: true,
      data: formattedSchedules,
      orders: orders.map((o) => ({
        id: Number(o.id),
        order_number: o.order_number,
        customer_name: o.customer_name_snapshot || o.customers?.name,
        customer_address: o.customer_address_snapshot || o.customers?.address,
        services: (o.order_services || []).map((s) => s.service_name_snapshot).join(', ') || 'Layanan IT',
        primary_service: o.order_services?.[0]?.service_name_snapshot || 'Layanan IT & Infrastruktur',
        team_id: o.team_id ? Number(o.team_id) : null,
        start_date_project: o.start_date_project,
        end_date_project: o.end_date_project,
      })),
      teams: teams.map((t) => {
        const mems = t.team_members || [];
        const lead = mems.find((m) => m.users?.role_id === 1 || m.users?.role_id === 2) || mems[0];
        return {
          id: Number(t.id),
          name: t.name,
          description: t.description,
          members_count: mems.length,
          lead_name: lead?.users?.name || 'PIC Tim',
          lead_id: lead?.users?.id ? `TECH-00${lead.users.id}` : 'TECH-001',
          members: mems.map((m) => m.users?.name),
        };
      }),
      conflicts,
    });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 2. GET /api/v1/schedules/developer
// Endpoint khusus untuk Developer Schedule dengan ringkasan statistik & tasks
// =========================================================================
async function handleDeveloperSchedule(req, res, next) {
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
        customers: { select: { id: true, name: true, email: true, phone: true, address: true } },
        teams: {
          include: {
            team_members: {
              where: { status: 'active' },
              include: { users: true },
            },
          },
        },
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
      orderBy: { created_at: 'desc' },
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
}

schedulesRouter.get('/developer', handleDeveloperSchedule);

// GET /api/v1/schedules/developer/:userId
schedulesRouter.get('/developer/:userId', (req, res, next) => {
  req.query.user_id = req.params.userId;
  return handleDeveloperSchedule(req, res, next);
});

// =========================================================================
// 3. GET /api/v1/schedules/maintenances
// List Jadwal Pemeliharaan & Maintenance Pusat
// =========================================================================
schedulesRouter.get('/maintenances', async (_req, res, next) => {
  try {
    const schedules = await prisma.maintenances.findMany({
      where: { deleted_at: null },
      include: {
        orders: { select: { id: true, order_number: true, customer_name_snapshot: true, status: true } },
      },
      orderBy: { id: 'asc' },
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
// Buat Jadwal Baru (Order Schedule / Maintenances)
// =========================================================================
const createScheduleSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  start_datetime: z.string().optional().nullable(),
  end_datetime: z.string().optional().nullable(),
  status: z.string().optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi form jadwal gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      order_id,
      team_id,
      start_date_project,
      end_date_project,
      start_datetime,
      end_datetime,
      status,
      title,
      description,
      notes,
    } = parsed.data;

    const startDate = start_date_project
      ? new Date(start_date_project)
      : start_datetime
      ? new Date(start_datetime)
      : new Date();

    const endDate = end_date_project
      ? new Date(end_date_project)
      : end_datetime
      ? new Date(end_datetime)
      : null;

    const updatedOrder = await prisma.orders.update({
      where: { id: BigInt(order_id) },
      data: {
        team_id: team_id ? BigInt(team_id) : undefined,
        start_date_project: startDate,
        end_date_project: endDate,
        status: status || 'in_progress',
        notes: notes || undefined,
      },
    });

    let maintenanceRecord = null;
    if (title) {
      maintenanceRecord = await prisma.maintenances.create({
        data: {
          order_id: BigInt(order_id),
          title: title,
          description: description || notes || 'Alokasi jadwal proyek teknis',
          start_datetime: startDate,
          end_datetime: endDate,
          status: 'scheduled',
          notes: notes || null,
        },
      });

      try {
        const userId = req.headers['x-user-id'];
        const dateStr = formatDateIndo(startDate);
        const detailText = `Menambahkan jadwal pada hari ${dateStr}. Judul: ${title}${description ? '. Deskripsi: ' + description : ''}`;

        await createAuditLog({
          userId,
          action: 'CREATE',
          entityType: 'Schedule',
          entityId: maintenanceRecord.id,
          module: 'Schedules',
          details: detailText,
          data: { title, start_datetime: startDate, description, status },
          req,
        });
      } catch (logErr) {
        console.warn('Gagal mencatat audit log schedule create:', logErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Jadwal dan alokasi tim berhasil disimpan ke database',
      data: updatedOrder,
      maintenance: maintenanceRecord,
    });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 5. PUT /api/v1/schedules/:id
// Update Jadwal Order atau Maintenance
// =========================================================================
const updateScheduleSchema = z.object({
  team_id: z.coerce.number().int().positive().optional().nullable(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  start_datetime: z.string().optional().nullable(),
  end_datetime: z.string().optional().nullable(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi update gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const {
      team_id,
      start_date_project,
      end_date_project,
      title,
      description,
      start_datetime,
      end_datetime,
      status,
      notes,
    } = parsed.data;

    const existingOrder = await prisma.orders.findFirst({
      where: { id, deleted_at: null },
    });

    if (existingOrder) {
      const updateData = {};
      if (team_id !== undefined) updateData.team_id = team_id ? BigInt(team_id) : null;
      if (start_date_project) updateData.start_date_project = new Date(start_date_project);
      if (end_date_project !== undefined) updateData.end_date_project = end_date_project ? new Date(end_date_project) : null;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const updated = await prisma.orders.update({
        where: { id },
        data: updateData,
      });

      return res.json({
        success: true,
        message: 'Jadwal penugasan tim berhasil diperbarui',
        data: updated,
      });
    }

    const existingMaintenance = await prisma.maintenances.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingMaintenance) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (start_datetime) data.start_datetime = new Date(start_datetime);
    if (end_datetime !== undefined) {
      data.end_datetime = end_datetime ? new Date(end_datetime) : null;
    }

    const updatedM = await prisma.maintenances.update({
      where: { id },
      data,
    });

    try {
      const userId = req.headers['x-user-id'];
      const changes = [];
      if (title && title !== existingMaintenance.title) changes.push(`Judul: "${existingMaintenance.title}" → "${title}"`);
      if (description !== undefined && description !== existingMaintenance.description) {
        changes.push(`Deskripsi: "${existingMaintenance.description || '-'}" → "${description || '-'}"`);
      }
      if (status && status !== existingMaintenance.status) changes.push(`Status: "${existingMaintenance.status}" → "${status}"`);
      if (start_datetime && new Date(start_datetime).getTime() !== new Date(existingMaintenance.start_datetime).getTime()) {
        changes.push(`Tanggal: "${formatDateIndo(existingMaintenance.start_datetime)}" → "${formatDateIndo(start_datetime)}"`);
      }

      const detailText = changes.length > 0
        ? `Mengedit jadwal ${existingMaintenance.title}.\n${changes.join('\n')}`
        : `Mengedit jadwal ${existingMaintenance.title}`;

      await createAuditLog({
        userId,
        action: 'UPDATE',
        entityType: 'Schedule',
        entityId: id,
        module: 'Schedules',
        details: detailText,
        data: { changes },
        req,
      });
    } catch (logErr) {
      console.warn('Gagal mencatat audit log schedule update:', logErr.message);
    }

    return res.json({
      success: true,
      message: 'Jadwal berhasil diupdate',
      data: updatedM,
    });
  } catch (err) {
    next(err);
  }
});

// =========================================================================
// 6. DELETE /api/v1/schedules/:id
// Soft delete maintenance atau reset jadwal proyek
// =========================================================================
schedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existingMaintenance = await prisma.maintenances.findFirst({ where: { id, deleted_at: null } });
    if (existingMaintenance) {
      await prisma.maintenances.update({ where: { id }, data: { deleted_at: new Date() } });

      const userId = req.headers['x-user-id'];
      const dateStr = formatDateIndo(existingMaintenance.start_datetime);
      const detailText = `Menghapus jadwal ${existingMaintenance.title}.\nTanggal: ${dateStr}${existingMaintenance.description ? '\nDeskripsi: ' + existingMaintenance.description : ''}`;

      await createAuditLog({
        userId,
        action: 'DELETE',
        entityType: 'Schedule',
        entityId: id,
        module: 'Schedules',
        details: detailText,
        data: { title: existingMaintenance.title, start_datetime: existingMaintenance.start_datetime },
        req,
      });

      return res.json({ success: true, message: 'Jadwal berhasil dihapus' });
    }

    const existingOrder = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (existingOrder) {
      await prisma.orders.update({
        where: { id },
        data: {
          start_date_project: null,
          end_date_project: null,
        },
      });
      return res.json({ success: true, message: 'Jadwal proyek berhasil direset' });
    }

    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
  } catch (err) {
    next(err);
  }
});

export default schedulesRouter;
