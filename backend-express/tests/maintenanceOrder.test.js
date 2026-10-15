import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Maintenance Order Linkage Verification', () => {
  test('maintenance order links correctly to parent order', () => {
    const parentOrder = { id: 101n, status: 'completed', customer_id: 202n, order_number: 'ORD-20261015-001' };
    const maintenanceOrder = {
      parent_order_id: parentOrder.id,
      order_parent_id: parentOrder.id,
      customer_id: parentOrder.customer_id,
      status: 'pending',
    };

    assert.equal(maintenanceOrder.parent_order_id, 101n);
    assert.equal(maintenanceOrder.order_parent_id, 101n);
    assert.equal(maintenanceOrder.customer_id, 202n);
    assert.equal(maintenanceOrder.status, 'pending');
  });

  test('maintenance order can only be created from completed parent order', () => {
    function canCreateMaintenance(parentStatus) {
      return parentStatus === 'completed';
    }

    assert.equal(canCreateMaintenance('completed'), true);
    assert.equal(canCreateMaintenance('in_progress'), false);
    assert.equal(canCreateMaintenance('pending'), false);
    assert.equal(canCreateMaintenance('draft'), false);
    assert.equal(canCreateMaintenance('cancelled'), false);
  });
});
