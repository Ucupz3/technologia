import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../lib/auditHelper.js';

export const usersRouter = Router();

const STATUS_ENUM = ['active', 'inactive', 'suspended', 'pending'];

const createUserSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  role_id: z.coerce.number().int().positive(),
  phone: z.string().max(30).optional(),
  job_ids: z.array(z.coerce.number().int().positive()).optional().default([]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function mapRoleToSlug(roleName) {
  const map = {
    'Super Admin': 'super_admin',
    'Admin': 'admin',
    'CS': 'sales',
    'Sales': 'sales',
    'Finance': 'finance',
  };
  return map[roleName] || 'sales';
}

// GET /api/v1/users (Daftar semua user + 1 role + list user_jobs)
usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.users.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        created_at: true,
        roles: { select: { id: true, name: true } },
        user_jobs: {
          select: {
            id: true,
            job_id: true,
            is_primary: true,
            jobs: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// GET /api/v1/users/roles/options (Pilihan Role)
usersRouter.get('/roles/options', async (_req, res, next) => {
  try {
    const roles = await prisma.roles.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
});

// GET /api/v1/users/jobs/options (Pilihan Job)
usersRouter.get('/jobs/options', async (_req, res, next) => {
  try {
    const jobs = await prisma.jobs.findMany({
      where: { status: 'active', deleted_at: null },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: jobs });
  } catch (err) { next(err); }
});

// GET /api/v1/users/by-email/:email
usersRouter.get('/by-email/:email', async (req, res, next) => {
  try {
    const user = await prisma.users.findFirst({
      where: { email: req.params.email, deleted_at: null },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, created_at: true,
        roles: { select: { id: true, name: true } },
        user_jobs: {
          select: {
            job_id: true,
            is_primary: true,
            jobs: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'User tidak aktif' });

    res.json({
      success: true,
      data: { ...user, role_slug: mapRoleToSlug(user.roles?.name) },
    });
  } catch (err) { next(err); }
});

// POST /api/v1/users/login
usersRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false, message: 'Email dan password wajib diisi',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { email, password } = parsed.data;

    const user = await prisma.users.findFirst({
      where: { email, deleted_at: null },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, password_hash: true,
        roles: { select: { id: true, name: true } },
      },
    });
    if (!user) return res.status(401).json({ success: false, message: 'Email atau password salah' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Akun tidak aktif' });

    const normalizedHash = user.password_hash.replace(/^\$2y\$/, '$2b$');
    const cocok = await bcrypt.compare(password, normalizedHash);
    if (!cocok) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    res.json({
      success: true,
      data: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        status: user.status,
        role_slug: mapRoleToSlug(user.roles?.name),
        role_name: user.roles?.name,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/v1/users/:id
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.users.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, created_at: true,
        roles: { select: { id: true, name: true } },
        user_jobs: {
          select: {
            id: true,
            job_id: true,
            is_primary: true,
            jobs: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(72).optional(),
  role_id: z.coerce.number().int().positive().optional(),
  phone: z.string().max(30).nullable().optional(),
  status: z.enum(STATUS_ENUM).optional(),
  job_ids: z.array(z.coerce.number().int().positive()).optional(),
});

// PUT /api/v1/users/:id
usersRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });
    }
    const id = BigInt(req.params.id);
    const existing = await prisma.users.findFirst({ 
      where: { id, deleted_at: null },
      include: {
        roles: { select: { name: true } },
        user_jobs: { include: { jobs: { select: { name: true } } } }
      }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const data = { ...parsed.data };
    const job_ids = data.job_ids;
    delete data.job_ids;

    if (data.role_id) data.role_id = BigInt(data.role_id);
    if (data.password) {
      data.password_hash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }
    if (data.email && data.email !== existing.email) {
      const dup = await prisma.users.findUnique({ where: { email: data.email } });
      if (dup) return res.status(409).json({ success: false, message: 'Email sudah dipakai' });
    }

    const user = await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id },
        data,
      });

      if (job_ids !== undefined) {
        await tx.user_jobs.deleteMany({
          where: { user_id: id },
        });

        if (job_ids.length > 0) {
          await tx.user_jobs.createMany({
            data: job_ids.map((jobId, index) => ({
              user_id: id,
              job_id: BigInt(jobId),
              is_primary: index === 0,
            })),
          });
        }
      }

      return tx.users.findUnique({
        where: { id },
        select: {
          id: true, name: true, email: true, phone: true,
          status: true, created_at: true,
          roles: { select: { id: true, name: true } },
          user_jobs: {
            select: {
              id: true,
              job_id: true,
              is_primary: true,
              jobs: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    // Audit log - track changes
    const userId = req.headers['x-user-id'];
    const changes = [];
    if (parsed.data.name && parsed.data.name !== existing.name) changes.push(`Nama: "${existing.name}" → "${parsed.data.name}"`);
    if (parsed.data.email && parsed.data.email !== existing.email) changes.push(`Email: "${existing.email}" → "${parsed.data.email}"`);
    if (parsed.data.phone !== undefined && parsed.data.phone !== existing.phone) changes.push(`Telepon: "${existing.phone || '-'}" → "${parsed.data.phone || '-'}"`);
    if (parsed.data.status && parsed.data.status !== existing.status) changes.push(`Status: "${existing.status}" → "${parsed.data.status}"`);
    if (parsed.data.role_id && BigInt(parsed.data.role_id).toString() !== existing.role_id.toString()) {
      const newRole = await prisma.roles.findUnique({ where: { id: BigInt(parsed.data.role_id) } });
      changes.push(`Role: "${existing.roles.name}" → "${newRole?.name}"`);
    }
    if (parsed.data.password) changes.push('Password diubah');

    const detailText = changes.length > 0 
      ? `Mengedit user ${existing.name}.\n${changes.join('\n')}`
      : `Mengedit user ${existing.name}`;
    
    await createAuditLog({
      userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      module: 'Users',
      details: detailText,
      data: { changes },
      req,
    });

    res.json({ success: true, data: user, message: 'User berhasil diupdate' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/users/:id/status
usersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = z.object({ status: z.enum(STATUS_ENUM) }).safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Status tidak valid' });

    const user = await prisma.users.update({
      where: { id: BigInt(req.params.id) },
      data: { status: parsed.data.status },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, created_at: true,
        roles: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: user, message: 'Status berhasil diubah' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/:id (soft delete)
usersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.users.findFirst({
      where: { id, deleted_at: null },
      include: {
        roles: { select: { name: true } },
        user_jobs: { include: { jobs: { select: { name: true } } } }
      }
    });
    
    if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    await prisma.users.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'inactive' },
    });

    // Audit log
    const userId = req.headers['x-user-id'];
    const jobNames = existing.user_jobs.map(uj => uj.jobs.name).join(', ');
    const detailText = `Menghapus user ${existing.name}.
Email: ${existing.email}
Telepon: ${existing.phone || '-'}
Role: ${existing.roles.name}${jobNames ? '\nPekerjaan: ' + jobNames : ''}`;
    
    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      module: 'Users',
      details: detailText,
      data: { name: existing.name, email: existing.email, phone: existing.phone, role: existing.roles.name },
      req,
    });

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) { next(err); }
});

// POST /api/v1/users (Buat user baru: 1 role + opsi multiple job)
usersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });
    }
    const { name, email, password, role_id, phone, job_ids } = parsed.data;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          name,
          email,
          password_hash: passwordHash,
          role_id: BigInt(role_id),
          phone: phone || null,
          status: 'active',
        },
      });

      if (job_ids && job_ids.length > 0) {
        await tx.user_jobs.createMany({
          data: job_ids.map((jobId, idx) => ({
            user_id: newUser.id,
            job_id: BigInt(jobId),
            is_primary: idx === 0,
          })),
        });
      }

      return tx.users.findUnique({
        where: { id: newUser.id },
        select: {
          id: true, name: true, email: true, phone: true,
          status: true, created_at: true,
          roles: { select: { id: true, name: true } },
          user_jobs: {
            select: {
              id: true,
              job_id: true,
              is_primary: true,
              jobs: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    // Audit log dengan detail lengkap
    const userId = req.headers['x-user-id'];
    const jobNames = user.user_jobs.map(uj => uj.jobs.name).join(', ');
    const detailText = `Menambahkan user baru.
Nama: ${name}
Email: ${email}
Telepon: ${phone || '-'}
Role: ${user.roles.name}${jobNames ? '\nPekerjaan: ' + jobNames : ''}`;
    
    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      module: 'Users',
      details: detailText,
      data: { name, email, phone, role: user.roles.name, jobs: jobNames },
      req,
    });

    res.status(201).json({ success: true, data: user, message: 'User berhasil dibuat' });
  } catch (err) { next(err); }
});