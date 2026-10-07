import { getPaymentStatusInfo } from './helpers';

export function PaymentStatusBadge({ status }) {
  const info = getPaymentStatusInfo(status);

  const colors = {
    unpaid:    'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    partial:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    paid:      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    overdue:   'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40',
    cancelled: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  };
  const dots = {
    unpaid: 'bg-red-500 dark:bg-red-400',
    partial: 'bg-amber-500 dark:bg-amber-400',
    paid: 'bg-emerald-500 dark:bg-emerald-400',
    overdue: 'bg-orange-500 dark:bg-orange-400',
    cancelled: 'bg-gray-500 dark:bg-gray-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.unpaid}`} />
      {info.label}
    </span>
  );
}