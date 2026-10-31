import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createAuditLog, formatDateIndo } from '../lib/auditHelper.js';

export const schedulesRouter = Router();

// GET /api/v1/schedules (Ambil semua order yang punya tanggal proyek untuk kalender)
schedulesRouter.get('/', async (_req, res, next) => {
  try {
    const orders = await prisma.orders.findMany({
      where: {
        deleted_at: null,
        OR: [
          { start_date_project: { not: null } },
          { end_date_project: { not: null } }
        ]
      },
      select: {
        id: true,
        order_number: true,
        customer_name_snapshot: true,
        status: true,
        start_date_project: true,
        end_date_project: true,
      },
      orderBy: { start_date_project: 'asc' },
    });

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// GET /api/v1/schedules/maintenances (List maintenance schedules)
schedulesRouter.get('/maintenances', async (_req, res, next) => {
  try {
    const schedules = await prisma.maintenances.findMany({
      where: { deleted_at: null },
      include: {
        orders: { select: { id: true, order_number: true, customer_name_snapshot: true } }
      },
      orderBy: { start_datetime: 'desc' },
    });

    const orders = await prisma.orders.findMany({
      where: { deleted_at: null, status: { notIn: ['cancelled'] } },
      select: { id: true, order_number: true, customer_name_snapshot: true },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: schedules, orders });
  } catch (err) { next(err); }
});

// POST /api/v1/schedules (Buat Jadwal Baru)
const createSchema = z.object({
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
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });
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

    // Audit log dengan format custom
    const userId = req.headers['x-user-id'];
    const dateStr = formatDateIndo(start_datetime);
    const detailText = `Menambahkan jadwal pada hari ${dateStr}. Judul: ${title}${description ? '. Deskripsi: ' + description : ''}`;
    
    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'Schedule',
      entityId: schedule.id,
      module: 'Schedules',
      details: detailText,
      data: { title, start_datetime, description, status },
      req,
    });

    res.status(201).json({ success: true, data: schedule, message: 'Jadwal berhasil dibuat' });
  } catch (err) { next(err); }
});

// PUT /api/v1/schedules/:id (Edit Jadwal)
const updateSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  start_datetime: z.string().optional(),
  end_datetime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

schedulesRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const id = BigInt(req.params.id);
    const existing = await prisma.maintenances.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    const data = { ...parsed.data };
    if (data.start_datetime) data.start_datetime = new Date(data.start_datetime);
    if (data.end_datetime !== undefined) data.end_datetime = data.end_datetime ? new Date(data.end_datetime) : null;

    const schedule = await prisma.maintenances.update({
      where: { id },
      data,
    });

    // Audit log
    const userId = req.headers['x-user-id'];
    const changes = [];
    if (parsed.data.title && parsed.data.title !== existing.title) changes.push(`Judul: "${existing.title}" → "${parsed.data.title}"`);
    if (parsed.data.description !== undefined && parsed.data.description !== existing.description) {
      changes.push(`Deskripsi: "${existing.description || '-'}" → "${parsed.data.description || '-'}"`);
    }
    if (parsed.data.status && parsed.data.status !== existing.status) changes.push(`Status: "${existing.status}" → "${parsed.data.status}"`);
    if (parsed.data.start_datetime && new Date(parsed.data.start_datetime).getTime() !== new Date(existing.start_datetime).getTime()) {
      changes.push(`Tanggal: "${formatDateIndo(existing.start_datetime)}" → "${formatDateIndo(parsed.data.start_datetime)}"`);
    }

    const detailText = changes.length > 0 
      ? `Mengedit jadwal ${existing.title}.\n${changes.join('\n')}`
      : `Mengedit jadwal ${existing.title}`;
    
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

    res.json({ success: true, data: schedule, message: 'Jadwal berhasil diupdate' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/schedules/:id
schedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.maintenances.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });

    await prisma.maintenances.update({ where: { id }, data: { deleted_at: new Date() } });

    // Audit log
    const userId = req.headers['x-user-id'];
    const dateStr = formatDateIndo(existing.start_datetime);
    const detailText = `Menghapus jadwal ${existing.title}.
Tanggal: ${dateStr}${existing.description ? '\nDeskripsi: ' + existing.description : ''}`;
    
    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'Schedule',
      entityId: id,
      module: 'Schedules',
      details: detailText,
      data: { title: existing.title, start_datetime: existing.start_datetime },
      req,
    });

    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (err) { next(err); }
});