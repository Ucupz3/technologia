import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Trash2, X,
  Wallet, CheckCircle2, AlertCircle, Pencil,
} from 'lucide-react';

import PaymentFormModal from '@/Components/Payments/FormModal';
import PaymentDetailModal from '@/Components/Payments/DetailModal';
import UpdatePaymentModal from '@/Components/Payments/UpdatePaymentModal';
import ConfirmDeleteModal from '@/Components/Payments/DeleteModal';
import { PaymentStatusBadge } from '@/Components/Payments/Badges';
import { formatRupiah, formatDate } from '@/Components/Payments/helpers';

export default function PaymentsIndex() {
  const [payments, setPayments] = useState([]);
  const [options, setOptions] = useState({ orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [updatePayment, setUpdatePayment] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletePayment, setDeletePayment] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/payments').then((r) => r.json()),
      fetch('/api/v1/payments/options/orders').then((r) => r.json()),
    ])
      .then(([p, o]) => {
        if (p.success) setPayments(p.data || []);
        else setError(p.message || 'Gagal ambil data');
        setOptions({ orders: o.success ? o.data : [] });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.invoice_number?.toLowerCase().includes(q) ||
      p.customer_name?.toLowerCase().includes(q) ||
      p.order_number?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalInvoiced = payments.reduce((sum, p) => sum + Number(p.grand_total), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.total_paid), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
    <RoleLayout>
      <Head title="Payments" />

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
          <h1 className="text-2xl font-bold text-brand-text">Payments</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {payments.length} invoice
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
            <Plus size={16} /> Buat Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Invoiced" value={formatRupiah(totalInvoiced)} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Total Paid" value={formatRupiah(totalPaid)} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Outstanding" value={formatRupiah(totalOutstanding)} color="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filter */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari invoice, customer, atau order..."
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
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {(search || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {payments.length} invoice</span>
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
            <Wallet size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {payments.length === 0 ? 'Belum ada invoice' : 'Tidak ada yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Invoice</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Grand Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Paid</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Sisa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Due</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-brand-text">{p.invoice_number}</div>
                      <div className="text-xs text-brand-text-muted">{p.order_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{p.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text font-medium">{formatRupiah(p.grand_total)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatRupiah(p.total_paid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{formatRupiah(p.remaining)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted text-xs">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(p.id)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setUpdatePayment(p)}
                          title="Update Pembayaran"
                          disabled={p.status === 'cancelled' || p.status === 'paid'}
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeletePayment(p)}
                          title="Hapus"
                          disabled={p.total_paid > 0}
                          className="p-2 rounded-lg text-brand-text-muted hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
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
            Menampilkan {filtered.length} invoice
          </div>
        )}
      </div>

      {/* Modals */}
      {detailId && (
        <PaymentDetailModal
          paymentId={detailId}
          onClose={() => setDetailId(null)}
          onUpdatePayment={(p) => { setDetailId(null); setUpdatePayment(p); }}
        />
      )}

      {updatePayment && (
        <UpdatePaymentModal
          payment={updatePayment}
          onClose={() => setUpdatePayment(null)}
          onSuccess={(msg) => { setUpdatePayment(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <PaymentFormModal
          options={options}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deletePayment && (
        <ConfirmDeleteModal
          payment={deletePayment}
          onClose={() => setDeletePayment(null)}
          onSuccess={(msg) => { setDeletePayment(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
      <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}