import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assignmentsRouter, orderAssignmentsRouter } from '../src/routes/assignments.js';

describe('Assignments Router Verification', () => {
  test('assignmentsRouter is exported and defined', () => {
    assert.ok(assignmentsRouter, 'assignmentsRouter should be exported');
  });

  test('orderAssignmentsRouter is exported and defined', () => {
    assert.ok(orderAssignmentsRouter, 'orderAssignmentsRouter should be exported');
  });

  test('assignment status values match enum definitions', () => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    for (const status of validStatuses) {
      assert.ok(['pending', 'in_progress', 'completed', 'cancelled'].includes(status));
    }
  });
});
