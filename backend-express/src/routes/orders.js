import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { calculateOrderTotals, generateOrderNumber, generateInvoiceNumber } from '../lib/orderHelpers.js';

export const ordersRouter = Router();

function computeAssignmentStatus(progressList = []) {
  if (!progressList || progressList.length === 0) return 'pending';
  const active = progressList.filter((p) => !p.deleted_at);
  if (active.length === 0) return 'pending';

  const completed = active.filter((p) => p.status === 'completed');
  if (completed.length === active.length) return 'completed';

  const cancelled = active.filter((p) => p.status === 'cancelled');
  if (cancelled.length === active.length) return 'cancelled';

  if (completed.length + cancelled.length === active.length && completed.length > 0) {
    return 'completed';
  }

  const inProgress = active.some((p) => p.status === 'in_progress' || p.progress_percentage > 0);
  if (inProgress) return 'in_progress';

  return 'pending';
}

function formatOrderService(os) {
  return {
    id: os.id,
    order_id: os.order_id,
    service_id: os.service_id,
    service_name_snapshot: os.service_name_snapshot,
    service_name: os.service_name_snapshot,
    category_name_snapshot: os.category_name_snapshot,
    is_custom: Boolean(os.is_custom),
    price_deal: Number(os.price_deal),
    deal_price: Number(os.price_deal),
    catalog_price: Number(os.price_deal),
    quantity: os.quantity,
    subtotal: Number(os.subtotal),
    status: os.status,
    notes: os.notes,
  };
}

function formatOrderAssignment(oa) {
  const user = oa.team_members?.users || null;
  const status = computeAssignmentStatus(oa.progress_order || []);

  return {
    id: oa.id,
    order_id: oa.order_id,
    team_member_id: oa.team_member_id,
    job_id: oa.job_id,
    is_lead: Boolean(oa.is_lead),
    assigned_at: oa.assigned_at,
    status,
    role_in_order: oa.jobs?.name || 'Staff',
    job_name: oa.jobs?.name || null,
    module_name: oa.jobs?.name || null,
    user_id: user?.id || null,
    user_name: user?.name || 'Unknown',
    user_email: user?.email || null,
    users: user,
    jobs: oa.jobs || null,
    team_members: oa.team_members || null,
  };
}

