import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Mail, Phone, MapPin,
  AlertCircle, CheckCircle2, Plus,
  Package, User,
} from 'lucide-react';

function getBasePath() {
  return window.location.pathname.replace(/\/customers.*$/, '');
}

const ORDER_STATUS_COLORS = {
  draft:       'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  pending:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
  in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
  completed:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  cancelled:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
};

const PAYMENT_STATUS_COLORS = {
  unpaid:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
  partial:  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
  paid:     'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  refunded: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  failed:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
};

export default function CustomerShow({ customerId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [picModalOpen, setPicModalOpen] = useState(false);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/customers/${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [customerId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Customer" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading customer...
        </div>
      </RoleLayout>
    );
  }

  if (error || !data) {
    return (
      <RoleLayout>
        <Head title="Detail Customer" />
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href={`${basePath}/customers`} className="text-brand-accent underline">
            ← Kembali ke daftar
          </Link>
        </div>
      </RoleLayout>
    );
  }

  const pics = data.pics || data.customer_pics || [];
  const orders = data.orders || [];

  return (
    <RoleLayout>
      <Head title={`Customer — ${data.name}`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-6">
        <Link
          href={`${basePath}/customers`}
          className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Customers
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-xl shrink-0">
              {getInitials(data.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text">{data.name}</h1>
              <p className="text-sm text-brand-text-muted mt-0.5">
                Customer ID: {data.id} · Terdaftar {formatDate(data.created_at)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={load}
              className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card title="Informasi Customer">
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow icon={Phone} label="Phone" value={data.phone || '—'} />
            <InfoRow icon={MapPin} label="Alamat" value={data.address || '—'} />
          </Card>

          <Card title="Sales PIC">
            {data.sales_name ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-semibold text-sm">
                  {getInitials(data.sales_name)}
                </div>
                <div>
                  <div className="text-sm font-medium text-brand-text">{data.sales_name}</div>
                  <div className="text-xs text-brand-text-muted">{data.sales_email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">Belum ada Sales PIC</p>
            )}
          </Card>

          {data.notes && (
            <Card title="Notes">
              <p className="text-sm text-brand-text whitespace-pre-line">{data.notes}</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Customer PIC"
            subtitle={`${pics.length} PIC terdaftar`}
            action={
              <button onClick={() => setPicModalOpen(true)}
                className="text-xs bg-brand-accent text-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-accent2 transition font-semibold flex items-center gap-1.5">
                <Plus size={12} /> Tambah PIC
              </button>
            }
          >
            {pics.length === 0 ? (
              <div className="text-center py-8">
                <User size={32} className="mx-auto mb-2 text-brand-text-muted/40" />
                <p className="text-sm text-brand-text-muted">Belum ada PIC terdaftar</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/50">
                {pics.map((pic) => (
                  <div key={pic.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-brand-muted/60 rounded-full flex items-center justify-center text-brand-text font-semibold text-xs shrink-0">
                        {getInitials(pic.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-brand-text truncate">
                          {pic.name}
                          {pic.is_primary && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent border border-brand-accent/40 font-semibold uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-brand-text-muted truncate">
                          {pic.position || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-brand-text-muted shrink-0">
                      <div>{pic.email || '—'}</div>
                      <div>{pic.phone || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Orders"
            subtitle={`${orders.length} order terakhir`}
            action={
              <Link href={`${basePath}/orders?customer_id=${data.id}`}
                className="text-xs text-brand-accent hover:text-brand-accent2 font-medium transition">
                Lihat semua →
              </Link>
            }
          >
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="mx-auto mb-2 text-brand-text-muted/40" />
                <p className="text-sm text-brand-text-muted">Belum ada order</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-brand-border">
                      <th className="px-2 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order #</th>
                      <th className="px-2 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Tanggal</th>
                      <th className="px-2 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                      <th className="px-2 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Payment</th>
                      <th className="px-2 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-brand-muted/30 transition">
                        <td className="px-2 py-2.5">
                          <Link href={`${basePath}/orders/${o.id}`}
                            className="text-sm font-medium text-brand-text hover:text-brand-accent transition">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 text-xs text-brand-text-muted">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium border ${ORDER_STATUS_COLORS[o.status] || ORDER_STATUS_COLORS.draft}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium border ${PAYMENT_STATUS_COLORS[o.payment_status] || PAYMENT_STATUS_COLORS.unpaid}`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-sm text-brand-text text-right font-medium">
                          {formatCurrency(o.grand_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {picModalOpen && (
        <PicFormModal
          customerId={data.id}
          onClose={() => setPicModalOpen(false)}
          onSuccess={(msg) => { setPicModalOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

function Card({ title, subtitle, action, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
          {subtitle && <p className="text-xs text-brand-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-sm text-brand-text break-words">{value}</div>
      </div>
    </div>
  );
}

function PicFormModal({ customerId, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: '', position: '', email: '', phone: '', is_primary: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = { ...form };
    if (!payload.email) payload.email = null;
    if (!payload.phone) payload.phone = null;
    if (!payload.position) payload.position = null;

    try {
      const res = await fetch(`/api/v1/customers/${customerId}/pics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menambah PIC');
      } else {
        onSuccess('PIC berhasil ditambahkan');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Tambah PIC" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
        <FormField label="Nama PIC" value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={errors.name} placeholder="Budi Santoso" required />
        <FormField label="Jabatan" value={form.position}
          onChange={(v) => setForm({ ...form, position: v })}
          error={errors.position} placeholder="Purchasing Manager" />
        <FormField label="Email" type="email" value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          error={errors.email} placeholder="budi@customer.com" />
        <FormField label="Phone" value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          error={errors.phone} placeholder="08123456789" />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
            className="rounded border-brand-border text-brand-accent focus:ring-0"
          />
          <span className="text-sm text-brand-text">Jadikan PIC utama</span>
        </label>
      </form>

      <ModalFooter>
        <button onClick={onClose} type="button"
          className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          {submitting ? 'Menyimpan...' : 'Tambah PIC'}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">{title}</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
      {children}
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, error, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none transition ${
          error ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
        }`}
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error[0]}</p>}
    </div>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(value);
}
