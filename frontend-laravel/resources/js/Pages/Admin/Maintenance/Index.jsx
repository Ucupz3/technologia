import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
    ClipboardClock, Plus, RefreshCw, Search, Clock,
    CheckCircle2, AlertCircle, Wrench, Calendar, User,
    FileText, X, Save, ArrowRight, ShieldAlert, Cpu
} from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Scheduled',
                className: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                icon: <Clock size={12} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
                icon: <Wrench size={12} />
            };
        case 'completed':
            return {
                label: 'Completed',
                className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
                icon: <CheckCircle2 size={12} />
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-500 border-red-500/30',
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

export default function AdminMaintenanceIndex() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // State Modal Tambah Maintenance
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
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectedParentOrder = completedOrders.find(
        (o) => o.id === form.parent_order_id
    );

    // Kumpulan job yang ada pada order terpilih
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

            alert(`Sukses! ${data.message}\nOrder Turunan: ${data.data.child_order_number}`);
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
            loadData();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;

        const q = search.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const custMatch = (item.customer_name || '').toLowerCase().includes(q);
        const orderMatch = (item.order_number || '').toLowerCase().includes(q);
        const parentMatch = (item.parent_order_number || '').toLowerCase().includes(q);
        const devMatch = (item.assigned_developer || '').toLowerCase().includes(q);

        return titleMatch || descMatch || custMatch || orderMatch || parentMatch || devMatch;
    });

    const stats = {
        total: items.length,
        in_progress: items.filter((i) => i.status === 'in_progress').length,
        scheduled: items.filter((i) => i.status === 'scheduled').length,
        completed: items.filter((i) => i.status === 'completed').length
    };

    return (
        <RoleLayout>
            <Head title="Manajemen Maintenance" />

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <ClipboardClock size={24} className="text-brand-accent" />
                        Manajemen Maintenance & Kendala Order
                    </h1>
                    <p className="text-sm text-brand-text-muted mt-1">
                        Kelola keluhan/error klien pada order yang telah selesai dan terbitkan order turunan perbaikan.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="bg-brand-secondary border border-brand-border text-brand-text px-3.5 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-muted transition shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-brand-accent text-brand-secondary font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-accent/90 transition shadow-sm"
                    >
                        <Plus size={16} />
                        Tambah Maintenance
                    </button>
                </div>
            </div>

            {/* STATISTIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Tiket Maintenance" value={stats.total} icon={ClipboardClock} color="purple" />
                <StatCard title="Sedang Dikerjakan" value={stats.in_progress} icon={Wrench} color="blue" />
                <StatCard title="Terjadwal (Scheduled)" value={stats.scheduled} icon={Clock} color="amber" />
                <StatCard title="Selesai Diperbaiki" value={stats.completed} icon={CheckCircle2} color="emerald" />
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative max-w-md w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                        type="text"
                        placeholder="Cari nomor order, klien, judul kendala, atau developer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'all'
                                ? 'bg-brand-accent text-brand-secondary border-brand-accent'
                                : 'bg-brand-secondary text-brand-text-muted border-brand-border hover:bg-brand-muted hover:text-brand-text'
                        }`}
                    >
                        Semua ({items.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('in_progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'in_progress'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-brand-secondary text-blue-400 border-brand-border hover:bg-brand-muted hover:text-blue-300'
                        }`}
                    >
                        In Progress ({stats.in_progress})
                    </button>
                    <button
                        onClick={() => setStatusFilter('scheduled')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'scheduled'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-brand-secondary text-amber-400 border-brand-border hover:bg-brand-muted hover:text-amber-300'
                        }`}
                    >
                        Scheduled ({stats.scheduled})
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            statusFilter === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-brand-secondary text-emerald-400 border-brand-border hover:bg-brand-muted hover:text-emerald-300'
                        }`}
                    >
                        Completed ({stats.completed})
                    </button>
                </div>
            </div>

            {/* DAFTAR TIKET MAINTENANCE */}
            {loading ? (
                <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                    Memuat data maintenance...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
                    <ClipboardClock size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                    <p className="font-semibold text-brand-text">Tidak ada tiket maintenance yang ditemukan.</p>
                    <p className="text-xs text-brand-text-muted mt-1">
                        Klik tombol "+ Tambah Maintenance" untuk mendaftarkan kendala dari order yang telah selesai.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredItems.map((item) => {
                        const badge = getStatusBadge(item.status);

                        return (
                            <div
                                key={item.id}
                                className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm transition hover:border-brand-accent/40"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text">
                                                Order: {item.order_number}
                                            </span>
                                            {item.parent_order_number && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    Turunan dari: <strong>{item.parent_order_number}</strong>
                                                </span>
                                            )}
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.className}`}>
                                                {badge.icon} {badge.label}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-brand-text-muted mt-0.5">
                                            Klien: <strong className="text-brand-text">{item.customer_name}</strong>
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="text-[11px] text-brand-text-muted uppercase block">Jadwal Perbaikan</span>
                                        <span className="text-xs font-medium text-brand-text flex items-center gap-1 sm:justify-end">
                                            <Calendar size={12} className="text-brand-text-muted" />
                                            {item.start_datetime} s/d {item.end_datetime}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-brand-primary/40 border border-brand-border/40 rounded-lg text-xs mb-3">
                                    <span className="text-brand-text-muted/80 block mb-1 font-semibold flex items-center gap-1">
                                        <FileText size={12} /> Rincian Kendala / Error:
                                    </span>
                                    <p className="text-brand-text leading-relaxed whitespace-pre-wrap">{item.description}</p>
                                </div>

                                {item.notes && (
                                    <div className="p-2.5 bg-brand-muted/50 border border-brand-border/30 rounded-lg text-xs mb-3 italic text-brand-text-muted">
                                        Catatan Teknis: "{item.notes}"
                                    </div>
                                )}

                                <div className="pt-3 border-t border-brand-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-text-muted">Ditugaskan ke:</span>
                                        <span className="font-semibold text-brand-text flex items-center gap-1">
                                            <User size={12} className="text-brand-accent" />
                                            {item.assigned_developer} ({item.assigned_job})
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-brand-text-muted">
                                        Dibuat pada: {item.created_at}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL TAMBAH MAINTENANCE */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-brand-border flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-brand-text text-lg flex items-center gap-2">
                                    <ShieldAlert size={20} className="text-brand-accent" />
                                    Tambah Tiket Maintenance Kendala
                                </h3>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                    Pilih order selesai untuk menerbitkan order turunan perbaikan.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMaintenance} className="p-5 space-y-4 overflow-y-auto">
                            {/* PILIH ORDER SELESAI */}
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Order Induk yang Selesai (Completed) *
                                </label>
                                <select
                                    required
                                    value={form.parent_order_id}
                                    onChange={(e) => handleParentOrderChange(e.target.value)}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                >
                                    <option value="">-- Pilih Order yang Telah Selesai --</option>
                                    {completedOrders.map((ord) => (
                                        <option key={ord.id} value={ord.id}>
                                            {ord.order_number} — {ord.customer_name} ({ord.team_name})
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[11px] text-brand-text-muted mt-1 block">
                                    Hanya menampilkan pesanan yang telah tuntas 100% dan berstatus Completed.
                                </span>
                            </div>

                            {form.parent_order_id && (
                                <>
                                    {/* PILIH BAGIAN YANG ERROR & DEVELOPER */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                                Bagian / Job yang Error *
                                            </label>
                                            <select
                                                required
                                                value={form.job_id}
                                                onChange={(e) => handleJobChange(e.target.value)}
                                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                            >
                                                <option value="">-- Pilih Bagian --</option>
                                                {availableJobs.map((m, idx) => (
                                                    <option key={`${m.job_id}-${idx}`} value={m.job_id}>
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
                                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                            >
                                                <option value="">-- Pilih Developer --</option>
                                                {availableJobs.map((m, idx) => (
                                                    <option key={`dev-${m.user_id}-${idx}`} value={m.user_id}>
                                                        {m.user_name} ({m.job_name})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* JUDUL KENDALA */}
                                    <div>
                                        <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                            Judul Kendala / Error *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            placeholder="Contoh: Error 500 saat Checkout Pembayaran"
                                            className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                        />
                                    </div>

                                    {/* RINCIAN ERROR */}
                                    <div>
                                        <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                            Rincian Kendala & Keluhan Klien *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Jelaskan secara detail pesan error yang muncul, alur terjadinya kendala, dan harapan perbaikan dari klien..."
                                            className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                        />
                                    </div>

                                    {/* TANGGAL */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                                Tgl Mulai Perbaikan
                                            </label>
                                            <input
                                                type="date"
                                                value={form.start_datetime}
                                                onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                                Deadline Target Selesai
                                            </label>
                                            <input
                                                type="date"
                                                value={form.end_datetime}
                                                onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3.5 bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-xs text-brand-text flex items-start gap-2.5">
                                        <AlertCircle size={16} className="text-brand-accent shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-brand-accent">Otomatis Membuat Order Turunan (Child Order)</p>
                                            <p className="text-brand-text-muted mt-0.5 text-[11px]">
                                                Sistem akan menerbitkan order baru yang melanjutkan order induk di atas, menugaskannya langsung ke menu Maintenance developer yang dipilih.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

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
                                    disabled={submitting || !form.parent_order_id}
                                    className="bg-brand-accent text-brand-secondary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {submitting ? 'Menyimpan...' : 'Terbitkan Order Maintenance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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

