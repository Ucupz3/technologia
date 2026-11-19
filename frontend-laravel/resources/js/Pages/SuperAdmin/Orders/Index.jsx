import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, FileText,
  CheckCircle2, AlertCircle, Users, ChevronDown, Check, X
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
function getBasePath() {
  return window.location.pathname.replace(/\/orders.*$/, '');
}

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

function OrderStatusBadge({ status }) {
  const labels = {
    draft: 'Draft',
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  const colors = {
    draft: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
    completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
  };
  return (
    <span className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border shrink-0 ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

export default function OrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data || []);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || o.name?.toLowerCase().includes(q)
      || o.customer_name_snapshot?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Orders" />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Orders</h1>
        <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">Total {orders.length} order</p>
      </div>

      {/* ============ FILTER BAR ============ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          
          {/* SEARCH + STATUS FILTER */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama order atau customer..."
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

            {/* Custom Dropdown Status */}
            <div className="relative sm:w-44 shrink-0">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">{STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}</span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isStatusOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button 
                    type="button" 
                    onClick={() => { setStatusFilter(''); setIsStatusOpen(false); }} 
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${!statusFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                  >
                    <span>Semua Status</span>{!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button 
                      key={s.value} 
                      type="button" 
                      onClick={() => { setStatusFilter(s.value); setIsStatusOpen(false); }} 
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${statusFilter === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                    >
                      <span className="truncate">{s.label}</span>{statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REFRESH + BUAT ORDER */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button 
              onClick={load} 
              className="flex-1 sm:flex-initial justify-center bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 sm:py-3 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <Link 
              href={`${basePath}/orders/create`} 
              className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 sm:py-3 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Buat Order
            </Link>
          </div>
        </div>

        {/* Info Filter Aktif */}
        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2.5 rounded-xl backdrop-blur-sm">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {orders.length} order</span>
            <button 
              onClick={() => { setSearch(''); setStatusFilter(''); setIsStatusOpen(false); }} 
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
            <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted text-xs sm:text-sm">
              {orders.length === 0 ? 'Tidak ada order' : 'Tidak ada order yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {filtered.map((o) => (
                <div key={o.id} className="p-4 space-y-3 hover:bg-brand-muted/30 transition">
                  <div className="flex items-center justify-end gap-2">
                    <OrderStatusBadge status={o.status} />
                  </div>

                  <div className="bg-brand-primary/40 rounded-xl p-3 border border-brand-border/40 space-y-2">
                    <div>
                      <span className="text-brand-text-muted text-[10px] uppercase tracking-wider block font-semibold mb-0.5">Nama Order</span>
                      <span className="text-xs text-brand-text font-medium truncate block">
                        {o.name || <span className="text-brand-text-muted italic">—</span>}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-brand-border/30">
                      <div>
                        <span className="text-brand-text-muted text-[10px] uppercase tracking-wider block font-semibold">Customer</span>
                        <span className="text-brand-text truncate block font-medium">{o.customer_name_snapshot || '—'}</span>
                      </div>
                      <div>
                        <span className="text-brand-text-muted text-[10px] uppercase tracking-wider block font-semibold">Tim</span>
                        <span className="text-brand-text truncate block font-medium">
                          {o.teams?.name ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-brand-text">
                              <Users size={11} className="text-brand-text-muted shrink-0" /> {o.teams.name}
                            </span>
                          ) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-brand-text-muted uppercase tracking-wider block font-semibold">Total</span>
                      <span className="text-sm font-bold text-brand-accent">{formatRupiah(o.grand_total)}</span>
                    </div>
                    <Link
                      href={`${basePath}/orders/${o.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                    >
                      Detail Order
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
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Nama Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Tim</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Total</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {filtered.map((o) => (
                    <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-4 py-3 text-sm text-brand-text font-medium">
                        {o.name || <span className="text-brand-text-muted italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-text">{o.customer_name_snapshot}</td>
                      <td className="px-4 py-3 text-sm text-brand-text-muted">
                        {o.teams?.name ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-brand-muted/50 px-2 py-1 rounded border border-brand-border">
                            <Users size={12} /> {o.teams.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-brand-accent">{formatRupiah(o.grand_total)}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`${basePath}/orders/${o.id}`}
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
      </div>
    </RoleLayout>
  );
}