import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  MapPin, Star, ChevronDown, Check, AlertTriangle, Users, X,
  Clock, Eye, FileText, Pencil, Plus, Trash2, Save, Calendar
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const cleanNotes = (rawNotes) => {
  if (!rawNotes) return '';
  const match = String(rawNotes).trim().match(/^Tiket Maintenance:\s*(.+?)\s*\(Order Turunan dari\s+[^)]+\)$/i);
  if (match) return match[1].trim();
  return rawNotes;
};

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

  // State Modal Edit Order & Atur Penugasan Tim
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [editForm, setEditForm] = useState({
    sales_id: '',
    team_id: '',
    start_date_project: '',
    end_date_project: '',
    notes: '',
    assignments: [],
  });

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
        if (d.success) {
          setTeams(d.data || []);
          setTeamsList(d.data || []);
        }
      })
      .catch(() => {});
  }, [orderId]);

  // Load data master tim dan jobs saat modal edit dibuka
  const openEditModal = () => {
    if (!order) return;

    if (teamsList.length === 0 || jobsList.length === 0 || salesList.length === 0) {
      Promise.all([
        fetch('/api/v1/orders/options/teams').then((r) => r.json()),
        fetch('/api/v1/jobs?per_page=100').then((r) => r.json()),
        fetch('/api/v1/orders/options/sales').then((r) => r.json()),
      ])
        .then(([tRes, jRes, sRes]) => {
          if (tRes.success) setTeamsList(tRes.data || []);
          if (jRes.success) setJobsList(jRes.data || []);
          if (sRes?.success) setSalesList(sRes.data || []);
        })
        .catch(() => {});
    }

    setEditForm({
      sales_id: order.sales_id ? String(order.sales_id) : '',
      team_id: order.team_id ? String(order.team_id) : '',
      start_date_project: order.start_date_project ? order.start_date_project.split('T')[0] : '',
      end_date_project: order.end_date_project ? order.end_date_project.split('T')[0] : '',
      notes: cleanNotes(order.notes),
      assignments: (order.order_assignments || []).map((a) => ({
        id: a.id,
        team_member_id: a.team_member_id ? String(a.team_member_id) : '',
        job_id: a.job_id ? String(a.job_id) : '',
        is_lead: Boolean(a.is_lead),
        phase_order: a.phase_order || 1,
        start_date: a.start_date ? a.start_date.split('T')[0] : '',
        end_date: a.end_date ? a.end_date.split('T')[0] : '',
      })),
    });

    setIsEditModalOpen(true);
  };

  const handleEditTeamChange = (newTeamId) => {
    const selectedTeam = teamsList.find((t) => String(t.id) === String(newTeamId));
    let newAssignments = [];

    if (selectedTeam && selectedTeam.team_members?.length > 0) {
      newAssignments = selectedTeam.team_members.map((tm, idx) => {
        const primaryJob = tm.users?.user_jobs?.find((uj) => uj.is_primary) || tm.users?.user_jobs?.[0];
        return {
          team_member_id: String(tm.id),
          job_id: primaryJob?.job_id ? String(primaryJob.job_id) : '',
          is_lead: idx === 0,
          phase_order: 1,
          start_date: editForm.start_date_project || '',
          end_date: editForm.end_date_project || '',
        };
      });
    }

    setEditForm((prev) => ({
      ...prev,
      team_id: newTeamId,
      assignments: newAssignments,
    }));
  };

  const handleAddAssignmentRow = () => {
    const selectedTeam = teamsList.find((t) => String(t.id) === String(editForm.team_id));
    const firstMember = selectedTeam?.team_members?.[0];
    const primaryJob = firstMember?.users?.user_jobs?.find((uj) => uj.is_primary) || firstMember?.users?.user_jobs?.[0];

    setEditForm((prev) => ({
      ...prev,
      assignments: [
        ...prev.assignments,
        {
          team_member_id: firstMember ? String(firstMember.id) : '',
          job_id: primaryJob?.job_id ? String(primaryJob.job_id) : '',
          is_lead: prev.assignments.length === 0,
          phase_order: 1,
          start_date: prev.start_date_project || '',
          end_date: prev.end_date_project || '',
        },
      ],
    }));
  };

  const handleRemoveAssignmentRow = (index) => {
    setEditForm((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index),
    }));
  };

  const handleAssignmentChange = (index, field, value) => {
    setEditForm((prev) => {
      const next = [...prev.assignments];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, assignments: next };
    });
  };

  const handleMemberSelect = (index, memberId) => {
    const selectedTeam = teamsList.find((t) => String(t.id) === String(editForm.team_id));
    const tm = selectedTeam?.team_members?.find((m) => String(m.id) === String(memberId));
    const primaryJob = tm?.users?.user_jobs?.find((uj) => uj.is_primary) || tm?.users?.user_jobs?.[0];

    setEditForm((prev) => {
      const next = [...prev.assignments];
      next[index] = {
        ...next[index],
        team_member_id: memberId,
        job_id: primaryJob?.job_id ? String(primaryJob.job_id) : next[index].job_id,
      };
      return { ...prev, assignments: next };
    });
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();

    if (editForm.team_id && editForm.assignments.length > 0) {
      const hasInvalid = editForm.assignments.some((a) => !a.team_member_id || !a.job_id);
      if (hasInvalid) {
        alert('Harap pilih developer dan peran/job untuk setiap baris penugasan.');
        return;
      }
    }

    setEditSubmitting(true);
    try {
      const payload = {
        sales_id: editForm.sales_id ? Number(editForm.sales_id) : null,
        team_id: editForm.team_id ? Number(editForm.team_id) : null,
        start_date_project: editForm.start_date_project || null,
        end_date_project: editForm.end_date_project || null,
        notes: editForm.notes || null,
        assignments: editForm.assignments.map((a) => ({
          id: a.id ? Number(a.id) : undefined,
          team_member_id: Number(a.team_member_id),
          job_id: Number(a.job_id),
          is_lead: Boolean(a.is_lead),
          phase_order: Number(a.phase_order || 1),
          start_date: a.start_date || null,
          end_date: a.end_date || null,
        })),
      };

      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal menyimpan perubahan');
      } else {
        showToast('success', 'Order dan penugasan tim berhasil disimpan!');
        setIsEditModalOpen(false);
        load();
      }
    } catch {
      showToast('error', 'Gagal menghubungi server saat menyimpan order');
    } finally {
      setEditSubmitting(false);
    }
  };

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
        const statusLabel = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus;
        showToast('success', `Status order berhasil diubah menjadi ${statusLabel}`);
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

      <Toast toast={toast} onClose={() => setToast(null)} />

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

            {/* Tombol Edit Order */}
            <button
              type="button"
              onClick={openEditModal}
              className="bg-brand-accent text-brand-secondary px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition shadow-sm flex items-center gap-1.5"
            >
              <Pencil size={15} />
              <span>Edit</span>
            </button>

            <button
              onClick={load}
              className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Banner Khusus Order Maintenance (Smart Redirect ke Tiket Maintenance Lengkap) */}
      {order.parent_order_id && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-purple-200">
                Order ini adalah Tiket Perbaikan Maintenance
              </h3>
              <p className="text-xs text-brand-text-muted mt-0.5">
                {order.parent_order?.order_number ? `Turunan dari order induk ${order.parent_order.order_number}. ` : ''}
                Lihat rincian komplain klien, foto tangkapan layar (screenshot) error, dan form pengesahan di halaman maintenance.
              </p>
            </div>
          </div>
          <Link
            href={`/admin/maintenance/${order.maintenances?.[0]?.id || order.id}`}
            className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Eye size={14} />
            <span>Buka Detail Tiket & Foto Error</span>
          </Link>
        </div>
      )}

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
            <p className="text-sm text-brand-text whitespace-pre-line leading-relaxed">
              {cleanNotes(order.notes) || (
                <span className="text-brand-text-muted italic">Tidak ada catatan order</span>
              )}
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

            {/* Daftar Anggota Tim (Desain Vertikal Responsif) */}
            {assignments.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-6">
                Belum ada anggota tim yang ditugaskan ke order ini.
              </p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => {
                  const latestProgress = a.progress_order?.[0];
                  const progress = Number(latestProgress?.progress_percentage ?? 0);
                  const taskStatus = latestProgress?.status ?? (progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending');
                  const notes = latestProgress?.notes;
                  const devName = a.team_members?.users?.name || '—';
                  const initials = devName !== '—' ? devName.substring(0, 2).toUpperCase() : 'DV';

                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-brand-primary/50 border border-brand-border hover:border-brand-accent/40 transition-all space-y-3.5"
                    >
                      {/* Baris Atas: Info Developer, Fase, Status, dan Tombol Detail */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 text-brand-accent font-bold text-sm flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-brand-text text-sm">{devName}</span>
                              {a.is_lead && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                                  <Star size={10} className="fill-amber-400" /> Lead
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                Fase {a.phase_order || 1}
                              </span>
                            </div>
                            <div className="text-xs text-brand-accent/90 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{a.jobs?.name || 'Developer'}</span>
                              {a.start_date && a.end_date && (
                                <>
                                  <span className="text-brand-text-muted/40">&bull;</span>
                                  <span className="text-[11px] text-brand-text-muted flex items-center gap-1">
                                    <Calendar size={11} className="text-brand-text-muted/60" />
                                    {formatDate(a.start_date)} &ndash; {formatDate(a.end_date)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Tugas & Tombol Detail */}
                        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                          {taskStatus === 'completed' || progress === 100 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={13} /> Selesai
                            </span>
                          ) : taskStatus === 'in_progress' || progress > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              <Clock size={13} /> Dikerjakan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-500/15 text-gray-400 border border-gray-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Belum Dimulai
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedAssignment(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-secondary border border-brand-border text-brand-text hover:border-brand-accent hover:text-brand-accent transition shadow-sm"
                          >
                            <Eye size={13} />
                            <span>Detail</span>
                          </button>
                        </div>
                      </div>

                      {/* Baris Bawah: Progres Bar & Catatan Setoran Terakhir */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-brand-border/40">
                        {/* Progress Bar (4 cols) */}
                        <div className="md:col-span-4 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-brand-text-muted font-medium">Progres Pengerjaan</span>
                            <span className="font-bold text-brand-text">{progress}%</span>
                          </div>
                          <div className="w-full bg-brand-secondary rounded-full h-2 overflow-hidden border border-brand-border/60">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-brand-accent' : 'bg-gray-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Catatan Setoran Terakhir (8 cols) */}
                        <div className="md:col-span-8 flex items-center justify-between text-xs">
                          {notes ? (
                            <div className="min-w-0 flex-1">
                              <p className="text-brand-text text-xs leading-relaxed truncate" title={notes}>
                                <span className="text-brand-text-muted mr-1">Setoran Terakhir:</span>
                                &ldquo;{notes}&rdquo;
                              </p>
                              <span className="text-[10px] text-brand-text-muted flex items-center gap-1 mt-0.5">
                                <Clock size={10} className="shrink-0 text-brand-text-muted/60" />
                                <span>Diupdate {formatDateTime(latestProgress?.updated_at || latestProgress?.created_at)}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-brand-text-muted/60 italic text-xs">
                              Belum ada catatan setoran progres dari developer ini.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
      {/* MODAL ATUR TIM & EDIT PENUGASAN DEVELOPER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-brand-primary/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-text">
                    Edit Order
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    Order: <strong className="font-mono text-brand-text">{order.order_number}</strong> &bull; {order.customer_name_snapshot}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-brand-primary hover:bg-brand-muted text-brand-text-muted hover:text-brand-text flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 1. Tim & Sales PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                    Tim Penanggung Jawab
                  </label>
                  <select
                    value={editForm.team_id}
                    onChange={(e) => handleEditTeamChange(e.target.value)}
                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                  >
                    <option value="">-- Belum Ada Tim Ditugaskan --</option>
                    {teamsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.team_members?.length || 0} anggota developer)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                    Sales PIC
                  </label>
                  <select
                    value={editForm.sales_id}
                    onChange={(e) => setEditForm({ ...editForm, sales_id: e.target.value })}
                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                  >
                    <option value="">-- Belum Ada Sales Ditugaskan --</option>
                    {salesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Jadwal Tanggal Proyek */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                    Tanggal Mulai Proyek
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date_project}
                    onChange={(e) => setEditForm({ ...editForm, start_date_project: e.target.value })}
                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                    Target Selesai Proyek
                  </label>
                  <input
                    type="date"
                    value={editForm.end_date_project}
                    onChange={(e) => setEditForm({ ...editForm, end_date_project: e.target.value })}
                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                  />
                </div>
              </div>

              {/* 3. Daftar Penugasan Developer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-brand-text uppercase tracking-wider">
                    2. Penugasan Anggota Developer
                  </label>
                  {editForm.team_id && (
                    <button
                      type="button"
                      onClick={handleAddAssignmentRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:text-brand-accent2 transition"
                    >
                      <Plus size={13} /> Tambah Anggota Developer
                    </button>
                  )}
                </div>

                {!editForm.team_id ? (
                  <div className="p-4 rounded-xl bg-brand-primary/40 border border-brand-border text-center text-xs text-brand-text-muted italic">
                    Silakan pilih Tim Penanggung Jawab di atas terlebih dahulu untuk menambahkan developer.
                  </div>
                ) : editForm.assignments.length === 0 ? (
                  <div className="p-5 rounded-xl bg-brand-primary/40 border border-dashed border-brand-border text-center space-y-2">
                    <p className="text-xs text-brand-text-muted">Belum ada anggota yang ditugaskan ke order ini.</p>
                    <button
                      type="button"
                      onClick={handleAddAssignmentRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-accent/15 text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/25 transition"
                    >
                      <Plus size={13} /> Tambah Anggota Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editForm.assignments.map((a, idx) => {
                      const selectedTeam = teamsList.find((t) => String(t.id) === String(editForm.team_id));
                      const availableMembers = selectedTeam?.team_members || [];

                      return (
                        <div key={idx} className="p-4 rounded-xl bg-brand-primary/60 border border-brand-border space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-brand-accent">
                              Anggota #{idx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-1.5 text-xs text-brand-text cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(a.is_lead)}
                                  onChange={(e) => handleAssignmentChange(idx, 'is_lead', e.target.checked)}
                                  className="rounded border-brand-border text-brand-accent focus:ring-brand-accent/30"
                                />
                                <span className="font-semibold flex items-center gap-1">
                                  <Star size={11} className={a.is_lead ? "fill-amber-400 text-amber-400" : "text-brand-text-muted"} />
                                  Team Lead
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveAssignmentRow(idx)}
                                className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition"
                                title="Hapus baris penugasan ini"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-semibold text-brand-text-muted mb-1">
                                Developer
                              </label>
                              <select
                                value={a.team_member_id}
                                onChange={(e) => handleMemberSelect(idx, e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                              >
                                <option value="">-- Pilih Developer --</option>
                                {availableMembers.map((tm) => (
                                  <option key={tm.id} value={tm.id}>
                                    {tm.users?.name || `Member #${tm.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-semibold text-brand-text-muted mb-1">
                                Peran / Job
                              </label>
                              <select
                                value={a.job_id}
                                onChange={(e) => handleAssignmentChange(idx, 'job_id', e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                              >
                                <option value="">-- Pilih Posisi Job --</option>
                                {jobsList.map((j) => (
                                  <option key={j.id} value={j.id}>
                                    {j.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-1">
                              <label className="block text-[11px] font-semibold text-brand-text-muted mb-1">
                                Fase Pengerjaan
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={a.phase_order || 1}
                                onChange={(e) => handleAssignmentChange(idx, 'phase_order', e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                placeholder="Contoh: 1"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Catatan / Keterangan Order */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                  Catatan / Keterangan Order
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Tambahkan catatan atau keterangan instruksi untuk order ini..."
                  className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-brand-primary border border-brand-border rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-muted transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 bg-brand-accent text-brand-secondary rounded-xl text-xs font-bold hover:bg-brand-accent/90 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

function Card({ title, action, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
