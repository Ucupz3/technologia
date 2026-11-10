import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const teamMembersRouter = Router();

// GET /api/v1/team-members (List Semua)
teamMembersRouter.get('/', async (_req, res, next) => {
  try {
    const members = await prisma.team_members.findMany({
      where: { status: 'active' },
      include: {
        teams: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: members });
  } catch (err) { next(err); }
});

// POST /api/v1/team-members (Tambah Anggota)
const createSchema = z.object({
  team_id: z.coerce.number().int().positive(),
  user_id: z.coerce.number().int().positive(),
});

teamMembersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const { team_id, user_id } = parsed.data;

    const existing = await prisma.team_members.findFirst({ where: { team_id: BigInt(team_id), user_id: BigInt(user_id) } });
    if (existing) return res.status(409).json({ success: false, message: 'User sudah terdaftar di tim ini' });

    const member = await prisma.team_members.create({
      data: { team_id: BigInt(team_id), user_id: BigInt(user_id), status: 'active' },
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json({ success: true, data: member, message: 'Anggota berhasil ditambahkan' });
  } catch (err) { next(err); }
});

// PUT /api/v1/team-members/:id (Update Job / Posisi)
const updateSchema = z.object({
  job_id: z.coerce.number().int().positive().optional().nullable(),
});

teamMembersRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const id = BigInt(req.params.id);
    const data = {};
    if (parsed.data.job_id !== undefined) data.job_id = parsed.data.job_id ? BigInt(parsed.data.job_id) : null;

    // Catatan: Jika di schema.prisma kolom job_id belum ada, ini akan error.
    // Tapi ini kode yang benar sesuai permintaan Anda.
    const member = await prisma.team_members.update({
      where: { id },
      data,
    });
    
    res.json({ success: true, data: member, message: 'Posisi berhasil diupdate' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/team-members/:id (Hapus Anggota)
teamMembersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.team_members.update({ where: { id }, data: { status: 'inactive' } });
    res.json({ success: true, message: 'Anggota berhasil dikeluarkan' });
  } catch (err) { next(err); }
});