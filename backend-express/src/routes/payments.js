import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export const paymentsRouter = Router();

// ============ HELPER ============
async function generateInvoiceNumber() {
  const today = new Date();
  const ym = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `INV-${ym}-`;

  const count = await prisma.payments.count({
    where: { invoice_number: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

function computeStatus(totalPaid, grandTotal, dueDate, currentStatus) {
  const paid = Number(totalPaid);
  const total = Number(grandTotal);
  if (currentStatus === 'cancelled') return 'cancelled';
  if (paid <= 0) {
    // cek overdue
    if (dueDate && new Date(dueDate) < new Date() && currentStatus !== 'paid') return 'overdue';
    return 'unpaid';
  }
  if (paid >= total) return 'paid';
  return 'partial';
}

// ============ OPTIONS ============
paymentsRouter.get('/options/orders', async (_req, res, next) => {
  try {
    const data = await prisma.orders.findMany({
      where: { deleted_at: null },
      select: {
        id: true, order_number: true, grand_total: true,
        customers: { select: { id: true, name: true } },
        payments: { where: { deleted_at: null }, select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter: hanya order yang belum punya invoice (1 order = 1 payment)
    const mapped = data
      .filter((o) => o.payments.length === 0)
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        grand_total: Number(o.grand_total),
        customer_id: o.customers?.id,
        customer_name: o.customers?.name,
      }));

    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
});

// ============ GET LIST ============
paymentsRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { invoice_number: { contains: search } },
        { customers: { name: { contains: search } } },
        { orders: { order_number: { contains: search } } },
      ];
    }

    const payments = await prisma.payments.findMany({
      where,
      select: {
        id: true, invoice_number: true, total_paid: true, status: true,
        due_date: true, issued_at: true, paid_at: true, created_at: true,
        orders: {
          select: { id: true, order_number: true, grand_total: true, payment_status: true },
        },
        customers: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = payments.map((p) => ({
      id: p.id,
      invoice_number: p.invoice_number,
      total_paid: Number(p.total_paid),
      status: p.status,
      due_date: p.due_date,
      issued_at: p.issued_at,
      paid_at: p.paid_at,
      created_at: p.created_at,
      order_id: p.orders?.id,
      order_number: p.orders?.order_number,
      grand_total: Number(p.orders?.grand_total || 0),
      remaining: Number(p.orders?.grand_total || 0) - Number(p.total_paid),
      order_payment_status: p.orders?.payment_status,
      customer_id: p.customers?.id,
      customer_name: p.customers?.name,
      customer_email: p.customers?.email,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
paymentsRouter.get('/:id', async (req, res, next) => {
  try {
    const payment = await prisma.payments.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      select: {
        id: true, invoice_number: true, total_paid: true, status: true,
        due_date: true, issued_at: true, paid_at: true, created_at: true, updated_at: true,
        orders: {
          select: {
            id: true, order_number: true, grand_total: true, subtotal: true,
            discount: true, tax: true, payment_status: true,
            customers: { select: { id: true, name: true, email: true, phone: true, address: true } },
          },
        },
        customers: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    res.json({
      success: true,
      data: {
        ...payment,
        total_paid: Number(payment.total_paid),
        grand_total: Number(payment.orders?.grand_total || 0),
        remaining: Number(payment.orders?.grand_total || 0) - Number(payment.total_paid),
      },
    });
  } catch (err) { next(err); }
});

// ============ CREATE (issue invoice for order) ============
const createSchema = z.object({
  order_id: z.coerce.number().int().positive(),
  due_date: z.string().optional().nullable(),
});

paymentsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { order_id, due_date } = parsed.data;

    const order = await prisma.orders.findFirst({
      where: { id: BigInt(order_id), deleted_at: null },
      select: { id: true, customer_id: true, grand_total: true },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const existing = await prisma.payments.findFirst({
      where: { order_id: order.id, deleted_at: null },
    });
    if (existing) return res.status(409).json({ success: false, message: 'Order ini sudah punya invoice' });

    const payment = await prisma.payments.create({
      data: {
        invoice_number: await generateInvoiceNumber(),
        order_id: order.id,
        customer_id: order.customer_id,
        total_paid: 0,
        status: 'unpaid',
        due_date: due_date ? new Date(due_date) : null,
        issued_at: new Date(),
      },
      select: { id: true, invoice_number: true, status: true, due_date: true },
    });

    res.status(201).json({ success: true, data: payment, message: 'Invoice berhasil dibuat' });
  } catch (err) { next(err); }
});

// ============ UPDATE INVOICE (due_date only) ============
const updateSchema = z.object({
  due_date: z.string().optional().nullable(),
});

paymentsRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ success: false, message: 'Validasi gagal' });
    }

    const id = BigInt(req.params.id);
    const existing = await prisma.payments.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    const payment = await prisma.payments.update({
      where: { id },
      data: { due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null },
      select: { id: true, invoice_number: true, due_date: true },
    });

    res.json({ success: true, data: payment, message: 'Invoice berhasil diupdate' });
  } catch (err) { next(err); }
});

// ============ UPDATE PAYMENT AMOUNT ============
const updatePaymentSchema = z.object({
  amount: z.coerce.number().min(0),
  paid_at: z.string().optional().nullable(),
});

paymentsRouter.patch('/:id/pay', async (req, res, next) => {
  try {
    const parsed = updatePaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        message: 'Validasi gagal',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const id = BigInt(req.params.id);
    const existing = await prisma.payments.findFirst({
      where: { id, deleted_at: null },
      select: { id: true, order_id: true, total_paid: true, status: true,
        due_date: true, orders: { select: { grand_total: true } } },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });
    if (existing.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Invoice sudah dibatalkan' });
    }

    const newTotalPaid = Number(parsed.data.amount);
    const grandTotal = Number(existing.orders.grand_total);

    if (newTotalPaid > grandTotal) {
      return res.status(400).json({
        success: false,
        message: `Total bayar (${newTotalPaid}) melebihi grand total (${grandTotal})`,
      });
    }

    const newStatus = computeStatus(newTotalPaid, grandTotal, existing.due_date, existing.status);

    // Transaksi: update payment + order payment_status
    const [payment] = await prisma.$transaction([
      prisma.payments.update({
        where: { id },
        data: {
          total_paid: newTotalPaid,
          status: newStatus,
          paid_at: parsed.data.paid_at
            ? new Date(parsed.data.paid_at)
            : (newStatus === 'paid' ? new Date() : null),
        },
        select: {
          id: true, invoice_number: true, total_paid: true, status: true,
          paid_at: true, due_date: true,
        },
      }),
      prisma.orders.update({
        where: { id: existing.order_id },
        data: {
          payment_status: newStatus === 'paid' ? 'paid'
            : newStatus === 'partial' ? 'partial'
            : newStatus === 'overdue' ? 'partial'
            : 'unpaid',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...payment,
        total_paid: Number(payment.total_paid),
        grand_total: grandTotal,
        remaining: grandTotal - Number(payment.total_paid),
      },
      message: 'Pembayaran berhasil diupdate',
    });
  } catch (err) { next(err); }
});

// ============ CANCEL INVOICE ============
paymentsRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const existing = await prisma.payments.findFirst({ where: { id, deleted_at: null } });
    if (!existing) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    await prisma.payments.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json({ success: true, message: 'Invoice berhasil dibatalkan' });
  } catch (err) { next(err); }
});

// ============ DELETE ============
paymentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const payment = await prisma.payments.findFirst({ where: { id, deleted_at: null } });
    if (!payment) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    if (Number(payment.total_paid) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice sudah ada pembayaran. Cancel dulu, tidak boleh dihapus.',
      });
    }

    await prisma.payments.update({ where: { id }, data: { deleted_at: new Date() } });
    res.json({ success: true, message: 'Invoice berhasil dihapus' });
  } catch (err) { next(err); }
});