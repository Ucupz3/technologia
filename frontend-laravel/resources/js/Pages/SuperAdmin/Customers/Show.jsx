import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Mail, Phone, MapPin,
  AlertCircle, CheckCircle2, Pencil, Trash2, Plus,
  Package, User, Save,
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

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [picModalOpen, setPicModalOpen] = useState(false);
  const [salesList, setSalesList] = useState([]);

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

  const loadSales = () => {
    fetch('/api/v1/customers/customer-service/options')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSalesList(d.data || []); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadSales();
  }, [customerId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Customer" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading customer...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !data) {
    return (
      <RoleLayout>
        <Head title="Detail Customer" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href={`${basePath}/customers`} className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">
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

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href={`${basePath}/customers`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Customers
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-base sm:text-xl shrink-0 shadow-sm">
              {getInitials(data.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text truncate">{data.name}</h1>
              <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 truncate">
                Customer ID: {data.id} · Terdaftar {formatDate(data.created_at)}
              </p>
            </div>
          </div>

          {/* Action Buttons (Full Width Grid di Mobile, Flex Auto di Desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={load}
              className="justify-center bg-brand-secondary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span>Refresh</span>
            </button>
            <button 
              onClick={() => setEditOpen(true)}
              className="justify-center bg-brand-accent text-brand-primary px-3.5 py-2.5 rounded-xl hover:bg-brand-accent2 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Pencil size={14} /> <span>Edit</span>
            </button>
            <button 
              onClick={() => setDeleteOpen(true)}
              className="justify-center bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-3.5 py-2.5 rounded-xl hover:bg-red-500/20 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Trash2 size={14} /> <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kolom Kiri: Informasi, Customer Service, Notes */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Informasi Customer">
            <InfoRow icon={Mail} label="Email" value={data.email} />
            <InfoRow icon={Phone} label="Phone" value={data.phone || '—'} />
            <InfoRow icon={MapPin} label="Alamat" value={data.address || '—'} />
          </Card>

          <Card title="Customer Service">
            {data.sales_name ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-semibold text-sm shrink-0">
                  {getInitials(data.sales_name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-brand-text truncate">{data.sales_name}</div>
                  <div className="text-xs text-brand-text-muted truncate">{data.sales_email}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-brand-text-muted">Belum ada Customer Service</p>
            )}
          </Card>

          {data.notes && (
            <Card title="Notes">
              <div className="bg-brand-primary/40 rounded-xl p-3 sm:p-3.5 border border-brand-border/40">
                <p className="text-xs sm:text-sm text-brand-text whitespace-pre-line break-words">{data.notes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Kolom Kanan: Customer PIC & Orders */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer PIC Card */}
          <Card
            title="Customer PIC"
            subtitle={`${pics.length} PIC terdaftar`}
            action={
              <button 
                onClick={() => setPicModalOpen(true)}
                className="text-xs bg-brand-accent text-brand-primary px-3 py-1.5 rounded-xl hover:bg-brand-accent2 transition font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> Tambah PIC
              </button>
            }
          >
            {pics.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <User size={32} className="mx-auto mb-2 text-brand-text-muted/40" />
                <p className="text-xs sm:text-sm text-brand-text-muted">Belum ada PIC terdaftar</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/50">
                {pics.map((pic) => (
                  <div key={pic.id} className="py-3 flex items-start sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-muted/60 rounded-full flex items-center justify-center text-brand-text font-semibold text-xs shrink-0">
                        {getInitials(pic.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-brand-text truncate flex items-center gap-1.5 flex-wrap">
                          <span>{pic.name}</span>
                          {pic.is_primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/15 text-brand-accent border border-brand-accent/40 font-semibold uppercase tracking-wider">
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
                      <div className="truncate max-w-[120px] sm:max-w-none">{pic.email || '—'}</div>
                      <div>{pic.phone || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Orders Card */}
          <Card
            title="Orders"
            subtitle={`${orders.length} order terakhir`}
            action={
              <Link 
                href={`${basePath}/orders?customer_id=${data.id}`}
                className="text-xs text-brand-accent hover:text-brand-accent2 font-medium transition"
              >
                Lihat semua →
              </Link>
            }
          >
            {orders.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Package size={32} className="mx-auto mb-2 text-brand-text-muted/40" />
                <p className="text-xs sm:text-sm text-brand-text-muted">Belum ada order</p>
              </div>
            ) : (
              <>
                {/* 1. CARD VIEW (MOBILE - < md) */}
                <div className="block md:hidden divide-y divide-brand-border/50">
                  {orders.map((o) => (
                    <div key={o.id} className="py-3 space-y-2 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <Link 
                          href={`${basePath}/orders/${o.id}`}
                          className="text-xs sm:text-sm font-bold text-brand-text hover:text-brand-accent transition truncate"
                        >
                          {o.order_number}
                        </Link>
                        <span className="text-xs sm:text-sm font-bold text-brand-text shrink-0">
                          {formatCurrency(o.grand_total)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 text-xs text-brand-text-muted">
                        <span>{formatDate(o.created_at)}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${ORDER_STATUS_COLORS[o.status] || ORDER_STATUS_COLORS.draft}`}>
                            {o.status}
                          </span>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${PAYMENT_STATUS_COLORS[o.payment_status] || PAYMENT_STATUS_COLORS.unpaid}`}>
                            {o.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. TABLE VIEW (DESKTOP - >= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                            <Link 
                              href={`${basePath}/orders/${o.id}`}
                              className="text-sm font-medium text-brand-text hover:text-brand-accent transition"
                            >
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
              </>
            )}
          </Card>
        </div>
      </div>

      {/* MODALS */}
      {editOpen && (
        <CustomerEditModal
          customer={data}
          salesList={salesList}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {picModalOpen && (
        <PicFormModal
          customerId={data.id}
          onClose={() => setPicModalOpen(false)}
          onSuccess={(msg) => { setPicModalOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOpen && (
        <DeleteCustomerModal
          customer={data}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Customer berhasil dihapus');
            router.visit(`${basePath}/customers`);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ HELPER COMPONENTS (RESPONSIF) ============

function Card({ title, subtitle, action, children }) {
  return (
    <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
      <div className="px-4 sm:px-5 py-3.5 border-b border-brand-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-xs sm:text-sm text-brand-text break-words mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function CustomerEditModal({ customer, salesList, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    sales_id: customer?.sales_id || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = { ...form };
    if (!payload.phone) payload.phone = null;
    if (!payload.sales_id) payload.sales_id = null;

    try {
      const res = await fetch(`/api/v1/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess('Customer berhasil diupdate');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="Edit Customer" onClose={onClose}>
      <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <FormField label="Nama Customer" value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={errors.name} placeholder="PT Maju Bersama" required />
        <FormField label="Email" type="email" value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          error={errors.email} placeholder="contact@majubersama.com" required />
        <FormField label="Phone" value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          error={errors.phone} placeholder="08123456789" />

        <div>
          <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Customer Service</label>
          <select
            value={form.sales_id}
            onChange={(e) => setForm({ ...form, sales_id: e.target.value })}
            className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
          >
            <option value="">— Tidak ada —</option>
            {salesList.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Alamat</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition resize-none"
          />
        </div>
      </form>

      <ModalFooter>
        <button onClick={onClose} type="button"
          className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </ModalFooter>
    </ModalShell>
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
      <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
            className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-0"
          />
          <span className="text-xs sm:text-sm text-brand-text font-medium">Jadikan PIC utama</span>
        </label>
      </form>

      <ModalFooter>
        <button onClick={onClose} type="button"
          className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          {submitting ? 'Menyimpan...' : 'Tambah PIC'}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}

function DeleteCustomerModal({ customer, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus');
        setSubmitting(false);
      } else {
        onSuccess();
      }
    } catch {
      onError('Gagal menghubungi server');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-md p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-brand-text">Hapus Customer?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-brand-text mb-6">
          Yakin ingin menghapus customer <strong className="text-brand-text font-semibold">{customer.name}</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleDelete} disabled={submitting}
            className="flex-1 sm:flex-initial justify-center bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-brand-text">{title}</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div className="px-5 py-4 border-t border-brand-border flex justify-end gap-2 shrink-0 bg-brand-secondary">
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
        className={`w-full bg-brand-primary border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition ${
          error ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent'
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