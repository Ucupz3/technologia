import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    ListTodo, RefreshCw, Calendar, CheckCircle2,
    Lock, PlayCircle, Clock, AlertCircle, Search,
    X, Save, Sliders
} from 'lucide-react';

// ============ HELPERS ============
const formatDate = (d) =>
    d && d !== '-'
        ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

// Nama yang ditampilkan: nama project dari order (bukan kode order)
const getTitle = (item) => item.project_name || item.name || 'Tanpa nama project';

const getStatusBadge = (status) => {
    switch (status) {
        case 'in_progress':
            return {
                label: 'Sedang Dikerjakan',
                className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                icon: <PlayCircle size={12} />
            };
        case 'completed':
            return {
                label: 'Selesai',
                className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                icon: <CheckCircle2 size={12} />
            };
        case 'cancelled':
            return {
                label: 'Dibatalkan',
                className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
                icon: <AlertCircle size={12} />
            };
        default:
            return {
                label: 'Belum Dikerjakan',
                className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                icon: <Clock size={12} />
            };
    }
};

const FILTERS = [
    { value: 'all', label: 'Semua' },
    { value: 'pending', label: 'Belum' },
    { value: 'in_progress', label: 'Berjalan' },
    { value: 'completed', label: 'Selesai' },
    { value: 'locked', label: 'Terkunci' },
];

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
        const p = task.progress || 0;
        const s = task.status || (p === 100 ? 'completed' : p > 0 ? 'in_progress' : 'pending');
        setModalForm({
            progress_percentage: p,
            status: s,
            notes: task.notes || ''
        });
    };

    const handleSelectStatus = (statusValue) => {
        let newProgress = modalForm.progress_percentage;
        if (statusValue === 'completed') {
            newProgress = 100;
        } else if (statusValue === 'pending') {
            newProgress = 0;
        } else if (statusValue === 'in_progress' && (newProgress === 0 || newProgress === 100)) {
            newProgress = 50;
        }

        setModalForm((prev) => ({
            ...prev,
            status: statusValue,
            progress_percentage: newProgress
        }));
    };

    const handleProgressChange = (val) => {
        const num = Number(val);
        let nextStatus = modalForm.status;

        if (num === 100) {
            nextStatus = 'completed';
        } else if (num > 0) {
            nextStatus = 'in_progress';
        } else {
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

    const isDone = (t) => t.status === 'completed' || t.progress === 100;

    const counts = {
        all: tasks.length,
        pending: tasks.filter((t) => t.status === 'pending' && !t.is_locked).length,
        in_progress: tasks.filter((t) => t.status === 'in_progress' && !t.is_locked).length,
        completed: tasks.filter(isDone).length,
        locked: tasks.filter((t) => t.is_locked).length,
    };

    const filteredTasks = tasks.filter((t) => {
        if (filterStatus === 'pending' && t.status !== 'pending') return false;
        if (filterStatus === 'in_progress' && t.status !== 'in_progress') return false;
        if (filterStatus === 'completed' && !isDone(t)) return false;
        if (filterStatus === 'locked' && !t.is_locked) return false;

        const q = search.toLowerCase();
        if (!q) return true;
        return (
            (t.project_name || '').toLowerCase().includes(q) ||
            (t.job_name || '').toLowerCase().includes(q) ||
            (t.customer || '').toLowerCase().includes(q)
        );
    });

    return (
        <RoleLayout>
            <Head title="Tugas Developer" />

            {/* HEADER */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-text flex items-center gap-2">
                        <ListTodo size={24} className="text-brand-accent shrink-0 sm:w-7 sm:h-7" />
                        <span>Tugas Saya</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
                        Laporkan progres pekerjaan Anda di setiap proyek.
                    </p>
                </div>
                <button
                    onClick={loadTasks}
                    disabled={loading}
                    className="bg-brand-secondary border border-brand-border text-brand-text px-3.5 py-2.5 sm:py-2 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm hover:bg-brand-muted transition shadow-sm w-full sm:w-auto font-medium disabled:opacity-50"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="relative max-w-md w-full">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    <input
                        type="text"
                        placeholder="Cari proyek, job, atau klien..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 sm:py-2 bg-brand-secondary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 shadow-sm transition"
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

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setFilterStatus(f.value)}
                            className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                                filterStatus === f.value
                                    ? 'bg-brand-accent text-brand-primary border-brand-accent shadow-sm'
                                    : 'bg-brand-secondary text-brand-text-muted border-brand-border hover:bg-brand-muted hover:text-brand-text'
                            }`}
                        >
                            {f.label} ({counts[f.value]})
                        </button>
                    ))}
                </div>
            </div>

            {/* DAFTAR TUGAS */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-8 sm:p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl shadow-sm">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                        <p className="text-xs sm:text-sm">Memuat daftar tugas...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl shadow-sm">
                        <ListTodo size={44} className="mx-auto mb-3 text-brand-text-muted/40 sm:w-12 sm:h-12" />
                        <p className="font-semibold text-brand-text text-xs sm:text-sm">Tidak ada tugas yang sesuai.</p>
                        <p className="text-xs text-brand-text-muted/70 mt-1">Coba sesuaikan pencarian atau kata kunci filter.</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const finished = isDone(task);
                        const badge = getStatusBadge(task.status);
                        const barColor = finished
                            ? 'bg-emerald-500'
                            : task.status === 'in_progress'
                            ? 'bg-blue-500'
                            : 'bg-gray-500';

                        return (
                            <div
                                key={task.id}
                                className={`bg-brand-secondary border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-sm transition hover:border-brand-accent/40 ${
                                    task.is_locked ? 'border-brand-border/60 opacity-85' : 'border-brand-border'
                                }`}
                            >
                                {/* Baris atas: nama project + status */}
                                <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0">
                                        <h3 className="text-sm sm:text-base font-bold text-brand-text truncate">
                                            {getTitle(task)}
                                        </h3>
                                        <p className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5 truncate">
                                            {task.job_name} &bull; Fase {task.phase_order || 1}
                                        </p>
                                    </div>

                                    {task.is_locked ? (
                                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-full border bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                            <Lock size={12} /> Terkunci
                                        </span>
                                    ) : (
                                        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 sm:py-1 rounded-full border ${badge.className}`}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    )}
                                </div>

                                {/* Alasan terkunci */}
                                {task.is_locked && task.lock_reason && (
                                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl mt-2 flex items-center gap-2">
                                        <Lock size={13} className="shrink-0" />
                                        <span>{task.lock_reason}</span>
                                    </div>
                                )}

                                {/* Baris bawah: deadline, progres, tombol */}
                                <div className="mt-3 pt-3 border-t border-brand-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 flex-1 min-w-0">
                                        <span className={`text-xs flex items-center gap-1.5 shrink-0 ${
                                            task.is_overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-text-muted'
                                        }`}>
                                            <Calendar size={13} className="shrink-0" />
                                            <span>{formatDate(task.deadline)}</span>
                                        </span>

                                        <div className="flex items-center gap-2 sm:max-w-xs flex-1">
                                            <div className="w-full bg-brand-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${barColor}`}
                                                    style={{ width: `${task.progress || 0}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold text-brand-text min-w-[36px] text-right text-xs">
                                                {task.progress || 0}%
                                            </span>
                                        </div>
                                    </div>

                                    {task.is_locked ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-medium bg-brand-muted border border-brand-border text-brand-text-muted/60 cursor-not-allowed text-center"
                                        >
                                            Belum Bisa Dikerjakan
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => openUpdateModal(task)}
                                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                                                finished
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                                    : 'bg-brand-accent text-brand-primary hover:bg-brand-accent2'
                                            }`}
                                        >
                                            <Sliders size={14} />
                                            <span>{finished ? 'Edit Catatan' : 'Setor Progres'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL SETORAN PROGRES (RESPONSIF MOBILE) */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={() => setSelectedTask(null)}>
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between gap-3 shrink-0">
                            <div className="min-w-0">
                                <h3 className="font-bold text-brand-text text-sm sm:text-base truncate">
                                    {getTitle(selectedTask)}
                                </h3>
                                <p className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5 truncate">
                                    {selectedTask.job_name} &bull; Fase {selectedTask.phase_order || 1}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg hover:bg-brand-primary shrink-0 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProgress} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Status */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
                                    Status Pekerjaan
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'pending', label: 'Belum', icon: Clock, active: 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400' },
                                        { value: 'in_progress', label: 'Berjalan', icon: PlayCircle, active: 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400' },
                                        { value: 'completed', label: 'Selesai', icon: CheckCircle2, active: 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400' },
                                    ].map((opt) => {
                                        const Icon = opt.icon;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSelectStatus(opt.value)}
                                                className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition ${
                                                    modalForm.status === opt.value
                                                        ? opt.active
                                                        : 'bg-brand-primary border-brand-border text-brand-text-muted hover:border-brand-accent/40'
                                                }`}
                                            >
                                                <Icon size={16} />
                                                <span>{opt.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Slider progres (hanya saat berjalan) */}
                            {modalForm.status === 'in_progress' && (
                                <div className="p-3.5 bg-brand-primary/50 border border-brand-border rounded-xl">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                                            Progres (%)
                                        </label>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                                            {modalForm.progress_percentage}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="95"
                                        step="5"
                                        value={modalForm.progress_percentage}
                                        onChange={(e) => handleProgressChange(e.target.value)}
                                        className="w-full accent-blue-500 cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Catatan */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                                    Catatan Perkembangan
                                </label>
                                <textarea
                                    rows={3}
                                    value={modalForm.notes}
                                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                                    placeholder="Apa saja kendala atau hal yang sudah dikerjakan..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none transition"
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTask(null)}
                                    className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-text rounded-xl transition text-center"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto bg-brand-accent text-brand-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-accent2 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                                >
                                    <Save size={15} />
                                    <span>{submitting ? 'Menyimpan...' : 'Simpan Progres'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}