import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const dashboardRouter = Router();

// GET /api/v1/dashboard/admin
dashboardRouter.get('/admin', async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const [
      pending_orders,
      today_schedules,
      today_deadlines,
      pending_payments,
      total_orders,
      weeklyOrders,
      schedules,
      orders,
      invoices,
    ] = await Promise.all([
      prisma.orders.count({
        where: { deleted_at: null, status: 'pending' },
      }),
      prisma.maintenances.count({
        where: {
          deleted_at: null,
          status: { in: ['scheduled', 'in_progress'] },
          start_datetime: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      prisma.orders.count({
        where: {
          deleted_at: null,
          status: { notIn: ['completed', 'cancelled'] },
          end_date_project: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      prisma.invoices.count({
        where: {
          deleted_at: null,
          status: { in: ['unpaid', 'partial', 'overdue'] },
        },
      }),
      prisma.orders.count({ where: { deleted_at: null } }),
      prisma.orders.findMany({
        where: {
          deleted_at: null,
          created_at: { gte: startOfWeek, lt: startOfTomorrow },
        },
        select: { created_at: true },
      }),
      prisma.maintenances.findMany({
        where: {
          deleted_at: null,
          status: { in: ['scheduled', 'in_progress'] },
          start_datetime: { gte: now },
        },
        select: {
          id: true,
          title: true,
          status: true,
          start_datetime: true,
          orders: {
            select: {
              customer_name_snapshot: true,
              teams: { select: { name: true } },
            },
          },
        },
        orderBy: { start_datetime: 'asc' },
        take: 3,
      }),
      prisma.orders.findMany({
        where: { deleted_at: null },
        select: {
          order_number: true,
          customer_name_snapshot: true,
          grand_total: true,
          status: true,
          created_at: true,
          customers: { select: { name: true } },
          order_services: {
            where: { deleted_at: null },
            select: { service_name_snapshot: true },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.invoices.findMany({
        where: {
          deleted_at: null,
          status: { in: ['unpaid', 'partial', 'overdue'] },
        },
        select: {
          id: true,
          invoice_number: true,
          total_paid: true,
          status: true,
          due_date: true,
          orders: { select: { grand_total: true } },
          customers: { select: { name: true } },
        },
        orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
        take: 10,
      }),
    ]);

    const dayKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const weeklyMap = new Map();
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + offset);
      weeklyMap.set(dayKey(date), 0);
    }
    weeklyOrders.forEach((order) => {
      if (!order.created_at) return;
      const key = dayKey(new Date(order.created_at));
      if (weeklyMap.has(key)) weeklyMap.set(key, weeklyMap.get(key) + 1);
    });

    res.json({
      success: true,
      data: {
        stats: {
          pending_orders,
          today_schedules,
          today_deadlines,
          pending_payments,
        },
        total_orders,
        weekly_orders: Array.from(weeklyMap, ([date, count]) => ({ date, count })),
        schedules: schedules.map((schedule) => ({
          ...schedule,
          customer_name: schedule.orders?.customer_name_snapshot || 'Customer tidak diketahui',
          team_name: schedule.orders?.teams?.name || 'Belum ditugaskan',
        })),
        orders: orders.map((order) => ({
          order_number: order.order_number,
          customer_name: order.customers?.name || order.customer_name_snapshot || 'Customer tidak diketahui',
          service_name: order.order_services[0]?.service_name_snapshot || 'Layanan tidak tersedia',
          grand_total: Number(order.grand_total),
          status: order.status,
        })),
        invoices: invoices.map((invoice) => ({
          invoice_number: invoice.invoice_number,
          customer_name: invoice.customers?.name || 'Customer tidak diketahui',
          amount_due: Math.max(Number(invoice.orders?.grand_total || 0) - Number(invoice.total_paid || 0), 0),
          status: invoice.status,
          due_date: invoice.due_date,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

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

    // Revenue bulan ini dari invoices yang sudah paid
    const revenueAgg = await prisma.invoices.aggregate({
      where: {
        deleted_at: null,
        status: 'paid',
        paid_at: { gte: startOfMonth },
      },
      _sum: { total_paid: true },
    });
    const total_revenue = Number(revenueAgg._sum.total_paid || 0);

    // Outstanding: invoices yang belum paid
    const outstandingAgg = await prisma.invoices.aggregate({
      where: {
        deleted_at: null,
        status: { in: ['unpaid', 'partial', 'overdue'] },
      },
      _sum: { total_paid: true },
    });
    const total_outstanding = Number(outstandingAgg._sum.total_paid || 0);

    // ===== REVENUE CHART 30 HARI =====
    const invoices = await prisma.invoices.findMany({
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
    invoices.forEach((inv) => {
      if (!inv.paid_at) return;
      const key = new Date(inv.paid_at).toISOString().slice(0, 10);
      if (dailyMap[key] !== undefined) {
        dailyMap[key] += Number(inv.total_paid || 0);
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
    const serviceGroups = await prisma.order_services.groupBy({
      by: ['service_id'],
      where: { deleted_at: null, service_id: { not: null } },
      _count: { _all: true },
      _sum: { subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
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
      total_revenue: Number(g._sum.subtotal || 0),
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