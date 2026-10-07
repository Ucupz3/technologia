import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const dashboardRouter = Router();

// GET /api/v1/dashboard/super-admin
dashboardRouter.get('/super-admin', async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ===== STATS =====
    const total_users = await prisma.users.count({
      where: { status: 'active', deleted_at: null },
    });

    const total_orders = await prisma.orders.count({
      where: {
        deleted_at: null,
        created_at: { gte: startOfMonth },
      },
    });

    // Revenue bulan ini dari payments yang sudah paid
    const revenueAgg = await prisma.payments.aggregate({
      where: {
        deleted_at: null,
        status: 'paid',
        paid_at: { gte: startOfMonth },
      },
      _sum: { total_paid: true },
    });
    const total_revenue = Number(revenueAgg._sum.total_paid || 0);

    // Outstanding: payments yang belum paid
    const outstandingAgg = await prisma.payments.aggregate({
      where: {
        deleted_at: null,
        status: { in: ['unpaid', 'partial', 'overdue'] },
      },
      _sum: { total_paid: true },
    });
    const total_outstanding = Number(outstandingAgg._sum.total_paid || 0);

    // ===== REVENUE CHART 30 HARI =====
    const payments = await prisma.payments.findMany({
      where: {
        deleted_at: null,
        status: 'paid',
        paid_at: { gte: thirtyDaysAgo },
      },
      select: { paid_at: true, total_paid: true },
    });

    const dailyMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }
    payments.forEach((p) => {
      if (!p.paid_at) return;
      const key = new Date(p.paid_at).toISOString().slice(0, 10);
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += Number(p.total_paid || 0);
      }
    });
    const revenue_chart = Object.entries(dailyMap).map(([date, amount]) => ({
      date,
      amount,
    }));

    // ===== ORDER STATUS CHART =====
    const orderGroups = await prisma.orders.groupBy({
      by: ['status'],
      where: { deleted_at: null },
      _count: { _all: true },
    });
    const order_status_chart = orderGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    // ===== TOP 5 SALES =====
    const salesGroups = await prisma.orders.groupBy({
      by: ['sales_id'],
      where: { deleted_at: null, sales_id: { not: null } },
      _count: { _all: true },
      _sum: { grand_total: true },
      orderBy: { _sum: { grand_total: 'desc' } },
      take: 5,
    });

    const salesIds = salesGroups.map((g) => g.sales_id).filter(Boolean);
    const salesUsers = salesIds.length
      ? await prisma.users.findMany({
          where: { id: { in: salesIds } },
          select: { id: true, name: true },
        })
      : [];
    const salesMap = Object.fromEntries(salesUsers.map((u) => [String(u.id), u.name]));

    const top_sales = salesGroups.map((g) => ({
      id: g.sales_id,
      name: salesMap[String(g.sales_id)] || 'Unknown',
      order_count: g._count._all,
      total_revenue: Number(g._sum.grand_total || 0),
    }));

    // ===== TOP 5 SERVICES =====
    const serviceGroups = await prisma.orders.groupBy({
      by: ['service_id'],
      where: { deleted_at: null },
      _count: { _all: true },
      _sum: { grand_total: true },
      orderBy: { _sum: { grand_total: 'desc' } },
      take: 5,
    });

    const serviceIds = serviceGroups.map((g) => g.service_id).filter(Boolean);
    const servicesList = serviceIds.length
      ? await prisma.services.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
    const serviceMap = Object.fromEntries(servicesList.map((s) => [String(s.id), s.name]));

    const top_services = serviceGroups.map((g) => ({
      id: g.service_id,
      name: serviceMap[String(g.service_id)] || 'Unknown',
      order_count: g._count._all,
      total_revenue: Number(g._sum.grand_total || 0),
    }));

    // ===== RECENT AUDIT LOGS =====
    const auditLogs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        ip_address: true,
        created_at: true,
        user_id: true,
      },
    });

    const userIds = [...new Set(auditLogs.map((l) => l.user_id).filter(Boolean))];
    const userList = userIds.length
      ? await prisma.users.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userMap = Object.fromEntries(userList.map((u) => [String(u.id), u.name]));

    const recent_audit_logs = auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      ip_address: l.ip_address,
      created_at: l.created_at,
      user_name: userMap[String(l.user_id)] || 'System',
    }));

    res.json({
      success: true,
      data: {
        stats: {
          total_users,
          total_orders,
          total_revenue,
          total_outstanding,
        },
        revenue_chart,
        order_status_chart,
        top_sales,
        top_services,
        recent_audit_logs,
      },
    });
  } catch (err) {
    next(err);
  }
});