import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Home, Package, ClipboardClock, Users, TrendingUp,
    RefreshCw, AlertCircle, CheckCircle2, Clock, Wrench,
    ArrowRight, Plus, FileText, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
    const [data, setData] = useState({
        total_orders: 0,
        completed_orders: 0,
        active_orders: 0,
        total_customers: 0,
        maintenance_active: 0,
        maintenance_total: 0,
        recent_orders: [],
        recent_maintenance: []
    });
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/v1/orders', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/v1/maintenances', { cache: 'no-store' }).then((r) => r.json()),
            fetch('/api/v1/customers', { cache: 'no-store' }).then((r) => r.json())
        ])
            .then(([resOrders, resMaintenances, resCustomers]) => {
                const orders = resOrders.success && Array.isArray(resOrders.data) ? resOrders.data : [];
                const maintenances = resMaintenances.success && Array.isArray(resMaintenances.data) ? resMaintenances.data : [];
                const customers = resCustomers.success && Array.isArray(resCustomers.data) ? resCustomers.data : [];

                const activeOrders = orders.filter((o) => o.status === 'in_progress' || o.status === 'pending');
                const completedOrders = orders.filter((o) => o.status === 'completed');
                const activeMaint = maintenances.filter((m) => m.status === 'in_progress' || m.status === 'scheduled');

                setData({
                    total_orders: orders.length,
                    completed_orders: completedOrders.length,
                    active_orders: activeOrders.length,
                    total_customers: customers.length,
                    maintenance_active: activeMaint.length,
                    maintenance_total: maintenances.length,
                    recent_orders: orders.slice(0, 5),
                    recent_maintenance: maintenances.slice(0, 4)
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <RoleLayout>
            <Head title="Admin Dashboard" />

            {/* HEADER */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <Home size={24} className="text-brand-accent" />
                        Dashboard Administrator
                    </h1>
                    <p className="text-sm text-brand-text-muted mt-1">
                        Ikhtisar operasional pesanan proyek, pengerjaan tim, dan penanganan maintenance kendala klien.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-muted transition shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh Data
                    </button>
                    <Link
                        href="/admin/orders/create"
                        className="bg-brand-accent text-brand-secondary font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-accent/90 transition shadow-sm"
                    >
                        <Plus size={16} />
                        Order Baru
                    </Link>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Pesanan (Order)" value={data.total_orders} icon={Package} color="blue" />
                <StatCard title="Proyek Selesai" value={data.completed_orders} icon={CheckCircle2} color="emerald" />
                <StatCard title="Sedang Dikerjakan" value={data.active_orders} icon={Clock} color="purple" />
                <StatCard title="Kendala / Maintenance" value={data.maintenance_active} icon={Wrench} color="amber" />
            </div>

            {/* BANNER MAINTENANCE & KENDALA ORDER */}
            <div className="bg-gradient-to-r from-brand-secondary via-brand-secondary to-brand-muted/40 border border-brand-border rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl shrink-0 mt-0.5">
                            <ClipboardClock size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                    Pusat Kendala & Maintenance
                                </span>
                                <span className="text-xs text-brand-text-muted">
                                    {data.maintenance_active} Kasus Aktif
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-brand-text">
                                Laporan Kendala & Order Turunan Maintenance
                            </h2>
                            <p className="text-xs text-brand-text-muted mt-1 max-w-xl">
                                Klien melaporkan bug atau error pada proyek yang sudah selesai? Daftarkan kendala tersebut untuk otomatis menerbitkan Order Turunan (*Child Order*) dan menugaskannya langsung ke developer penanggung jawab.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/admin/maintenance"
                            className="bg-brand-accent text-brand-secondary font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-brand-accent/90 transition shadow-sm flex items-center gap-2"
                        >
                            Buka Menu Maintenance
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* GRID DUA KOLOM: TIKET MAINTENANCE TERBARU & ORDER TERBARU */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TIKET MAINTENANCE TERBARU */}
                <div className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
                        <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                            <Wrench size={18} className="text-amber-500" />
                            Tiket Maintenance Terkini
                        </h3>
                        <Link href="/admin/maintenance" className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1">
                            Lihat Semua <ChevronRight size={14} />
                        </Link>
                    </div>

                    {data.recent_maintenance.length === 0 ? (
                        <p className="text-xs text-brand-text-muted italic py-6 text-center">
                            Belum ada kendala maintenance yang dilaporkan.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.recent_maintenance.map((m) => (
                                <div key={m.id} className="p-3 bg-brand-primary/40 border border-brand-border/60 rounded-xl space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-brand-text">{m.title}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            m.status === 'completed'
                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                : 'bg-amber-500/15 text-amber-400'
                                        }`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-brand-text-muted truncate">
                                        Klien: {m.customer_name} • Order: {m.order_number} {m.parent_order_number ? `(Induk: ${m.parent_order_number})` : ''}
                                    </p>
                                    <p className="text-[11px] text-brand-text-muted">
                                        Teknisi: <strong className="text-brand-text">{m.assigned_developer}</strong> ({m.assigned_job})
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* PESANAN TERBARU */}
                <div className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
                        <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                            <Package size={18} className="text-brand-accent" />
                            Pesanan (Orders) Terkini
                        </h3>
                        <Link href="/admin/orders" className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1">
                            Lihat Semua <ChevronRight size={14} />
                        </Link>
                    </div>

                    {data.recent_orders.length === 0 ? (
                        <p className="text-xs text-brand-text-muted italic py-6 text-center">
                            Belum ada pesanan yang terdaftar.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.recent_orders.map((o) => (
                                <div key={o.id} className="p-3 bg-brand-primary/40 border border-brand-border/60 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-brand-text">{o.order_number}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                o.status === 'completed'
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : o.status === 'in_progress'
                                                    ? 'bg-blue-500/15 text-blue-400'
                                                    : 'bg-amber-500/15 text-amber-400'
                                            }`}>
                                                {o.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-brand-text-muted mt-0.5 truncate max-w-xs">
                                            {o.customer_name_snapshot || '-'}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/admin/orders/${o.id}`}
                                        className="text-xs text-brand-accent hover:underline px-2.5 py-1 rounded bg-brand-muted border border-brand-border"
                                    >
                                        Detail
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
