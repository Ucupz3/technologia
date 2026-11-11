import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditHelper.js';

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

    // Audit log
    const userId = req.headers['x-user-id'];
    console.log('🔍 CREATE TEAM - User ID:', userId, 'Team:', team.name);
    
    const detailText = `Menambahkan manajemen baru.
Nama: ${team.name}${team.description ? '\nDeskripsi: ' + team.description : ''}
Status: ${team.status}`;
    
    try {
      await createAuditLog({
        userId,
        action: 'CREATE',
        entityType: 'Team',
        entityId: team.id,
        module: 'Management',
        details: detailText,
        data: { name: team.name, description: team.description, status: team.status },
        req,
      });
      console.log('✅ Audit log berhasil dibuat untuk team:', team.name);
    } catch (err) {
      console.error('❌ Audit log error untuk team:', team.name, err);
    }

    res.status(201).json({ success: true, data: team, message: 'Tim berhasil dibuat' });
  } catch (err) { next(err); }
});

// PUT /api/v1/teams/:id
const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});

teamsRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal' });

    const id = BigInt(req.params.id);
    const existing = await prisma.teams.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });

    // Cek duplikat nama
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const dup = await prisma.teams.findFirst({ where: { name: parsed.data.name, deleted_at: null } });
      if (dup && dup.id.toString() !== id.toString()) {
        return res.status(409).json({ success: false, message: 'Nama tim sudah digunakan' });
      }
    }

    const team = await prisma.teams.update({
      where: { id },
      data: {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.status && { status: parsed.data.status }),
      },
    });

    // Audit log
    const userId = req.headers['x-user-id'];
    const changes = [];
    if (parsed.data.name && parsed.data.name !== existing.name) changes.push(`Nama: "${existing.name}" → "${parsed.data.name}"`);
    if (parsed.data.description !== undefined && parsed.data.description !== existing.description) {
      changes.push(`Deskripsi: "${existing.description || '-'}" → "${parsed.data.description || '-'}"`);
    }
    if (parsed.data.status && parsed.data.status !== existing.status) changes.push(`Status: "${existing.status}" → "${parsed.data.status}"`);

    const detailText = changes.length > 0 
      ? `Mengedit manajemen ${existing.name}.\n${changes.join('\n')}`
      : `Mengedit manajemen ${existing.name}`;
    
    await createAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Team',
      entityId: id,
      module: 'Management',
      details: detailText,
      data: { changes },
      req,
    });

    res.json({ success: true, data: team, message: 'Tim berhasil diupdate' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/teams/:id (soft delete)
teamsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.teams.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Tim tidak ditemukan' });

    await prisma.teams.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Audit log
    const userId = req.headers['x-user-id'];
    const detailText = `Menghapus manajemen ${existing.name}.${existing.description ? '\nDeskripsi: ' + existing.description : ''}
Status: ${existing.status}`;
    
    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'Team',
      entityId: id,
      module: 'Management',
      details: detailText,
      data: { name: existing.name, description: existing.description, status: existing.status },
      req,
    });

    res.json({ success: true, message: 'Tim berhasil dihapus' });
  } catch (err) { next(err); }
});