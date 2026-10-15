import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrderTotals, generateInvoiceNumber, generateOrderNumber } from '../src/lib/orderHelpers.js';

describe('Order Financial Calculations', () => {
  test('calculates subtotal with custom deal_price override', () => {
    const items = [
      { catalog_price: 5000000, deal_price: 3500000, quantity: 2 },
      { catalog_price: 1000000, quantity: 1 } // uses catalog_price
    ];
    const totals = calculateOrderTotals(items, 500000, 100000);
    assert.equal(totals.subtotal, 8000000); // (3500000*2) + (1000000*1)
    assert.equal(totals.discount, 500000);
    assert.equal(totals.tax, 100000);
    assert.equal(totals.grand_total, 7600000); // 8000000 - 500000 + 100000
  });

  test('uses catalog_price when deal_price is 0 or undefined', () => {
    const items = [
      { catalog_price: 2000000, deal_price: 0, quantity: 1 },
      { catalog_price: 3000000, quantity: 1 }
    ];
    const totals = calculateOrderTotals(items);
    assert.equal(totals.subtotal, 5000000);
    assert.equal(totals.grand_total, 5000000);
  });

  test('handles empty items array', () => {
    const totals = calculateOrderTotals([], 0, 0);
    assert.equal(totals.subtotal, 0);
    assert.equal(totals.grand_total, 0);
  });

  test('defaults discount and tax to 0', () => {
    const items = [{ catalog_price: 1000000, quantity: 1 }];
    const totals = calculateOrderTotals(items);
    assert.equal(totals.discount, 0);
    assert.equal(totals.tax, 0);
    assert.equal(totals.grand_total, 1000000);
  });
});

describe('Number Generation Helpers', () => {
  test('generateOrderNumber queries count with ORD- prefix', async () => {
    let capturedQuery = null;
    const mockPrisma = {
      orders: {
        count: async (args) => {
          capturedQuery = args;
          return 5;
        }
      }
    };
    const orderNum = await generateOrderNumber(mockPrisma);
    assert.match(orderNum, /^ORD-\d{8}-006$/);
    assert.ok(capturedQuery?.where?.order_number?.startsWith);
  });

  test('generateInvoiceNumber queries count with INV- prefix', async () => {
    let capturedQuery = null;
    const mockPrisma = {
      invoices: {
        count: async (args) => {
          capturedQuery = args;
          return 0;
        }
      }
    };
    const invNum = await generateInvoiceNumber(mockPrisma);
    assert.match(invNum, /^INV-\d{8}-001$/);
    assert.ok(capturedQuery?.where?.invoice_number?.startsWith);
  });
});
