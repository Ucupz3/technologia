import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  MapPin, Star, ChevronDown, Check, Clock, Eye, FileText, X,
  ShieldCheck, Calendar, Layers, Tag, Percent, Receipt
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_OPTIONS = [
  { value: 'draft',       label: 'Draft' },
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
    <span className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-lg font-semibold border shrink-0 ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

export default function OrderShow({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);

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
        if (d.success) setOrder(d.data);
        else setError(d.message || 'Gagal mengambil data order');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    setIsStatusOpen(false);
    if (!order || newStatus === order.status) return;

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
        showToast('success', `Status order pusat berhasil diubah menjadi ${newStatus.toUpperCase()}`);
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Order" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading order...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !order) {
    return (
      <RoleLayout>
        <Head title="Detail Order" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <button onClick={handleBack} className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">
            ← Kembali ke halaman sebelumnya
          </button>
        </div>
      </RoleLayout>
    );
  }

  const services = order.order_services || [];
  const assignments = order.order_assignments || [];

  const allTasksFinished = assignments.length > 0 && assignments.every((a) => {
    const latestProgress = a.progress_order?.[0];
    return latestProgress && (latestProgress.status === 'completed' || Number(latestProgress.progress_percentage) === 100);
  });

  return (
    <RoleLayout>
      <Head title={`Detail Order — ${order.name || order.order_number}`} />

      {/* Toast Notification */}
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

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-6"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-text break-words">
                {order.name || order.order_number}
              </h1>
              {order.parent_order_id && (
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-medium">
                  Order Perbaikan Maintenance
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-brand-text-muted mt-1 truncate">
              <span className="font-mono">{order.order_number}</span> &bull; Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:flex-initial">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between gap-2.5 bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition"
                title="Hanya Super Admin yang berwenang mengubah status order pusat"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-brand-text-muted font-normal text-xs hidden sm:inline">Status:</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform shrink-0 ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsStatusOpen(false)} />
                  <div className="absolute z-30 top-full right-0 mt-2 w-52 p-1.5 bg-brand-primary border border-brand-border rounded-xl shadow-2xl">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-brand-text-muted border-b border-brand-border/60 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-brand-accent" /> Otoritas Super Admin
                    </div>
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleStatusChange(s.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center justify-between transition ${
                          order.status === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'
                        }`}
                      >
                        <span>{s.label}</span>
                        {order.status === s.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={load} 
              className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2.5 sm:py-2 rounded-xl hover:bg-brand-muted flex items-center justify-center gap-2 text-xs sm:text-sm transition shadow-sm shrink-0"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* KIRI: Info Customer, Customer Service, Tim */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card title="Informasi Customer">
            <div className="space-y-3">
              <div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold">Nama Customer</div>
                <div className="text-xs sm:text-sm font-bold text-brand-text mt-0.5">{order.customer_name_snapshot}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold">Alamat</div>
                <div className="text-xs sm:text-sm text-brand-text flex items-start gap-1.5 mt-0.5 break-words">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-brand-text-muted" />
                  <span>{order.customer_address_snapshot || '—'}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold">PIC Customer</div>
                <div className="text-xs sm:text-sm text-brand-text mt-0.5">{order.pic_name_snapshot || '—'}</div>
                <div className="text-xs text-brand-text-muted truncate">{order.pic_email_snapshot || ''}</div>
              </div>
            </div>
          </Card>

          <Card title="Customer Service">
            {order.sales_user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-semibold text-xs shrink-0">
                  {order.sales_user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-brand-text truncate">{order.sales_user.name}</div>
                  <div className="text-xs text-brand-text-muted truncate">{order.sales_user.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-brand-text-muted italic">Tidak ada Customer Service yang terkait</p>
            )}
          </Card>

          <Card title="Informasi Waktu & Tim">
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold">Tim Penanggung Jawab</div>
                <div className="font-semibold text-brand-text mt-0.5">{order.teams?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-brand-text-muted uppercase tracking-widest font-semibold">Target Selesai Proyek</div>
                <div className="font-semibold text-brand-text mt-0.5">{formatDate(order.end_date_project)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* KANAN: Layanan & Setoran Progres Tim Developer */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Card Layanan Dipesan (Clean UI/UX Redesign) */}
          <Card title="Layanan yang Dipesan">
            <div className="space-y-3">
              {/* Item List Layanan */}
              <div className="divide-y divide-brand-border/40">
                {services.map((s) => (
                  <div key={s.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center shrink-0 mt-0.5">
                        <Layers size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-brand-text truncate">
                          {s.service_name_snapshot}
                        </div>
                        {s.category_name_snapshot && (
                          <div className="text-xs text-brand-text-muted flex items-center gap-1 mt-0.5">
                            <Tag size={11} className="shrink-0" />
                            <span>{s.category_name_snapshot}</span>
                          </div>
                        )}
                        {s.notes && (
                          <p className="text-xs text-brand-text-muted/90 bg-brand-primary/40 px-2.5 py-1 rounded-lg border border-brand-border/40 mt-1.5 inline-block">
                            {s.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-1 sm:pt-0">
                      <div className="text-xs text-brand-text-muted">
                        <span>{formatRupiah(s.price_deal)}</span>
                        <span className="mx-1">×</span>
                        <span className="font-semibold text-brand-text">{s.quantity}</span>
                      </div>
                      <div className="text-sm font-bold text-brand-text">
                        {formatRupiah(s.subtotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rincian Pembayaran Box */}
              <div className="mt-4 pt-4 border-t border-brand-border/60">
                <div className="bg-brand-primary/50 border border-brand-border/60 rounded-xl p-4 space-y-2.5 w-full sm:max-w-xs ml-auto">
                  <div className="flex justify-between text-xs text-brand-text-muted">
                    <span>Subtotal</span>
                    <span className="font-semibold text-brand-text">{formatRupiah(order.subtotal)}</span>
                  </div>

                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-xs text-red-500 font-medium">
                      <span>Diskon</span>
                      <span>-{formatRupiah(order.discount)}</span>
                    </div>
                  )}

                  {Number(order.tax) > 0 && (
                    <div className="flex justify-between text-xs text-brand-text-muted">
                      <span>Pajak ({order.tax_rate}%)</span>
                      <span className="font-semibold text-brand-text">+{formatRupiah(order.tax)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">Grand Total</span>
                    <span className="text-base font-bold text-brand-accent">
                      {formatRupiah(order.grand_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Progres Developer */}
          <Card title="Tim Pengerjaan & Progres Developer">
            {allTasksFinished && order.status !== 'completed' && (
              <div className="mb-4 sm:mb-5 p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-200 text-xs sm:text-sm">
                      Seluruh Tugas Developer Telah Selesai 100%
                    </h3>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                      Semua anggota tim telah menyetorkan progresnya. Anda dapat mengesahkan status order pusat menjadi <strong>Completed</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('completed')}
                  className="w-full sm:w-auto shrink-0 justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} /> Sahkan Order Completed
                </button>
              </div>
            )}

            {order.status === 'completed' && (
              <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 rounded-xl bg-brand-primary/60 border border-brand-border text-xs text-brand-text-muted flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Order ini telah disahkan berstatus <strong className="text-emerald-500 dark:text-emerald-400">Completed</strong> oleh Super Admin.</span>
              </div>
            )}

            {assignments.length === 0 ? (
              <p className="text-xs sm:text-sm text-brand-text-muted italic text-center py-4">Belum ada anggota tim yang ditugaskan.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const latestProgress = a.progress_order?.[0];
                  const progress = latestProgress?.progress_percentage ?? 0;
                  const taskStatus = latestProgress?.status ?? (progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending');
                  const devName = a.team_members?.users?.name || 'Developer';
                  const initials = devName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <div
                      key={a.id}
                      className="p-3.5 sm:p-4 bg-brand-primary/40 border border-brand-border/60 hover:border-brand-accent/40 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Developer Details & Role */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-brand-text truncate">{devName}</span>
                            {a.is_lead && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 font-semibold border border-amber-500/30">
                                <Star size={10} className="fill-amber-500" /> Lead
                              </span>
                            )}
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              Fase {a.phase_order || 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-brand-text-muted mt-1 flex-wrap">
                            <span className="font-medium text-brand-text/90">{a.jobs?.name || '—'}</span>
                            {a.start_date && a.end_date && (
                              <span className="flex items-center gap-1 text-[11px] text-brand-text-muted/80">
                                <Calendar size={12} className="shrink-0" />
                                {formatDate(a.start_date)} - {formatDate(a.end_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status, Visual Progress & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/40">
                        {/* Progress Bar & Status Badge */}
                        <div className="flex items-center gap-3 min-w-[150px] sm:min-w-[180px]">
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-brand-text-muted font-medium">
                                {taskStatus === 'completed' || progress === 100 ? (
                                  <span className="text-emerald-500 font-semibold">Selesai</span>
                                ) : taskStatus === 'in_progress' || progress > 0 ? (
                                  <span className="text-blue-400 font-semibold">Proses</span>
                                ) : (
                                  <span className="text-brand-text-muted">Belum Dimulai</span>
                                )}
                              </span>
                              <span className="font-bold text-brand-text">{progress}%</span>
                            </div>
                            <div className="w-full bg-brand-muted rounded-full h-1.5 overflow-hidden border border-brand-border/40">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-500/40'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Detail */}
                        <button
                          type="button"
                          onClick={() => setSelectedAssignment(a)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-brand-primary border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent transition shadow-sm flex items-center gap-1.5 shrink-0"
                          title="Lihat Detail Setoran"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL DETAIL ASSIGNMENT */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-brand-border flex items-center justify-between bg-brand-primary/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/40 flex items-center justify-center text-brand-accent font-bold text-xs sm:text-sm shrink-0">
                  {selectedAssignment.team_members?.users?.name?.substring(0, 2).toUpperCase() || 'DV'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-brand-text text-sm sm:text-base flex items-center gap-1.5 flex-wrap truncate">
                    <span>{selectedAssignment.team_members?.users?.name || 'Developer'}</span>
                    {selectedAssignment.is_lead && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-500 font-semibold border border-amber-500/30">
                        <Star size={10} className="fill-amber-500" /> Lead
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-brand-text-muted truncate">
                    Posisi: {selectedAssignment.jobs?.name || '—'} &bull; Fase {selectedAssignment.phase_order || 1}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg hover:bg-brand-primary transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3 sm:p-3.5">
                  <div className="text-[10px] sm:text-[11px] font-semibold text-brand-text-muted uppercase tracking-widest">Status Tugas</div>
                  <div className="mt-1">
                    {(() => {
                      const latest = selectedAssignment.progress_order?.[0];
                      const p = latest?.progress_percentage ?? 0;
                      const s = latest?.status ?? (p === 100 ? 'completed' : p > 0 ? 'in_progress' : 'pending');
                      if (s === 'completed' || p === 100) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Selesai 100%
                          </span>
                        );
                      }
                      if (s === 'in_progress' || p > 0) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            <Clock size={13} /> Sedang Dikerjakan
                          </span>
                        );
                      }
                      return (
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Belum Dimulai
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3 sm:p-3.5">
                  <div className="text-[10px] sm:text-[11px] font-semibold text-brand-text-muted uppercase tracking-widest">Progres Setoran</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-brand-text">
                      {selectedAssignment.progress_order?.[0]?.progress_percentage ?? 0}%
                    </span>
                    <div className="flex-1 bg-brand-muted rounded-full h-2 overflow-hidden border border-brand-border/40">
                      <div
                        className="bg-brand-accent h-full transition-all"
                        style={{ width: `${selectedAssignment.progress_order?.[0]?.progress_percentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-brand-primary/60 border border-brand-border rounded-xl p-3 sm:p-3.5">
                  <div className="text-[10px] sm:text-[11px] font-semibold text-brand-text-muted uppercase tracking-widest">Jadwal Target</div>
                  <div className="text-xs font-semibold text-brand-text mt-1 break-words">
                    {selectedAssignment.start_date && selectedAssignment.end_date
                      ? `${formatDate(selectedAssignment.start_date)} - ${formatDate(selectedAssignment.end_date)}`
                      : selectedAssignment.end_date
                      ? `Deadline: ${formatDate(selectedAssignment.end_date)}`
                      : '—'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-brand-accent shrink-0" />
                  <span>Laporan / Catatan Setoran Terkini</span>
                </h4>
                <div className="bg-brand-primary border border-brand-border rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-wrap break-words">
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

              {selectedAssignment.progress_order && selectedAssignment.progress_order.length > 1 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
                    <span>Riwayat Log Setoran ({selectedAssignment.progress_order.length} riwayat)</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedAssignment.progress_order.map((log, idx) => (
                      <div key={log.id || idx} className="p-3 rounded-xl bg-brand-primary/40 border border-brand-border/60 text-xs space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-brand-text-muted">
                          <span className="font-semibold text-brand-text">Progres: {log.progress_percentage}% &bull; Status: {log.status}</span>
                          <span className="text-[10px] sm:text-xs">{formatDateTime(log.created_at || log.updated_at)}</span>
                        </div>
                        {log.notes && (
                          <p className="text-brand-text/90 whitespace-pre-wrap break-words mt-1">{log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-600 dark:text-blue-300 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Otoritas Pusat:</strong> Progres dan status di atas adalah laporan pengerjaan teknis dari developer. Pengesahan status order di sistem pusat (misal <em>Completed</em> atau <em>Cancelled</em>) hanya dapat dilakukan oleh Super Admin via dropdown status di bagian atas halaman.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-brand-border flex items-center justify-between bg-brand-primary/30 shrink-0">
              <span className="text-[11px] sm:text-xs text-brand-text-muted">ID Assignment: #{selectedAssignment.id}</span>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 bg-brand-primary border border-brand-border rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-muted transition shadow-sm"
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
    <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
      <div className="px-4 sm:px-5 py-3.5 border-b border-brand-border">
        <h2 className="text-xs sm:text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}