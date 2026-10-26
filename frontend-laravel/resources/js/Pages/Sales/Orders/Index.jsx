import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, FileText, CheckCircle2, AlertCircle,
  Users, ChevronDown, Check, X
} from 'lucide-react';

// Currency & Date helpers (English format)
const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Status filter options
const STATUS_OPTIONS = [
  { value: 'draft',       label: 'Draft' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

// Order Progress Status Badge
function OrderStatusBadge({ status }) {
  const labels = {
    draft:       'Draft',
    pending:     'Pending',
    in_progress: 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
  };
  const colors = {
    draft:       'bg-gray-500/15 text-gray-400 border-gray-500/40',
    pending:     'bg-amber-500/15 text-amber-400 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    cancelled:   'bg-red-500/15 text-red-400 border-red-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

// Order Payment Status Badge
function PaymentStatusBadge({ status }) {
  const labels = {
    unpaid:   'Unpaid',
    partial:  'Partial (DP)',
    paid:     'Paid',
    refunded: 'Refunded',
    failed:   'Failed',
  };
  const colors = {
    unpaid:   'bg-red-500/15 text-red-400 border-red-500/40',
    partial:  'bg-amber-500/15 text-amber-400 border-amber-500/40',
    paid:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    refunded: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    failed:   'bg-gray-500/15 text-gray-400 border-gray-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CustomerServiceOrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch orders from Express API via Laravel proxy
  const loadOrders = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/orders')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrders(d.data || []);
        else setError(d.message || 'Failed to load orders');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to connect to server');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter orders by search query and progress status
  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name_snapshot?.toLowerCase().includes(q) ||
      o.pic_name_snapshot?.toLowerCase().includes(q) ||
      o.customers?.name?.toLowerCase().includes(q) ||
      o.teams?.name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Orders - Customer Service" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-red-500/15 border-red-500/40 text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Orders</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Total {orders.length} orders
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Search order number, customer, PIC, or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-brand-primary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Dropdown Filter */}
            <div className="relative sm:w-44 sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">
                  {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'All Status'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${
                    isStatusOpen ? 'rotate-180 text-brand-accent' : ''
                  }`}
                />
              </button>

              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('');
                      setIsStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                      !statusFilter
                        ? 'bg-brand-accent/15 text-brand-accent font-medium'
                        : 'text-brand-text hover:bg-brand-border/40'
                    }`}
                  >
                    <span>All Status</span>
                    {!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(s.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                        statusFilter === s.value
                          ? 'bg-brand-accent/15 text-brand-accent font-medium'
                          : 'text-brand-text hover:bg-brand-border/40'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      {statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Aligned with Filter (Matching Super Admin) */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button
              onClick={loadOrders}
              className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              href="/sales/orders/create"
              className="bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Create Order
            </Link>
          </div>
        </div>

        {/* Filter Summary */}
        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl backdrop-blur-sm">
            <span>
              Showing <strong className="text-brand-text font-semibold">{filtered.length}</strong> of{' '}
              {orders.length} orders
            </span>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setIsStatusOpen(false);
              }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition"
            >
              <X size={13} /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading orders...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-3">Error: {error}</p>
            <button onClick={loadOrders} className="text-brand-accent underline hover:no-underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">No orders found</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order No.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Team</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Total Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                    {/* Order No */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-brand-text text-sm font-mono whitespace-nowrap">
                        {o.order_number}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-brand-text">
                        {o.customer_name_snapshot || o.customers?.name || '—'}
                      </div>
                    </td>

                    {/* Assigned Team */}
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {o.teams?.name ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-brand-muted/50 px-2 py-1 rounded border border-brand-border">
                          <Users size={12} /> {o.teams.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent whitespace-nowrap">
                      {formatRupiah(o.grand_total)}
                    </td>

                    {/* Order Progress Status */}
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>

                    {/* Action Button: Navigate to Dedicated Show Page */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/sales/orders/${o.id}`}
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
        )}
      </div>
    </RoleLayout>
  );
}
