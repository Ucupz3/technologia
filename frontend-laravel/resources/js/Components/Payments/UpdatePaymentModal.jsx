import { useState } from 'react';
import { RefreshCw, Wallet, TrendingUp } from 'lucide-react';
import { formatRupiah, toDateInput } from './helpers';

export default function UpdatePaymentModal({ payment, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    amount: payment.total_paid || 0,
    paid_at: toDateInput(payment.paid_at || new Date()),
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const grandTotal = Number(payment.grand_total || 0);
  const newAmount = Number(form.amount) || 0;
  const remaining = Math.max(0, grandTotal - newAmount);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/v1/payments/${payment.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess('Pembayaran berhasil diupdate');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <Wallet size={20} className="text-brand-accent" />
            Update Pembayaran
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Invoice</span>
              <span className="text-brand-text font-mono">{payment.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Customer</span>
              <span className="text-brand-text font-medium">{payment.customer_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Grand Total</span>
              <span className="text-brand-text font-semibold">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Total Dibayar (Rp) <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              max={grandTotal}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
                errors.amount ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              }`}
              required
            />
            {errors.amount && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.amount[0]}</p>}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, amount: grandTotal })}
                className="text-xs bg-brand-muted text-brand-text px-3 py-1 rounded hover:bg-brand-muted/70 transition"
              >
                Full {formatRupiah(grandTotal)}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, amount: Math.round(grandTotal / 2) })}
                className="text-xs bg-brand-muted text-brand-text px-3 py-1 rounded hover:bg-brand-muted/70 transition"
              >
                Setengah
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Tanggal Bayar
            </label>
            <input
              type="date"
              value={form.paid_at}
              onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>

          {/* Preview */}
          <div className="bg-brand-muted/40 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted flex items-center gap-1">
                <TrendingUp size={12} /> Total Dibayar
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatRupiah(newAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Sisa</span>
              <span className={`font-semibold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatRupiah(remaining)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-border">
              <span className="text-brand-text font-medium">Status Baru</span>
              <span className="text-brand-accent font-bold">
                {newAmount <= 0 ? 'Unpaid' : newAmount >= grandTotal ? 'Paid' : 'Partial'}
              </span>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
            {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
}