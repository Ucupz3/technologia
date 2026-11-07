import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ListTodo, RefreshCw, Briefcase, Calendar, CheckCircle2,
    Lock, PlayCircle, Clock, AlertCircle, Search, ChevronRight,
    ArrowRight, Sparkles, X, Save, Sliders, Cpu, FileText
} from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending':
            return {
                label: 'Pending',
                className: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                icon: <Clock size={12} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
                icon: <PlayCircle size={12} />
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

export default function DeveloperTasksIndex() {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedTask, setSelectedTask] = useState(null);
    const [modalForm, setModalForm] = useState({
        progress_percentage: 0,
        status: 'pending',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const loadTasks = () => {
        if (!currentUserId) return;
        setLoading(true);
        fetch(`/api/v1/developer/tasks?user_id=${currentUserId}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setTasks(res.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadTasks();
    }, [currentUserId]);

    const openUpdateModal = (task) => {
        setSelectedTask(task);
        setModalForm({
            progress_percentage: task.progress || 0,
            status: task.status || 'pending',
            notes: task.notes || ''
        });
    };

    const handleProgressChange = (val) => {
        const num = Number(val);
        let nextStatus = modalForm.status;

        if (num === 100) {
            nextStatus = 'completed';
        } else if (num > 0 && modalForm.status !== 'in_progress') {
            nextStatus = 'in_progress';
        } else if (num === 0 && modalForm.status === 'completed') {
            nextStatus = 'pending';
        }

        setModalForm((prev) => ({
            ...prev,
            progress_percentage: num,
            status: nextStatus
        }));
    };

    const handleSaveProgress = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/v1/developer/tasks/${selectedTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modalForm)
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'Gagal menyimpan progres');

            setSelectedTask(null);
            loadTasks();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan saat menyimpan progres.');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTasks = tasks.filter((t) => {
        if (filterStatus === 'pending' && t.status !== 'pending') return false;
        if (filterStatus === 'in_progress' && t.status !== 'in_progress') return false;
        if (filterStatus === 'completed' && t.status !== 'completed') return false;
        if (filterStatus === 'locked' && !t.is_locked) return false;

        const q = search.toLowerCase();
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const jobMatch = (t.job_name || '').toLowerCase().includes(q);
        const orderMatch = (t.order_number || '').toLowerCase().includes(q);
        const customerMatch = (t.customer || '').toLowerCase().includes(q);

        return titleMatch || jobMatch || orderMatch || customerMatch;
    });

    const stats = {
        total: tasks.length,
        in_progress: tasks.filter((t) => t.status === 'in_progress' && !t.is_locked).length,
        completed: tasks.filter((t) => t.status === 'completed' || t.progress === 100).length,
        locked: tasks.filter((t) => t.is_locked).length
    };

    return (
        <RoleLayout>
            <Head title="Task & Progress Developer" />

            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <ListTodo size={24} className="text-brand-accent" />
                        Task & Progress Pengerjaan
                    </h1>
                    <p className="text-sm text-brand-text-muted mt-1">
                        Kelola dan update kemajuan tugas modul pengerjaan yang ditugaskan kepada Anda.
                    </p>
                </div>
                <button
                    onClick={loadTasks}
                    disabled={loading}
                    className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-muted transition shadow-sm w-fit disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh Tugas
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Tugas Anda" value={stats.total} icon={ListTodo} color="purple" />
                <StatCard title="Sedang Dikerjakan" value={stats.in_progress} icon={PlayCircle} color="blue" />
                <StatCard title="Selesai (100%)" value={stats.completed} icon={CheckCircle2} color="emerald" />
                <StatCard title="Terkunci (Antri Fase)" value={stats.locked} icon={Lock} color="amber" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="relative max-w-md w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                        type="text"
                        placeholder="Cari tugas, nama modul, nomor order, atau klien..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            filterStatus === 'all'
                                ? 'bg-brand-accent text-brand-secondary border-brand-accent'
                                : 'bg-brand-secondary text-brand-text-muted border-brand-border hover:bg-brand-muted hover:text-brand-text'
                        }`}
                    >
                        Semua ({tasks.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('in_progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            filterStatus === 'in_progress'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-brand-secondary text-blue-400 border-brand-border hover:bg-brand-muted hover:text-blue-300'
                        }`}
                    >
                        Sedang Dikerjakan ({stats.in_progress})
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            filterStatus === 'completed'
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'bg-brand-secondary text-emerald-400 border-brand-border hover:bg-brand-muted hover:text-emerald-300'
                        }`}
                    >
                        Selesai ({stats.completed})
                    </button>
                    <button
                        onClick={() => setFilterStatus('locked')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                            filterStatus === 'locked'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-brand-secondary text-amber-400 border-brand-border hover:bg-brand-muted hover:text-amber-300'
                        }`}
                    >
                        Terkunci ({stats.locked})
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        Memuat daftar tugas...
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
                        <ListTodo size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                        <p className="font-semibold text-brand-text">Tidak ada tugas yang sesuai.</p>
                        <p className="text-xs text-brand-text-muted mt-1">
                            Semua tugas yang ditugaskan kepada Anda akan tampil di halaman ini.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map((task) => {
                            const badge = getStatusBadge(task.status);
                            const isFinished = task.status === 'completed' || task.progress === 100;

                            return (
                                <div
                                    key={task.id}
                                    className={`bg-brand-secondary border rounded-xl p-5 shadow-sm transition hover:border-brand-accent/40 ${
                                        task.is_locked ? 'border-brand-border/60 opacity-80' : 'border-brand-border'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text-muted">
                                                    {task.order_number}
                                                </span>
                                                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                                    Fase {task.phase_order || 1}
                                                </span>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.className}`}>
                                                    {badge.icon} {badge.label}
                                                </span>
                                                {task.is_locked && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                                        <Lock size={11} /> Terkunci
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base font-bold text-brand-text">
                                                {task.job_name} — {task.title}
                                            </h3>
                                            <p className="text-xs text-brand-text-muted mt-0.5">
                                                Klien: <strong className="text-brand-text">{task.customer}</strong>
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-[11px] text-brand-text-muted uppercase block">Jadwal / Deadline</span>
                                            <span className={`text-xs font-medium flex items-center gap-1 sm:justify-end ${task.is_overdue ? 'text-red-500 font-semibold' : 'text-brand-text'}`}>
                                                <Calendar size={12} className={task.is_overdue ? 'text-red-500' : 'text-brand-text-muted'} />
                                                {task.start_date && task.end_date
                                                    ? `${task.start_date} s/d ${task.end_date}`
                                                    : task.deadline}
                                            </span>
                                        </div>
                                    </div>

                                    {task.is_locked && task.lock_reason && (
                                        <div className="text-xs text-amber-500/90 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-lg mb-3">
                                            <Lock size={14} className="shrink-0" />
                                            <span>{task.lock_reason}</span>
                                        </div>
                                    )}

                                    {task.notes && (
                                        <div className="mb-3 p-3 bg-brand-primary/40 border border-brand-border/40 rounded-lg text-xs">
                                            <span className="text-brand-text-muted block mb-1 font-semibold flex items-center gap-1">
                                                <FileText size={12} /> Catatan Terakhir:
                                            </span>
                                            <p className="text-brand-text italic">"{task.notes}"</p>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-brand-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 sm:w-72">
                                            <span className="text-xs font-semibold text-brand-text-muted shrink-0">Progres:</span>
                                            <div className="w-full bg-brand-muted rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        isFinished
                                                            ? 'bg-emerald-500'
                                                            : task.status === 'in_progress'
                                                            ? 'bg-blue-500'
                                                            : 'bg-gray-500'
                                                    }`}
                                                    style={{ width: `${task.progress || 0}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-brand-text min-w-[36px] text-right text-xs">
                                                {task.progress || 0}%
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                                            {isFinished ? (
                                                <Link
                                                    href="/developer/maintenance"
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition shadow-sm"
                                                >
                                                    <Cpu size={13} />
                                                    Selesai 100% • Buka di Maintenance Modul
                                                    <ArrowRight size={13} />
                                                </Link>
                                            ) : task.is_locked ? (
                                                <button
                                                    disabled
                                                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-brand-muted border border-brand-border text-brand-text-muted/60 cursor-not-allowed flex items-center gap-1.5"
                                                >
                                                    <Lock size={12} /> Belum Dapat Dikerjakan
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openUpdateModal(task)}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-accent text-brand-secondary hover:bg-brand-accent/90 transition shadow-sm"
                                                >
                                                    <Sliders size={13} />
                                                    Update Progres
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-brand-border flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-brand-text">Update Progres Pekerjaan</h3>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                    {selectedTask.order_number} — {selectedTask.job_name} ({selectedTask.customer})
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProgress} className="p-5 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-brand-text-muted uppercase">
                                        Persentase Progres
                                    </label>
                                    <span className="text-sm font-bold text-brand-accent">
                                        {modalForm.progress_percentage}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={modalForm.progress_percentage}
                                    onChange={(e) => handleProgressChange(e.target.value)}
                                    className="w-full accent-brand-accent cursor-pointer"
                                />
                                <div className="flex justify-between text-[11px] text-brand-text-muted mt-1">
                                    <span>0% (Belum Mulai)</span>
                                    <span>50% (Sedang Jalan)</span>
                                    <span>100% (Selesai Penuh)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Status Pengerjaan
                                </label>
                                <select
                                    value={modalForm.status}
                                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                >
                                    <option value="pending">Pending (Belum Dimulai)</option>
                                    <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                                    <option value="completed">Completed (Selesai 100%)</option>
                                </select>
                            </div>

                            {modalForm.progress_percentage === 100 && (
                                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-200">Tugas Selesai (100%)</p>
                                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                                            Tugas ini akan ditandai selesai penuh.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Catatan & Laporan Pengerjaan
                                </label>
                                <textarea
                                    rows={3}
                                    value={modalForm.notes}
                                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                                    placeholder="Tuliskan kemajuan tugas, link aset, atau catatan teknis..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTask(null)}
                                    className="px-4 py-2 text-sm text-brand-text-muted hover:text-brand-text rounded-xl"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-brand-accent text-brand-secondary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={14} />
                                    {submitting ? 'Menyimpan...' : 'Simpan Progres'}
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
