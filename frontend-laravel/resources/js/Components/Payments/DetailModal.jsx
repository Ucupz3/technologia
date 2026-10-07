import { useEffect, useState } from 'react';
import { RefreshCw, User, FileText, Calendar, Wallet } from 'lucide-react';
import { PaymentStatusBadge } from './Badges';
import { formatRupiah, formatDate, formatDateTime } from './helpers';

export default function PaymentDetailModal({ paymentId, onClose, onUpdatePayment }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/payments/${paymentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPayment(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [paymentId]);

  const progressPct = payment
    ? Math.min(100, (Number(payment.total_paid) / Number(payment.grand_total || 1)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text font-mono">
              {payment?.invoice_number || 'Loading...'}
            </h2>
            {payment && (
              <div className="flex items-center gap-2 mt-1">
                <PaymentStatusBadge status={payment.status} />
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center text-brand-text-muted py-8">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
              Loading...
            </div>
          )}

          {!loading && payment && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoBlock icon={User} label="Customer">
                  <div className="text-brand-text font-medium">{payment.customers?.name}</div>
                  <div className="text-xs text-brand-text-muted">{payment.customers?.email}</div>
                  <div className="text-xs text-brand-text-muted">{payment.customers?.phone || '—'}</div>
                </InfoBlock>

                <InfoBlock icon={FileText} label="Order">
                  <div className="text-brand-text font-mono text-sm">{payment.orders?.order_number}</div>
                  <div className="text-xs text-brand-text-muted">
                    Grand Total: {formatRupiah(payment.grand_total)}
                  </div>
                </InfoBlock>

                <InfoBlock icon={Calendar} label="Due Date">
                  <div className="text-brand-text text-sm">{formatDate(payment.due_date)}</div>
                </InfoBlock>

                <InfoBlock icon={Calendar} label="Issued">
                  <div className="text-brand-text text-sm">{formatDateTime(payment.issued_at)}</div>
                </InfoBlock>
              </div>

              {/* Progress Pembayaran */}
              <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={16} className="text-brand-accent" />
                  <h3 className="text-sm font-semibold text-brand-text">Progress Pembayaran</h3>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-muted">Total Dibayar</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatRupiah(payment.total_paid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-text-muted">Sisa</span>
                    <span className={`font-semibold ${payment.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatRupiah(payment.remaining)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-brand-border">
                    <span className="text-brand-text font-medium">Grand Total</span>
                    <span className="text-brand-accent font-bold">{formatRupiah(payment.grand_total)}</span>
                  </div>
                </div>

                <div className="h-2 bg-brand-primary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-accent to-brand-accent2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="text-xs text-brand-text-muted mt-1 text-right">
                  {progressPct.toFixed(0)}% terbayar
                </div>
              </div>

              {/* Info Tambahan */}
              {payment.paid_at && (
                <div className="text-sm text-brand-text-muted">
                  <strong className="text-brand-text">Dibayar penuh pada:</strong>{' '}
                  {formatDateTime(payment.paid_at)}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition"
          >
            Tutup
          </button>
          {payment && payment.status !== 'cancelled' && payment.status !== 'paid' && (
            <button
              onClick={() => onUpdatePayment(payment)}
              className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2"
            >
              <Wallet size={14} /> Update Pembayaran
            </button>
          )}
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