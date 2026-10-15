import { prisma as defaultPrisma } from './prisma.js';

/**
 * Calculates order subtotal, discount, tax, and grand total.
 * @param {Array<{ deal_price?: number|string, catalog_price?: number|string, price?: number|string, quantity?: number }>} items
 * @param {number|string} [discount=0]
 * @param {number|string} [tax=0]
 * @returns {{ subtotal: number, discount: number, tax: number, grand_total: number }}
 */
export function calculateOrderTotals(items = [], discount = 0, tax = 0) {
  let subtotal = 0;
  if (Array.isArray(items)) {
    for (const item of items) {
      const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      let unitPrice = 0;
      if (item.price_deal !== undefined && item.price_deal !== null && Number(item.price_deal) > 0) {
        unitPrice = Number(item.price_deal);
      } else if (item.deal_price !== undefined && item.deal_price !== null && Number(item.deal_price) > 0) {
        unitPrice = Number(item.deal_price);
      } else if (item.default_price !== undefined && item.default_price !== null) {
        unitPrice = Number(item.default_price);
      } else if (item.catalog_price !== undefined && item.catalog_price !== null) {
        unitPrice = Number(item.catalog_price);
      } else if (item.price !== undefined && item.price !== null) {
        unitPrice = Number(item.price);
      }
      subtotal += unitPrice * qty;
    }
  }

  const disc = Number(discount) >= 0 ? Number(discount) : 0;
  const tx = Number(tax) >= 0 ? Number(tax) : 0;
  const grand_total = subtotal - disc + tx;

  return {
    subtotal,
    discount: disc,
    tax: tx,
    grand_total,
  };
}

/**
 * Generates next sequence order number: ORD-YYYYMMDD-XXX
 * @param {object} [client] Prisma client or transaction client
 * @returns {Promise<string>}
 */
export async function generateOrderNumber(client = defaultPrisma) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;

  const count = await client.orders.count({
    where: { order_number: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

/**
 * Generates next sequence invoice number: INV-YYYYMMDD-XXX
 * @param {object} [client] Prisma client or transaction client
 * @returns {Promise<string>}
 */
export async function generateInvoiceNumber(client = defaultPrisma) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  const invoiceModel = client.invoices || client.payments;
  const count = await invoiceModel.count({
    where: { invoice_number: { startsWith: prefix } },
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

