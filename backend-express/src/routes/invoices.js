import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createAuditLog } from '../lib/auditHelper.js';

export const invoicesRouter = Router();
export const paymentsRouter = invoicesRouter;

// Helper biar BigInt & Decimal aman di JSON
const safeSerialize = (obj) => {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    // Prisma Decimal
    if (value && typeof value === 'object' && value.constructor?.name === 'Decimal') {
      return Number(value);
    }
    return value;
  }));
};

const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

// Setup Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/invoices';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `INV-PROOF-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

function computeInvoiceStatus(totalPaid, grandTotal, currentStatus) {
  if (currentStatus === 'cancelled') return 'cancelled';
  const paid = Number(totalPaid);
  const total = Number(grandTotal);
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

// ============ GET LIST ============
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const userRole = req.header('X-User-Role');
    const userId = req.header('X-User-Id');
    const where = { deleted_at: null };

    // Sales/CS hanya lihat invoice dari customer mereka
    if ((userRole === 'Sales' || userRole === 'CS') && userId) {
      where.customers = {
        sales_id: BigInt(userId)
      };
    }

    const invoices = await prisma.invoices.findMany({
      where,
      select: {
        id: true, invoice_number: true, total_paid: true, status: true,
        due_date: true, issued_at: true, paid_at: true, created_at: true,
        orders: { select: { id: true, order_number: true, grand_total: true, payment_status: true } },
        customers: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = invoices.map((inv) => ({
      id: inv.id.toString(),
      invoice_number: inv.invoice_number,
      total_paid: Number(inv.total_paid),
      status: inv.status,
      due_date: inv.due_date,
      order_id: inv.orders?.id?.toString(),
      order_number: inv.orders?.order_number,
      grand_total: Number(inv.orders?.grand_total || 0),
      remaining: Number(inv.orders?.grand_total || 0) - Number(inv.total_paid),
      customer_name: inv.customers?.name,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ GET DETAIL ============
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const userRole = req.header('X-User-Role');
    const userId = req.header('X-User-Id');
    const where = { id: BigInt(req.params.id), deleted_at: null };

    // Sales/CS hanya lihat invoice dari customer mereka
    if ((userRole === 'Sales' || userRole === 'CS') && userId) {
      where.customers = {
        sales_id: BigInt(userId)
      };
    }

    const invoice = await prisma.invoices.findFirst({
      where,
      include: {
        orders: { include: { order_services: true } },
        customers: true, 
        invoice_attachments: true,
      },
    });

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    const data = safeSerialize({
      ...invoice,
      total_paid: Number(invoice.total_paid),
      grand_total: Number(invoice.orders?.grand_total || 0),
      remaining: Number(invoice.orders?.grand_total || 0) - Number(invoice.total_paid),
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ============ UPDATE PAYMENT ============
invoicesRouter.post('/:id/pay', upload.single('proof_file'), async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const amountPaid = Number(req.body.amount);
    
    if (!amountPaid || amountPaid <= 0) {
      return res.status(422).json({ success: false, message: 'Nominal pembayaran tidak valid' });
    }

    const invoice = await prisma.invoices.findFirst({
      where: { id, deleted_at: null },
      include: { orders: true }
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    const currentPaid = Number(invoice.total_paid);
    const newTotalPaid = currentPaid + amountPaid;
    const grandTotal = Number(invoice.orders.grand_total);

    if (newTotalPaid > grandTotal) {
      return res.status(400).json({ success: false, message: `Total bayar melebihi tagihan. Sisa: Rp ${grandTotal - currentPaid}` });
    }

    const newInvoiceStatus = computeInvoiceStatus(newTotalPaid, grandTotal, invoice.status);
    let newOrderPaymentStatus = 'unpaid';
    if (newInvoiceStatus === 'paid') newOrderPaymentStatus = 'paid';
    if (newInvoiceStatus === 'partial') newOrderPaymentStatus = 'partial';

    await prisma.$transaction(async (tx) => {
      if (req.file) {
        await tx.invoice_attachments.create({
          data: {
            invoice_id: id,
            file_path: `/uploads/invoices/${req.file.filename}`,
            file_name: req.file.originalname,
            file_type: req.file.mimetype,
            file_size: req.file.size,
          }
        });
      }
      await tx.invoices.update({
        where: { id },
        data: {
          total_paid: newTotalPaid,
          status: newInvoiceStatus,
          paid_at: newInvoiceStatus === 'paid' ? new Date() : null,
        },
      });
      await tx.orders.update({
        where: { id: invoice.order_id },
        data: { payment_status: newOrderPaymentStatus },
      });
    });

    const detailText = `Mencatat pembayaran invoice ${invoice.invoice_number}.
Nominal: Rp ${amountPaid.toLocaleString('id-ID')}
Total Dibayar: Rp ${newTotalPaid.toLocaleString('id-ID')}
Status Invoice: ${newInvoiceStatus}`;

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: id,
      module: 'Invoices',
      details: detailText,
      data: { invoice_number: invoice.invoice_number, amount: amountPaid, status: newInvoiceStatus },
      req,
    });

    res.json({ success: true, message: 'Pembayaran berhasil & Status Order telah disinkronisasi' });
  } catch (err) { next(err); }
});

// ============ SEND EMAIL (FINAL FIX) ============
invoicesRouter.post('/:id/send-email', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { send_to_customer, send_to_pic } = req.body;

    const invoice = await prisma.invoices.findFirst({
      where: { id, deleted_at: null },
      include: { 
        orders: { include: { order_services: true } }, 
        customers: true 
      }
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice tidak ditemukan' });

    const recipients = [];
    if (send_to_customer && invoice.customers?.email) recipients.push(invoice.customers.email.trim());
    if (send_to_pic && invoice.orders?.pic_email_snapshot) recipients.push(invoice.orders.pic_email_snapshot.trim());
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length === 0) {
      return res.status(422).json({ success: false, message: 'Tidak ada email tujuan yang valid' });
    }

    const mailUser = process.env.MAIL_USER;
    const mailPass = (process.env.MAIL_PASS || process.env.MAIL_PASSWORD || '').replace(/\s/g, '');
    const mailFrom = process.env.MAIL_FROM || `"ERP Jasa" <${mailUser}>`;
    const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
    const mailPort = Number(process.env.MAIL_PORT) || 587;

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465,
      auth: { user: mailUser, pass: mailPass },
    });

    await transporter.verify();

    // Data untuk struk - SAMA PERSIS kayak di frontend InvoiceShow
    const customerName = invoice.orders?.customer_name_snapshot || invoice.customers?.name || '—';
    const picName = invoice.orders?.pic_name_snapshot || '—';
    const services = invoice.orders?.order_services || [];
    const grandTotal = Number(invoice.orders?.grand_total || 0);
    const totalPaid = Number(invoice.total_paid);
    const remaining = grandTotal - totalPaid;

    const formatRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
    const formatDateEmail = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    const itemsHtml = services.map(svc => `
      <tr>
        <td style="padding: 6px 0;">
          <div style="font-weight: bold; color: #000;">${svc.service_name_snapshot}</div>
          <div style="font-size: 10px; color: #6b7280;">${Number(svc.quantity)} x ${formatRp(svc.price_deal)}</div>
        </td>
        <td style="text-align: right; vertical-align: top; color: #000;">${formatRp(svc.subtotal)}</td>
      </tr>
    `).join('');

    const discountHtml = Number(invoice.orders?.discount) > 0 ? `
      <div style="display: flex; justify-content: space-between; color: #4b5563;">
        <span>Diskon</span><span>-${formatRp(invoice.orders?.discount)}</span>
      </div>
    ` : '';

    // INI HTML NYA SUDAH IDENTIK DENGAN PREVIEW DI InvoiceShow
    const htmlBody = `
      <div style="font-family: 'Courier New', Courier, monospace; max-width: 400px; margin: 0 auto; background: #ffffff; padding: 32px; border: 1px solid #d1d5db; border-radius: 12px; color: #000000;">
        
        <div style="text-align: center; margin-bottom: 24px; padding-top: 8px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px;">TEKNA.ID</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Solusi Digital Terbaik</p>
          <p style="margin: 2px 0 0; font-size: 12px; color: #6b7280;">Jl. Teknologi No. 123, Jakarta</p>
        </div>

        <div style="font-size: 12px; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; padding: 12px 0; margin-bottom: 16px; line-height: 22px;">
          <div style="display: flex; justify-content: space-between;"><span>No. Invoice:</span><span style="font-weight: bold;">${invoice.invoice_number}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Tanggal:</span><span>${formatDateEmail(invoice.created_at)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Customer:</span><span>${customerName}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>PIC:</span><span>${picName}</span></div>
        </div>

        <table style="width: 100%; font-size: 12px; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 1px solid #d1d5db;">
              <th style="text-align: left; padding-bottom: 8px;">Item</th>
              <th style="text-align: right; padding-bottom: 8px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="font-size: 12px; border-top: 1px dashed #d1d5db; padding-top: 12px; line-height: 22px;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal</span><span>${formatRp(invoice.orders?.subtotal)}</span></div>
          ${discountHtml}
          <div style="display: flex; justify-content: space-between;"><span>Pajak</span><span>${formatRp(invoice.orders?.tax)}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; border-top: 1px solid #d1d5db; padding-top: 8px; margin-top: 8px;">
            <span>Grand Total</span><span>${formatRp(grandTotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #059669; font-weight: bold; margin-top: 4px;">
            <span>Sudah Dibayar</span><span>${formatRp(totalPaid)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #dc2626; font-weight: bold; font-size: 14px; margin-top: 4px;">
            <span>Sisa Tagihan</span><span>${formatRp(remaining)}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px dashed #d1d5db; padding-top: 16px; margin-top: 20px; line-height: 14px;">
          <p style="margin: 0;">Terima kasih atas kepercayaan Anda.</p>
          <p style="margin: 4px 0 0;">Barang/Jasa yang sudah dibeli tidak dapat dikembalikan.</p>
        </div>
      </div>
    `;

    for (const email of uniqueRecipients) {
      await transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: `Invoice Tagihan ${invoice.invoice_number}`,
        html: htmlBody,
      });

      try {
        await prisma.email_logs.create({
          data: {
            recipient: email,
            subject: `Invoice Tagihan ${invoice.invoice_number}`,
            body: htmlBody,
            status: 'sent',
            related_order_id: invoice.order_id,
            related_invoice_id: invoice.id,
            sent_at: new Date(),
          }
        });
      } catch (e) {
        console.warn('Log gagal:', e.message);
      }
    }

    // Audit log untuk send email (1 log untuk semua recipient)
    const emailList = uniqueRecipients.join(', ');
    const detailText = `Mengirim invoice ${invoice.invoice_number} ke email:
${uniqueRecipients.map(e => `- ${e}`).join('\n')}`;
    
    await createAuditLog({
      action: 'SEND_EMAIL',
      entityType: 'Invoice',
      entityId: invoice.id,
      module: 'Invoices',
      details: detailText,
      data: { 
        recipients: uniqueRecipients, 
        recipient_count: uniqueRecipients.length,
        invoice_number: invoice.invoice_number 
      },
      req,
    });

    res.json({ success: true, message: `Invoice berhasil dikirim ke ${uniqueRecipients.length} email.` });
  } catch (err) { 
    console.error('Email Error Detail:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ CANCEL ============
invoicesRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.invoices.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ success: true, message: 'Invoice dibatalkan' });
  } catch (err) { next(err); }
});