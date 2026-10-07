import { useState } from 'react';
import { RefreshCw, User, Briefcase, Users, Calendar, FileText, Wallet } from 'lucide-react';
import { OrderStatusBadge, PaymentStatusBadge } from './Badges';
import {
  ORDER_STATUS_OPTIONS,
  formatRupiah,
  formatDate,
  formatDateTime,
} from './helpers';

export default function OrderDetailModal({ orderId, onClose, onStatusChanged }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useState(() => { load(); }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder({ ...order, status: newStatus });
        onStatusChanged?.();
      }
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text">
              {order?.order_number || 'Loading...'}
            </h2>
            {order && (
              <div className="flex items-center gap-2 mt-1">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center text-brand-text-muted py-8">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
              Loading order...
            </div>
          )}

          {!loading && !order && (
            <p className="text-center text-brand-text-muted">Order tidak ditemukan</p>
          )}

          {!loading && order && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBlock icon={User} label="Customer">
                  <div className="text-brand-text font-medium">{order.customers?.name}</div>
                  <div className="text-xs text-brand-text-muted">{order.customers?.email}</div>
                  <div className="text-xs text-brand-text-muted">{order.customers?.phone || '—'}</div>
                </InfoBlock>

                <InfoBlock icon={User} label="Sales PIC">
                  <div className="text-brand-text font-medium">{order.users?.name || '—'}</div>
                  <div className="text-xs text-brand-text-muted">{order.users?.email || '—'}</div>
                </InfoBlock>

                <InfoBlock icon={Briefcase} label="Service">
                  <div className="text-brand-text font-medium">{order.service_name_snapshot}</div>
                  <div className="text-xs text-brand-text-muted">{formatRupiah(order.service_price_snapshot)} / unit</div>
                </InfoBlock>

                <InfoBlock icon={Users} label="Team Member">
                  <div className="text-brand-text font-medium">{order.team_members?.users?.name || '—'}</div>
                  <div className="text-xs text-brand-text-muted">{order.team_members?.role || '—'}</div>
                </InfoBlock>

                <InfoBlock icon={Calendar} label="Periode Project">
                  <div className="text-brand-text text-sm">
                    {formatDate(order.start_date_project)} — {formatDate(order.end_date_project)}
                  </div>
                </InfoBlock>

                <InfoBlock icon={Calendar} label="Dibuat">
                  <div className="text-brand-text text-sm">{formatDateTime(order.created_at)}</div>
                </InfoBlock>
              </div>

              {/* Financial */}
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={16} className="text-brand-accent" />
                  <h3 className="text-sm font-semibold text-brand-text">Rincian Biaya</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label={`Subtotal (${order.quantity}×)`} value={formatRupiah(order.subtotal)} />
                  <Row label="Discount" value={`- ${formatRupiah(order.discount)}`} valueClass="text-red-600 dark:text-red-400" />
                  <Row label="Tax" value={`+ ${formatRupiah(order.tax)}`} valueClass="text-emerald-600 dark:text-emerald-400" />
                  <div className="pt-2 border-t border-brand-border flex justify-between">
                    <span className="text-brand-text font-semibold">Grand Total</span>
                    <span className="text-brand-accent font-bold text-lg">{formatRupiah(order.grand_total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <FileText size={12} /> Notes
                  </h3>
                  <p className="text-sm text-brand-text">{order.notes}</p>
                </div>
              )}

              {/* Payments */}
              {order.payments?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">
                    Payment ({order.payments.length})
                  </h3>
                  <div className="border border-brand-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-brand-muted/40">
                        <tr>
                          <th className="px-3 py-2 font-medium text-brand-text-muted">Invoice</th>
                          <th className="px-3 py-2 font-medium text-brand-text-muted">Status</th>
                          <th className="px-3 py-2 font-medium text-brand-text-muted">Paid</th>
                          <th className="px-3 py-2 font-medium text-brand-text-muted">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/50">
                        {order.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2 text-brand-text">{p.invoice_number}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs px-2 py-0.5 rounded-full border border-brand-border text-brand-text-muted">
                                {p.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-brand-text">{formatRupiah(p.total_paid)}</td>
                            <td className="px-3 py-2 text-brand-text-muted text-xs">{formatDate(p.due_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Change Status */}
              {!['completed', 'cancelled'].includes(order.status) && (
                <div className="border-t border-brand-border pt-4">
                  <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">
                    Ubah Status Order
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUS_OPTIONS.filter((s) => s.value !== order.status).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(s.value)}
                        disabled={changingStatus}
                        className="text-xs bg-brand-muted text-brand-text px-3 py-1.5 rounded-lg hover:bg-brand-muted/70 transition disabled:opacity-50"
                      >
                        → {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-0.5">{label}</div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-brand-text' }) {
  return (
    <div className="flex justify-between">
      <span className="text-brand-text-muted">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}