import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  RefreshCw, Search, X, FileText, CheckCircle2, AlertCircle,
  ChevronDown, Check
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

function getBasePath() {
  return window.location.pathname.replace(/\/invoices.*$/, '');
}

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial (DP)' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function PaymentStatusBadge({ status }) {
  const colors = {
    unpaid: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  };
  return (
    <span
      className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border capitalize ${
        colors[status] || colors.unpaid
      }`}
    >
      {status}
    </span>
  );
}

export default function CustomerServiceInvoicesIndex() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const basePath = getBasePath() || '/sales';

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/invoices')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoices(d.data || []);
        else setError(d.message || 'Gagal memuat data invoice');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Gagal menghubungi server');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.order_number?.toLowerCase().includes(q) ||
      inv.customer_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const goToDetail = (inv) => {
    router.visit(`${basePath}/invoices/${inv.id}`);
  };

  return (
    <RoleLayout>
      <Head title="Invoices — Customer Service" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Invoices</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Total {invoices.length} tagihan invoice
        </p>
      </div>

      {/* Filter Bar (Sejajar & Responsif) */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted"
            />
            <input
              type="text"
              placeholder="Cari nomor invoice, order, atau customer..."
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

          {/* Status Filter Dropdown */}
          <div className="relative sm:w-48 sm:shrink-0">
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
            >
              <span className="truncate">
                {statusFilter
                  ? STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label
                  : 'Semua Status'}
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
                  <span>Semua Status</span>
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

          {/* Refresh Button */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={load}
              className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Info Filter Aktif */}
        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl backdrop-blur-sm">
            <span>
              Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong>{' '}
              dari {invoices.length} invoice
            </span>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setIsStatusOpen(false);
              }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition"
            >
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Table Invoices */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Memuat data invoice...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline">
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {invoices.length === 0 ? 'Belum ada invoice dibuat' : 'Tidak ada invoice yang sesuai filter'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Total Tagihan
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Dibayar
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Sisa
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-brand-muted/40 transition cursor-pointer"
                    onClick={() => goToDetail(inv)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-brand-text font-semibold">
                        {inv.invoice_number}
                      </div>
                      <div className="text-xs text-brand-text-muted font-mono">{inv.order_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text font-medium">
                      {inv.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-text">
                      {formatRupiah(inv.grand_total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatRupiah(inv.total_paid)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-500 font-semibold">
                      {formatRupiah(inv.remaining)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/invoices/${inv.id}`}
                        onClick={(e) => e.stopPropagation()}
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

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-brand-border text-xs text-brand-text-muted">
            Menampilkan {filtered.length} invoice
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
