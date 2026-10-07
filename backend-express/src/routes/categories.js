import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const categoriesRouter = Router();

// GET /api/v1/service-categories
categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await prisma.service_categories.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        created_at: true,
        _count: { select: { services: true } },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      status: c.status,
      service_count: c._count.services,
      created_at: c.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/service-categories/:id
categoriesRouter.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.service_categories.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        created_at: true,
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/service-categories
const createSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

categoriesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, description, status } = parsed.data;

    const existing = await prisma.service_categories.findUnique({ where: { name } });

    // Kalau ada & aktif → tolak
    if (existing && !existing.deleted_at) {
      return res.status(409).json({ success: false, message: 'Nama kategori sudah dipakai' });
    }

    // Kalau ada & soft-deleted → restore
    if (existing && existing.deleted_at) {
      const category = await prisma.service_categories.update({
        where: { id: existing.id },
        data: {
          description: description || null,
          status,
          deleted_at: null,
        },
        select: { id: true, name: true, description: true, status: true },
      });
      return res.status(201).json({
        success: true,
        data: category,
        message: 'Kategori berhasil dibuat',
      });
    }

    const category = await prisma.service_categories.create({
      data: { name, description: description || null, status },
      select: { id: true, name: true, description: true, status: true },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Kategori berhasil dibuat',
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/service-categories/:id
const updateSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});

categoriesRouter.put('/:id', async (req, res, next) => {
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
    const existing = await prisma.service_categories.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Cek duplikat nama
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const dup = await prisma.service_categories.findUnique({ where: { name: parsed.data.name } });
      if (dup && dup.id.toString() !== id.toString() && !dup.deleted_at) {
        return res.status(409).json({ success: false, message: 'Nama kategori sudah dipakai' });
      }
    }

    const category = await prisma.service_categories.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
      select: { id: true, name: true, description: true, status: true },
    });

    res.json({ success: true, data: category, message: 'Kategori berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/service-categories/:id (soft delete)
categoriesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const category = await prisma.service_categories.findFirst({
      where: { id, deleted_at: null },
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Cek apakah masih ada service yang pakai
    const serviceCount = await prisma.services.count({
      where: { category_id: id, deleted_at: null },
    });
    if (serviceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori masih dipakai oleh ${serviceCount} service. Hapus service dulu.`,
      });
    }

    await prisma.service_categories.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});