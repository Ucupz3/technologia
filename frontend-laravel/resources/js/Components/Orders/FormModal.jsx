import { useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { formatRupiah } from './helpers';

export default function OrderFormModal({ mode, order, options, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    customer_id: order?.customers?.id || '',
    service_id: order?.services?.id || '',
    sales_id: order?.users?.id || '',
    team_id: order?.team_members?.id || '',
    quantity: order?.quantity || 1,
    discount: order?.discount || 0,
    tax: order?.tax || 0,
    start_date_project: toDateInput(order?.start_date_project),
    end_date_project: toDateInput(order?.end_date_project),
    notes: order?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedService = options.services.find((s) => String(s.id) === String(form.service_id));
  const price = selectedService ? Number(selectedService.price) : 0;
  const qty = Number(form.quantity) || 0;
  const subtotal = price * qty;
  const grandTotal = subtotal - Number(form.discount || 0) + Number(form.tax || 0);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = { ...form };
    if (!payload.sales_id) payload.sales_id = null;
    if (!payload.team_id) payload.team_id = null;
    if (!payload.start_date_project) payload.start_date_project = null;
    if (!payload.end_date_project) payload.end_date_project = null;

    const url = isEdit ? `/api/v1/orders/${order.id}` : '/api/v1/orders';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess(isEdit ? 'Order berhasil diupdate' : 'Order berhasil dibuat');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">
            {isEdit ? `Edit Order ${order.order_number}` : 'Buat Order Baru'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Customer & Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Customer"
              value={form.customer_id}
              onChange={(v) => setForm({ ...form, customer_id: v })}
              error={errors.customer_id}
              required
              options={options.customers.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` }))}
              placeholder="Pilih customer..."
            />
            <SelectField
              label="Service"
              value={form.service_id}
              onChange={(v) => setForm({ ...form, service_id: v })}
              error={errors.service_id}
              required
              options={options.services.map((s) => ({ value: s.id, label: `${s.name} — ${formatRupiah(s.price)}` }))}
              placeholder="Pilih service..."
            />
          </div>

          {/* Sales & Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Sales PIC (opsional)"
              value={form.sales_id}
              onChange={(v) => setForm({ ...form, sales_id: v })}
              options={options.sales.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="— Tidak ada —"
            />
            <SelectField
              label="Team Member (opsional)"
              value={form.team_id}
              onChange={(v) => setForm({ ...form, team_id: v })}
              options={options.teamMembers.map((t) => ({ value: t.id, label: `${t.name}${t.role_in_team ? ` — ${t.role_in_team}` : ''}` }))}
              placeholder="— Tidak ada —"
            />
          </div>

          {/* Quantity & Discount & Tax */}
          <div className="grid grid-cols-3 gap-4">
            <NumberField
              label="Quantity"
              value={form.quantity}
              onChange={(v) => setForm({ ...form, quantity: v })}
              min="1"
              required
            />
            <NumberField
              label="Discount (Rp)"
              value={form.discount}
              onChange={(v) => setForm({ ...form, discount: v })}
              min="0"
            />
            <NumberField
              label="Tax (Rp)"
              value={form.tax}
              onChange={(v) => setForm({ ...form, tax: v })}
              min="0"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              label="Tanggal Mulai"
              value={form.start_date_project}
              onChange={(v) => setForm({ ...form, start_date_project: v })}
            />
            <DateField
              label="Tanggal Selesai"
              value={form.end_date_project}
              onChange={(v) => setForm({ ...form, end_date_project: v })}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Harga satuan</span>
              <span className="text-brand-text font-medium">{formatRupiah(price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Subtotal ({qty}×)</span>
              <span className="text-brand-text font-medium">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Discount</span>
              <span className="text-red-600 dark:text-red-400">- {formatRupiah(form.discount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Tax</span>
              <span className="text-emerald-600 dark:text-emerald-400">+ {formatRupiah(form.tax)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-border">
              <span className="text-brand-text font-semibold">Grand Total</span>
              <span className="text-brand-accent font-bold text-lg">{formatRupiah(grandTotal)}</span>
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
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Order')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SUB COMPONENTS ============
function SelectField({ label, value, onChange, options, placeholder, error, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
          error ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
        }`}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error[0]}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange, min, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
        required={required}
      />
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
      />
    </div>
  );
}

function toDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}