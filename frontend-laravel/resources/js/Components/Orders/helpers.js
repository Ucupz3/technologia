// ============ CONSTANTS ============
export const ORDER_STATUS_OPTIONS = [
  { value: 'draft',       label: 'Draft',       color: 'bg-slate-500' },
  { value: 'pending',     label: 'Pending',     color: 'bg-amber-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-cyan-500' },
  { value: 'completed',   label: 'Completed',   color: 'bg-emerald-500' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'bg-red-500' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',   label: 'Unpaid',   color: 'bg-red-500' },
  { value: 'partial',  label: 'Partial',  color: 'bg-amber-500' },
  { value: 'paid',     label: 'Paid',     color: 'bg-emerald-500' },
  { value: 'refunded', label: 'Refunded', color: 'bg-blue-500' },
  { value: 'failed',   label: 'Failed',   color: 'bg-gray-500' },
];

export function getOrderStatusInfo(status) {
  return ORDER_STATUS_OPTIONS.find((s) => s.value === status) || ORDER_STATUS_OPTIONS[0];
}

export function getPaymentStatusInfo(status) {
  return PAYMENT_STATUS_OPTIONS.find((s) => s.value === status) || PAYMENT_STATUS_OPTIONS[0];
}

// ============ FORMATTING ============
export function formatRupiah(n) {
  if (!n) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}