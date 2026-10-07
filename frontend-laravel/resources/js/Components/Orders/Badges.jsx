import { getOrderStatusInfo, getPaymentStatusInfo } from './helpers';

export function OrderStatusBadge({ status }) {
  const info = getOrderStatusInfo(status);
  const colors = {
    draft:       'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/40',
    pending:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    in_progress: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40',
    completed:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    cancelled:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
  };
  const dotColors = {
    draft: 'bg-slate-500 dark:bg-slate-400',
    pending: 'bg-amber-500 dark:bg-amber-400',
    in_progress: 'bg-cyan-500 dark:bg-cyan-400',
    completed: 'bg-emerald-500 dark:bg-emerald-400',
    cancelled: 'bg-red-500 dark:bg-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.draft}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.draft}`} />
      {info.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  const info = getPaymentStatusInfo(status);
  const colors = {
    unpaid:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    partial:  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    paid:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    refunded: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
    failed:   'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>
      {info.label}
    </span>
  );
}