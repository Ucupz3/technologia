import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const schedulesRouter = Router();

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
            description: `${a.teams?.name || 'Tim Lapangan'} memiliki 2 tugas bersamaan pada waktu overlapping di ${a.customer_name_snapshot} & ${b.customer_name_snapshot}.`
          });
        }
      }
    }
  }
  return conflicts;
}

// ============ GET /api/v1/schedules ============
schedulesRouter.get('/', async (_req, res, next) => {
  try {
    const orders = await prisma.orders.findMany({
      where: {
        deleted_at: null,
        status: { notIn: ['cancelled'] },
      },
      include: {
        teams: {
          include: {
            team_members: {
              where: { status: 'active' },
              include: { users: true }
            }
          }
        },
        order_services: {
          where: { deleted_at: null },
          include: { services: true }
        },
        maintenances: {
          where: { deleted_at: null }
        },
        customers: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const teams = await prisma.teams.findMany({
      where: { deleted_at: null, status: 'active' },
      include: {
        team_members: {
          where: { status: 'active' },
          include: { users: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    const conflicts = detectConflicts(orders);
    const conflictedOrderIds = new Set();
    conflicts.forEach(c => {
      conflictedOrderIds.add(c.orderA_id);
      conflictedOrderIds.add(c.orderB_id);
    });

    const formattedSchedules = orders.map(o => {
      const isConflicted = conflictedOrderIds.has(o.id.toString());
      const relevantConflict = conflicts.find(c => c.orderA_id === o.id.toString() || c.orderB_id === o.id.toString());

      const members = o.teams?.team_members || [];
      const leadMember = members.find(m => m.users?.role_id === 1 || m.users?.role_id === 2) || members[0];
      const leadName = leadMember?.users?.name || 'Lead Teknisi';

      const primaryService = o.order_services[0];
      const serviceName = primaryService?.service_name_snapshot || 'Layanan IT & Infrastruktur';
      const projectDetail = primaryService?.services?.description || o.notes || 'Pengerjaan teknis operasional lapangan';

      let scheduledDate = 'Belum Dijadwalkan';
      let scheduledTime = '09:00 - 15:00 WIB';

      if (o.start_date_project) {
        const d = new Date(o.start_date_project);
        scheduledDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        if (o.end_date_project) {
          const dEnd = new Date(o.end_date_project);
          scheduledTime = `${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${dEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
        }
      }

      let progressPercent = 20;
      let progressStage = 'Preparation';
      if (o.status === 'completed') {
        progressPercent = 100;
        progressStage = 'Selesai (B.A. Ditandatangani)';
      } else if (o.status === 'in_progress') {
        progressPercent = 65;
        progressStage = 'Pengerjaan Lapangan';
      } else if (o.status === 'ready') {
        progressPercent = 90;
        progressStage = 'Final Stage Testing';
      }

      return {
        id: Number(o.id),
        order_number: o.order_number,
        customer_name: o.customer_name_snapshot || o.customers?.name || 'Klien Tekna',
        customer_address: o.customer_address_snapshot || o.customers?.address || 'Lokasi Klien',
        customer_pic: o.pic_name_snapshot || o.customers?.contact_person || 'PIC Klien',
        pic_phone: o.customers?.phone || '—',
        pic_email: o.pic_email_snapshot || o.customers?.email || '—',
        service_name: serviceName,
        project_detail: projectDetail,
        team_id: o.team_id ? Number(o.team_id) : null,
        team_name: o.teams?.name || 'Belum Ditugaskan',
        team_initial: o.teams ? o.teams.name.substring(0, 2).toUpperCase() : 'TX',
        team_lead: leadName,
        team_members_count: members.length,
        team_members: members.map(m => m.users?.name || 'Teknisi'),
        progress_stage: progressStage,
        progress_percent: progressPercent,
        start_date_project: o.start_date_project,
        end_date_project: o.end_date_project,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        has_conflict: isConflicted,
        conflict_desc: relevantConflict?.description || null,
        status: o.status,
        status_label: o.status === 'completed' ? 'Selesai' : o.status === 'in_progress' ? 'Diproses' : o.status === 'ready' ? 'Siap' : 'Pending',
        notes: o.notes || '',
        order_services: o.order_services,
      };
    });

    res.json({
      success: true,
      data: formattedSchedules,
      orders: orders.map(o => ({
        id: Number(o.id),
        order_number: o.order_number,
        customer_name: o.customer_name_snapshot || o.customers?.name,
        customer_address: o.customer_address_snapshot || o.customers?.address,
        services: o.order_services.map(s => s.service_name_snapshot).join(', ') || 'Layanan IT',
        primary_service: o.order_services[0]?.service_name_snapshot || 'Layanan IT & Infrastruktur',
        team_id: o.team_id ? Number(o.team_id) : null,
        start_date_project: o.start_date_project,
        end_date_project: o.end_date_project,
      })),
      teams: teams.map(t => {
        const mems = t.team_members || [];
        const lead = mems.find(m => m.users?.role_id === 1 || m.users?.role_id === 2) || mems[0];
        return {
          id: Number(t.id),
          name: t.name,
          description: t.description,
          members_count: mems.length,
          lead_name: lead?.users?.name || 'PIC Tim',
          lead_id: lead?.users?.id ? `TECH-00${lead.users.id}` : 'TECH-001',
          members: mems.map(m => m.users?.name),
        };
      }),
      conflicts,
    });
  } catch (err) {
    next(err);
  }
});

// ============ POST /api/v1/schedules ============
const scheduleSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  start_date_project: z.string(),
  end_date_project: z.string().optional().nullable(),
  status: z.string().optional(),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = scheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi form jadwal gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { order_id, team_id, start_date_project, end_date_project, status, title, notes } = parsed.data;

    const startDate = new Date(start_date_project);
    const endDate = end_date_project ? new Date(end_date_project) : null;

    const updatedOrder = await prisma.orders.update({
      where: { id: BigInt(order_id) },
      data: {
        team_id: team_id ? BigInt(team_id) : undefined,
        start_date_project: startDate,
        end_date_project: endDate,
        status: (status || 'in_progress'),
        notes: notes || undefined,
      },
    });

    if (title) {
      await prisma.maintenances.create({
        data: {
          order_id: BigInt(order_id),
          title: title,
          description: notes || 'Alokasi jadwal proyek teknis',
          start_datetime: startDate,
          end_datetime: endDate,
          status: 'scheduled',
          notes: notes || null,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Jadwal dan alokasi tim berhasil disimpan ke database',
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
});

// ============ PUT /api/v1/schedules/:id ============
const updateScheduleSchema = z.object({
  team_id: z.coerce.number().int().positive().optional().nullable(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
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
    const { team_id, start_date_project, end_date_project, status, notes } = parsed.data;

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

    res.json({
      success: true,
      message: 'Jadwal penugasan tim berhasil diperbarui',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ============ DELETE /api/v1/schedules/:id ============
schedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.orders.update({
      where: { id },
      data: {
        start_date_project: null,
        end_date_project: null,
      },
    });
    res.json({ success: true, message: 'Jadwal proyek berhasil direset' });
  } catch (err) {
    next(err);
  }
});
