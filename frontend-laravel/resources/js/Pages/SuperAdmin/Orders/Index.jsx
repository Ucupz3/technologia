import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Pencil, Trash2, X,
  FileText, CheckCircle2, AlertCircle, User,
} from 'lucide-react';

import OrderFormModal from '@/Components/Orders/FormModal';
import OrderDetailModal from '@/Components/Orders/DetailModal';
import ConfirmDeleteModal from '@/Components/Orders/DeleteModal';
import { OrderStatusBadge, PaymentStatusBadge } from '@/Components/Orders/Badges';
import { formatRupiah, formatDate, getInitials } from '@/Components/Orders/helpers';

export default function OrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [options, setOptions] = useState({ customers: [], services: [], sales: [], teamMembers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/orders').then((r) => r.json()),
      fetch('/api/v1/orders/options/customers').then((r) => r.json()),
      fetch('/api/v1/orders/options/services').then((r) => r.json()),
      fetch('/api/v1/orders/options/sales').then((r) => r.json()),
      fetch('/api/v1/orders/options/team-members').then((r) => r.json()),
    ])
      .then(([o, c, s, sa, tm]) => {
        if (o.success) setOrders(o.data || []);
        else setError(o.message || 'Gagal ambil data');

        setOptions({
          customers: c.success ? c.data : [],
          services: s.success ? s.data : [],
          sales: sa.success ? sa.data : [],
          teamMembers: tm.success ? tm.data : [],
        });
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
    const matchSearch =
      !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.customers?.name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Orders" />

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
          <h1 className="text-2xl font-bold text-brand-text">Orders</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {orders.length} order
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
            <Plus size={16} /> Buat Order
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
              placeholder="Cari no order atau customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {(search || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {orders.length} order</span>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1 transition"
            >
              <X size={12} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
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
            <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {orders.length === 0 ? 'Belum ada order' : 'Tidak ada yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">No Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Sales</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Payment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text text-sm font-mono">{o.order_number}</div>
                      <div className="text-xs text-brand-text-muted">{formatDate(o.created_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-[10px] shrink-0">
                          {getInitials(o.customers?.name)}
                        </div>
                        <div className="text-sm text-brand-text truncate">{o.customers?.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {o.users?.name ? (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} /> {o.users.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent">
                      {formatRupiah(o.grand_total)}
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={o.payment_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(o.id)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditOrder(o)}
                          title="Edit"
                          disabled={['completed', 'cancelled'].includes(o.status)}
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteOrder(o)}
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
            Menampilkan {filtered.length} order
          </div>
        )}
      </div>

      {/* Modals */}
      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onStatusChanged={() => load()}
        />
      )}

      {editOrder && (
        <OrderFormModal
          mode="edit"
          order={editOrder}
          options={options}
          onClose={() => setEditOrder(null)}
          onSuccess={(msg) => { setEditOrder(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <OrderFormModal
          mode="create"
          options={options}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOrder && (
        <ConfirmDeleteModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onSuccess={(msg) => { setDeleteOrder(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}