import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const teamMembersRouter = Router();

// GET /api/v1/team-members
teamMembersRouter.get('/', async (_req, res, next) => {
  try {
    const members = await prisma.team_members.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        user_id: true,
        role: true,
        phone: true,
        status: true,
        created_at: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const data = members.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      user_name: m.users?.name || 'Unknown',
      user_email: m.users?.email || null,
      user_role: m.users?.roles?.name || null,
      role: m.role,
      phone: m.phone,
      status: m.status,
      created_at: m.created_at,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/team-members/users/options
// Daftar user yang bisa dijadikan team member (belum terdaftar sebagai team member)
teamMembersRouter.get('/users/options', async (_req, res, next) => {
  try {
    const usedUsers = await prisma.team_members.findMany({
      where: { deleted_at: null },
      select: { user_id: true },
    });
    const usedIds = usedUsers.map((u) => u.user_id);

    const users = await prisma.users.findMany({
      where: {
        deleted_at: null,
        status: 'active',
        id: { notIn: usedIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roles: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role_name: u.roles?.name || null,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/team-members/:id
teamMembersRouter.get('/:id', async (req, res, next) => {
  try {
    const member = await prisma.team_members.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true,
        user_id: true,
        role: true,
        phone: true,
        status: true,
        created_at: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: { select: { name: true } },
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    res.json({
      success: true,
      data: {
        id: member.id,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        role: member.role,
        phone: member.phone,
        status: member.status,
        created_at: member.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/team-members
const createSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  role: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  status: z.enum(['active', 'inactive', 'busy', 'off']).default('active'),
});

teamMembersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { user_id, role, phone, status } = parsed.data;

    // Cek user ada
    const user = await prisma.users.findFirst({
      where: { id: BigInt(user_id), deleted_at: null },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Cek user belum terdaftar sebagai team member
    const existing = await prisma.team_members.findFirst({
      where: { user_id: BigInt(user_id), deleted_at: null },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User sudah terdaftar sebagai team member' });
    }

    const member = await prisma.team_members.create({
      data: {
        user_id: BigInt(user_id),
        role: role || null,
        phone: phone || null,
        status,
      },
      select: {
        id: true, user_id: true, role: true, phone: true, status: true,
        users: {
          select: {
            id: true, name: true, email: true,
            roles: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: member.id,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        role: member.role,
        phone: member.phone,
        status: member.status,
      },
      message: 'Team member berhasil ditambahkan',
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/team-members/:id
const updateSchema = z.object({
  role: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  status: z.enum(['active', 'inactive', 'busy', 'off']).optional(),
});

teamMembersRouter.put('/:id', async (req, res, next) => {
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
    const existing = await prisma.team_members.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    const member = await prisma.team_members.update({
      where: { id },
      data: {
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
      select: {
        id: true, user_id: true, role: true, phone: true, status: true,
        users: {
          select: {
            id: true, name: true, email: true,
            roles: { select: { name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: member.id,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        role: member.role,
        phone: member.phone,
        status: member.status,
      },
      message: 'Team member berhasil diupdate',
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/team-members/:id (soft delete)
teamMembersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const member = await prisma.team_members.findFirst({ where: { id, deleted_at: null } });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    // Cek dipakai di order
    const orderCount = await prisma.orders.count({
      where: { team_id: id, deleted_at: null },
    });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Team member masih ditugaskan di ${orderCount} order. Selesaikan/pindah dulu.`,
      });
    }

    await prisma.team_members.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    res.json({ success: true, message: 'Team member berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});