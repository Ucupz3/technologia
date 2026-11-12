import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    RefreshCw, Search, FileText, ChevronDown, Check, X
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

export default function DeveloperMaintenanceIndex() {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const loadData = () => {
        if (!currentUserId) return;
        setLoading(true);
        fetch(`/api/v1/developer/maintenance?user_id=${currentUserId}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setItems(res.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [currentUserId]);

    // Filter pencarian dan status
    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            item.title?.toLowerCase().includes(q) ||
            item.customer_name?.toLowerCase().includes(q) ||
            item.order_number?.toLowerCase().includes(q) ||
            item.parent_order_number?.toLowerCase().includes(q) ||
            item.job_name?.toLowerCase().includes(q);
        const matchStatus = !statusFilter || item.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <RoleLayout>
            <Head title="Developer — Maintenance" />

            {/* HEADER SIMPEL PERSIS HALAMAN ORDER */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-brand-text">Penugasan Maintenance</h1>
                <p className="text-sm text-brand-text-muted mt-1">Total {items.length} order maintenance ditugaskan kepada Anda</p>
            </div>

            {/* TOOLBAR: SEARCH, FILTER STATUS, REFRESH */}
            <div className="mb-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                        {/* Input Search */}
                        <div className="relative flex-1 min-w-0 max-w-md">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                            <input
                                type="text"
                                placeholder="Cari no order, order induk, customer, atau posisi..."
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

                    {/* Tombol Aksi Sejajar Filter: Refresh */}
                    <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
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

            {/* TABEL DATA ORDER MAINTENANCE DEVELOPER (PERSIS HALAMAN ORDER) */}
            <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
                {loading && (
                    <div className="p-12 text-center text-brand-text-muted">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        Memuat data penugasan maintenance...
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                        <p className="text-brand-text-muted font-medium">Tidak ada penugasan maintenance ditemukan</p>
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
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Posisi / Job</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Status Tiket</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase">Setoran Saya</th>
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
                                                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 whitespace-nowrap">
                                                    Order Utama
                                                </span>
                                            )}
                                        </td>

                                        {/* 3. Customer */}
                                        <td className="px-4 py-3 text-sm font-medium text-brand-text whitespace-nowrap">
                                            {item.customer_name}
                                        </td>

                                        {/* 4. Posisi / Job */}
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                                            <span className="inline-block px-2.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-xs font-semibold border border-brand-accent/20">
                                                {item.job_name}
                                            </span>
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
                                                href={`/developer/maintenance/${item.id}`}
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
                )}
            </div>
        </RoleLayout>
    );
}
