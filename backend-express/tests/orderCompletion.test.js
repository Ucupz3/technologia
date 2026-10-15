import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Completion Guard Logic', () => {
  function validateOrderCompletion(assignments) {
    if (!assignments || assignments.length === 0) {
      return { ok: false, message: 'minimal harus ada 1 penugasan tim yang selesai' };
    }
    const unfinished = assignments.filter(a => !['completed', 'cancelled'].includes(a.status));
    if (unfinished.length > 0) {
      return { ok: false, message: 'masih ada modul atau penugasan tim yang belum selesai' };
    }
    const completedCount = assignments.filter(a => a.status === 'completed').length;
    if (completedCount < 1) {
      return { ok: false, message: 'minimal harus ada 1 penugasan tim yang berstatus selesai (completed)' };
    }
    return { ok: true };
  }

  test('guard rejects completion if no assignments exist (0 assignments)', () => {
    const result = validateOrderCompletion([]);
    assert.equal(result.ok, false);
    assert.match(result.message, /minimal harus ada 1 penugasan tim/i);
  });

  test('guard rejects completion if pending or in_progress assignments exist', () => {
    const assignments = [
      { id: 1, role_in_order: 'Frontend', status: 'completed' },
      { id: 2, role_in_order: 'Backend', status: 'in_progress' },
    ];
    const result = validateOrderCompletion(assignments);
    assert.equal(result.ok, false);
    assert.match(result.message, /belum selesai/i);
  });

  test('guard rejects completion if all assignments are cancelled (0 completed)', () => {
    const assignments = [
      { id: 1, role_in_order: 'Frontend', status: 'cancelled' },
    ];
    const result = validateOrderCompletion(assignments);
    assert.equal(result.ok, false);
    assert.match(result.message, /minimal harus ada 1 penugasan tim yang berstatus selesai/i);
  });

  test('guard approves completion when all assignments completed (at least 1 completed)', () => {
    const assignments = [
      { id: 1, role_in_order: 'UI/UX', status: 'completed' },
      { id: 2, role_in_order: 'Backend', status: 'completed' },
    ];
    const result = validateOrderCompletion(assignments);
    assert.equal(result.ok, true);
  });

  test('guard approves completion when 1 assignment completed and 1 cancelled', () => {
    const assignments = [
      { id: 1, role_in_order: 'UI/UX', status: 'completed' },
      { id: 2, role_in_order: 'Optional Feature', status: 'cancelled' },
    ];
    const result = validateOrderCompletion(assignments);
    assert.equal(result.ok, true);
  });
});
