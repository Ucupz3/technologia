import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const assignmentsRouter = Router();
export const orderAssignmentsRouter = Router({ mergeParams: true });

// ============ UPDATE ASSIGNMENT (EDIT JOB & LEAD) ============
// Endpoint: PUT /api/v1/assignments/:id
const updateAssignmentSchema = z.object({
  job_id: z.coerce.number().int().positive().optional(),
  is_lead: z.boolean().optional(),
});

assignmentsRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });
    }

    const id = BigInt(req.params.id);
    const data = {};
    
    if (parsed.data.job_id) {
      data.job_id = BigInt(parsed.data.job_id);
    }
    if (parsed.data.is_lead !== undefined) {
      data.is_lead = parsed.data.is_lead;
    }

    const updated = await prisma.order_assignments.update({
      where: { id },
      data,
      include: {
        jobs: true,
        team_members: { include: { users: true } }
      }
    });

    res.json({ 
      success: true, 
      data: updated, 
      message: 'Penugasan (Job/Lead) berhasil diupdate' 
    });
  } catch (err) { 
    next(err); 
  }
});

// ============ DELETE ASSIGNMENT ============
// Endpoint: DELETE /api/v1/assignments/:id
assignmentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.order_assignments.findFirst({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Penugasan tidak ditemukan' });
    }

    const progressCount = await prisma.progress_order.count({
      where: { assignment_id: id, deleted_at: null },
    });
    if (progressCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Penugasan masih memiliki ${progressCount} catatan progres pengerjaan dan tidak dapat dihapus`,
      });
    }

    await prisma.order_assignments.delete({ where: { id } });
    res.json({ success: true, message: 'Penugasan berhasil dihapus' });
  } catch (err) { 
    next(err); 
  }
});