import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateOrderNumber } from '../lib/orderHelpers.js';

export const maintenancesRouter = Router();

// GET /api/v1/maintenances/completed-orders
// Mengambil daftar order yang berstatus 'completed' untuk dropdown pembuatan maintenance
maintenancesRouter.get('/completed-orders', async (_req, res, next) => {
  try {
    const completedOrders = await prisma.orders.findMany({
      where: {
        deleted_at: null,
        status: 'completed',
      },
      select: {
        id: true,
        order_number: true,
        customer_name_snapshot: true,
        start_date_project: true,
        end_date_project: true,
        team_id: true,
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
        order_services: {
          select: {
            id: true,
            service_name_snapshot: true,
          },
        },
        order_assignments: {
          include: {
            jobs: { select: { id: true, name: true } },
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    const formatted = completedOrders.map((o) => ({
      id: o.id.toString(),
      order_number: o.order_number,
      customer_name: o.customer_name_snapshot || '-',
      team_name: o.teams?.name || '-',
      team_id: o.team_id ? o.team_id.toString() : null,
      services: o.order_services.map((s) => s.service_name_snapshot),
      assigned_members: o.order_assignments.map((a) => ({
        user_id: a.team_members?.users?.id ? a.team_members.users.id.toString() : null,
        user_name: a.team_members?.users?.name || '-',
        user_email: a.team_members?.users?.email || '-',
        job_id: a.jobs?.id ? a.jobs.id.toString() : null,
        job_name: a.jobs?.name || '-',
      })),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/maintenances
// Mengambil seluruh data maintenance untuk Admin (termasuk relasi ke child order & parent order)
maintenancesRouter.get('/', async (_req, res, next) => {
  try {
    const list = await prisma.maintenances.findMany({
      where: { deleted_at: null },
      include: {
        orders: {
          include: {
            parent_order: {
              select: {
                id: true,
                order_number: true,
                customer_name_snapshot: true,
              },
            },
            order_assignments: {
              include: {
                jobs: { select: { name: true } },
                team_members: {
                  include: { users: { select: { id: true, name: true } } },
                },
              },
            },
            customers: {
              select: { name: true, phone: true, email: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = list.map((m) => {
      const order = m.orders;
      const parent = order?.parent_order;
      const assign = order?.order_assignments?.[0];

      return {
        id: m.id.toString(),
        title: m.title,
        description: m.description || '-',
        status: m.status,
        notes: m.notes || '',
        start_datetime: m.start_datetime ? new Date(m.start_datetime).toISOString().split('T')[0] : '-',
        end_datetime: m.end_datetime ? new Date(m.end_datetime).toISOString().split('T')[0] : '-',
        created_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '-',
        order_id: order?.id ? order.id.toString() : null,
        order_number: order?.order_number || '-',
        parent_order_id: parent?.id ? parent.id.toString() : null,
        parent_order_number: parent?.order_number || null,
        customer_name: order?.customer_name_snapshot || order?.customers?.name || parent?.customer_name_snapshot || '-',
        assigned_developer: assign?.team_members?.users?.name || '-',
        assigned_job: assign?.jobs?.name || '-',
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/maintenances
// Admin membuat tiket maintenance kendala order selesai
// Otomatis membuat Order Turunan (Child Order) dengan parent_order_id & penugasan developer
const createMaintenanceSchema = z.object({
  parent_order_id: z.coerce.number().int().positive(),
  job_id: z.coerce.number().int().positive(),
  developer_user_id: z.coerce.number().int().positive(),
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  start_datetime: z.string().optional().nullable(),
  end_datetime: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('in_progress'),
});

maintenancesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi form maintenance gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      parent_order_id,
      job_id,
      developer_user_id,
      title,
      description,
      start_datetime,
      end_datetime,
      status,
    } = parsed.data;

    const parentId = BigInt(parent_order_id);
    const parentOrder = await prisma.orders.findFirst({
      where: { id: parentId, deleted_at: null },
      include: {
        customers: true,
        order_services: true,
      },
    });

    if (!parentOrder) {
      return res.status(404).json({ success: false, message: 'Order induk tidak ditemukan' });
    }

    if (parentOrder.status !== 'completed') {
      return res.status(422).json({
        success: false,
        message: 'Hanya order dengan status Selesai (Completed) yang dapat ditambahkan tiket maintenance.',
      });
    }

    const job = await prisma.jobs.findUnique({
      where: { id: BigInt(job_id) },
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Posisi/Job error tidak ditemukan' });
    }

    // Cari atau pastikan team_member_id untuk developer terpilih
    let teamMember = null;
    if (parentOrder.team_id) {
      teamMember = await prisma.team_members.findFirst({
        where: {
          user_id: BigInt(developer_user_id),
          team_id: parentOrder.team_id,
        },
      });
    }

    if (!teamMember) {
      teamMember = await prisma.team_members.findFirst({
        where: {
          user_id: BigInt(developer_user_id),
        },
      });
    }

    if (!teamMember) {
      return res.status(422).json({
        success: false,
        message: 'Developer terpilih belum terdaftar dalam keanggotaan tim mana pun.',
      });
    }

    const startDate = start_datetime ? new Date(start_datetime) : new Date();
    const endDate = end_datetime ? new Date(end_datetime) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate nomor order turunan
      const childOrderNumber = await generateOrderNumber(tx);

      // 2. Buat Order Turunan (Child Order)
      const childOrder = await tx.orders.create({
        data: {
          order_number: childOrderNumber,
          parent_order_id: parentOrder.id,
          customer_id: parentOrder.customer_id,
          pic_id: parentOrder.pic_id,
          sales_id: parentOrder.sales_id,
          team_id: parentOrder.team_id || teamMember.team_id,
          customer_name_snapshot: parentOrder.customer_name_snapshot,
          customer_address_snapshot: parentOrder.customer_address_snapshot,
          pic_name_snapshot: parentOrder.pic_name_snapshot,
          pic_email_snapshot: parentOrder.pic_email_snapshot,
          status: 'in_progress',
          payment_status: 'paid',
          subtotal: 0,
          discount: 0,
          tax: 0,
          grand_total: 0,
          start_date_project: startDate,
          end_date_project: endDate,
          notes: `Tiket Maintenance: ${title} (Order Turunan dari ${parentOrder.order_number})`,
        },
      });

      // 3. Salin snapshot layanan jika ada
      if (parentOrder.order_services && parentOrder.order_services.length > 0) {
        for (const s of parentOrder.order_services) {
          await tx.order_services.create({
            data: {
              order_id: childOrder.id,
              service_id: s.service_id,
              service_name_snapshot: `[Maintenance] ${s.service_name_snapshot}`,
              quantity: 1,
              price_deal: 0,
              subtotal: 0,
              status: 'active',
            },
          });
        }
      }

      // 4. Buat penugasan (order_assignments) untuk developer yang menangani perbaikan
      const assignment = await tx.order_assignments.create({
        data: {
          order_id: childOrder.id,
          team_member_id: teamMember.id,
          job_id: BigInt(job_id),
          is_lead: true,
          phase_order: 1,
          start_date: startDate,
          end_date: endDate,
        },
      });

      // 5. Buat initial progress di progress_order
      await tx.progress_order.create({
        data: {
          assignment_id: assignment.id,
          title: `Perbaikan Kendala: ${title}`,
          status: status === 'completed' ? 'completed' : 'in_progress',
          progress_percentage: status === 'completed' ? 100 : 0,
          notes: `Laporan kendala klien: ${description}`,
          started_at: startDate,
        },
      });

      // 6. Buat tiket di tabel maintenances
      const maintenance = await tx.maintenances.create({
        data: {
          order_id: childOrder.id,
          title,
          description,
          status,
          start_datetime: startDate,
          end_datetime: endDate,
          notes: `Ditugaskan ke ${teamMember.user_id} (${job.name}). Menunggu perbaikan teknis.`,
        },
      });

      // 7. Catat order status history
      await tx.order_status_history.create({
        data: {
          order_id: childOrder.id,
          from_status: null,
          to_status: 'in_progress',
          notes: `Order pemeliharaan turunan dibuat dari order induk ${parentOrder.order_number} untuk menangani kendala ${title}`,
        },
      });

      await tx.order_status_history.create({
        data: {
          order_id: parentOrder.id,
          from_status: 'completed',
          to_status: 'completed',
          notes: `Laporan kendala klien diterima. Order pemeliharaan turunan ${childOrderNumber} telah diterbitkan untuk penanganan developer.`,
        },
      });

      return { childOrder, maintenance, assignment };
    });

    res.status(201).json({
      success: true,
      message: 'Tiket maintenance dan order turunan berhasil dibuat!',
      data: {
        maintenance_id: result.maintenance.id.toString(),
        child_order_id: result.childOrder.id.toString(),
        child_order_number: result.childOrder.order_number,
        parent_order_number: parentOrder.order_number,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/maintenances/:id (Soft delete)
maintenancesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.maintenances.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true, message: 'Tiket maintenance berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

