import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const ordersRouter = Router();

// ============ HELPER ============
async function generateOrderNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const count = await prisma.orders.count({
    where: { order_number: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

// ============ OPTIONS (harus di atas /:id) ============
ordersRouter.get('/options/customers', async (_req, res, next) => {
  try {
    const data = await prisma.customers.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/services', async (_req, res, next) => {
  try {
    const data = await prisma.services.findMany({
      where: { deleted_at: null, status: 'active' },
      select: { id: true, name: true, price: true, duration: true,
        service_categories: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/sales', async (_req, res, next) => {
  try {
    const data = await prisma.users.findMany({
      where: { deleted_at: null, status: 'active', roles: { name: 'Sales' } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/team-members', async (_req, res, next) => {
  try {
    const data = await prisma.team_members.findMany({
      where: { deleted_at: null, status: 'active' },
      select: {
        id: true, role: true,
        users: { select: { id: true, name: true, email: true } },
      },
      orderBy: { id: 'asc' },
    });
    const mapped = data.map((m) => ({
      id: m.id,
      name: m.users?.name || 'Unknown',
      email: m.users?.email || null,
      role_in_team: m.role,
    }));
    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
});

// ============ GET LIST ============
ordersRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { order_number: { contains: search } },
        { customers: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.orders.findMany({
      where,
      select: {
        id: true, order_number: true, quantity: true,
        status: true, payment_status: true,
        subtotal: true, discount: true, tax: true, grand_total: true,
        start_date_project: true, end_date_project: true, created_at: true,
        customers: { select: { id: true, name: true } },
        users: { select: { id: true, name: true } },
        services: { select: { id: true, name: true } },
        team_members: {
          select: { id: true, users: { select: { name: true } } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true, order_number: true,
        service_name_snapshot: true, service_price_snapshot: true,
        quantity: true, status: true, payment_status: true,
        subtotal: true, discount: true, tax: true, grand_total: true,
        start_date_project: true, end_date_project: true,
        notes: true, created_at: true, updated_at: true,
        customers: { select: { id: true, name: true, email: true, phone: true } },
        users: { select: { id: true, name: true, email: true } },
        services: { select: { id: true, name: true } },
        team_members: {
          select: { id: true, role: true, users: { select: { name: true } } },
        },
        payments: {
          where: { deleted_at: null },
          select: { id: true, invoice_number: true, status: true, total_paid: true, due_date: true },
        },
        maintenances: {
          where: { deleted_at: null },
          select: { id: true, title: true, status: true, start_datetime: true, end_datetime: true },
        },
      },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ============ CREATE ============
const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  service_id: z.coerce.number().int().positive(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { customer_id, service_id, sales_id, team_id, quantity, discount, tax,
            start_date_project, end_date_project, notes } = parsed.data;

    const service = await prisma.services.findFirst({
      where: { id: BigInt(service_id), deleted_at: null },
    });
    if (!service) return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });

    const price = Number(service.price);
    const subtotal = price * quantity;
    const grandTotal = subtotal - Number(discount) + Number(tax);

    const order = await prisma.orders.create({
      data: {
        order_number: await generateOrderNumber(),
        customer_id: BigInt(customer_id),
        sales_id: sales_id ? BigInt(sales_id) : null,
        service_id: BigInt(service_id),
        team_id: team_id ? BigInt(team_id) : null,
        service_name_snapshot: service.name,
        service_price_snapshot: price,
        quantity,
        status: 'pending',
        payment_status: 'unpaid',
        subtotal,
        discount: Number(discount),
        tax: Number(tax),
        grand_total: grandTotal,
        start_date_project: start_date_project ? new Date(start_date_project) : null,
        end_date_project: end_date_project ? new Date(end_date_project) : null,
        notes: notes || null,
      },
      select: { id: true, order_number: true, status: true, grand_total: true },
    });

    res.status(201).json({ success: true, data: order, message: 'Order berhasil dibuat' });
  } catch (err) { next(err); }
});

// ============ UPDATE ============
const updateSchema = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
  service_id: z.coerce.number().int().positive().optional(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().min(1).optional(),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const existing = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (['completed', 'cancelled'].includes(existing.status)) {
      return res.status(400).json({ success: false, message: 'Order yang sudah selesai/cancel tidak bisa diedit' });
    }

    const data = { ...parsed.data };
    if (data.customer_id) data.customer_id = BigInt(data.customer_id);
    if (data.sales_id !== undefined) data.sales_id = data.sales_id ? BigInt(data.sales_id) : null;
    if (data.team_id !== undefined) data.team_id = data.team_id ? BigInt(data.team_id) : null;

    // Re-calculate kalau service/quantity/discount/tax berubah
    let service = null;
    const serviceId = data.service_id || existing.service_id;
    if (data.service_id) {
      service = await prisma.services.findFirst({
        where: { id: BigInt(data.service_id), deleted_at: null },
      });
      if (!service) return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
      data.service_name_snapshot = service.name;
      data.service_price_snapshot = Number(service.price);
    }

    if (data.service_id || data.quantity || data.discount !== undefined || data.tax !== undefined) {
      const price = service ? Number(service.price) : Number(existing.service_price_snapshot);
      const qty = data.quantity ?? existing.quantity;
      const disc = data.discount ?? Number(existing.discount);
      const tx = data.tax ?? Number(existing.tax);

      data.subtotal = price * qty;
      data.grand_total = data.subtotal - disc + tx;
    }

    if (data.start_date_project !== undefined) {
      data.start_date_project = data.start_date_project ? new Date(data.start_date_project) : null;
    }
    if (data.end_date_project !== undefined) {
      data.end_date_project = data.end_date_project ? new Date(data.end_date_project) : null;
    }

    const order = await prisma.orders.update({
      where: { id },
      data,
      select: { id: true, order_number: true, status: true, grand_total: true },
    });

    res.json({ success: true, data: order, message: 'Order berhasil diupdate' });
  } catch (err) { next(err); }
});

// ============ UPDATE STATUS ============
ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = z.object({
      status: z.enum(['draft', 'pending', 'in_progress', 'completed', 'cancelled']),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Status tidak valid' });
    }

    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const updated = await prisma.orders.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, order_number: true, status: true },
    });

    res.json({ success: true, data: updated, message: 'Status order berhasil diubah' });
  } catch (err) { next(err); }
});

// ============ DELETE ============
ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const paymentCount = await prisma.payments.count({ where: { order_id: id, deleted_at: null } });
    if (paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Order masih punya ${paymentCount} payment terkait. Tidak bisa dihapus.`,
      });
    }

    await prisma.orders.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Order berhasil dihapus' });
  } catch (err) { next(err); }
});