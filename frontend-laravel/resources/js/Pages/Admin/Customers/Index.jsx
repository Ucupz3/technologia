import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, X,
  Contact, AlertCircle, CheckCircle2, Mail, Phone,
  ChevronDown, Check
} from 'lucide-react';

function getBasePath() {
  return window.location.pathname.replace(/\/customers.*$/, '');
}

export default function CustomersIndex() {
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [salesFilter, setSalesFilter] = useState('');
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/customers').then((r) => r.json()),
      fetch('/api/v1/customers/customer-service/options').then((r) => r.json()),
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

  useEffect(() => { load(); }, []);

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

  const goToDetail = (customer) => {
    router.visit(`${basePath}/customers/${customer.id}`);
  };

  return (
    <RoleLayout>
      <Head title="Customers" />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/15 dark:bg-red-950/90 border-red-500/40 text-red-600 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words">
            {toast.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Customers</h1>
        <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
          Total {customers.length} customer
        </p>
      </div>

      {/* ============ FILTER BAR (RESPONSIF) ============ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          
          {/* SEARCH + CUSTOMER SERVICE */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama, email, atau phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button 
                  type="button" 
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Custom Dropdown Customer Service */}
            <div className="relative sm:w-56 shrink-0">
              <button
                type="button"
                onClick={() => setIsSalesOpen(!isSalesOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">
                  {salesFilter 
                    ? salesList.find((s) => String(s.id) === String(salesFilter))?.name 
                    : 'Semua Customer Service'}
                </span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isSalesOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isSalesOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setSalesFilter(''); setIsSalesOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${!salesFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                  >
                    <span>Semua Customer Service</span>
                    {!salesFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {salesList.map((s) => {
                    const isSelected = String(salesFilter) === String(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSalesFilter(s.id); setIsSalesOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${isSelected ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                      >
                        <span className="truncate">{s.name}</span>
                        {isSelected && <Check size={14} className="text-brand-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* REFRESH + TAMBAH CUSTOMER */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button 
              onClick={load} 
              className="flex-1 sm:flex-initial justify-center bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 sm:py-3 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <button 
              onClick={() => setCreateOpen(true)} 
              className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 sm:py-3 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Tambah Customer
            </button>
          </div>
        </div>

        {/* Info Filter Aktif */}
        {(search || salesFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2.5 rounded-xl backdrop-blur-sm">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {customers.length} customer</span>
            <button
              onClick={() => { setSearch(''); setSalesFilter(''); setIsSalesOpen(false); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition"
            >
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* ============ DATA VIEW CONTAINER ============ */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
        {loading && (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            <p className="text-xs sm:text-sm">Loading...</p>
          </div>
        )}

        {error && (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">Coba lagi</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <Contact size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted text-xs sm:text-sm">
              {customers.length === 0 ? 'Belum ada customer' : 'Tidak ada yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  className="p-4 space-y-3 hover:bg-brand-muted/30 transition cursor-pointer"
                  onClick={() => goToDetail(c)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0 shadow-sm">
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-brand-text truncate">{c.name}</div>
                        <div className="text-[11px] text-brand-text-muted">ID: {c.id}</div>
                      </div>
                    </div>
                    {c.sales_name ? (
                      <span className="text-[11px] bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2 py-0.5 rounded-full font-medium shrink-0">
                        {c.sales_name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-brand-text-muted shrink-0">—</span>
                    )}
                  </div>

                  <div className="space-y-1 bg-brand-primary/40 rounded-xl p-2.5 border border-brand-border/40 text-xs">
                    <div className="text-brand-text flex items-center gap-2 truncate">
                      <Mail size={13} className="text-brand-text-muted shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="text-brand-text-muted flex items-center gap-2">
                      <Phone size={13} className="text-brand-text-muted shrink-0" />
                      <span>{c.phone || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-brand-text-muted">
                      <strong className="text-brand-text font-semibold">{c.order_count}</strong> order
                    </span>
                    <Link
                      href={`${basePath}/customers/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-muted/40 border-b border-brand-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">No</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Contact</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer Service</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      className="hover:bg-brand-muted/40 transition cursor-pointer"
                      onClick={() => goToDetail(c)}
                    >
                      <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0">
                            {getInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-brand-text truncate">{c.name}</div>
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
                        <div className="flex items-center justify-end">
                          <Link
                            href={`${basePath}/customers/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                          >
                            Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-brand-border text-xs text-brand-text-muted">
            Menampilkan {filtered.length} customer
          </div>
        )}
      </div>

      {/* FORM MODAL CREATE */}
      {createOpen && (
        <CustomerFormModal
          mode="create"
          salesList={salesList}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL (RESPONSIF) ============
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-brand-text">
            {isEdit ? 'Edit Customer' : 'Tambah Customer Baru'}
          </h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
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
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Customer Service
            </label>
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

        {/* Footer Modal Fixed */}
        <div className="px-5 py-4 border-t border-brand-border flex justify-end gap-2 shrink-0 bg-brand-secondary">
          <button type="button" onClick={onClose}
            className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {submitting ? 'Menyimpan...' : 'Buat'}
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