import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import { RefreshCw, Search, FileText, Users, X, ChevronDown, Check, Plus } from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function getBasePath() {
  return window.location.pathname.replace(/\/orders.*$/, '');
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
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
    draft: 'bg-gray-500/15 text-gray-600 border-gray-500/40',
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
    completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-600 border-red-500/40',
  };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.draft}`}>{labels[status] || status}</span>;
}

export default function OrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const basePath = getBasePath();

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
    const matchSearch = !q || o.order_number?.toLowerCase().includes(q) || o.customer_name_snapshot?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Manajemen Orders" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Manajemen Orders</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {orders.length} order</p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari no order atau customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-brand-primary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative sm:w-44 sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">{STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}</span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isStatusOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button type="button" onClick={() => { setStatusFilter(''); setIsStatusOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!statusFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                    <span>Semua Status</span>{!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} type="button" onClick={() => { setStatusFilter(s.value); setIsStatusOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${statusFilter === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                      <span className="truncate">{s.label}</span>{statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <button onClick={load} className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <Link href={`${basePath}/orders/create`} className="bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap">
              <Plus size={16} /> Buat Order
            </Link>
          </div>
        </div>

        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {orders.length} order</span>
            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition">
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-accent" /></div>}
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">{error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="p-12 text-center"><FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Tidak ada order</p></div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">No Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Tim</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text text-sm font-mono">{o.order_number}</div>
                      <div className="text-xs text-brand-text-muted">{formatDate(o.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{o.customer_name_snapshot}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {o.teams?.name ? <span className="inline-flex items-center gap-1 text-xs bg-brand-muted/50 px-2 py-1 rounded border border-brand-border"><Users size={12} /> {o.teams.name}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent">{formatRupiah(o.grand_total)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/orders/${o.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
