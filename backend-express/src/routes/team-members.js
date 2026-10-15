import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const teamMembersRouter = Router();

// GET /api/v1/team-members
teamMembersRouter.get('/', async (_req, res, next) => {
  try {
    const members = await prisma.team_members.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        team_id: true,
        user_id: true,
        joined_at: true,
        status: true,
        teams: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roles: { select: { name: true } },
            user_jobs: {
              include: { jobs: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const data = members.map((m) => {
      const primaryJob = m.users?.user_jobs?.find((uj) => uj.is_primary)?.jobs?.name
        || m.users?.user_jobs?.[0]?.jobs?.name
        || m.users?.roles?.name
        || null;

      return {
        id: m.id,
        team_id: m.team_id,
        team_name: m.teams?.name || null,
        user_id: m.user_id,
        user_name: m.users?.name || 'Unknown',
        user_email: m.users?.email || null,
        user_role: m.users?.roles?.name || null,
        role: primaryJob,
        phone: m.users?.phone || null,
        joined_at: m.joined_at,
        status: m.status,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/team-members/users/options
teamMembersRouter.get('/users/options', async (_req, res, next) => {
  try {
    const usedUsers = await prisma.team_members.findMany({
      where: { status: 'active' },
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
      where: { id: BigInt(req.params.id) },
      select: {
        id: true,
        team_id: true,
        user_id: true,
        joined_at: true,
        status: true,
        teams: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            roles: { select: { name: true } },
            user_jobs: {
              include: { jobs: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    const primaryJob = member.users?.user_jobs?.find((uj) => uj.is_primary)?.jobs?.name
      || member.users?.user_jobs?.[0]?.jobs?.name
      || member.users?.roles?.name
      || null;

    res.json({
      success: true,
      data: {
        id: member.id,
        team_id: member.team_id,
        team_name: member.teams?.name || null,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        role: primaryJob,
        phone: member.users?.phone,
        joined_at: member.joined_at,
        status: member.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/team-members
const createSchema = z.object({
  team_id: z.coerce.number().int().positive().optional().nullable(),
  user_id: z.coerce.number().int().positive(),
  role: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
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

    const { team_id, user_id, phone, status } = parsed.data;

    // Cek user ada
    const user = await prisma.users.findFirst({
      where: { id: BigInt(user_id), deleted_at: null },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Resolve team_id
    let resolvedTeamId = team_id;
    if (!resolvedTeamId) {
      const defaultTeam = await prisma.teams.findFirst({
        where: { deleted_at: null, status: 'active' },
        orderBy: { id: 'asc' },
      });
      resolvedTeamId = defaultTeam ? Number(defaultTeam.id) : 1;
    }

    // Cek user belum terdaftar di team tersebut
    const existing = await prisma.team_members.findFirst({
      where: { team_id: BigInt(resolvedTeamId), user_id: BigInt(user_id) },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User sudah terdaftar sebagai anggota tim ini' });
    }

    if (phone && phone !== user.phone) {
      await prisma.users.update({
        where: { id: user.id },
        data: { phone },
      });
    }

    const member = await prisma.team_members.create({
      data: {
        team_id: BigInt(resolvedTeamId),
        user_id: BigInt(user_id),
        status,
      },
      include: {
        teams: { select: { id: true, name: true } },
        users: {
          select: {
            id: true, name: true, email: true, phone: true,
            roles: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: member.id,
        team_id: member.team_id,
        team_name: member.teams?.name,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        phone: member.users?.phone,
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
  team_id: z.coerce.number().int().positive().optional(),
  phone: z.string().max(30).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
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
    const existing = await prisma.team_members.findFirst({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    const data = {};
    if (parsed.data.team_id) data.team_id = BigInt(parsed.data.team_id);
    if (parsed.data.status) data.status = parsed.data.status;

    if (parsed.data.phone !== undefined) {
      await prisma.users.update({
        where: { id: existing.user_id },
        data: { phone: parsed.data.phone || null },
      });
    }

    const member = await prisma.team_members.update({
      where: { id },
      data,
      include: {
        teams: { select: { id: true, name: true } },
        users: {
          select: {
            id: true, name: true, email: true, phone: true,
            roles: { select: { name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: member.id,
        team_id: member.team_id,
        team_name: member.teams?.name,
        user_id: member.user_id,
        user_name: member.users?.name,
        user_email: member.users?.email,
        user_role: member.users?.roles?.name,
        phone: member.users?.phone,
        status: member.status,
      },
      message: 'Team member berhasil diupdate',
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/team-members/:id
teamMembersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const member = await prisma.team_members.findFirst({ where: { id } });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member tidak ditemukan' });
    }

    // Cek dipakai di order_assignments
    const assignCount = await prisma.order_assignments.count({
      where: { team_member_id: id },
    });
    if (assignCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Team member masih ditugaskan di ${assignCount} order assignment. Selesaikan/pindah dulu.`,
      });
    }

    await prisma.team_members.update({
      where: { id },
      data: { status: 'inactive' },
    });

    res.json({ success: true, message: 'Team member berhasil dinonaktifkan' });
  } catch (err) {
    next(err);
  }
});