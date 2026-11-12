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
        scheduled:   'bg-amber-500/15 text-amber-400 border-amber-500/40',
        in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
        completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
        cancelled:   'bg-red-500/15 text-red-400 border-red-500/40',
    };
    return (
        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.scheduled}`}>
            {labels[status] || status}
        </span>
    );
}

function DeveloperProgressBadge({ status, percentage }) {
    if (status === 'completed' || percentage === 100) {
        return (
            <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                100% Selesai
            </span>
        );
    }
    if (status === 'in_progress' || (percentage > 0 && percentage < 100)) {
        return (
            <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400 border border-blue-500/40">
                {percentage || 50}% Pengerjaan
            </span>
        );
    }
    return (
        <span className="inline-block text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/40">
            Belum Dikerjakan
        </span>
    );
}

export default function AdminMaintenanceIndex() {
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
            <Head title="Admin — Maintenance Orders" />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
                    toast.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/15 border-red-500/40 text-red-400'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* HEADER SIMPEL PERSIS HALAMAN ORDER */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-brand-text">Order Maintenance</h1>
                <p className="text-sm text-brand-text-muted mt-1">Total {items.length} order maintenance</p>
            </div>

            {/* TOOLBAR: SEARCH, FILTER STATUS, REFRESH, TAMBAH */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                        {/* Input Search */}
                        <div className="relative flex-1 min-w-0 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                            <input
                                type="text"
                                placeholder="Cari no order, kendala, customer, atau developer..."
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
                    </div>

                    {/* Tombol Aksi Sejajar Filter */}
                    <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-brand-accent text-brand-secondary font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent/90 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> Tambah Maintenance
                        </button>
                    </div>
                </div>

                {/* Ringkasan Filter Aktif */}
                {(search || statusFilter) && (
                    <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl backdrop-blur-sm">
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
                            className="text-brand-accent hover:text-brand-accent/80 flex items-center gap-1.5 font-medium transition"
                        >
                            <X size={13} /> Reset Filter
                        </button>
                    </div>
                )}
            </div>

            {/* TABEL DATA ORDER MAINTENANCE (PERSIS HALAMAN ORDER) */}
            <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
                {loading && (
                    <div className="p-12 text-center text-brand-text-muted">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        Memuat data order maintenance...
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                        <p className="text-brand-text-muted font-medium">Tidak ada order maintenance ditemukan</p>
                        <p className="text-xs text-brand-text-muted/70 mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-brand-primary/50 border-b border-brand-border text-brand-text-muted">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">No Order</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Order Induk</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Customer</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Developer PIC</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Status Tiket</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Setoran Dev</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/50">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-brand-primary/40 transition">
                                        {/* 1. No Order Maintenance & Tanggal */}
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-brand-text text-sm font-mono whitespace-nowrap">
                                                {item.order_number || `MNT-#${item.id}`}
                                            </div>
                                            <div className="text-xs text-brand-text-muted mt-0.5">
                                                {formatDate(item.created_at)}
                                            </div>
                                        </td>

                                        {/* 2. Order Induk */}
                                        <td className="px-4 py-3 text-sm">
                                            {item.parent_order_number ? (
                                                <span className="inline-block font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                                    {item.parent_order_number}
                                                </span>
                                            ) : (
                                                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 whitespace-nowrap" title="Tiket dibuat langsung pada order utama (data awal)">
                                                    Order Utama (Mandiri)
                                                </span>
                                            )}
                                        </td>

                                        {/* 3. Customer */}
                                        <td className="px-4 py-3 text-sm font-medium text-brand-text whitespace-nowrap">
                                            {item.customer_name}
                                        </td>

                                        {/* 4. Developer PIC */}
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                                            <div className="font-medium text-brand-text">{item.assigned_developer}</div>
                                            <div className="text-xs text-brand-text-muted">{item.assigned_job}</div>
                                        </td>

                                        {/* 5. Status Tiket Pusat */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <MaintenanceStatusBadge status={item.status} />
                                        </td>

                                        {/* 6. Setoran Progres Developer */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <DeveloperProgressBadge
                                                status={item.developer_progress_status}
                                                percentage={item.developer_progress_percentage}
                                            />
                                        </td>

                                        {/* 7. Tombol Aksi (Langsung Navigasi ke Halaman Kontrol Penuh) */}
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <Link
                                                href={`/admin/maintenance/${item.id}`}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition shadow-sm"
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
            </div>

            {/* MODAL TAMBAH MAINTENANCE */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-brand-border flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-brand-text text-lg flex items-center gap-2">
                                    <Plus size={18} className="text-brand-accent" />
                                    Tambah Tiket Maintenance & Order Turunan
                                </h3>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                    Daftarkan keluhan komplain untuk order yang sudah selesai dan tugaskan developer untuk perbaikan.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMaintenance} className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* PILIH ORDER INDUK (HANYA COMPLETED) */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Pilih Order Induk (Hanya Status Selesai) *
                                </label>
                                <select
                                    required
                                    value={form.parent_order_id}
                                    onChange={(e) => handleParentOrderChange(e.target.value)}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                >
                                    <option value="">-- Pilih Order yang Selesai --</option>
                                    {completedOrders.map((ord) => (
                                        <option key={ord.id} value={ord.id}>
                                            {ord.order_number} — {ord.customer_name} ({ord.services.join(', ')})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* RINGKASAN ORDER INDUK */}
                            {selectedParentOrder && (
                                <div className="p-3.5 bg-brand-primary/60 border border-brand-border/60 rounded-xl space-y-2 text-xs">
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
                                        <span className="text-brand-text truncate max-w-[280px]">{selectedParentOrder.services.join(', ')}</span>
                                    </div>
                                </div>
                            )}

                            {/* PILIH JOB & DEVELOPER */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                        Posisi / Role yang Error *
                                    </label>
                                    <select
                                        required
                                        value={form.job_id}
                                        onChange={(e) => handleJobChange(e.target.value)}
                                        disabled={!selectedParentOrder}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
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
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                        Developer Penanggung Jawab *
                                    </label>
                                    <select
                                        required
                                        value={form.developer_user_id}
                                        onChange={(e) => setForm({ ...form, developer_user_id: e.target.value })}
                                        disabled={!selectedParentOrder}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
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

                            {/* JUDUL KENDALA */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Judul Kendala / Laporan Error *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Perbaikan Error 500 API Checkout / Bug Tampilan Mobile"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                />
                            </div>

                            {/* DESKRIPSI KENDALA */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Rincian Kendala & Komplain Klien *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Tuliskan keluhan klien secara spesifik, alur terjadinya error, atau ekspektasi perbaikan..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                />
                            </div>

                            {/* JADWAL PERBAIKAN */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                        Tanggal Mulai Perbaikan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.start_datetime}
                                        onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                        Target Selesai Perbaikan
                                    </label>
                                    <input
                                        type="date"
                                        value={form.end_datetime}
                                        onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                                        className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-brand-accent text-brand-secondary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition flex items-center gap-2 disabled:opacity-50"
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
