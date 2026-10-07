export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid',    label: 'Unpaid',    color: 'red' },
  { value: 'partial',   label: 'Partial',   color: 'amber' },
  { value: 'paid',      label: 'Paid',      color: 'emerald' },
  { value: 'overdue',   label: 'Overdue',   color: 'orange' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
];

export function getPaymentStatusInfo(status) {
  return PAYMENT_STATUS_OPTIONS.find((s) => s.value === status) || PAYMENT_STATUS_OPTIONS[0];
}

export function formatRupiah(n) {
  if (!n && n !== 0) return 'Rp 0';
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

export function toDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}