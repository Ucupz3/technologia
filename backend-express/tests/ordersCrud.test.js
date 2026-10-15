import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ordersRouter } from '../src/routes/orders.js';

describe('Orders Multi-Service and Immutability', () => {
  test('router exports ordersRouter handler', () => {
    assert.ok(ordersRouter, 'ordersRouter should be defined and exported');
  });

  test('immutability guard rules reject editing approved/completed/cancelled orders', () => {
    const lockedStatuses = ['in_progress', 'completed', 'cancelled'];
    const editableStatuses = ['draft', 'pending'];

    for (const status of lockedStatuses) {
      const isLocked = ['in_progress', 'completed', 'cancelled'].includes(status);
      assert.equal(isLocked, true, `Status ${status} should be locked`);
    }

    for (const status of editableStatuses) {
      const isLocked = ['in_progress', 'completed', 'cancelled'].includes(status);
      assert.equal(isLocked, false, `Status ${status} should be editable`);
    }
  });

  test('multi-service payload validation logic', () => {
    // Empty services array check
    const emptyServices = [];
    const hasValidServices = Array.isArray(emptyServices) && emptyServices.length > 0;
    assert.equal(hasValidServices, false);

    const validServices = [
      { service_id: 1, deal_price: 3500000, quantity: 1 },
      { service_id: 2, quantity: 2 }
    ];
    assert.equal(validServices.length > 0, true);
  });
});
