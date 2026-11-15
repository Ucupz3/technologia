import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateOrderNumber } from '../lib/orderHelpers.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const maintenancesRouter = Router();

const maintenanceUploadDir = './public/uploads/maintenance';
if (!fs.existsSync(maintenanceUploadDir)) {
  fs.mkdirSync(maintenanceUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, maintenanceUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'error-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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
                progress_order: {
                  where: { deleted_at: null },
                  orderBy: { created_at: 'desc' },
                  take: 1,
                  include: { progress_attachments: true },
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
      const devProgress = assign?.progress_order?.[0] || null;

      // Status resmi tiket: jika sempat diubah completed sebelum Super Admin mengesahkan (order.status !== 'completed'),
      // pulihkan status resmi ke order.status || 'in_progress'
      const officialStatus =
        m.status === 'completed' && order?.status !== 'completed'
          ? order?.status || 'in_progress'
          : m.status;

      let cleanNotes = m.notes || '';
      let errorImages = [];
      if (devProgress?.progress_attachments && devProgress.progress_attachments.length > 0) {
        errorImages = devProgress.progress_attachments.map((att) => att.file_path);
      }
      if (m.notes) {
        try {
          const parsed = JSON.parse(m.notes);
          if (typeof parsed === 'object' && parsed !== null) {
            if (Array.isArray(parsed.error_images)) errorImages = parsed.error_images;
            else if (parsed.error_image) errorImages = [parsed.error_image];
            cleanNotes = parsed.admin_notes || parsed.evaluation_note || parsed.notes || '';
          }
        } catch {}
      }

      return {
        id: m.id.toString(),
        title: m.title,
        description: m.description || '-',
        status: officialStatus,
        developer_progress_status: devProgress?.status || (officialStatus === 'completed' ? 'completed' : 'scheduled'),
        developer_progress_percentage: devProgress?.progress_percentage ?? (officialStatus === 'completed' ? 100 : 0),
        notes: cleanNotes,
        error_image: errorImages[0] || null,
        error_images: errorImages,
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

maintenancesRouter.post('/', upload.any(), async (req, res, next) => {
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
          notes: description ? description.trim() : (title ? title.trim() : ''),
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

      // 5. Buat initial progress di progress_order (enum progress_order_status: pending, in_progress, completed, cancelled)
      const initProgress = await tx.progress_order.create({
        data: {
          assignment_id: assignment.id,
          title: `Perbaikan Kendala: ${title}`,
          status: status === 'completed' ? 'completed' : 'pending',
          progress_percentage: status === 'completed' ? 100 : 0,
          notes: `Laporan kendala klien: ${description}`,
          started_at: startDate,
        },
      });

      const uploadedFiles = req.files || (req.file ? [req.file] : []);
      const uploadedFilePaths = [];
      const uploadedFileNames = [];

      if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const filePath = `/uploads/maintenance/${file.filename}`;
          uploadedFilePaths.push(filePath);
          uploadedFileNames.push(file.originalname);

          await tx.progress_attachments.create({
            data: {
              progress_id: initProgress.id,
              file_path: filePath,
              file_name: file.originalname,
              file_type: file.mimetype || 'image/jpeg',
              file_size: BigInt(file.size || 0),
            },
          });
        }
      }

      // 6. Buat tiket di tabel maintenances
      const maintenanceNotes = uploadedFilePaths.length > 0
        ? JSON.stringify({
            error_images: uploadedFilePaths,
            error_image: uploadedFilePaths[0],
            file_names: uploadedFileNames,
          })
        : null;

      const maintenance = await tx.maintenances.create({
        data: {
          order_id: childOrder.id,
          title,
          description,
          status,
          start_datetime: startDate,
          end_datetime: endDate,
          notes: maintenanceNotes,
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

// GET /api/v1/maintenances/:id
// Mengambil detail lengkap satu tiket maintenance (termasuk order induk, tim awal, dan histori)
// Mendukung pencarian via ID angka tiket maintenance, ID order, maupun kode string nomor order (contoh: ORD-20261106-003)
maintenancesRouter.get('/:id', async (req, res, next) => {
  try {
    const rawParam = req.params.id ? String(req.params.id).trim() : '';
    const isNumeric = /^\d+$/.test(rawParam);

    let whereClause = null;
    if (isNumeric) {
      const numericId = BigInt(rawParam);
      whereClause = {
        deleted_at: null,
        OR: [
          { id: numericId },
          { order_id: numericId },
        ],
      };
    } else {
      whereClause = {
        deleted_at: null,
        OR: [
          { orders: { order_number: rawParam } },
          { orders: { parent_order: { order_number: rawParam } } },
        ],
      };
    }

    const m = await prisma.maintenances.findFirst({
      where: whereClause,
      include: {
        orders: {
          include: {
            parent_order: {
              include: {
                customers: true,
                order_services: true,
                order_assignments: {
                  include: {
                    jobs: true,
                    team_members: {
                      include: { users: { select: { id: true, name: true, email: true } } },
                    },
                  },
                },
              },
            },
            customers: true,
            order_services: true,
            order_assignments: {
              include: {
                jobs: true,
                team_members: {
                  include: { users: { select: { id: true, name: true, email: true } } },
                },
                progress_order: {
                  where: { deleted_at: null },
                  orderBy: { created_at: 'desc' },
                  take: 1,
                  include: { progress_attachments: true },
                },
              },
            },
            order_status_history: {
              orderBy: { created_at: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!m) {
      return res.status(404).json({
        success: false,
        message: `Tiket maintenance tidak ditemukan untuk ID / Nomor Order '${rawParam}'`,
      });
    }

    const childOrder = m.orders;
    const parentOrder = childOrder?.parent_order || null;
    const customer = childOrder?.customers || parentOrder?.customers || null;
    const currentAssign = childOrder?.order_assignments?.[0];
    const devProgress = currentAssign?.progress_order?.[0] || null;

    // Perbaiki inkonsistensi jika tiket sempat tertulis completed oleh bug lama tapi order anak belum completed
    let officialStatus = m.status;
    if (m.status === 'completed' && childOrder?.status !== 'completed') {
      officialStatus = childOrder?.status || 'in_progress';
      try {
        await prisma.maintenances.update({
          where: { id: m.id },
          data: { status: officialStatus },
        });
      } catch (e) {
        console.error('Failed to auto-repair maintenance status:', e);
      }
      m.status = officialStatus;
    }

    const originalTeam = (parentOrder?.order_assignments || []).map((a) => ({
      user_id: a.team_members?.users?.id?.toString() || null,
      name: a.team_members?.users?.name || '-',
      email: a.team_members?.users?.email || '-',
      job: a.jobs?.name || '-',
    }));

    let cleanNotes = m.notes || '';
    let errorImages = [];
    if (devProgress?.progress_attachments && devProgress.progress_attachments.length > 0) {
      errorImages = devProgress.progress_attachments.map((att) => att.file_path);
    }
    if (m.notes) {
      try {
        const parsed = JSON.parse(m.notes);
        if (typeof parsed === 'object' && parsed !== null) {
          if (Array.isArray(parsed.error_images)) errorImages = parsed.error_images;
          else if (parsed.error_image) errorImages = [parsed.error_image];
          cleanNotes = parsed.admin_notes || parsed.evaluation_note || parsed.notes || '';
        }
      } catch {}
    }

    res.json({
      success: true,
      data: {
        id: m.id.toString(),
        title: m.title,
        description: m.description || '-',
        status: officialStatus,
        notes: cleanNotes,
        error_image: errorImages[0] || null,
        error_images: errorImages,
        developer_progress: {
          status: devProgress?.status || (officialStatus === 'completed' ? 'completed' : 'scheduled'),
          progress_percentage: devProgress?.progress_percentage ?? (officialStatus === 'completed' ? 100 : 0),
          notes: devProgress?.notes || '',
          updated_at: devProgress?.updated_at ? new Date(devProgress.updated_at).toISOString().replace('T', ' ').slice(0, 16) : null,
        },
        start_datetime: m.start_datetime ? new Date(m.start_datetime).toISOString().split('T')[0] : '-',
        end_datetime: m.end_datetime ? new Date(m.end_datetime).toISOString().split('T')[0] : '-',
        created_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '-',
        updated_at: m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : '-',
        child_order: {
          id: childOrder?.id?.toString() || null,
          order_number: childOrder?.order_number || '-',
          status: childOrder?.status || '-',
          notes: childOrder?.notes || '',
        },
        parent_order: parentOrder
          ? {
              id: parentOrder.id.toString(),
              order_number: parentOrder.order_number,
              status: parentOrder.status,
              start_date: parentOrder.start_date_project
                ? new Date(parentOrder.start_date_project).toISOString().split('T')[0]
                : '-',
              end_date: parentOrder.end_date_project
                ? new Date(parentOrder.end_date_project).toISOString().split('T')[0]
                : '-',
              services: (parentOrder.order_services || []).map((s) => s.service_name_snapshot),
            }
          : null,
        customer: {
          name: childOrder?.customer_name_snapshot || customer?.name || '-',
          email: customer?.email || '-',
          phone: customer?.phone || '-',
          address: childOrder?.customer_address_snapshot || customer?.address || '-',
        },
        assigned_developer: {
          user_id: currentAssign?.team_members?.users?.id?.toString() || null,
          name: currentAssign?.team_members?.users?.name || '-',
          job: currentAssign?.jobs?.name || '-',
        },
        original_team: originalTeam,
        history: (childOrder?.order_status_history || [])
          .filter((h) => !h.from_status || h.from_status !== h.to_status)
          .map((h) => ({
            id: h.id.toString(),
            from_status: h.from_status,
            to_status: h.to_status,
            notes: h.notes,
            created_at: h.created_at ? new Date(h.created_at).toISOString().replace('T', ' ').slice(0, 16) : '-',
          })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT & PATCH /api/v1/maintenances/:id (dan /:id/status)
// Update status / catatan tiket maintenance oleh Super Admin atau Admin
const updateMaintenanceHandler = async (req, res, next) => {
  try {
    const rawParam = req.params.id ? String(req.params.id).trim() : '';
    const isNumeric = /^\d+$/.test(rawParam);
    const { status, notes, start_datetime, end_datetime } = req.body;

    let currentM = null;
    if (isNumeric) {
      const numericId = BigInt(rawParam);
      currentM = await prisma.maintenances.findFirst({
        where: {
          deleted_at: null,
          OR: [{ id: numericId }, { order_id: numericId }],
        },
        include: { orders: true },
      });
    } else {
      currentM = await prisma.maintenances.findFirst({
        where: {
          deleted_at: null,
          OR: [
            { orders: { order_number: rawParam } },
            { orders: { parent_order: { order_number: rawParam } } },
          ],
        },
        include: { orders: true },
      });
    }

    if (!currentM) {
      return res.status(404).json({
        success: false,
        message: `Tiket maintenance tidak ditemukan untuk ID / Nomor Order '${rawParam}'`,
      });
    }

    const prevStatus = currentM.orders?.status || currentM.status;

    let newNotes = notes !== undefined ? notes : undefined;
    if (notes !== undefined && currentM.notes) {
      try {
        const parsed = JSON.parse(currentM.notes);
        if (typeof parsed === 'object' && parsed !== null && (parsed.error_images || parsed.error_image)) {
          parsed.admin_notes = notes || '';
          newNotes = JSON.stringify(parsed);
        }
      } catch {}
    }

    const updated = await prisma.maintenances.update({
      where: { id: currentM.id },
      data: {
        status: status || undefined,
        notes: newNotes,
        start_datetime: start_datetime ? new Date(start_datetime) : undefined,
        end_datetime: end_datetime ? new Date(end_datetime) : undefined,
        updated_at: new Date(),
      },
      include: {
        orders: true,
      },
    });

    // Sinkronkan status order turunan sesuai status yang disahkan oleh Super Admin
    if (status && updated.orders) {
      await prisma.orders.update({
        where: { id: updated.orders.id },
        data: { status },
      });

      // Catat history hanya jika status berubah secara riil
      if (prevStatus !== status) {
        const evalNote = notes && !notes.startsWith('Ditugaskan ke') ? ` Catatan evaluasi: ${notes}` : '';
        await prisma.order_status_history.create({
          data: {
            order_id: updated.orders.id,
            from_status: prevStatus,
            to_status: status,
            notes: `Status tiket maintenance & order turunan disahkan oleh Super Admin menjadi '${status}'.${evalNote}`,
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Data tiket maintenance berhasil diperbarui.',
      data: {
        ...updated,
        id: updated.id.toString(),
        order_id: updated.order_id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

maintenancesRouter.put('/:id', updateMaintenanceHandler);
maintenancesRouter.patch('/:id', updateMaintenanceHandler);
maintenancesRouter.patch('/:id/status', updateMaintenanceHandler);

// DELETE /api/v1/maintenances/:id (Soft delete)
maintenancesRouter.delete('/:id', async (req, res, next) => {
  try {
    const rawParam = req.params.id ? String(req.params.id).trim() : '';
    const isNumeric = /^\d+$/.test(rawParam);

    let currentM = null;
    if (isNumeric) {
      const numericId = BigInt(rawParam);
      currentM = await prisma.maintenances.findFirst({
        where: {
          deleted_at: null,
          OR: [{ id: numericId }, { order_id: numericId }],
        },
      });
    } else {
      currentM = await prisma.maintenances.findFirst({
        where: {
          deleted_at: null,
          OR: [
            { orders: { order_number: rawParam } },
            { orders: { parent_order: { order_number: rawParam } } },
          ],
        },
      });
    }

    if (!currentM) {
      return res.status(404).json({
        success: false,
        message: `Tiket maintenance tidak ditemukan untuk ID / Nomor Order '${rawParam}'`,
      });
    }

    await prisma.maintenances.update({
      where: { id: currentM.id },
      data: { deleted_at: new Date() },
    });
    res.json({ success: true, message: 'Tiket maintenance berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

