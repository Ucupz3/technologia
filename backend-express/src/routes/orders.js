import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { generateOrderNumber } from '../lib/orderHelpers.js';

export const ordersRouter = Router();

// ============ OPTIONS ============
ordersRouter.get('/options/customers', async (_req, res, next) => {
  try {
    const data = await prisma.customers.findMany({
      where: { deleted_at: null },
      select: {
        id: true, name: true, address: true,
        customer_pics: {
          where: { deleted_at: null, is_active: true },
          select: { id: true, name: true, email: true }
        }
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
      select: { id: true, name: true, default_price: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/sales', async (_req, res, next) => {
  try {
    const data = await prisma.users.findMany({
      where: { deleted_at: null, status: 'active', roles: { name: { in: ['CS'] } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

ordersRouter.get('/options/teams', async (_req, res, next) => {
  try {
    const data = await prisma.teams.findMany({
      where: { deleted_at: null, status: 'active' },
      select: {
        id: true, name: true,
        team_members: {
          select: {
            id: true,
            users: {
              select: {
                id: true, name: true,
                user_jobs: { include: { jobs: { select: { id: true, name: true } } } }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ GET LIST ============
ordersRouter.get('/', async (_req, res, next) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        customers: { select: { id: true, name: true } },
        teams: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.orders.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      include: {
        customers: true,
        customer_pics: true,
        sales_user: true,
        teams: true,
        order_services: true, // ✅ Multi services akan muncul di sini
        invoices: true,
        order_assignments: {
          include: { team_members: { include: { users: true } }, jobs: true },
        },
      },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ============ CREATE ORDER + AUTO INVOICE ============
const createSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  pic_id: z.coerce.number().int().positive().optional().nullable(),
  sales_id: z.coerce.number().int().positive().optional().nullable(),
  team_id: z.coerce.number().int().positive().optional().nullable(),
  
  // ✅ VALIDASI MULTIPLE SERVICES
  services: z.array(z.object({
    service_id: z.coerce.number().int().positive(),
    price_deal: z.coerce.number().min(0),
    quantity: z.coerce.number().int().min(1).default(1)
  })).min(1, 'Minimal pilih 1 layanan'),

  discount_type: z.enum(['fixed', 'percent']).default('fixed'),
  discount: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).default(0),
  start_date_project: z.string().optional().nullable(),
  end_date_project: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignments: z.array(z.object({
    team_member_id: z.coerce.number().int().positive(),
    job_id: z.coerce.number().int().positive(),
    is_lead: z.boolean().optional().default(false)
  })).optional()
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    console.log("=== PAYLOAD MASUK ===");
    console.log("Services:", req.body.services);
    console.log("Assignments:", req.body.assignments);
    console.log("=====================");

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(422).json({ success: false, message: 'Validasi gagal', errors: parsed.error.flatten().fieldErrors });

    const { 
      customer_id, pic_id, sales_id, team_id, services, 
      discount_type, discount, tax_rate, 
      start_date_project, end_date_project, notes, assignments 
    } = parsed.data;

    if (team_id && (!assignments || assignments.length === 0)) {
      return res.status(422).json({ success: false, message: 'Harap pilih "Posisi / Job" untuk anggota tim sebelum menyimpan.' });
    }

    const customer = await prisma.customers.findFirst({ where: { id: BigInt(customer_id), deleted_at: null } });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });

    const pic = pic_id ? await prisma.customer_pics.findFirst({ where: { id: BigInt(pic_id) } }) : null;

    // ✅ HITUNG TOTAL DARI BANYAK LAYANAN
    let subtotal = 0;
    const servicesData = [];

    for (const s of services) {
      const service = await prisma.services.findFirst({ 
        where: { id: BigInt(s.service_id), deleted_at: null },
        include: { service_categories: true }
      });
      if (!service) throw new Error(`Service dengan ID ${s.service_id} tidak ditemukan`);

      const price = Number(s.price_deal ?? service.default_price);
      const sSubtotal = price * s.quantity;
      subtotal += sSubtotal;

      servicesData.push({
        service_id: service.id,
        service_name_snapshot: service.name,
        category_name_snapshot: service.service_categories?.name || null,
        price_deal: price,
        quantity: s.quantity,
        subtotal: sSubtotal
      });
    }

    const discountAmount = discount_type === 'percent' ? (subtotal * discount) / 100 : discount;
    const taxAmount = ((subtotal - discountAmount) * tax_rate) / 100;
    const grandTotal = subtotal - discountAmount + taxAmount;

    const order = await prisma.$transaction(async (tx) => {
      const orderNum = await generateOrderNumber(tx);
      
      // 1. Buat Order Utama
      const newOrder = await tx.orders.create({
        data: {
          order_number: orderNum,
          customer_id: BigInt(customer_id),
          pic_id: pic ? pic.id : null,
          sales_id: sales_id ? BigInt(sales_id) : null,
          team_id: team_id ? BigInt(team_id) : null,
          customer_name_snapshot: customer.name,
          customer_address_snapshot: customer.address,
          pic_name_snapshot: pic?.name || null,
          pic_email_snapshot: pic?.email || null,
          status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          discount_type,
          discount: discountAmount,
          tax_rate,
          tax: taxAmount,
          grand_total: grandTotal,
          start_date_project: start_date_project ? new Date(start_date_project) : null,
          end_date_project: end_date_project ? new Date(end_date_project) : null,
          notes: notes || null,
        },
      });

      // 2. ✅ INSERT BANYAK LAYANAN KE ORDER_SERVICES
      for (const sd of servicesData) {
        await tx.order_services.create({
          data: {
            order_id: newOrder.id,
            ...sd,
            is_custom: false,
            status: 'active',
            notes: null,
          },
        });
      }

      // 3. Simpan Order Assignments (Tim)
      if (assignments && assignments.length > 0) {
        for (const a of assignments) {
          await tx.order_assignments.create({
            data: {
              order_id: newOrder.id,
              team_member_id: BigInt(a.team_member_id),
              job_id: BigInt(a.job_id),
              is_lead: a.is_lead,
              assigned_at: new Date(),
            }
          });
        }
      }

      // 4. OTOMATIS BUAT INVOICE
      const today = new Date();
      const ym = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
      const prefix = `INV-${ym}-`;
      const countInv = await tx.invoices.count({ where: { invoice_number: { startsWith: prefix } } });
      const invoiceNum = `${prefix}${String(countInv + 1).padStart(3, '0')}`;

      await tx.invoices.create({
        data: {
          invoice_number: invoiceNum,
          order_id: newOrder.id,
          customer_id: newOrder.customer_id,
          total_paid: 0,
          status: 'unpaid',
          issued_at: new Date(),
        }
      });

      // 5. Catat History
      await tx.order_status_history.create({
        data: {
          order_id: newOrder.id,
          from_status: null,
          to_status: 'pending',
          changed_by: sales_id ? BigInt(sales_id) : null,
          notes: 'Order dibuat & Invoice otomatis diterbitkan',
        },
      });

      return newOrder;
    });

    res.status(201).json({ success: true, data: order, message: 'Order berhasil dibuat & Invoice otomatis terbuat' });
  } catch (err) { next(err); }
});

ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'pending', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ success: false, message: 'Status tidak valid' });
    }

    const id = BigInt(req.params.id);
    
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: { status },
    });

    await prisma.order_status_history.create({
      data: {
        order_id: id,
        from_status: null,
        to_status: status,
        notes: `Status pengerjaan diubah menjadi ${status}`,
      }
    });

    res.json({ success: true, data: updatedOrder, message: 'Status pengerjaan berhasil diupdate' });
  } catch (err) {
    next(err);
  }
});

ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.orders.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Order berhasil dihapus' });
  } catch (err) { next(err); }
});