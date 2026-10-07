import { useState } from 'react';
import { RefreshCw, Save, FileText } from 'lucide-react';
import { formatRupiah } from './helpers';

export default function PaymentFormModal({ options, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    order_id: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedOrder = options.orders.find((o) => String(o.id) === String(form.order_id));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          order_id: form.order_id,
          due_date: form.due_date || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess('Invoice berhasil dibuat');
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
            <FileText size={20} className="text-brand-accent" />
            Buat Invoice
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Pilih Order <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
                errors.order_id ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              }`}
              required
            >
              <option value="">Pilih order...</option>
              {options.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.customer_name} — {formatRupiah(o.grand_total)}
                </option>
              ))}
            </select>
            {errors.order_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.order_id[0]}</p>}
            {options.orders.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Semua order sudah punya invoice. Buat order baru dulu di halaman Orders.
              </p>
            )}
          </div>

          {selectedOrder && (
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Customer</span>
                <span className="text-brand-text font-medium">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Grand Total Order</span>
                <span className="text-brand-accent font-bold">{formatRupiah(selectedOrder.grand_total)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
            />
            <p className="text-xs text-brand-text-muted mt-1">
              Tanggal jatuh tempo invoice (opsional)
            </p>
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
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Membuat...' : 'Buat Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}