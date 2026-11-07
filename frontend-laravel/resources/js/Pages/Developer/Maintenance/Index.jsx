import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Wrench, RefreshCw, Briefcase, Calendar, CheckCircle2,
    Clock, AlertCircle, Search, ArrowRight, User, ShieldAlert
} from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Scheduled',
                className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                icon: <Clock size={12} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                icon: <Wrench size={12} />
            };
        case 'completed':
            return {
                label: 'Completed',
                className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                icon: <CheckCircle2 size={12} />
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-400 border-red-500/30',
                icon: <AlertCircle size={12} />
            };
        default:
            return {
                label: status,
                className: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
                icon: <Clock size={12} />
            };
    }
};

export default function MaintenanceIndex() {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

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

    const filteredItems = items.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) {
            return false;
        }

        const q = search.toLowerCase();
        const orderMatch = (item.order_number || '').toLowerCase().includes(q);
        const parentMatch = (item.parent_order_number || '').toLowerCase().includes(q);
        const customerMatch = (item.customer_name || '').toLowerCase().includes(q);
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const jobMatch = (item.job_name || '').toLowerCase().includes(q);

        return orderMatch || parentMatch || customerMatch || titleMatch || jobMatch;
    });

    const stats = {
        total: items.length,
        in_progress: items.filter((i) => i.status === 'in_progress').length,
        scheduled: items.filter((i) => i.status === 'scheduled').length,
        completed: items.filter((i) => i.status === 'completed').length,
    };

    return (
        <RoleLayout>
            <Head title="Maintenance Developer" />

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <Wrench size={24} className="text-brand-accent" />
                        Penugasan Maintenance & Perbaikan
                    </h1>
                    <p className="text-sm text-brand-text-muted mt-1">
                        Daftar order perbaikan dan penanganan kendala yang ditugaskan Super Admin kepada Anda.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-muted transition shadow-sm w-fit disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Data
                </button>
            </div>

            {/* STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Order Maintenance" value={stats.total} icon={Briefcase} color="purple" />
                <StatCard title="Sedang Dikerjakan" value={stats.in_progress} icon={Wrench} color="blue" />
                <StatCard title="Terjadwal / Antri" value={stats.scheduled} icon={Clock} color="amber" />
                <StatCard title="Selesai Diperbaiki" value={stats.completed} icon={CheckCircle2} color="emerald" />
            </div>

            {/* PENCARIAN & FILTER STATUS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative max-w-md w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                        type="text"
                        placeholder="Cari order, klien, modul, atau judul kendala..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'all'
                                ? 'bg-brand-accent text-brand-secondary border-brand-accent'
                                : 'bg-brand-secondary text-brand-text-muted border-brand-border hover:bg-brand-muted hover:text-brand-text'
                        }`}
                    >
                        Semua ({items.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('in_progress')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'in_progress'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-brand-secondary text-blue-400 border-brand-border hover:bg-brand-muted hover:text-blue-300'
                        }`}
                    >
                        Sedang Dikerjakan ({stats.in_progress})
                    </button>
                    <button
                        onClick={() => setStatusFilter('scheduled')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'scheduled'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-brand-secondary text-amber-400 border-brand-border hover:bg-brand-muted hover:text-amber-300'
                        }`}
                    >
                        Terjadwal ({stats.scheduled})
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-brand-secondary text-emerald-400 border-brand-border hover:bg-brand-muted hover:text-emerald-300'
                        }`}
                    >
                        Selesai ({stats.completed})
                    </button>
                </div>
            </div>

            {/* DAFTAR ORDER MAINTENANCE LANGSUNG (TANPA ACCORDION / PER LURAHAN) */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-brand-secondary border border-brand-border rounded-xl p-12 text-center text-brand-text-muted">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        Memuat data order maintenance...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-12 text-center text-brand-text-muted">
                        <ShieldAlert size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                        <p className="font-semibold text-brand-text text-base">Tidak ada penugasan maintenance</p>
                        <p className="text-xs text-brand-text-muted mt-1 max-w-md mx-auto">
                            Halaman ini hanya menampilkan order maintenance perbaikan kendala yang dibuat oleh Admin/Super Admin khusus untuk akun Anda.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredItems.map((item) => {
                            const badge = getStatusBadge(item.status);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-brand-secondary border border-brand-border rounded-2xl p-5 shadow-sm hover:border-brand-accent/40 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                                >
                                    <div className="space-y-3 min-w-0 flex-1">
                                        {/* HEADER IDENTITAS ORDER */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text">
                                                {item.order_number}
                                            </span>
                                            {item.parent_order_number && (
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                                    Induk: {item.parent_order_number}
                                                </span>
                                            )}
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                                                {item.job_name}
                                            </span>
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${badge.className}`}>
                                                {badge.icon} {badge.label}
                                            </span>
                                        </div>

                                        {/* JUDUL KENDALA & KLIEN */}
                                        <div>
                                            <h3 className="text-lg font-bold text-brand-text group-hover:text-brand-accent transition">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-brand-text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span>Klien: <strong className="text-brand-text">{item.customer_name}</strong></span>
                                                {item.services?.length > 0 && (
                                                    <span>• Layanan: {item.services.join(', ')}</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* DESKRIPSI KENDALA DARI ADMIN */}
                                        <p className="text-xs text-brand-text-muted/90 line-clamp-2 bg-brand-primary/40 border border-brand-border/40 p-2.5 rounded-xl">
                                            {item.description || 'Tidak ada deskripsi rincian kendala.'}
                                        </p>
                                    </div>

                                    {/* SISI KANAN: JADWAL & TOMBOL DETAIL ORDER */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-brand-border/60">
                                        <div className="text-left md:text-right">
                                            <span className="text-[11px] text-brand-text-muted uppercase block">Jadwal Perbaikan</span>
                                            <span className="text-xs font-medium text-brand-text flex items-center gap-1 mt-0.5">
                                                <Calendar size={13} className="text-brand-accent" />
                                                {item.start_datetime} s/d {item.end_datetime}
                                            </span>
                                        </div>

                                        <Link
                                            href={`/developer/maintenance/${item.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-accent text-brand-secondary hover:bg-brand-accent/90 transition shadow-sm"
                                        >
                                            Detail Order
                                            <ArrowRight size={13} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </RoleLayout>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
    const colors = {
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition">
            <div className={`p-3 rounded-lg border ${colors[color]}`}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-xs font-medium text-brand-text-muted mb-0.5">{title}</p>
                <h3 className="text-2xl font-bold text-brand-text">{value}</h3>
            </div>
        </div>
    );
}