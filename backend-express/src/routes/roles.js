import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const rolesRouter = Router();

// GET /api/v1/roles
rolesRouter.get('/', async (_req, res, next) => {
  try {
    const roles = await prisma.roles.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        description: true,
        is_default: true,
        created_at: true,
        _count: { select: { users: true } },
      },
      orderBy: { id: 'asc' },
    });

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_default: r.is_default,
      user_count: r._count.users,
      created_at: r.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/roles/:id
rolesRouter.get('/:id', async (req, res, next) => {
  try {
    const role = await prisma.roles.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true,
        name: true,
        description: true,
        is_default: true,
        created_at: true,
        users: {
          where: { deleted_at: null },
          select: { id: true, name: true, email: true, phone: true, status: true },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        is_default: role.is_default,
        created_at: role.created_at,
        users: role.users,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/roles
const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional().nullable(),
});

rolesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, description } = parsed.data;

    const existing = await prisma.roles.findUnique({ where: { name } });

    // Kalau ada & masih aktif → tolak
    if (existing && !existing.deleted_at) {
      return res.status(409).json({ success: false, message: 'Nama role sudah dipakai' });
    }

    // Kalau ada tapi soft-deleted → restore
    if (existing && existing.deleted_at) {
      const role = await prisma.roles.update({
        where: { id: existing.id },
        data: {
          description: description || null,
          deleted_at: null,
          is_default: false,
        },
        select: { id: true, name: true, description: true, is_default: true },
      });
      return res.status(201).json({
        success: true,
        data: role,
        message: 'Role berhasil dibuat',
      });
    }

    // Belum ada → create baru
    const role = await prisma.roles.create({
      data: { name, description: description || null, is_default: false },
      select: { id: true, name: true, description: true, is_default: true },
    });

    res.status(201).json({ success: true, data: role, message: 'Role berhasil dibuat' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/roles/:id
const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(255).optional().nullable(),
});

rolesRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const existing = await prisma.roles.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    }

    if (existing.is_default && parsed.data.name && parsed.data.name !== existing.name) {
      return res.status(400).json({ success: false, message: 'Role default tidak bisa diubah namanya' });
    }

    // Cek duplikat nama (kalau nama diubah)
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const dup = await prisma.roles.findUnique({ where: { name: parsed.data.name } });
      if (dup && dup.id.toString() !== id.toString() && !dup.deleted_at) {
        return res.status(409).json({ success: false, message: 'Nama role sudah dipakai' });
      }
    }

    const role = await prisma.roles.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      },
      select: { id: true, name: true, description: true, is_default: true },
    });

    res.json({ success: true, data: role, message: 'Role berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/roles/:id (soft delete)
rolesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const role = await prisma.roles.findFirst({ where: { id, deleted_at: null } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });
    }

    if (role.is_default) {
      return res.status(400).json({ success: false, message: 'Role default tidak bisa dihapus' });
    }

    const userCount = await prisma.users.count({ where: { role_id: id, deleted_at: null } });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Role masih dipakai oleh ${userCount} user. Pindahkan user dulu.`,
      });
    }

    await prisma.roles.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, message: 'Role berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});