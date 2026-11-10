import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const schedulesRouter = Router();
// GET /api/v1/schedules (Ambil semua order yang punya tanggal proyek)
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
// GET /api/v1/schedules (List Jadwal)
schedulesRouter.get('/', async (_req, res, next) => {
  try {
    const schedules = await prisma.maintenances.findMany({
      where: { deleted_at: null },
      include: {
        orders: { select: { id: true, order_number: true, customer_name_snapshot: true } }
      },
      orderBy: { start_datetime: 'desc' },
    });

    // Ambil list order untuk form dropdown
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
    const data = { ...parsed.data };
    if (data.start_datetime) data.start_datetime = new Date(data.start_datetime);
    if (data.end_datetime !== undefined) data.end_datetime = data.end_datetime ? new Date(data.end_datetime) : null;

    const schedule = await prisma.maintenances.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: schedule, message: 'Jadwal berhasil diupdate' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/schedules/:id
schedulesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.maintenances.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (err) { next(err); }
});