import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Pencil, Trash2, X,
  Contact, Save, AlertCircle, CheckCircle2, Mail, Phone, MapPin,
} from 'lucide-react';

export default function CustomersIndex() {
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [salesFilter, setSalesFilter] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer, setEditCustomer] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/customers').then((r) => r.json()),
      fetch('/api/v1/customers/sales/options').then((r) => r.json()),
    ])
      .then(([c, s]) => {
        if (c.success) setCustomers(c.data || []);
        else setError(c.message || 'Gagal ambil data');
        if (s.success) setSalesList(s.data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q);
    const matchSales = !salesFilter || String(c.sales_id) === salesFilter;
    return matchSearch && matchSales;
  });

  return (
    <RoleLayout>
      <Head title="Customers" />

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

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Customers</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {customers.length} customer
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 flex items-center gap-2 text-sm font-semibold transition"
          >
            <Plus size={16} /> Tambah Customer
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari nama, email, atau phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Sales PIC</option>
            {salesList.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {(search || salesFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {customers.length} customer</span>
            <button
              onClick={() => { setSearch(''); setSalesFilter(''); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1 transition"
            >
              <X size={12} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">Error: {error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline">Coba lagi</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Contact size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {customers.length === 0 ? 'Belum ada customer' : 'Tidak ada yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Sales PIC</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-brand-text truncate">{c.name}</div>
                          <div className="text-xs text-brand-text-muted truncate">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-brand-text flex items-center gap-1.5">
                        <Mail size={12} className="text-brand-text-muted shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                      <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-brand-text-muted shrink-0" />
                        <span>{c.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.sales_name ? (
                        <span className="text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2 py-0.5 rounded-full font-medium">
                          {c.sales_name}
                        </span>
                      ) : (
                        <span className="text-xs text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {c.order_count} order
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditCustomer(c)}
                          title="Edit"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteCustomer(c)}
                          title="Hapus"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-brand-border text-xs text-brand-text-muted">
            Menampilkan {filtered.length} customer
          </div>
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => { setEditCustomer(selectedCustomer); setSelectedCustomer(null); }}
        />
      )}

      {editCustomer && (
        <CustomerFormModal
          mode="edit"
          customer={editCustomer}
          salesList={salesList}
          onClose={() => setEditCustomer(null)}
          onSuccess={(msg) => { setEditCustomer(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <CustomerFormModal
          mode="create"
          salesList={salesList}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteCustomer && (
        <ConfirmDeleteModal
          customer={deleteCustomer}
          onClose={() => setDeleteCustomer(null)}
          onSuccess={(msg) => { setDeleteCustomer(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL ============
function CustomerFormModal({ mode, customer, salesList, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
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

    const url = isEdit ? `/api/v1/customers/${customer.id}` : '/api/v1/customers';
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
        onSuccess(isEdit ? 'Customer berhasil diupdate' : 'Customer berhasil dibuat');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">
            {isEdit ? 'Edit Customer' : 'Tambah Customer Baru'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField
            label="Nama Customer"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            error={errors.name}
            placeholder="Contoh: PT Maju Bersama"
            required
          />
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            error={errors.email}
            placeholder="contact@majubersama.com"
            required
          />
          <FormField
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            error={errors.phone}
            placeholder="08123456789"
          />

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Sales PIC
            </label>
            <select
              value={form.sales_id}
              onChange={(e) => setForm({ ...form, sales_id: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
            >
              <option value="">— Tidak ada —</option>
              {salesList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Alamat
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="Jl. Merdeka No. 45, Jakarta"
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Catatan tambahan (opsional)"
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
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
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat')}
          </button>
        </div>
      </div>
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

// ============ DELETE CONFIRM ============
function ConfirmDeleteModal({ customer, onClose, onSuccess, onError }) {
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
      } else {
        onSuccess('Customer berhasil dihapus');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-red-500/30 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">Hapus Customer?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus customer <strong className="text-brand-text">{customer.name}</strong>?
          {customer.order_count > 0 && (
            <span className="block mt-2 text-amber-600 dark:text-amber-400 text-xs">
              ⚠️ Customer masih punya {customer.order_count} order — pindahkan/selesaikan dulu.
            </span>
          )}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DETAIL MODAL ============
function CustomerDetailModal({ customer, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md overflow-hidden">
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20" />
          <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
          <div className="px-6 -mt-12">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-2xl border-4 border-brand-secondary">
              {getInitials(customer.name)}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-brand-text">{customer.name}</h2>
          {customer.sales_name && (
            <span className="text-xs text-brand-text-muted mt-1 inline-block">
              Sales PIC: <span className="text-brand-accent font-medium">{customer.sales_name}</span>
            </span>
          )}

          <div className="mt-5 space-y-3">
            <DetailRow icon={Mail} label="Email" value={customer.email} />
            <DetailRow icon={Phone} label="Phone" value={customer.phone || '—'} />
            <DetailRow icon={MapPin} label="Alamat" value={customer.address || '—'} />
            <DetailRow icon={Contact} label="Total Order" value={`${customer.order_count} order`} />
          </div>

          {customer.notes && (
            <div className="mt-5">
              <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Notes</div>
              <p className="text-sm text-brand-text">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Tutup
          </button>
          <button onClick={onEdit} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2">
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-sm text-brand-text">{value}</div>
      </div>
    </div>
  );
}

// ============ HELPERS ============
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}