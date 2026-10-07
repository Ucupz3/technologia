import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const servicesRouter = Router();

// GET /api/v1/services
servicesRouter.get('/', async (_req, res, next) => {
  try {
    const services = await prisma.services.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        category_id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        status: true,
        created_at: true,
        service_categories: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const data = services.map((s) => ({
      id: s.id,
      category_id: s.category_id,
      category_name: s.service_categories?.name || null,
      name: s.name,
      description: s.description,
      price: s.price,
      duration: s.duration,
      status: s.status,
      created_at: s.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/services/categories/options
servicesRouter.get('/categories/options', async (_req, res, next) => {
  try {
    const categories = await prisma.service_categories.findMany({
      where: { deleted_at: null, status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/services/:id
servicesRouter.get('/:id', async (req, res, next) => {
  try {
    const service = await prisma.services.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true,
        category_id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        status: true,
        created_at: true,
        service_categories: { select: { id: true, name: true } },
      },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/services
const createSchema = z.object({
  category_id: z.coerce.number().int().positive(),
  name: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  duration: z.coerce.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

servicesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { category_id, name, description, price, duration, status } = parsed.data;

    // Cek kategori ada
    const category = await prisma.service_categories.findFirst({
      where: { id: BigInt(category_id), deleted_at: null },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const service = await prisma.services.create({
      data: {
        category_id: BigInt(category_id),
        name,
        description: description || null,
        price: Number(price),
        duration: Number(duration),
        status,
      },
      select: {
        id: true, name: true, description: true, price: true,
        duration: true, status: true,
        service_categories: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service berhasil dibuat',
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/services/:id
const updateSchema = z.object({
  category_id: z.coerce.number().int().positive().optional(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  duration: z.coerce.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

servicesRouter.put('/:id', async (req, res, next) => {
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
    const existing = await prisma.services.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }

    const data = { ...parsed.data };
    if (data.category_id) data.category_id = BigInt(data.category_id);
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.duration !== undefined) data.duration = Number(data.duration);

    const service = await prisma.services.update({
      where: { id },
      data,
      select: {
        id: true, name: true, description: true, price: true,
        duration: true, status: true,
        service_categories: { select: { id: true, name: true } },
      },
    });

    res.json({ success: true, data: service, message: 'Service berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/services/:id (soft delete)
servicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const service = await prisma.services.findFirst({
      where: { id, deleted_at: null },
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }

    // Cek dipakai order
    const orderCount = await prisma.orders.count({
      where: { service_id: id, deleted_at: null },
    });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Service masih dipakai oleh ${orderCount} order. Tidak bisa dihapus.`,
      });
    }

    await prisma.services.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, message: 'Service berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});