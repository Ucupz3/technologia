import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateOrderNumber } from '../lib/orderHelpers.js';

export const ordersRouter = Router();

// ============ OPTIONS ============
ordersRouter.get('/options/customers', async (_req, res, next) => {
  try {
    const data = await prisma.customers.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/services', async (_req, res, next) => {
  try {
    const data = await prisma.services.findMany({
      where: { deleted_at: null, status: 'active' },
      select: { id: true, name: true, default_price: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/sales', async (_req, res, next) => {
  try {
    const data = await prisma.users.findMany({
      where: { deleted_at: null, status: 'active', roles: { name: { in: ['CS', 'Sales'] } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ✅ GET options teams (termasuk data member & job-nya)
ordersRouter.get('/options/teams', async (_req, res, next) => {
  try {
    const data = await prisma.teams.findMany({
      where: { deleted_at: null, status: 'active' },
      select: {
        id: true,
        name: true,
        team_members: {
          where: { status: 'active' },
          select: {
            id: true,
            users: {
              select: {
                id: true, 
                name: true,
                user_jobs: {
                  include: { jobs: { select: { id: true, name: true } } }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/jobs', async (_req, res, next) => {
  try {
    const data = await prisma.jobs.findMany({
      where: { deleted_at: null, status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ GET LIST ============
ordersRouter.get('/', async (_req, res, next) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        customers: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      include: {
        customers: true,
        teams: true,
        order_assignments: {
          include: {
            team_members: { include: { users: true } },
            jobs: true,
          },
        },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ============ CREATE ORDER ============
const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  service_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).default(1),
  notes: z.string().optional().nullable(),
  // ✅ Tambahan: Menerima array assignments dari frontend
  assignments: z.array(z.object({
    team_member_id: z.coerce.number().int().positive(),
    job_id: z.coerce.number().int().positive(),
    is_lead: z.boolean().optional().default(false)
  })).optional()
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });

    const { customer_id, sales_id, team_id, service_id, quantity, notes, assignments } = parsed.data;

    const customer = await prisma.customers.findFirst({ where: { id: BigInt(customer_id), deleted_at: null } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    const service = await prisma.services.findFirst({ where: { id: BigInt(service_id), deleted_at: null } });
    if (!service) return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });

    const price = Number(service.default_price);
    const subtotal = price * quantity;

    const order = await prisma.$transaction(async (tx) => {
      const orderNum = await generateOrderNumber(tx);
      
      // 1. Buat Order
      const newOrder = await tx.orders.create({
        data: {
          order_number: orderNum,
          customer_id: BigInt(customer_id),
          sales_id: sales_id ? BigInt(sales_id) : null,
          team_id: team_id ? BigInt(team_id) : null,
          customer_name_snapshot: customer.name,
          status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          grand_total: subtotal,
          notes: notes || null,
        },
      });

      // 2. Buat Order Service
      await tx.order_services.create({
        data: {
          order_id: newOrder.id,
          service_id: service.id,
          service_name_snapshot: service.name,
          price_deal: price,
          quantity,
          subtotal,
          status: 'active',
        },
      });

      // 3. ✅ SIMPAN ORDER ASSIGNMENTS (DARI FRONTEND)
      if (assignments && assignments.length > 0) {
        for (const a of assignments) {
          await tx.order_assignments.create({
            data: {
              order_id: newOrder.id,
              team_member_id: BigInt(a.team_member_id),
              job_id: BigInt(a.job_id),
              is_lead: a.is_lead,
              assigned_at: new Date(),
            }
          });
        }
      }

      // 4. Catat History
      await tx.order_status_history.create({
        data: {
          order_id: newOrder.id,
          from_status: null,
          to_status: 'pending',
          changed_by: sales_id ? BigInt(sales_id) : null,
          notes: 'Order dibuat',
        },
      });

      return newOrder;
    });

    res.status(201).json({ success: true, data: order, message: 'Order berhasil dibuat & Tim ditugaskan' });
  } catch (err) { next(err); }
});

// ============ UPDATE ORDER ============
const updateSchema = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const id = BigInt(req.params.id);
    const data = { ...parsed.data };
    if (data.customer_id) data.customer_id = BigInt(data.customer_id);
    if (data.team_id !== undefined) data.team_id = data.team_id ? BigInt(data.team_id) : null;

    const order = await prisma.orders.update({ where: { id }, data });
    res.json({ success: true, data: order, message: 'Order berhasil diupdate' });
  } catch (err) { next(err); }
});

// ============ DELETE ORDER ============
ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.orders.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Order berhasil dihapus' });
  } catch (err) { next(err); }
});