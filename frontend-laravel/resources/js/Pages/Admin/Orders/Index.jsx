import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, FileText, CheckCircle2, AlertCircle,
  Users, ChevronDown, Check, X, Calendar, User, Mail, Phone, MapPin, Briefcase
} from 'lucide-react';

// Format helper rupiah & tanggal
const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Opsi filter status pengerjaan
const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

// Badge status pengerjaan (desain pill bersih persis Super Admin)
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

// Badge status pembayaran (desain pill bersih tanpa dot)
function PaymentStatusBadge({ status }) {
  const labels = {
    unpaid:   'Unpaid',
    partial:  'Partial',
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

export default function AdminOrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal Detail Order
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Mengambil data order dari Express API melalui proxy Laravel
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
        setError(e.message || 'Connection error');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter pencarian dan status
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

  // Buka Modal Detail
  const openDetailModal = (orderId) => {
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDetailOrder(d.data);
        else showToast('error', d.message || 'Failed to load order details');
        setDetailLoading(false);
      })
      .catch(() => {
        showToast('error', 'Failed to connect to server');
        setDetailLoading(false);
      });
  };

  const closeDetailModal = () => {
    setSelectedOrderId(null);
    setDetailOrder(null);
  };

  // Update Status Operasional Order (Hak Akses Admin)
  const handleStatusChange = async (newStatus) => {
    if (!detailOrder || updatingStatus || detailOrder.status === newStatus) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/orders/${detailOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Order status updated to ${newStatus}`);
        setDetailOrder((prev) => ({ ...prev, status: newStatus }));
        loadOrders();
      } else {
        showToast('error', data.message || 'Failed to update status');
      }
    } catch {
      showToast('error', 'Failed to connect to server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <RoleLayout>
      <Head title="Orders - Admin" />

      {/* Toast Notifikasi */}
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

      {/* Header Halaman Sesuai Desain Super Admin */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Orders</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {orders.length} orders</p>
      </div>

      {/* Bar Pencarian & Filter Sesuai Desain Super Admin */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            {/* Input Search */}
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

            {/* Dropdown Filter Status */}
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

          {/* Tombol Aksi Sejajar Filter (Sesuai Desain Super Admin) */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button
              onClick={loadOrders}
              className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/orders/create"
              className="bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Create Order
            </Link>
          </div>
        </div>

        {/* Ringkasan Filter Aktif */}
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

      {/* Tabel Data Orders: Isi Lengkap Admin, Desain Rapi & Elegan Persis Super Admin */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-500 mb-3">Error: {error}</p>
            <button onClick={loadOrders} className="text-brand-accent underline">
              Retry
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
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Order No</th>
                   <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Total</th>
                   <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Progress</th>
                   <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Payment</th>
                   <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                    {/* 1. No Order & Tanggal (Nowrap font-mono rapi tanpa ikon jam) */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text text-sm font-mono whitespace-nowrap">
                        {o.order_number}
                      </div>
                      <div className="text-xs text-brand-text-muted mt-0.5">{formatDate(o.created_at)}</div>
                    </td>

                     {/* 4. Total Biaya (Format rupiah aksen bersih tanpa baris diskon berlebih) */}
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent whitespace-nowrap">
                      {formatRupiah(o.grand_total)}
                    </td>

                    {/* 5. Status Pengerjaan (Pill badge bersih persis Super Admin) */}
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>

                    {/* 6. Status Pembayaran (Pill badge bersih tanpa dot) */}
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={o.payment_status} />
                    </td>

                    {/* 7. Tombol Aksi (Navigasi ke Halaman Detail Sesuai Desain Super Admin) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/orders/${o.id}`}
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

      {/* ==============================================================
          MODAL DETAIL ORDER OPERASIONAL ADMIN
          (Muncul saat klik 'Detail' untuk melihat rincian & update status)
         ============================================================== */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-primary/50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-brand-text font-mono">
                    {detailOrder?.order_number || `Order #${selectedOrderId}`}
                  </h2>
                  {detailOrder && (
                    <>
                      <OrderStatusBadge status={detailOrder.status} />
                      <PaymentStatusBadge status={detailOrder.payment_status} />
                    </>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Created on {formatDateTime(detailOrder?.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-brand-muted transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {detailLoading && (
                <div className="py-16 text-center text-brand-text-muted">
                  <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-brand-accent" />
                   <p className="text-sm">Loading order details...</p>
                </div>
              )}

              {!detailLoading && detailOrder && (
                <>
                  {/* Status Operasional Updater (Hak Admin) */}
                  <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-brand-text uppercase tracking-wider">
                        Update Order Status:
                       </p>
                       <p className="text-xs text-brand-text-muted mt-0.5">
                         Admin can update the project progress status directly.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['pending', 'in_progress', 'completed', 'cancelled'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={updatingStatus || detailOrder.status === st}
                          onClick={() => handleStatusChange(st)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            detailOrder.status === st
                              ? 'bg-brand-accent text-brand-primary font-bold shadow-sm'
                              : 'bg-brand-secondary border border-brand-border text-brand-text hover:bg-brand-muted disabled:opacity-50'
                          }`}
                        >
                          {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Customer, PIC & Tim */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-brand-primary/40 border border-brand-border rounded-xl p-4 space-y-2">
                       <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent uppercase tracking-wider">
                         <User size={14} />
                         <span>Customer & PIC</span>
                       </div>
                       <p className="font-semibold text-brand-text text-base">
                         {detailOrder.customer_name_snapshot || detailOrder.customers?.name || '—'}
                       </p>
                       <p className="text-xs text-brand-text-muted flex items-center gap-1.5">
                         <MapPin size={13} className="shrink-0 text-brand-text-muted/70" />
                         <span>{detailOrder.customer_address_snapshot || detailOrder.customers?.address || 'No address provided'}</span>
                       </p>
                       <div className="pt-2 border-t border-brand-border/60 text-xs text-brand-text-muted space-y-1">
                         <p>
                           <span className="font-medium text-brand-text">PIC:</span>{' '}
                           {detailOrder.pic_name_snapshot || detailOrder.customer_pics?.name || '—'}
                         </p>
                         {(detailOrder.pic_email_snapshot || detailOrder.customer_pics?.email) && (
                           <p className="flex items-center gap-1.5">
                             <Mail size={12} />
                             <span>{detailOrder.pic_email_snapshot || detailOrder.customer_pics?.email}</span>
                           </p>
                         )}
                         {detailOrder.customer_pics?.phone && (
                           <p className="flex items-center gap-1.5">
                             <Phone size={12} />
                             <span>{detailOrder.customer_pics.phone}</span>
                           </p>
                         )}
                       </div>
                     </div>

                     <div className="bg-brand-primary/40 border border-brand-border rounded-xl p-4 space-y-2">
                       <div className="flex items-center gap-2 text-xs font-semibold text-brand-accent uppercase tracking-wider">
                         <Calendar size={14} />
                         <span>Timeline & Tim</span>
                       </div>
                       <div className="space-y-1.5 text-xs text-brand-text">
                         <div className="flex justify-between py-1 border-b border-brand-border/50">
                           <span className="text-brand-text-muted">Team:</span>
                           <span className="font-semibold text-brand-text">{detailOrder.teams?.name || 'Not Assigned'}</span>
                         </div>
                         <div className="flex justify-between py-1 border-b border-brand-border/50">
                           <span className="text-brand-text-muted">Start Date:</span>
                           <span>{detailOrder.start_date_project ? formatDate(detailOrder.start_date_project) : 'Not Scheduled'}</span>
                         </div>
                         <div className="flex justify-between py-1 border-b border-brand-border/50">
                           <span className="text-brand-text-muted">Due Date:</span>
                           <span>{detailOrder.end_date_project ? formatDate(detailOrder.end_date_project) : 'Not Set'}</span>
                         </div>
                         <div className="flex justify-between py-1">
                           <span className="text-brand-text-muted">Sales / CS:</span>
                           <span className="font-medium text-brand-text">{detailOrder.sales_user?.name || '—'}</span>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Layanan yang Dipesan */}
                  {detailOrder.order_services && detailOrder.order_services.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-brand-accent" />
                         <span>Service Details</span>
                      </h3>
                      <div className="border border-brand-border rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-brand-muted/40 border-b border-brand-border text-brand-text-muted uppercase">
                            <tr>
                               <th className="px-3.5 py-2.5">Service</th>
                              <th className="px-3.5 py-2.5 text-center">Qty</th>
                               <th className="px-3.5 py-2.5 text-right">Deal Price</th>
                              <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border/40">
                            {detailOrder.order_services.map((srv) => (
                              <tr key={srv.id} className="hover:bg-brand-muted/10">
                                <td className="px-3.5 py-2.5">
                                  <div className="font-medium text-brand-text">{srv.service_name_snapshot}</div>
                                  {srv.category_name_snapshot && (
                                    <div className="text-[11px] text-brand-text-muted">{srv.category_name_snapshot}</div>
                                  )}
                                </td>
                                <td className="px-3.5 py-2.5 text-center text-brand-text font-medium">{srv.quantity}</td>
                                <td className="px-3.5 py-2.5 text-right text-brand-text">{formatRupiah(srv.price_deal)}</td>
                                <td className="px-3.5 py-2.5 text-right text-brand-accent font-semibold">{formatRupiah(srv.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Anggota Tim yang Ditugaskan */}
                  {detailOrder.order_assignments && detailOrder.order_assignments.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users size={14} className="text-brand-accent" />
                         <span>Assigned Team Members</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {detailOrder.order_assignments.map((asg) => (
                          <div key={asg.id} className="bg-brand-primary/40 border border-brand-border rounded-lg p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-brand-muted flex items-center justify-center font-bold text-brand-accent">
                                {asg.team_members?.users?.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-brand-text">
                                  {asg.team_members?.users?.name || `Member #${asg.team_member_id}`}
                                </p>
                                <p className="text-[11px] text-brand-text-muted">{asg.jobs?.name || 'Project Task'}</p>
                              </div>
                            </div>
                            {asg.is_lead && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                Team Lead
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ringkasan Finansial */}
                  <div className="bg-brand-primary/40 border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-brand-text-muted space-y-0.5">
                      <p>
                        Subtotal: <strong className="text-brand-text">{formatRupiah(detailOrder.subtotal)}</strong>
                      </p>
                      <p>
                         Tax ({detailOrder.tax_rate}%): <strong className="text-brand-text">{formatRupiah(detailOrder.tax)}</strong>
                       </p>
                       {detailOrder.notes && (
                         <p className="italic text-brand-text-muted/80 pt-1">Notes: &ldquo;{detailOrder.notes}&rdquo;</p>
                       )}
                     </div>
                     <div className="text-right">
                       <p className="text-xs uppercase font-medium text-brand-text-muted">Grand Total</p>
                      <h4 className="text-xl font-bold text-brand-accent">{formatRupiah(detailOrder.grand_total)}</h4>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3 border-t border-brand-border flex items-center justify-between bg-brand-primary/40 text-xs">
              <span className="text-brand-text-muted">
                Admin Operations
              </span>
              <button
                type="button"
                onClick={closeDetailModal}
                className="bg-brand-primary border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-muted transition font-medium"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </RoleLayout>
  );
}
