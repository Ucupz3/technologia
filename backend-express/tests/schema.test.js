import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';

describe('Prisma Schema Model Verification', () => {
  test('prisma client exposes order_services, order_assignments, and invoices delegates', () => {
    assert.ok(prisma.order_services, 'prisma.order_services should be defined');
    assert.ok(prisma.order_assignments, 'prisma.order_assignments should be defined');
    assert.ok(prisma.orders, 'prisma.orders should be defined');
    assert.ok(prisma.progress_order, 'prisma.progress_order should be defined');
    assert.ok(prisma.invoices, 'prisma.invoices should be defined');
  });

  test('orders model contains required new fields and relations', () => {
    const ordersModel = Prisma.dmmf.datamodel.models.find(m => m.name === 'orders');
    assert.ok(ordersModel, 'orders model exists in dmmf');

    const fieldMap = new Map(ordersModel.fields.map(f => [f.name, f]));

    // Check parent_order_id, customer_id, pic_id, sales_id, team_id, discount_type, tax_rate, cancelled_by
    assert.equal(fieldMap.get('parent_order_id')?.isRequired, false, 'parent_order_id should be nullable');
    assert.equal(fieldMap.get('customer_id')?.isRequired, true, 'customer_id should be required');
    assert.equal(fieldMap.get('pic_id')?.isRequired, false, 'pic_id should be nullable');
    assert.equal(fieldMap.get('sales_id')?.isRequired, false, 'sales_id should be nullable');
    assert.equal(fieldMap.get('cancelled_by')?.isRequired, false, 'cancelled_by should be nullable');

    // Check relations
    assert.ok(fieldMap.has('parent_order'), 'parent_order relation should exist');
    assert.ok(fieldMap.has('child_orders'), 'child_orders relation should exist');
    assert.ok(fieldMap.has('order_services'), 'order_services relation should exist');
    assert.ok(fieldMap.has('order_assignments'), 'order_assignments relation should exist');
    assert.ok(fieldMap.has('invoices'), 'invoices relation should exist');
    assert.ok(fieldMap.has('maintenances'), 'maintenances relation should exist');
  });

  test('order_services model contains all required fields and relations', () => {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === 'order_services');
    assert.ok(model, 'order_services model exists');

    const fieldMap = new Map(model.fields.map(f => [f.name, f]));
    assert.equal(fieldMap.get('order_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('service_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('service_name_snapshot')?.type, 'String');
    assert.equal(fieldMap.get('price_deal')?.type, 'Decimal');
    assert.equal(fieldMap.get('quantity')?.type, 'Int');
    assert.equal(fieldMap.get('subtotal')?.type, 'Decimal');
    assert.equal(fieldMap.get('is_custom')?.type, 'Boolean');
    assert.equal(fieldMap.get('status')?.type, 'order_services_status');
    assert.equal(fieldMap.get('notes')?.isRequired, false);
    assert.ok(fieldMap.has('orders'));
    assert.ok(fieldMap.has('services'));
  });

  test('order_assignments model contains all required fields and relations', () => {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === 'order_assignments');
    assert.ok(model, 'order_assignments model exists');

    const fieldMap = new Map(model.fields.map(f => [f.name, f]));
    assert.equal(fieldMap.get('order_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('team_member_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('job_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('is_lead')?.type, 'Boolean');
    assert.equal(fieldMap.get('assigned_at')?.type, 'DateTime');
    assert.ok(fieldMap.has('orders'));
    assert.ok(fieldMap.has('team_members'));
    assert.ok(fieldMap.has('jobs'));
    assert.ok(fieldMap.has('progress_order'));
  });

  test('progress_order model contains assignment_id and title', () => {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === 'progress_order');
    assert.ok(model, 'progress_order model exists');

    const fieldMap = new Map(model.fields.map(f => [f.name, f]));
    assert.equal(fieldMap.get('assignment_id')?.type, 'BigInt');
    assert.equal(fieldMap.get('title')?.type, 'String');
    assert.equal(fieldMap.get('progress_percentage')?.type, 'Int');
    assert.ok(fieldMap.has('order_assignments'), 'order_assignments relation should exist');
    assert.ok(fieldMap.has('progress_attachments'), 'progress_attachments relation should exist');
  });
});
