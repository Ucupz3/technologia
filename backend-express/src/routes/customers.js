import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const customersRouter = Router();

// GET /api/v1/customers
customersRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;

    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.customers.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        notes: true,
        sales_id: true,
        created_at: true,
        users: { select: { id: true, name: true, email: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      sales_id: c.sales_id,
      sales_name: c.users?.name || null,
      sales_email: c.users?.email || null,
      order_count: c._count.orders,
      created_at: c.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/v1/customers/sales/options
customersRouter.get('/sales/options', async (_req, res, next) => {
  try {
    const salesUsers = await prisma.users.findMany({
      where: {
        deleted_at: null,
        status: 'active',
        roles: { name: 'Sales' },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: salesUsers });
  } catch (err) { next(err); }
});

// GET /api/v1/customers/:id
customersRouter.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customers.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true, name: true, email: true, phone: true,
        address: true, notes: true, sales_id: true, created_at: true,
        users: { select: { id: true, name: true, email: true } },
        orders: {
          where: { deleted_at: null },
          select: {
            id: true, order_number: true, status: true,
            payment_status: true, grand_total: true, created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    res.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
        sales_id: customer.sales_id,
        sales_name: customer.users?.name || null,
        sales_email: customer.users?.email || null,
        created_at: customer.created_at,
        orders: customer.orders,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/v1/customers
const createSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
});

customersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, phone, address, notes, sales_id } = parsed.data;

    const existing = await prisma.customers.findUnique({ where: { email } });

    if (existing && !existing.deleted_at) {
      return res.status(409).json({ success: false, message: 'Email customer sudah terdaftar' });
    }

    const payload = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
      sales_id: sales_id ? BigInt(sales_id) : null,
    };

    let customer;
    if (existing && existing.deleted_at) {
      customer = await prisma.customers.update({
        where: { id: existing.id },
        data: { ...payload, deleted_at: null },
        select: { id: true, name: true, email: true, phone: true, address: true, notes: true, sales_id: true, created_at: true },
      });
    } else {
      customer = await prisma.customers.create({
        data: payload,
        select: { id: true, name: true, email: true, phone: true, address: true, notes: true, sales_id: true, created_at: true },
      });
    }

    res.status(201).json({ success: true, data: customer, message: 'Customer berhasil dibuat' });
  } catch (err) { next(err); }
});

// PUT /api/v1/customers/:id
const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
});

customersRouter.put('/:id', async (req, res, next) => {
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
    const existing = await prisma.customers.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const dup = await prisma.customers.findUnique({ where: { email: parsed.data.email } });
      if (dup && dup.id.toString() !== id.toString() && !dup.deleted_at) {
        return res.status(409).json({ success: false, message: 'Email customer sudah dipakai' });
      }
    }

    const data = { ...parsed.data };
    if (data.sales_id !== undefined) {
      data.sales_id = data.sales_id ? BigInt(data.sales_id) : null;
    }

    const customer = await prisma.customers.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, address: true, notes: true, sales_id: true, created_at: true },
    });

    res.json({ success: true, data: customer, message: 'Customer berhasil diupdate' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/customers/:id
customersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const customer = await prisma.customers.findFirst({ where: { id, deleted_at: null } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    const orderCount = await prisma.orders.count({ where: { customer_id: id, deleted_at: null } });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Customer masih punya ${orderCount} order. Tidak bisa dihapus.`,
      });
    }

    await prisma.customers.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Customer berhasil dihapus' });
  } catch (err) { next(err); }
});