// ============ OPTIONS (harus di atas /:id) ============
ordersRouter.get('/options/customers', async (_req, res, next) => {
  try {
    const data = await prisma.customers.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        name: true,
        email: true,
        customer_pics: {
          where: { deleted_at: null, is_active: true },
          select: { id: true, name: true, position: true, email: true, phone: true, is_primary: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/services', async (_req, res, next) => {
  try {
    const data = await prisma.services.findMany({
      where: { deleted_at: null, status: 'active' },
      select: {
        id: true,
        name: true,
        default_price: true,
        duration: true,
        service_categories: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const mapped = data.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.default_price),
      default_price: Number(s.default_price),
      duration: s.duration,
      service_categories: s.service_categories,
    }));

    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/sales', async (_req, res, next) => {
  try {
    const data = await prisma.users.findMany({
      where: { deleted_at: null, status: 'active', roles: { name: { in: ['CS', 'Sales'] } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/team-members', async (_req, res, next) => {
  try {
    const data = await prisma.team_members.findMany({
      where: { status: 'active' },
      include: {
        users: { select: { id: true, name: true, email: true } },
        teams: { select: { id: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });
    const mapped = data.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      name: m.users?.name || 'Unknown',
      email: m.users?.email || null,
      team_name: m.teams?.name || null,
      role_in_team: m.teams?.name || 'Team Member',
    }));
    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
});

// ============ GET LIST ============
ordersRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { order_number: { contains: search } },
        { customer_name_snapshot: { contains: search } },
        { customers: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.orders.findMany({
      where,
      select: {
        id: true,
        order_number: true,
        parent_order_id: true,
        customer_id: true,
        pic_id: true,
        sales_id: true,
        team_id: true,
        customer_name_snapshot: true,
        customer_address_snapshot: true,
        pic_name_snapshot: true,
        pic_email_snapshot: true,
        status: true,
        payment_status: true,
        subtotal: true,
        discount_type: true,
        discount: true,
        tax_rate: true,
        tax: true,
        grand_total: true,
        start_date_project: true,
        end_date_project: true,
        created_at: true,
        customers: { select: { id: true, name: true } },
        sales_user: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
        order_services: {
          where: { deleted_at: null },
          select: {
            id: true,
            service_id: true,
            service_name_snapshot: true,
            category_name_snapshot: true,
            is_custom: true,
            price_deal: true,
            quantity: true,
            subtotal: true,
            status: true,
            notes: true,
          },
        },
        parent_order: {
          select: { id: true, order_number: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = orders.map((o) => {
      const formattedServices = o.order_services.map(formatOrderService);
      const totalQuantity = formattedServices.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...o,
        order_parent_id: o.parent_order_id,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        tax: Number(o.tax),
        tax_rate: Number(o.tax_rate),
        grand_total: Number(o.grand_total),
        quantity: totalQuantity,
        users: o.sales_user,
        order_services: formattedServices,
      };
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true,
        order_number: true,
        parent_order_id: true,
        customer_id: true,
        pic_id: true,
        sales_id: true,
        team_id: true,
        customer_name_snapshot: true,
        customer_address_snapshot: true,
        pic_name_snapshot: true,
        pic_email_snapshot: true,
        status: true,
        payment_status: true,
        subtotal: true,
        discount_type: true,
        discount: true,
        tax_rate: true,
        tax: true,
        grand_total: true,
        start_date_project: true,
        end_date_project: true,
        notes: true,
        cancelled_reason: true,
        cancelled_at: true,
        cancelled_by: true,
        created_at: true,
        updated_at: true,
        customers: { select: { id: true, name: true, email: true, phone: true, address: true } },
        customer_pics: { select: { id: true, name: true, position: true, email: true, phone: true } },
        sales_user: { select: { id: true, name: true, email: true } },
        cancelled_by_user: { select: { id: true, name: true, email: true } },
        teams: { select: { id: true, name: true } },
        parent_order: {
          select: { id: true, order_number: true, status: true },
        },
        child_orders: {
          where: { deleted_at: null },
          select: { id: true, order_number: true, status: true, grand_total: true, created_at: true },
        },
        order_services: {
          where: { deleted_at: null },
          select: {
            id: true,
            service_id: true,
            service_name_snapshot: true,
            category_name_snapshot: true,
            is_custom: true,
            price_deal: true,
            quantity: true,
            subtotal: true,
            status: true,
            notes: true,
            services: { select: { id: true, name: true } },
          },
        },
        order_assignments: {
          include: {
            team_members: {
              include: {
                users: { select: { id: true, name: true, email: true, phone: true } },
                teams: { select: { id: true, name: true } },
              },
            },
            jobs: { select: { id: true, name: true } },
            progress_order: {
              where: { deleted_at: null },
              select: { id: true, title: true, status: true, progress_percentage: true, completed_at: true },
            },
          },
        },
        invoices: {
          where: { deleted_at: null },
          select: { id: true, invoice_number: true, status: true, total_paid: true, due_date: true, issued_at: true, paid_at: true },
        },
        maintenances: {
          where: { deleted_at: null },
          select: { id: true, title: true, status: true, start_datetime: true, end_datetime: true },
        },
        order_status_history: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            from_status: true,
            to_status: true,
            notes: true,
            created_at: true,
            users: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const formattedServices = order.order_services.map(formatOrderService);
    const formattedAssignments = order.order_assignments.map(formatOrderAssignment);
    const totalQuantity = formattedServices.reduce((sum, item) => sum + item.quantity, 0);

    const data = {
      ...order,
      order_parent_id: order.parent_order_id,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      tax_rate: Number(order.tax_rate),
      grand_total: Number(order.grand_total),
      quantity: totalQuantity,
      service_name_snapshot: formattedServices.map((s) => s.service_name_snapshot).join(', '),
      service_price_snapshot: formattedServices[0]?.price_deal || 0,
      users: order.sales_user,
      order_services: formattedServices,
      order_assignments: formattedAssignments,
      invoices: order.invoices.map((inv) => ({
        ...inv,
        total_paid: Number(inv.total_paid),
      })),
      payments: order.invoices.map((inv) => ({
        ...inv,
        total_paid: Number(inv.total_paid),
      })),
      maintenance_orders: order.child_orders.map((co) => ({
        ...co,
        grand_total: Number(co.grand_total),
      })),
    };

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ CREATE ============
const serviceItemSchema = z.object({
  service_id: z.coerce.number().int().positive().optional().nullable(),
  service_name: z.string().optional().nullable(),
  service_name_snapshot: z.string().optional().nullable(),
  category_name_snapshot: z.string().optional().nullable(),
  is_custom: z.boolean().optional(),
  price_deal: z.coerce.number().min(0).optional().nullable(),
  deal_price: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  notes: z.string().optional().nullable(),
});

const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  pic_id: z.coerce.number().int().positive().optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  service_id: z.coerce.number().int().positive().optional().nullable(),
  services: z.array(serviceItemSchema).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  discount_type: z.enum(['percent', 'fixed']).default('fixed'),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).optional(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  parent_order_id: z.coerce.number().int().positive().optional().nullable(),
  order_parent_id: z.coerce.number().int().positive().optional().nullable(),
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      customer_id, pic_id, sales_id, team_id,
      service_id, services, quantity,
      discount_type, discount, tax_rate, tax,
      start_date_project, end_date_project,
      notes, parent_order_id, order_parent_id,
    } = parsed.data;

    const resolvedParentId = parent_order_id || order_parent_id || null;

    // Must provide either services array or single service_id
    const hasServicesArray = Array.isArray(services) && services.length > 0;
    if (!hasServicesArray && !service_id) {
      return res.status(422).json({
        success: false,
        message: 'Layanan wajib dipilih (services array atau service_id)',
      });
    }

    // Check customer exists
    const customer = await prisma.customers.findFirst({
      where: { id: BigInt(customer_id), deleted_at: null },
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
    }

    // Check PIC if provided
    let pic = null;
    if (pic_id) {
      pic = await prisma.customer_pics.findFirst({
        where: { id: BigInt(pic_id), customer_id: BigInt(customer_id), deleted_at: null },
      });
    } else {
      pic = await prisma.customer_pics.findFirst({
        where: { customer_id: BigInt(customer_id), is_primary: true, deleted_at: null },
      });
    }

    // Check parent order if provided
    if (resolvedParentId) {
      const parentOrder = await prisma.orders.findFirst({
        where: { id: BigInt(resolvedParentId), deleted_at: null },
      });
      if (!parentOrder) {
        return res.status(404).json({ success: false, message: 'Order induk (parent order) tidak ditemukan' });
      }
    }

    const enrichedItems = [];
    if (hasServicesArray) {
      for (const item of services) {
        let svc = null;
        if (item.service_id) {
          svc = await prisma.services.findFirst({
            where: { id: BigInt(item.service_id), deleted_at: null },
            include: { service_categories: true },
          });
          if (!svc) {
            return res.status(404).json({
              success: false,
              message: `Service dengan ID ${item.service_id} tidak ditemukan`,
            });
          }
        }

        const isCustom = Boolean(item.is_custom || !item.service_id);
        const nameSnapshot = item.service_name_snapshot || item.service_name || svc?.name || 'Custom Service';
        const categorySnapshot = item.category_name_snapshot || svc?.service_categories?.name || (isCustom ? 'Custom' : null);
        const catalogPrice = svc ? Number(svc.default_price) : 0;
        const dealPrice = (item.price_deal !== undefined && item.price_deal !== null)
          ? Number(item.price_deal)
          : ((item.deal_price !== undefined && item.deal_price !== null) ? Number(item.deal_price) : catalogPrice);
        const qty = item.quantity || 1;

        enrichedItems.push({
          service_id: svc ? svc.id : null,
          service_name_snapshot: nameSnapshot,
          category_name_snapshot: categorySnapshot,
          is_custom: isCustom,
          price_deal: dealPrice,
          quantity: qty,
          subtotal: dealPrice * qty,
          notes: item.notes || null,
        });
      }
    } else {
      const svc = await prisma.services.findFirst({
        where: { id: BigInt(service_id), deleted_at: null },
        include: { service_categories: true },
      });
      if (!svc) {
        return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
      }
      const catalogPrice = Number(svc.default_price);
      const qty = quantity || 1;

      enrichedItems.push({
        service_id: svc.id,
        service_name_snapshot: svc.name,
        category_name_snapshot: svc.service_categories?.name || null,
        is_custom: false,
        price_deal: catalogPrice,
        quantity: qty,
        subtotal: catalogPrice * qty,
        notes: null,
      });
    }

    // Calculate totals
    const subtotal = enrichedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    let discountAmount = 0;
    if (discount_type === 'percent') {
      discountAmount = (subtotal * Number(discount)) / 100;
    } else {
      discountAmount = Number(discount);
    }

    let taxAmount = 0;
    if (tax !== undefined) {
      taxAmount = Number(tax);
    } else if (Number(tax_rate) > 0) {
      taxAmount = ((subtotal - discountAmount) * Number(tax_rate)) / 100;
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    // Create order and order_services in transaction
    const order = await prisma.$transaction(async (tx) => {
      const orderNum = await generateOrderNumber(tx);
      const newOrder = await tx.orders.create({
        data: {
          order_number: orderNum,
          parent_order_id: resolvedParentId ? BigInt(resolvedParentId) : null,
          customer_id: BigInt(customer_id),
          pic_id: pic ? pic.id : null,
          sales_id: sales_id ? BigInt(sales_id) : null,
          team_id: team_id ? BigInt(team_id) : null,
          customer_name_snapshot: customer.name,
          customer_address_snapshot: customer.address || null,
          pic_name_snapshot: pic?.name || null,
          pic_email_snapshot: pic?.email || null,
          status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          discount_type,
          discount: discountAmount,
          tax_rate: Number(tax_rate),
          tax: taxAmount,
          grand_total: grandTotal,
          start_date_project: start_date_project ? new Date(start_date_project) : null,
          end_date_project: end_date_project ? new Date(end_date_project) : null,
          notes: notes || null,
        },
        select: {
          id: true,
          order_number: true,
          parent_order_id: true,
          status: true,
          subtotal: true,
          grand_total: true,
        },
      });

      for (const item of enrichedItems) {
        await tx.order_services.create({
          data: {
            order_id: newOrder.id,
            service_id: item.service_id,
            service_name_snapshot: item.service_name_snapshot,
            category_name_snapshot: item.category_name_snapshot,
            is_custom: item.is_custom,
            price_deal: item.price_deal,
            quantity: item.quantity,
            subtotal: item.subtotal,
            status: 'active',
            notes: item.notes,
          },
        });
      }

      // Record audit history
      await tx.order_status_history.create({
        data: {
          order_id: newOrder.id,
          from_status: null,
          to_status: 'pending',
          changed_by: sales_id ? BigInt(sales_id) : null,
          notes: 'Order dibuat',
        },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      data: {
        ...order,
        order_parent_id: order.parent_order_id,
        subtotal: Number(order.subtotal),
        grand_total: Number(order.grand_total),
      },
      message: 'Order berhasil dibuat',
    });
  } catch (err) { next(err); }
});

// ============ UPDATE ============
const updateSchema = z.object({
  customer_id: z.coerce.number().int().positive().optional(),
  pic_id: z.coerce.number().int().positive().optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  discount_type: z.enum(['percent', 'fixed']).optional(),
  discount: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.put('/:id', async (req, res, next) => {
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
    const existing = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (['in_progress', 'completed', 'cancelled'].includes(existing.status)) {
      return res.status(400).json({ success: false, message: 'Order yang sudah disetujui/berjalan tidak dapat diubah rinciannya' });
    }

    const data = { ...parsed.data };
    if (data.customer_id) data.customer_id = BigInt(data.customer_id);
    if (data.pic_id !== undefined) data.pic_id = data.pic_id ? BigInt(data.pic_id) : null;
    if (data.sales_id !== undefined) data.sales_id = data.sales_id ? BigInt(data.sales_id) : null;
    if (data.team_id !== undefined) data.team_id = data.team_id ? BigInt(data.team_id) : null;

    if (data.start_date_project !== undefined) {
      data.start_date_project = data.start_date_project ? new Date(data.start_date_project) : null;
    }
    if (data.end_date_project !== undefined) {
      data.end_date_project = data.end_date_project ? new Date(data.end_date_project) : null;
    }

    const order = await prisma.orders.update({
      where: { id },
      data,
      select: { id: true, order_number: true, status: true, grand_total: true },
    });

    res.json({
      success: true,
      data: {
        ...order,
        grand_total: Number(order.grand_total),
      },
      message: 'Order berhasil diupdate',
    });
  } catch (err) { next(err); }
});

// ============ APPROVE ORDER & AUTO-INVOICE ============
const approveSchema = z.object({
  approved_by: z.coerce.number().int().positive().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

ordersRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const parsed = approveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({
      where: { id, deleted_at: null },
      include: {
        invoices: { where: { deleted_at: null } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    if (!['pending', 'draft'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order dengan status '${order.status}' tidak dapat di-approve. Hanya order berstatus 'pending' atau 'draft' yang dapat disetujui.`,
      });
    }

    // Determine approver ID (body or header)
    const approverId = parsed.data.approved_by || (req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : null);
    if (approverId) {
      const approverUser = await prisma.users.findFirst({
        where: { id: BigInt(approverId), deleted_at: null },
        include: { roles: true },
      });
      if (!approverUser) {
        return res.status(404).json({ success: false, message: 'User approver tidak ditemukan' });
      }
      if (approverUser.roles && !['Super Admin', 'Admin'].includes(approverUser.roles.name)) {
        return res.status(403).json({
          success: false,
          message: 'Hanya Admin atau Super Admin yang berhak menyetujui (approve) order',
        });
      }
    }

    // Execute approval and auto invoice creation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update order status to in_progress
      const updatedOrder = await tx.orders.update({
        where: { id },
        data: {
          status: 'in_progress',
        },
        select: {
          id: true,
          order_number: true,
          parent_order_id: true,
          status: true,
          grand_total: true,
          customer_id: true,
        },
      });

      // 2. Record status history
      await tx.order_status_history.create({
        data: {
          order_id: id,
          from_status: order.status,
          to_status: 'in_progress',
          changed_by: approverId ? BigInt(approverId) : null,
          notes: 'Order disetujui (approval) dan invoice diterbitkan',
        },
      });

      // 3. Check if invoice already exists for this order
      let invoice = await tx.invoices.findFirst({
        where: { order_id: id, deleted_at: null },
      });

      if (!invoice) {
        const invoiceNum = await generateInvoiceNumber(tx);
        invoice = await tx.invoices.create({
          data: {
            invoice_number: invoiceNum,
            order_id: id,
            customer_id: order.customer_id,
            total_paid: 0,
            status: 'unpaid',
            due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
            issued_at: new Date(),
          },
          select: {
            id: true,
            invoice_number: true,
            status: true,
            total_paid: true,
            due_date: true,
            issued_at: true,
          },
        });
      }

      return {
        order: {
          ...updatedOrder,
          order_parent_id: updatedOrder.parent_order_id,
          approved_by: approverId,
          approved_at: new Date(),
          grand_total: Number(updatedOrder.grand_total),
        },
        invoice: {
          ...invoice,
          total_paid: Number(invoice.total_paid),
        },
      };
    });

    res.json({
      success: true,
      data: result,
      message: 'Order berhasil disetujui dan invoice telah dibuat',
    });
  } catch (err) { next(err); }
});

// ============ COMPLETION GUARD HELPER ============
async function verifyOrderCanBeCompleted(orderId) {
  const assignments = await prisma.order_assignments.findMany({
    where: { order_id: orderId },
    include: {
      team_members: {
        include: {
          users: { select: { id: true, name: true } },
        },
      },
      jobs: { select: { id: true, name: true } },
      progress_order: {
        where: { deleted_at: null },
        select: { id: true, status: true },
      },
    },
  });

  if (!assignments || assignments.length === 0) {
    return {
      allowed: false,
      status: 409,
      message: 'Order belum dapat diselesaikan: minimal harus ada 1 penugasan tim yang selesai',
    };
  }

  const assignmentStatusList = assignments.map((a) => ({
    id: a.id,
    role_in_order: a.jobs?.name || 'Staff',
    user_name: a.team_members?.users?.name || 'Staff',
    status: computeAssignmentStatus(a.progress_order),
  }));

  const unfinished = assignmentStatusList.filter((a) => !['completed', 'cancelled'].includes(a.status));
  if (unfinished.length > 0) {
    const details = unfinished.map((a) => `${a.role_in_order} (${a.user_name}) - status: ${a.status}`).join(', ');
    return {
      allowed: false,
      status: 409,
      message: `Order belum dapat diselesaikan: masih ada penugasan tim yang belum selesai [${details}]`,
      unfinished_assignments: unfinished,
    };
  }

  const completedCount = assignmentStatusList.filter((a) => a.status === 'completed').length;
  if (completedCount < 1) {
    return {
      allowed: false,
      status: 409,
      message: 'Order belum dapat diselesaikan: minimal harus ada 1 penugasan tim yang berstatus selesai (completed)',
    };
  }

  return { allowed: true };
}

// ============ COMPLETE ORDER ============
ordersRouter.patch('/:id/complete', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (order.status === 'completed') {
      return res.status(200).json({ success: true, data: order, message: 'Order sudah dalam status completed' });
    }

    const check = await verifyOrderCanBeCompleted(id);
    if (!check.allowed) {
      return res.status(check.status).json({
        success: false,
        message: check.message,
        unfinished_assignments: check.unfinished_assignments,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.orders.update({
        where: { id },
        data: {
          status: 'completed',
          end_date_project: order.end_date_project || new Date(),
        },
        select: { id: true, order_number: true, parent_order_id: true, status: true, end_date_project: true },
      });

      await tx.order_status_history.create({
        data: {
          order_id: id,
          from_status: order.status,
          to_status: 'completed',
          notes: 'Order selesai (completed)',
        },
      });

      return ord;
    });

    res.json({
      success: true,
      data: {
        ...updated,
        order_parent_id: updated.parent_order_id,
      },
      message: 'Order berhasil diselesaikan',
    });
  } catch (err) { next(err); }
});

// ============ UPDATE STATUS ============
ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = z.object({
      status: z.enum(['draft', 'pending', 'in_progress', 'completed', 'cancelled']),
      cancelled_reason: z.string().optional().nullable(),
      cancelled_by: z.coerce.number().int().positive().optional().nullable(),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Status tidak valid' });
    }

    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (parsed.data.status === 'completed') {
      const check = await verifyOrderCanBeCompleted(id);
      if (!check.allowed) {
        return res.status(check.status).json({
          success: false,
          message: check.message,
          unfinished_assignments: check.unfinished_assignments,
        });
      }
    }

    const updateData = { status: parsed.data.status };
    if (parsed.data.status === 'completed' && !order.end_date_project) {
      updateData.end_date_project = new Date();
    }
    if (parsed.data.status === 'cancelled') {
      updateData.cancelled_at = new Date();
      updateData.cancelled_reason = parsed.data.cancelled_reason || null;
      if (parsed.data.cancelled_by) updateData.cancelled_by = BigInt(parsed.data.cancelled_by);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.orders.update({
        where: { id },
        data: updateData,
        select: { id: true, order_number: true, parent_order_id: true, status: true, end_date_project: true },
      });

      await tx.order_status_history.create({
        data: {
          order_id: id,
          from_status: order.status,
          to_status: parsed.data.status,
          changed_by: parsed.data.cancelled_by ? BigInt(parsed.data.cancelled_by) : null,
          notes: parsed.data.cancelled_reason || `Status diubah ke ${parsed.data.status}`,
        },
      });

      return ord;
    });

    res.json({
      success: true,
      data: {
        ...updated,
        order_parent_id: updated.parent_order_id,
      },
      message: 'Status order berhasil diubah',
    });
  } catch (err) { next(err); }
});

// ============ DELETE ============
ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const order = await prisma.orders.findFirst({ where: { id, deleted_at: null } });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const invoiceCount = await prisma.invoices.count({ where: { order_id: id, deleted_at: null } });
    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Order masih punya ${invoiceCount} invoice terkait. Tidak bisa dihapus.`,
      });
    }

    await prisma.orders.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Order berhasil dihapus' });
  } catch (err) { next(err); }
});

// ============ CREATE MAINTENANCE ORDER ============
const maintenanceOrderSchema = z.object({
  service_id: z.coerce.number().int().positive().optional().nullable(),
  services: z.array(serviceItemSchema).optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  discount_type: z.enum(['percent', 'fixed']).default('fixed'),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).optional(),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

ordersRouter.post('/:id/maintenance', async (req, res, next) => {
  try {
    const parentId = BigInt(req.params.id);
    const parentOrder = await prisma.orders.findFirst({
      where: { id: parentId, deleted_at: null },
      include: { customers: true },
    });

    if (!parentOrder) {
      return res.status(404).json({ success: false, message: 'Order induk (parent order) tidak ditemukan' });
    }

    if (parentOrder.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Order maintenance hanya dapat diajukan untuk order yang sudah berstatus 'completed' (status saat ini: '${parentOrder.status}')`,
      });
    }

    const parsed = maintenanceOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      service_id, services, sales_id, team_id,
      quantity, discount_type, discount, tax_rate, tax,
      start_date_project, end_date_project, notes,
    } = parsed.data;

    const hasServicesArray = Array.isArray(services) && services.length > 0;
    if (!hasServicesArray && !service_id) {
      return res.status(422).json({
        success: false,
        message: 'Layanan maintenance wajib dipilih (services array atau service_id)',
      });
    }

    const enrichedItems = [];
    if (hasServicesArray) {
      for (const item of services) {
        let svc = null;
        if (item.service_id) {
          svc = await prisma.services.findFirst({
            where: { id: BigInt(item.service_id), deleted_at: null },
            include: { service_categories: true },
          });
          if (!svc) {
            return res.status(404).json({
              success: false,
              message: `Service maintenance dengan ID ${item.service_id} tidak ditemukan`,
            });
          }
        }
        const isCustom = Boolean(item.is_custom || !item.service_id);
        const nameSnapshot = item.service_name_snapshot || item.service_name || svc?.name || 'Maintenance Service';
        const categorySnapshot = item.category_name_snapshot || svc?.service_categories?.name || 'Maintenance';
        const catalogPrice = svc ? Number(svc.default_price) : 0;
        const dealPrice = (item.price_deal !== undefined && item.price_deal !== null)
          ? Number(item.price_deal)
          : ((item.deal_price !== undefined && item.deal_price !== null) ? Number(item.deal_price) : catalogPrice);
        const qty = item.quantity || 1;

        enrichedItems.push({
          service_id: svc ? svc.id : null,
          service_name_snapshot: nameSnapshot,
          category_name_snapshot: categorySnapshot,
          is_custom: isCustom,
          price_deal: dealPrice,
          quantity: qty,
          subtotal: dealPrice * qty,
          notes: item.notes || null,
        });
      }
    } else {
      const svc = await prisma.services.findFirst({
        where: { id: BigInt(service_id), deleted_at: null },
        include: { service_categories: true },
      });
      if (!svc) {
        return res.status(404).json({ success: false, message: 'Service maintenance tidak ditemukan' });
      }
      const catalogPrice = Number(svc.default_price);
      const qty = quantity || 1;
      enrichedItems.push({
        service_id: svc.id,
        service_name_snapshot: svc.name,
        category_name_snapshot: svc.service_categories?.name || null,
        is_custom: false,
        price_deal: catalogPrice,
        quantity: qty,
        subtotal: catalogPrice * qty,
        notes: null,
      });
    }

    const subtotal = enrichedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    let discountAmount = 0;
    if (discount_type === 'percent') {
      discountAmount = (subtotal * Number(discount)) / 100;
    } else {
      discountAmount = Number(discount);
    }

    let taxAmount = 0;
    if (tax !== undefined) {
      taxAmount = Number(tax);
    } else if (Number(tax_rate) > 0) {
      taxAmount = ((subtotal - discountAmount) * Number(tax_rate)) / 100;
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    // Create maintenance order and order_services in transaction
    const newMaintenanceOrder = await prisma.$transaction(async (tx) => {
      const orderNum = await generateOrderNumber(tx);
      const createdOrder = await tx.orders.create({
        data: {
          order_number: orderNum,
          parent_order_id: parentOrder.id,
          customer_id: parentOrder.customer_id,
          pic_id: parentOrder.pic_id,
          sales_id: sales_id ? BigInt(sales_id) : parentOrder.sales_id,
          team_id: team_id ? BigInt(team_id) : parentOrder.team_id,
          customer_name_snapshot: parentOrder.customer_name_snapshot,
          customer_address_snapshot: parentOrder.customer_address_snapshot,
          pic_name_snapshot: parentOrder.pic_name_snapshot,
          pic_email_snapshot: parentOrder.pic_email_snapshot,
          status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          discount_type,
          discount: discountAmount,
          tax_rate: Number(tax_rate),
          tax: taxAmount,
          grand_total: grandTotal,
          start_date_project: start_date_project ? new Date(start_date_project) : null,
          end_date_project: end_date_project ? new Date(end_date_project) : null,
          notes: notes || `Order Maintenance untuk ${parentOrder.order_number}`,
        },
        select: {
          id: true,
          order_number: true,
          parent_order_id: true,
          status: true,
          grand_total: true,
          customer_id: true,
        },
      });

      for (const item of enrichedItems) {
        await tx.order_services.create({
          data: {
            order_id: createdOrder.id,
            service_id: item.service_id,
            service_name_snapshot: item.service_name_snapshot,
            category_name_snapshot: item.category_name_snapshot,
            is_custom: item.is_custom,
            price_deal: item.price_deal,
            quantity: item.quantity,
            subtotal: item.subtotal,
            status: 'active',
            notes: item.notes,
          },
        });
      }

      await tx.order_status_history.create({
        data: {
          order_id: createdOrder.id,
          from_status: null,
          to_status: 'pending',
          changed_by: sales_id ? BigInt(sales_id) : parentOrder.sales_id,
          notes: `Order Maintenance dibuat untuk ${parentOrder.order_number}`,
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      data: {
        ...newMaintenanceOrder,
        order_parent_id: newMaintenanceOrder.parent_order_id,
        grand_total: Number(newMaintenanceOrder.grand_total),
      },
      message: 'Order maintenance berhasil dibuat dan ditautkan ke order induk',
    });
  } catch (err) { next(err); }
});