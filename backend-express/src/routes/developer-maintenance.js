import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/developer/maintenance?user_id=...
router.get('/', async (req, res, next) => {
    try {
        const userIdStr = req.query.user_id;
        if (!userIdStr) {
            return res.json({ success: true, data: [] });
        }
        const userId = BigInt(userIdStr);

        // Hanya tampilkan order turunan maintenance yang ditugaskan ke akun developer ini
        const orders = await prisma.orders.findMany({
            where: {
                deleted_at: null,
                parent_order_id: { not: null },
                order_assignments: {
                    some: { team_members: { user_id: userId } },
                },
            },
            include: {
                parent_order: {
                    select: {
                        id: true,
                        order_number: true,
                        customer_name_snapshot: true,
                    },
                },
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
                    where: { team_members: { user_id: userId } },
                    include: {
                        jobs: { select: { id: true, name: true } },
                        team_members: {
                            include: { users: { select: { id: true, name: true, email: true } } },
                        },
                        progress_order: {
                            where: { deleted_at: null },
                            orderBy: { created_at: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { updated_at: 'desc' },
        });

        const result = [];

        for (const o of orders) {
            const userAssignment = o.order_assignments[0];
            const assignedJob = userAssignment?.jobs?.name || 'Developer Maintenance';
            const devProgress = userAssignment?.progress_order?.[0] || null;

            for (const m of o.maintenances) {
                const officialStatus =
                    m.status === 'completed' && o.status !== 'completed'
                        ? o.status || 'in_progress'
                        : m.status;

                result.push({
                    id: m.id.toString(),
                    order_id: o.id.toString(),
                    order_number: o.order_number,
                    parent_order_id: o.parent_order?.id?.toString() || null,
                    parent_order_number: o.parent_order?.order_number || null,
                    customer_name: o.customer_name_snapshot || o.customers?.name || o.parent_order?.customer_name_snapshot || '-',
                    title: m.title,
                    description: m.description || '-',
                    status: officialStatus,
                    developer_progress_status: devProgress?.status || (officialStatus === 'completed' ? 'completed' : 'in_progress'),
                    developer_progress_percentage: devProgress?.progress_percentage ?? (officialStatus === 'completed' ? 100 : 0),
                    notes: m.notes || '',
                    start_datetime: m.start_datetime ? new Date(m.start_datetime).toISOString().split('T')[0] : '-',
                    end_datetime: m.end_datetime ? new Date(m.end_datetime).toISOString().split('T')[0] : '-',
                    created_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '-',
                    services: o.order_services.map((s) => s.service_name_snapshot),
                    job_name: assignedJob,
                    order_status: o.status,
                });
            }
        }

        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/developer/maintenance/:id
// Mengambil DETAIL LENGKAP tiket maintenance untuk halaman Detail Maintenance Developer
router.get('/:id', async (req, res, next) => {
    try {
        const id = BigInt(req.params.id);

        const m = await prisma.maintenances.findFirst({
            where: { id, deleted_at: null },
            include: {
                orders: {
                    include: {
                        parent_order: {
                            include: {
                                customers: true,
                                order_services: true,
                                order_assignments: {
                                    include: {
                                        jobs: true,
                                        team_members: {
                                            include: { users: { select: { id: true, name: true, email: true } } },
                                        },
                                    },
                                },
                            },
                        },
                        customers: true,
                        order_services: true,
                        order_assignments: {
                            include: {
                                jobs: true,
                                team_members: {
                                    include: { users: { select: { id: true, name: true, email: true } } },
                                },
                                progress_order: {
                                    where: { deleted_at: null },
                                    orderBy: { created_at: 'desc' },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!m) {
            return res.status(404).json({ success: false, message: 'Tiket maintenance tidak ditemukan' });
        }

        const childOrder = m.orders;
        const parentOrder = childOrder?.parent_order || null;
        const customer = childOrder?.customers || parentOrder?.customers || null;

        const currentAssign = childOrder?.order_assignments?.[0];
        const devProgress = currentAssign?.progress_order?.[0] || null;

        const originalTeam = (parentOrder?.order_assignments || []).map((a) => ({
            user_id: a.team_members?.users?.id?.toString() || null,
            name: a.team_members?.users?.name || '-',
            email: a.team_members?.users?.email || '-',
            job: a.jobs?.name || '-',
        }));

        res.json({
            success: true,
            data: {
                id: m.id.toString(),
                title: m.title,
                description: m.description || '-',
                status: m.status,
                notes: m.notes || '',
                developer_progress: {
                    status: devProgress?.status || (m.status === 'completed' ? 'completed' : 'in_progress'),
                    progress_percentage: devProgress?.progress_percentage ?? (m.status === 'completed' ? 100 : 0),
                    notes: devProgress?.notes || '',
                    updated_at: devProgress?.updated_at ? new Date(devProgress.updated_at).toISOString().replace('T', ' ').slice(0, 16) : null,
                },
                start_datetime: m.start_datetime ? new Date(m.start_datetime).toISOString().split('T')[0] : '-',
                end_datetime: m.end_datetime ? new Date(m.end_datetime).toISOString().split('T')[0] : '-',
                created_at: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '-',
                updated_at: m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : '-',
                child_order: {
                    id: childOrder?.id?.toString() || null,
                    order_number: childOrder?.order_number || '-',
                    status: childOrder?.status || '-',
                    notes: childOrder?.notes || '',
                },
                parent_order: parentOrder
                    ? {
                          id: parentOrder.id.toString(),
                          order_number: parentOrder.order_number,
                          status: parentOrder.status,
                          start_date: parentOrder.start_date_project
                              ? new Date(parentOrder.start_date_project).toISOString().split('T')[0]
                              : '-',
                          end_date: parentOrder.end_date_project
                              ? new Date(parentOrder.end_date_project).toISOString().split('T')[0]
                              : '-',
                          services: (parentOrder.order_services || []).map((s) => s.service_name_snapshot),
                      }
                    : null,
                customer: {
                    name: childOrder?.customer_name_snapshot || customer?.name || '-',
                    email: customer?.email || '-',
                    phone: customer?.phone || '-',
                    address: childOrder?.customer_address_snapshot || customer?.address || '-',
                },
                assigned_developer: {
                    user_id: currentAssign?.team_members?.users?.id?.toString() || null,
                    name: currentAssign?.team_members?.users?.name || '-',
                    job: currentAssign?.jobs?.name || '-',
                },
                original_team: originalTeam,
            },
        });
    } catch (err) {
        next(err);
    }
});

// PUT /api/v1/developer/maintenance/:id
// Developer hanya menyetorkan progres perbaikan (progress_order).
// Developer TIDAK MENGUBAH status tiket maintenance atau status order pusat (wewenang eksklusif Super Admin).
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const m = await prisma.maintenances.findFirst({
            where: { id: BigInt(id), deleted_at: null },
            include: {
                orders: {
                    include: {
                        order_assignments: true,
                    },
                },
            },
        });

        if (!m) {
            return res.status(404).json({ success: false, message: 'Tiket maintenance tidak ditemukan' });
        }

        const currentAssign = m.orders?.order_assignments?.[0];
        let targetProgress = null;

        if (currentAssign) {
            const progStatus = status === 'completed' ? 'completed' : (status === 'in_progress' ? 'in_progress' : 'pending');
            const progPercent = status === 'completed' ? 100 : (status === 'in_progress' ? 50 : 0);

            const existingProgress = await prisma.progress_order.findFirst({
                where: { assignment_id: currentAssign.id, deleted_at: null },
                orderBy: { created_at: 'desc' },
            });

            if (existingProgress) {
                targetProgress = await prisma.progress_order.update({
                    where: { id: existingProgress.id },
                    data: {
                        status: progStatus,
                        progress_percentage: progPercent,
                        notes: notes !== undefined ? notes : existingProgress.notes,
                        completed_at: progStatus === 'completed' ? new Date() : null,
                        updated_at: new Date(),
                    },
                });
            } else {
                targetProgress = await prisma.progress_order.create({
                    data: {
                        assignment_id: currentAssign.id,
                        title: `Perbaikan Kendala: ${m.title}`,
                        status: progStatus,
                        progress_percentage: progPercent,
                        notes: notes || '',
                        completed_at: progStatus === 'completed' ? new Date() : null,
                        started_at: new Date(),
                    },
                });
            }
        }

        // Developer TIDAK mengubah maintenances.status ataupun orders.status!
        // Hanya perbarui timestamp updated_at pada tiket
        await prisma.maintenances.update({
            where: { id: BigInt(id) },
            data: {
                updated_at: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'Setoran progres perbaikan berhasil disimpan. Menunggu verifikasi dan pengesahan Super Admin.',
            data: {
                id: m.id.toString(),
                developer_progress: targetProgress
                    ? {
                          status: targetProgress.status,
                          progress_percentage: targetProgress.progress_percentage,
                          notes: targetProgress.notes,
                      }
                    : null,
            },
        });
    } catch (err) {
        next(err);
    }
});

export { router as developerMaintenanceRouter };
