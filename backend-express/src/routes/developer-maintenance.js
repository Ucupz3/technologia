import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
    try {
        const userIdStr = req.query.user_id;
        if (!userIdStr) {
            return res.json({ success: true, data: [] });
        }
        const userId = BigInt(userIdStr);

        const orders = await prisma.orders.findMany({
            where: {
                deleted_at: null,
                status: 'completed',
                order_assignments: {
                    some: {
                        team_members: { user_id: userId },
                    },
                },
            },
            include: {
                maintenances: {
                    where: { deleted_at: null },
                    orderBy: { created_at: 'desc' },
                },
                customers: {
                    select: { name: true, phone: true, email: true },
                },
                order_services: {
                    select: { id: true, service_name_snapshot: true },
                },
                order_assignments: {
                    include: {
                        jobs: { select: { name: true } },
                        team_members: {
                            include: { users: { select: { id: true, name: true, email: true } } },
                        },
                    },
                },
            },
            orderBy: { updated_at: 'desc' },
        });

        const result = [];

        for (const o of orders) {
            let maintList = o.maintenances;

            if (!maintList || maintList.length === 0) {
                const autoMaint = await prisma.maintenances.create({
                    data: {
                        order_id: o.id,
                        title: 'Pemeliharaan Sistem Pasca Rilis',
                        description: 'Pemeliharaan berkala, pengecekan bug, dan monitoring server.',
                        status: 'scheduled',
                        start_datetime: o.end_date_project || new Date(),
                        end_datetime: o.end_date_project
                            ? new Date(new Date(o.end_date_project).getTime() + 30 * 24 * 60 * 60 * 1000)
                            : null,
                    },
                });
                maintList = [autoMaint];
            }

            for (const m of maintList) {
                result.push({
                    id: m.id.toString(),
                    order_id: o.id.toString(),
                    order_number: o.order_number,
                    customer_name: o.customer_name_snapshot || o.customers?.name || '-',
                    title: m.title,
                    description: m.description || 'Tidak ada deskripsi detail.',
                    status: m.status,
                    notes: m.notes || '',
                    start_datetime: m.start_datetime ? new Date(m.start_datetime).toISOString().split('T')[0] : '-',
                    end_datetime: m.end_datetime ? new Date(m.end_datetime).toISOString().split('T')[0] : '-',
                    services: o.order_services.map((s) => s.service_name_snapshot),
                    team_members: o.order_assignments.map((a) => ({
                        name: a.team_members?.users?.name || '-',
                        job: a.jobs?.name || '-',
                    })),
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const updated = await prisma.maintenances.update({
            where: { id: BigInt(id) },
            data: {
                status: status || undefined,
                notes: notes !== undefined ? notes : undefined,
                updated_at: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'Laporan pemeliharaan berhasil disimpan.',
            data: {
                ...updated,
                id: updated.id.toString(),
                order_id: updated.order_id.toString(),
            },
        });
    } catch (err) {
        next(err);
    }
});

export { router as developerMaintenanceRouter };
