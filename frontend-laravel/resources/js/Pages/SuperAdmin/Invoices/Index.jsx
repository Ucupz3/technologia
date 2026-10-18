import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Trash2, X,
  Wallet, CheckCircle2, AlertCircle, Pencil,
} from 'lucide-react';

// Pastikan path import ini sesuai dengan folder komponen Anda
import PaymentFormModal from '@/Components/Payments/FormModal';
import PaymentDetailModal from '@/Components/Payments/DetailModal';
import UpdatePaymentModal from '@/Components/Payments/UpdatePaymentModal';
import ConfirmDeleteModal from '@/Components/Payments/DeleteModal';
import { PaymentStatusBadge } from '@/Components/Payments/Badges';
import { formatRupiah, formatDate } from '@/Components/Payments/helpers';

export default function InvoicesIndex() {
  const [invoices, setInvoices] = useState([]);
  const [options, setOptions] = useState({ orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [updateInvoice, setUpdateInvoice] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/invoices').then((r) => r.json()),
      fetch('/api/v1/invoices/options/orders').then((r) => r.json()),
    ])
      .then(([i, o]) => {
        if (i.success) setInvoices(i.data || []);
        else setError(i.message || 'Gagal ambil data');
        setOptions({ orders: o.success ? o.data : [] });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.order_number?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.total_paid), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
    <RoleLayout>
      <Head title="Invoices" />

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
          <h1 className="text-2xl font-bold text-brand-text">Invoices</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {invoices.length} invoice
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
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {invoices.length} invoice</span>
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
              {invoices.length === 0 ? 'Belum ada invoice' : 'Tidak ada yang cocok'}
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
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-brand-text">{inv.invoice_number}</div>
                      <div className="text-xs text-brand-text-muted">{inv.order_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{inv.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text font-medium">{formatRupiah(inv.grand_total)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatRupiah(inv.total_paid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{formatRupiah(inv.remaining)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted text-xs">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(inv.id)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setUpdateInvoice(inv)}
                          title="Update Pembayaran"
                          disabled={inv.status === 'cancelled' || inv.status === 'paid'}
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteInvoice(inv)}
                          title="Hapus"
                          disabled={inv.total_paid > 0}
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
          onUpdatePayment={(inv) => { setDetailId(null); setUpdateInvoice(inv); }}
        />
      )}

      {updateInvoice && (
        <UpdatePaymentModal
          payment={updateInvoice}
          onClose={() => setUpdateInvoice(null)}
          onSuccess={(msg) => { setUpdateInvoice(null); load(); showToast('success', msg); }}
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

      {deleteInvoice && (
        <ConfirmDeleteModal
          payment={deleteInvoice}
          onClose={() => setDeleteInvoice(null)}
          onSuccess={(msg) => { setDeleteInvoice(null); load(); showToast('success', msg); }}
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