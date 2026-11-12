import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  MapPin, Star, ChevronDown, Check, AlertTriangle, Users, X,
  Clock, Eye, FileText
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_OPTIONS = [
  { value: 'draft',       label: 'Draft' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
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
    draft: 'bg-gray-500/15 text-gray-400 border-gray-500/40',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const labels = {
    unpaid: 'Belum Bayar',
    partial: 'Sebagian',
    paid: 'Lunas',
    overdue: 'Jatuh Tempo',
  };
  const colors = {
    unpaid: 'bg-red-500/15 text-red-400 border-red-500/40',
    partial: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    overdue: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/40'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function AdminOrderShow({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown Status
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal Cancel Order (Wajib isi alasan)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Tim Opsi
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [updatingTeam, setUpdatingTeam] = useState(false);

  // State Modal Detail Setoran Progres Developer
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setOrder(d.data);
          setSelectedTeamId(d.data.team_id ? String(d.data.team_id) : '');
        } else {
          setError(d.message || 'Gagal mengambil data order');
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // Load options tim
    fetch('/api/v1/orders/options/teams')
      .then(r => r.json())
      .then(d => {
        if (d.success) setTeams(d.data || []);
      })
      .catch(() => {});
  }, [orderId]);

  // Handle Ubah Status biasa: draft -> pending -> in_progress -> completed
  const handleStatusChange = async (newStatus) => {
    setIsStatusOpen(false);
    if (newStatus === order.status) return;

    if (newStatus === 'cancelled') {
      setIsCancelModalOpen(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal mengubah status');
      } else {
        load();
        showToast('success', 'Status order berhasil diperbarui');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Cancel Order dengan Wajib Mengisi Alasan
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi');
      return;
    }

    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: cancelReason.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal membatalkan order');
      } else {
        setIsCancelModalOpen(false);
        setCancelReason('');
        load();
        showToast('success', 'Order berhasil dibatalkan');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Order — Admin" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Memuat data order...
        </div>
      </RoleLayout>
    );
  }

  if (error || !order) {
    return (
      <RoleLayout>
        <Head title="Detail Order — Admin" />
        <div className="p-8 text-center">
          <p className="text-red-400 mb-3">Error: {error || 'Data order tidak ditemukan'}</p>
          <Link href="/admin/orders" className="text-brand-accent underline">← Kembali ke daftar order</Link>
        </div>
      </RoleLayout>
    );
  }

  const services = order.order_services || [];
  const assignments = order.order_assignments || [];
  const invoice = order.invoices?.[0];

  const allTasksFinished = assignments.length > 0 && assignments.every((a) => {
    const latestProgress = a.progress_order?.[0];
    return latestProgress && (latestProgress.status === 'completed' || Number(latestProgress.progress_percentage) === 100);
  });

  return (
    <RoleLayout>
      <Head title={`Detail Order ${order.order_number} — Admin`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-red-500/15 border-red-500/40 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Halaman Persis Desain Super Admin */}
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3">
          <ArrowLeft size={16} /> Kembali ke Orders
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-brand-text flex items-center gap-3">
              {order.order_number}
              <PaymentStatusBadge status={order.payment_status} />
            </h1>
            <p className="text-sm text-brand-text-muted mt-1">
              Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Dropdown Ubah Status (Admin: draft -> pending -> in_progress -> completed) */}
            {order.status !== 'cancelled' ? (
              <div className="relative">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="flex items-center justify-between gap-3 bg-brand-primary border border-brand-border rounded-xl px-4 py-2 text-sm font-semibold text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition min-w-[170px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-brand-text-muted font-normal">Status:</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <ChevronDown size={16} className={`text-brand-text-muted transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute z-30 top-full right-0 mt-2 w-52 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-brand-text-muted uppercase">
                        Ubah Status Pengerjaan
                      </div>
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => handleStatusChange(s.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                            order.status === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'
                          }`}
                        >
                          <span>{s.label}</span>
                          {order.status === s.value && <Check size={14} />}
                        </button>
                      ))}
                      <div className="border-t border-brand-border my-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusOpen(false);
                          setIsCancelModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between text-red-400 hover:bg-red-500/10 transition"
                      >
                        <span className="flex items-center gap-1.5"><AlertTriangle size={14} /> Batalkan Order</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-brand-primary border border-brand-border rounded-xl px-4 py-2 text-sm">
                <span className="text-brand-text-muted">Status:</span>
                <OrderStatusBadge status="cancelled" />
              </div>
            )}

            {/* Tombol Cancel Order Mandiri jika belum dibatalkan */}
            {order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-3.5 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <AlertTriangle size={15} />
                <span>Batalkan Order</span>
              </button>
            )}

            <button
              onClick={load}
              className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Grid Informasi Persis Super Admin (3 Kolom: 1 Kiri, 2 Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ================= KIRI: INFO CUSTOMER & SALES ================= */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Informasi Customer">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-brand-text-muted uppercase">Nama Customer</div>
                <div className="text-sm font-semibold text-brand-text">{order.customer_name_snapshot || order.customers?.name}</div>
              </div>
              <div>
                <div className="text-xs text-brand-text-muted uppercase">Alamat</div>
                <div className="text-sm text-brand-text flex items-start gap-1.5 mt-0.5">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-brand-text-muted" />
                  {order.customer_address_snapshot || order.customers?.address || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-brand-text-muted uppercase">PIC Customer</div>
                <div className="text-sm text-brand-text">{order.pic_name_snapshot || order.customer_pics?.name || '—'}</div>
                <div className="text-xs text-brand-text-muted">{order.pic_email_snapshot || order.customer_pics?.email || ''}</div>
                {order.customer_pics?.phone && (
                  <div className="text-xs text-brand-text-muted">{order.customer_pics.phone}</div>
                )}
              </div>
            </div>
          </Card>

          <Card title="Sales PIC">
            {order.sales_user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-semibold text-xs">
                  {order.sales_user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-brand-text">{order.sales_user.name}</div>
                  <div className="text-xs text-brand-text-muted">{order.sales_user.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">Tidak ada sales</p>
            )}
          </Card>

          <Card title="Catatan Order">
            <p className="text-sm text-brand-text whitespace-pre-line">
              {order.notes || 'Tidak ada catatan order'}
            </p>
          </Card>

          {/* Banner Informasi Jika Dibatalkan */}
          {order.status === 'cancelled' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle size={15} />
                <span>Order Dibatalkan</span>
              </div>
              <p className="text-sm text-brand-text">
                {order.cancelled_reason || 'Order telah dibatalkan oleh Admin.'}
              </p>
            </div>
          )}
        </div>

        {/* ================= KANAN: LAYANAN, TOTAL & TIM ================= */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Layanan & Rincian Total */}
          <Card title="Rincian Layanan">
            {services.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-4">Belum ada rincian layanan.</p>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <div key={svc.id} className="flex justify-between items-start bg-brand-primary/40 border border-brand-border p-3.5 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-brand-text">{svc.service_name_snapshot}</div>
                      <div className="text-xs text-brand-text-muted mt-0.5">
                        {svc.quantity} x {formatRupiah(svc.price_deal)}
                        {svc.category_name_snapshot && (
                          <span className="ml-2 text-brand-text-muted/70">({svc.category_name_snapshot})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-accent">
                      {formatRupiah(svc.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Ringkasan Total */}
            <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-400">
                <span>Diskon</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Pajak ({order.tax_rate}%)</span>
                <span>+{formatRupiah(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-accent pt-2 border-t border-brand-border mt-2">
                <span>Grand Total</span>
                <span>{formatRupiah(order.grand_total)}</span>
              </div>
            </div>
          </Card>

          {/* Status Pembayaran & Invoice */}
          <Card title="Informasi Pembayaran & Invoice">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-brand-primary/40 border border-brand-border p-3 rounded-xl">
                <span className="text-xs text-brand-text-muted uppercase">No. Invoice</span>
                <p className="font-mono text-sm font-medium text-brand-text mt-1">{invoice?.invoice_number || '—'}</p>
              </div>
              <div className="bg-brand-primary/40 border border-brand-border p-3 rounded-xl">
                <span className="text-xs text-brand-text-muted uppercase">Status Bayar</span>
                <div className="mt-1">
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
              </div>
              <div className="bg-brand-primary/40 border border-brand-border p-3 rounded-xl">
                <span className="text-xs text-brand-text-muted uppercase">Sudah Dibayar</span>
                <p className="text-sm font-semibold text-emerald-400 mt-1">{formatRupiah(invoice?.total_paid || 0)}</p>
              </div>
            </div>
          </Card>

          {/* Tim Pengerjaan & Penugasan (Hak Admin: Assign Team Member) */}
          <Card title="Tim Pelaksana & Penugasan">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-primary/30 border border-brand-border p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-accent" />
                <div>
                  <span className="text-xs text-brand-text-muted uppercase block">Tim Ditugaskan:</span>
                  <span className="font-semibold text-brand-text text-sm">
                    {order.teams?.name || 'Belum ada tim ditugaskan'}
                  </span>
                </div>
              </div>

              {/* Jadwal Proyek */}
              <div className="text-xs text-brand-text-muted sm:text-right">
                <span>Jadwal Proyek: </span>
                <span className="text-brand-text font-medium">
                  {order.start_date_project ? formatDate(order.start_date_project) : '—'} s/d {order.end_date_project ? formatDate(order.end_date_project) : '—'}
                </span>
              </div>
            </div>

            {/* Banner Khusus: Jika seluruh tugas developer selesai 100% */}
            {allTasksFinished && order.status !== 'completed' && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-200 text-sm">
                      Seluruh Tugas Developer Telah Selesai 100%
                    </h4>
                    <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
                      Semua anggota tim telah menyetorkan progresnya hingga tuntas. Anda dapat memverifikasi laporan mereka di tabel bawah, lalu mengesahkan status order menjadi <strong>Completed</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('completed')}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} /> Sahkan Order Completed
                </button>
              </div>
            )}

            {/* Tabel Anggota Tim */}
            {assignments.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-4">Belum ada anggota tim yang ditugaskan ke order ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-muted/30 border-b border-brand-border">
                    <tr>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs">Fase</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs">Developer & Posisi</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs">Status Tugas Developer</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs">Progres</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs">Catatan Setoran Terakhir</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-xs text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {assignments.map((a) => {
                      const latestProgress = a.progress_order?.[0];
                      const progress = latestProgress?.progress_percentage ?? 0;
                      const taskStatus = latestProgress?.status ?? (progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending');
                      const notes = latestProgress?.notes;

                      return (
                        <tr key={a.id} className="hover:bg-brand-muted/20 transition">
                          <td className="px-3 py-3 align-top">
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Fase {a.phase_order || 1}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-1.5 font-medium text-brand-text">
                              <span>{a.team_members?.users?.name || '—'}</span>
                              {a.is_lead && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                                  <Star size={10} className="fill-amber-400" /> Lead
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-brand-muted text-brand-text-muted border border-brand-border">
                                {a.jobs?.name || '—'}
                              </span>
                            </div>
                            {a.start_date && a.end_date && (
                              <div className="text-[11px] text-brand-text-muted/70 mt-1">
                                {formatDate(a.start_date)} - {formatDate(a.end_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">
                            {taskStatus === 'completed' || progress === 100 ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={12} /> Tugas Selesai
                              </span>
                            ) : taskStatus === 'in_progress' || progress > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                <Clock size={12} /> Sedang Dikerjakan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
                                Belum Dimulai
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-brand-muted rounded-full h-1.5 overflow-hidden border border-brand-border/40">
                                <div
                                  className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-brand-text">{progress}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top max-w-xs">
                            {notes ? (
                              <div>
                                <p className="text-xs text-brand-text line-clamp-2 leading-relaxed">
                                  {notes}
                                </p>
                                <span className="text-[10px] text-brand-text-muted mt-1 block">
                                  Diupdate: {formatDateTime(latestProgress?.updated_at || latestProgress?.created_at)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-text-muted italic">Belum ada catatan setoran</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-top text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedAssignment(a)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent transition shadow-sm"
                            >
                              <Eye size={13} />
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* =========================================================
          MODAL BATALKAN ORDER (ADMIN: Wajib Mengisi Alasan)
         ========================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-brand-primary/50">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <AlertTriangle size={18} />
                <span>Batalkan Order</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason('');
                  setCancelError('');
                }}
                className="text-brand-text-muted hover:text-brand-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-5 space-y-4">
              <p className="text-sm text-brand-text">
                Anda akan membatalkan order <strong className="text-brand-accent">{order.order_number}</strong>.
                Sesuai hak operasional Admin, Anda <strong>wajib mengisi alasan pembatalan</strong> di bawah ini.
              </p>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                  Alasan Pembatalan <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelError) setCancelError('');
                  }}
                  placeholder="Contoh: Customer membatalkan proyek karena perubahan spesifikasi..."
                  className={`w-full bg-brand-primary border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all resize-none ${
                    cancelError ? 'border-red-500' : 'border-brand-border'
                  }`}
                  autoFocus
                />
                {cancelError && (
                  <p className="text-xs text-red-400 mt-1">{cancelError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCancelModalOpen(false);
                    setCancelReason('');
                    setCancelError('');
                  }}
                  className="px-4 py-2 text-sm text-brand-text bg-brand-primary border border-brand-border rounded-xl hover:bg-brand-muted transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cancelling ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                  <span>{cancelling ? 'Membatalkan...' : 'Ya, Batalkan Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DETAIL SETORAN PROGRES DEVELOPER
         ========================================================= */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-primary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/40 flex items-center justify-center text-brand-accent font-bold">
                  {selectedAssignment.team_members?.users?.name?.substring(0, 2).toUpperCase() || 'DV'}
                </div>
                <div>
                  <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                    {selectedAssignment.team_members?.users?.name || 'Developer'}
                    {selectedAssignment.is_lead && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                        <Star size={11} className="fill-amber-400" /> Lead
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    Posisi: {selectedAssignment.jobs?.name || '—'} &bull; Fase {selectedAssignment.phase_order || 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg hover:bg-brand-primary transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Ringkasan Status & Progres */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3.5">
                  <div className="text-[11px] font-medium text-brand-text-muted uppercase">Status Tugas</div>
                  <div className="mt-1">
                    {(() => {
                      const latest = selectedAssignment.progress_order?.[0];
                      const p = latest?.progress_percentage ?? 0;
                      const s = latest?.status ?? (p === 100 ? 'completed' : p > 0 ? 'in_progress' : 'pending');
                      if (s === 'completed' || p === 100) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 size={13} /> Selesai 100%
                          </span>
                        );
                      }
                      if (s === 'in_progress' || p > 0) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                            <Clock size={13} /> Sedang Dikerjakan
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs font-semibold text-amber-400">
                          Belum Dimulai
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3.5">
                  <div className="text-[11px] font-medium text-brand-text-muted uppercase">Progres Setoran</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-brand-text">
                      {selectedAssignment.progress_order?.[0]?.progress_percentage ?? 0}%
                    </span>
                    <div className="flex-1 bg-brand-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-accent h-full transition-all"
                        style={{ width: `${selectedAssignment.progress_order?.[0]?.progress_percentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3.5 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-brand-text-muted uppercase">Jadwal Target</div>
                  <div className="text-xs font-semibold text-brand-text mt-1">
                    {selectedAssignment.start_date && selectedAssignment.end_date
                      ? `${formatDate(selectedAssignment.start_date)} - ${formatDate(selectedAssignment.end_date)}`
                      : selectedAssignment.end_date
                      ? `Deadline: ${formatDate(selectedAssignment.end_date)}`
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Catatan / Laporan Setoran Developer Terkini */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-2 flex items-center gap-2">
                  <FileText size={14} className="text-brand-accent" />
                  Laporan / Catatan Setoran Developer Terkini
                </h4>
                <div className="bg-brand-primary border border-brand-border rounded-xl p-4 text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                  {selectedAssignment.progress_order?.[0]?.notes || (
                    <span className="text-brand-text-muted italic">Developer belum mengisi catatan laporan setoran.</span>
                  )}
                </div>
                {selectedAssignment.progress_order?.[0]?.updated_at && (
                  <p className="text-[11px] text-brand-text-muted mt-1.5">
                    Waktu Setoran Terakhir: {formatDateTime(selectedAssignment.progress_order[0].updated_at)}
                  </p>
                )}
              </div>

              {/* Riwayat Log Setoran (Jika ada beberapa kali update) */}
              {selectedAssignment.progress_order && selectedAssignment.progress_order.length > 1 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-purple-400" />
                    Riwayat Log Setoran ({selectedAssignment.progress_order.length} riwayat)
                  </h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedAssignment.progress_order.map((log, idx) => (
                      <div key={log.id || idx} className="p-3 rounded-xl bg-brand-primary/40 border border-brand-border/60 text-xs space-y-1">
                        <div className="flex items-center justify-between text-brand-text-muted">
                          <span className="font-semibold text-brand-text">Progres: {log.progress_percentage}% &bull; Status: {log.status}</span>
                          <span>{formatDateTime(log.created_at || log.updated_at)}</span>
                        </div>
                        {log.notes && (
                          <p className="text-brand-text/90 whitespace-pre-wrap">{log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Hak Otoritas Admin / Super Admin */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Otoritas Pusat:</strong> Progres dan status di atas adalah laporan pengerjaan teknis dari developer. Pengesahan status order di sistem pusat tetap di bawah kendali manajemen melalui dropdown status di halaman ini.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-3.5 border-t border-brand-border flex items-center justify-between bg-brand-primary/30">
              <span className="text-xs text-brand-text-muted">ID Assignment: #{selectedAssignment.id}</span>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 bg-brand-primary border border-brand-border rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-muted transition"
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

function Card({ title, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
