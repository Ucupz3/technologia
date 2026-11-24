import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
    RefreshCw, Search, Plus, FileText, CheckCircle2,
    AlertCircle, ChevronDown, Check, X
} from 'lucide-react';

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_OPTIONS = [
    { value: 'scheduled',   label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed',   label: 'Completed' },
    { value: 'cancelled',   label: 'Cancelled' },
];

function MaintenanceStatusBadge({ status }) {
    const labels = {
        scheduled:   'Scheduled',
        in_progress: 'In Progress',
        completed:   'Completed',
        cancelled:   'Cancelled',
    };
    const colors = {
        scheduled:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
        in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
        completed:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
        cancelled:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    };
    return (
        <span className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium border shrink-0 ${colors[status] || colors.scheduled}`}>
            {labels[status] || status}
        </span>
    );
}

function DeveloperProgressBadge({ status, percentage }) {
    if (status === 'completed' || percentage === 100) {
        return (
            <span className="inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shrink-0">
                100% Selesai
            </span>
        );
    }
    if (status === 'in_progress' || (percentage > 0 && percentage < 100)) {
        return (
            <span className="inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/40 shrink-0">
                {percentage || 50}% Pengerjaan
            </span>
        );
    }
    return (
        <span className="inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 shrink-0">
            Belum Dikerjakan
        </span>
    );
}

export default function SuperAdminMaintenanceIndex() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [toast, setToast] = useState(null);

    // Modal Tambah Maintenance
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        parent_order_id: '',
        job_id: '',
        developer_user_id: '',
        title: '',
        description: '',
        start_datetime: new Date().toISOString().split('T')[0],
        end_datetime: '',
        status: 'in_progress'
    });

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/v1/maintenances', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/v1/maintenances/completed-orders', { cache: 'no-store' }).then((r) => r.json())
        ])
            .then(([resMaintenances, resOrders]) => {
                if (resMaintenances.success && Array.isArray(resMaintenances.data)) {
                    setItems(resMaintenances.data);
                }
                if (resOrders.success && Array.isArray(resOrders.data)) {
                    setCompletedOrders(resOrders.data);
                }
                setLoading(false);
            })
            .catch(() => {
                showToast('error', 'Gagal memuat data maintenance');
                setLoading(false);
            });
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter pencarian dan status
    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            item.title?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.customer_name?.toLowerCase().includes(q) ||
            item.order_number?.toLowerCase().includes(q) ||
            item.parent_order_number?.toLowerCase().includes(q) ||
            item.assigned_developer?.toLowerCase().includes(q) ||
            item.assigned_job?.toLowerCase().includes(q);
        const matchStatus = !statusFilter || item.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Handler Form Tambah Maintenance
    const selectedParentOrder = completedOrders.find(
        (o) => o.id === form.parent_order_id
    );
    const availableJobs = selectedParentOrder?.assigned_members || [];

    const handleParentOrderChange = (orderId) => {
        const order = completedOrders.find((o) => o.id === orderId);
        const firstMember = order?.assigned_members?.[0];
        setForm((prev) => ({
            ...prev,
            parent_order_id: orderId,
            job_id: firstMember?.job_id || '',
            developer_user_id: firstMember?.user_id || ''
        }));
    };

    const handleJobChange = (jobId) => {
        const matchingMember = availableJobs.find((m) => m.job_id === jobId);
        setForm((prev) => ({
            ...prev,
            job_id: jobId,
            developer_user_id: matchingMember?.user_id || prev.developer_user_id
        }));
    };

    const handleCreateMaintenance = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/v1/maintenances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Gagal membuat tiket maintenance');
            }
            setShowModal(false);
            setForm({
                parent_order_id: '',
                job_id: '',
                developer_user_id: '',
                title: '',
                description: '',
                start_datetime: new Date().toISOString().split('T')[0],
                end_datetime: '',
                status: 'in_progress'
            });
            showToast('success', 'Order maintenance berhasil diterbitkan!');
            loadData();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan saat membuat tiket maintenance.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RoleLayout>
            <Head title="Super Admin — Maintenance" />

            {/* Toast Notification (Responsif: Bawah di Mobile, Atas di Desktop) */}
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

            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Order Maintenance</h1>
                <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">Total {items.length} order maintenance</p>
            </div>

            {/* Toolbar: Search, Filter Status, Refresh, Tambah */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                        {/* Input Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                            <input
                                type="text"
                                placeholder="Cari no order, kendala, customer, atau developer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filter Status */}
                        <div className="relative sm:w-44 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsStatusOpen(!isStatusOpen)}
                                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
                            >
                                <span className="truncate">
                                    {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}
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
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
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
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
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

                    {/* Tombol Aksi Sejajar Filter */}
                    <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex-1 sm:flex-initial justify-center bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 sm:py-3 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 sm:py-3 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> Tambah Maintenance
                        </button>
                    </div>
                </div>

                {/* Ringkasan Filter Aktif */}
                {(search || statusFilter) && (
                    <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2.5 rounded-xl backdrop-blur-sm">
                        <span>
                            Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari{' '}
                            {items.length} order maintenance
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

            {/* Data View Container */}
            <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
                {loading && (
                    <div className="p-8 sm:p-12 text-center text-brand-text-muted">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        <p className="text-xs sm:text-sm">Memuat data order maintenance...</p>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="p-8 sm:p-12 text-center">
                        <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                        <p className="text-brand-text-muted font-medium text-xs sm:text-sm">Tidak ada order maintenance ditemukan</p>
                        <p className="text-xs text-brand-text-muted/70 mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <>
                        {/* 1. CARD VIEW (MOBILE - < md) */}
                        <div className="block md:hidden divide-y divide-brand-border/50">
                            {filtered.map((item) => (
                                <div key={item.id} className="p-4 space-y-3 hover:bg-brand-muted/30 transition">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="font-mono font-bold text-xs sm:text-sm text-brand-text block truncate">
                                                {item.order_number || `MNT-#${item.id}`}
                                            </span>
                                            <span className="text-[11px] text-brand-text-muted block mt-0.5">
                                                {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                        <MaintenanceStatusBadge status={item.status} />
                                    </div>

                                    {/* Sub-Card Detail Maintenance */}
                                    <div className="bg-brand-primary/40 rounded-xl p-3 border border-brand-border/40 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-brand-text-muted text-[10px] uppercase tracking-wider font-semibold">Order Induk</span>
                                            {item.parent_order_number ? (
                                                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 truncate max-w-[160px]">
                                                    {item.parent_order_number}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20">
                                                    Order Utama
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-brand-border/30">
                                            <div>
                                                <span className="text-brand-text-muted text-[10px] uppercase tracking-wider block font-semibold">Customer</span>
                                                <span className="text-brand-text truncate block font-medium">{item.customer_name || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-brand-text-muted text-[10px] uppercase tracking-wider block font-semibold">Developer PIC</span>
                                                <span className="text-brand-text truncate block font-medium">{item.assigned_developer || '—'}</span>
                                                <span className="text-[10px] text-brand-text-muted truncate block">{item.assigned_job || ''}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div>
                                            <span className="text-[10px] text-brand-text-muted uppercase tracking-wider block font-semibold">Setoran Dev</span>
                                            <div className="mt-0.5">
                                                <DeveloperProgressBadge
                                                    status={item.developer_progress_status}
                                                    percentage={item.developer_progress_percentage}
                                                />
                                            </div>
                                        </div>
                                        <Link
                                            href={`/super-admin/maintenance/${item.id}`}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                                        >
                                            Detail Order
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2. TABLE VIEW (DESKTOP - >= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-brand-muted/40 border-b border-brand-border text-brand-text-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">No Order</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Order Induk</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Customer</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Developer PIC</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Status Tiket</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Setoran Dev</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/50">
                                    {filtered.map((item) => (
                                        <tr key={item.id} className="hover:bg-brand-muted/40 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-brand-text text-sm font-mono whitespace-nowrap">
                                                    {item.order_number || `MNT-#${item.id}`}
                                                </div>
                                                <div className="text-xs text-brand-text-muted mt-0.5">
                                                    {formatDate(item.created_at)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-sm">
                                                {item.parent_order_number ? (
                                                    <span className="inline-block font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                                        {item.parent_order_number}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20 whitespace-nowrap" title="Tiket dibuat langsung pada order utama (data awal)">
                                                        Order Utama (Mandiri)
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-medium text-brand-text whitespace-nowrap">
                                                {item.customer_name}
                                            </td>

                                            <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                <div className="font-medium text-brand-text">{item.assigned_developer}</div>
                                                <div className="text-xs text-brand-text-muted">{item.assigned_job}</div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <MaintenanceStatusBadge status={item.status} />
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <DeveloperProgressBadge
                                                    status={item.developer_progress_status}
                                                    percentage={item.developer_progress_percentage}
                                                />
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <Link
                                                    href={`/super-admin/maintenance/${item.id}`}
                                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition shadow-sm inline-block"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Modal Tambah Maintenance (Responsif Mobile) */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-brand-text text-base sm:text-lg flex items-center gap-2">
                                    <Plus size={18} className="text-brand-accent shrink-0" />
                                    <span>Tambah Tiket Maintenance & Order Turunan</span>
                                </h3>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                    Daftarkan keluhan komplain untuk order yang telah selesai.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMaintenance} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Pilih Order Induk */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                    Pilih Order Induk (Hanya Status Selesai) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={form.parent_order_id}
                                    onChange={(e) => handleParentOrderChange(e.target.value)}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                >
                                    <option value="">-- Pilih Order yang Selesai --</option>
                                    {completedOrders.map((ord) => (
                                        <option key={ord.id} value={ord.id}>
                                            {ord.order_number} — {ord.customer_name} ({ord.services.join(', ')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ringkasan Order Induk */}
                            {selectedParentOrder && (
                                <div className="p-3 sm:p-3.5 bg-brand-primary/60 border border-brand-border/60 rounded-xl space-y-1.5 sm:space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-brand-text-muted">Klien:</span>
                                        <span className="font-semibold text-brand-text">{selectedParentOrder.customer_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-brand-text-muted">Tim Asli Proyek:</span>
                                        <span className="font-semibold text-brand-text">{selectedParentOrder.team_name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-brand-text-muted">Layanan:</span>
                                        <span className="text-brand-text truncate max-w-[180px] sm:max-w-[280px]">{selectedParentOrder.services.join(', ')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Pilih Job & Developer */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                        Posisi / Role yang Error <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.job_id}
                                        onChange={(e) => handleJobChange(e.target.value)}
                                        disabled={!selectedParentOrder}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
                                    >
                                        <option value="">-- Pilih Posisi --</option>
                                        {availableJobs.map((m) => (
                                            <option key={`${m.job_id}-${m.user_id}`} value={m.job_id}>
                                                {m.job_name} ({m.user_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                        Developer Penanggung Jawab <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.developer_user_id}
                                        onChange={(e) => setForm({ ...form, developer_user_id: e.target.value })}
                                        disabled={!selectedParentOrder}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
                                    >
                                        <option value="">-- Pilih Developer --</option>
                                        {availableJobs.map((m) => (
                                            <option key={m.user_id} value={m.user_id}>
                                                {m.user_name} — {m.job_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Judul Kendala */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                    Judul Kendala / Laporan Error <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Perbaikan Error 500 API Checkout / Bug Tampilan Mobile"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                />
                            </div>

                            {/* Deskripsi Kendala */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                    Rincian Kendala & Komplain Klien <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Tuliskan keluhan klien secara spesifik, alur terjadinya error, atau ekspektasi perbaikan..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                />
                            </div>

                            {/* Jadwal Perbaikan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                        Tanggal Mulai Perbaikan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.start_datetime}
                                        onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                        Target Selesai Perbaikan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.end_datetime}
                                        onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="w-full sm:w-auto text-center px-4 py-2.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-text rounded-xl bg-brand-muted/40"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto justify-center bg-brand-accent text-brand-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-accent2 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    <Plus size={15} />
                                    {submitting ? 'Menerbitkan...' : 'Simpan & Terbitkan Order Perbaikan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}