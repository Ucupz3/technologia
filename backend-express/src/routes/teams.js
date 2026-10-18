import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const teamsRouter = Router();

teamsRouter.get('/', async (_req, res, next) => {
  try {
    const teams = await prisma.teams.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true, description: true, status: true,
        _count: { select: { team_members: { where: { status: 'active' } } } }
      },
      orderBy: { id: 'asc' }
    });
    res.json({ success: true, data: teams });
  } catch (err) { next(err); }
});

teamsRouter.get('/:id', async (req, res, next) => {
  try {
    const team = await prisma.teams.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true, name: true, description: true, status: true,
        team_members: {
          where: { status: 'active' },
          select: {
            id: true, user_id: true, joined_at: true,
            users: {
              select: {
                id: true, name: true, email: true, phone: true,
                roles: { select: { name: true } },
                user_jobs: { include: { jobs: { select: { id: true, name: true } } } }
              }
            }
          }
        }
      }
    });

    if (!team) return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });
    res.json({ success: true, data: team });
  } catch (err) { next(err); }
});

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
});

teamsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const existing = await prisma.teams.findFirst({ where: { name: parsed.data.name, deleted_at: null } });
    if (existing) return res.status(409).json({ success: false, message: 'Nama tim sudah digunakan' });

    const team = await prisma.teams.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        status: parsed.data.status,
      }
    });
    res.status(201).json({ success: true, data: team, message: 'Tim berhasil dibuat' });
  } catch (err) { next(err); }
});