import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    ClipboardClock, RefreshCw, Briefcase, User,
    Calendar, CheckCircle2, ShieldCheck, Wrench, Search,
    Clock, AlertCircle, FileText, X, Save
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

export default function MaintenanceIndex() {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');

    const [selectedItem, setSelectedItem] = useState(null);
    const [modalForm, setModalForm] = useState({ status: 'scheduled', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const loadData = () => {
        if (!currentUserId) return;
        setLoading(true);
        fetch(`/api/v1/developer/maintenance?user_id=${currentUserId}`, { cache: 'no-store' })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) setItems(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [currentUserId]);

    const openUpdateModal = (item) => {
        setSelectedItem(item);
        setModalForm({
            status: item.status,
            notes: item.notes || '',
        });
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch(`/api/v1/developer/maintenance/${selectedItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modalForm),
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.message || 'Gagal menyimpan');

            setSelectedItem(null);
            loadData();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan saat menyimpan laporan.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = items.filter((item) => {
        const q = search.toLowerCase();
        return (
            item.order_number?.toLowerCase().includes(q) ||
            item.customer_name?.toLowerCase().includes(q) ||
            item.title?.toLowerCase().includes(q)
        );
    });

    return (
        <RoleLayout>
            <Head title="Maintenance Proyek" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
                        <ClipboardClock size={24} className="text-brand-accent" />
                        Maintenance & Pemeliharaan Proyek
                    </h1>
                    <p className="text-sm text-brand-text-muted mt-1">
                        Daftar jadwal pemeliharaan dan catatan teknis proyek yang Anda tangani.
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-brand-muted transition shadow-sm w-fit"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="relative mb-6 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                <input
                    type="text"
                    placeholder="Cari nomor order, klien, atau judul tugas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                />
            </div>

            {loading ? (
                <div className="p-12 text-center text-brand-text-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
                    Memuat data pemeliharaan...
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
                    <ShieldCheck size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
                    <p className="font-semibold text-brand-text">Belum ada tugas maintenance yang terdaftar.</p>
                    <p className="text-xs text-brand-text-muted mt-1">
                        Tiket maintenance akan otomatis muncul saat order disahkan <strong>Completed</strong> oleh Admin.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((item) => {
                        const badge = getStatusBadge(item.status);

                        return (
                            <div
                                key={item.id}
                                className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm hover:border-brand-accent/50 transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${badge.className}`}>
                                            {badge.icon} {badge.label}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-brand-text bg-brand-muted px-2 py-0.5 rounded">
                                            {item.order_number}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-brand-text mb-1">{item.title}</h3>
                                    <p className="text-xs font-medium text-brand-accent mb-3 flex items-center gap-1.5">
                                        <User size={13} /> {item.customer_name}
                                    </p>

                                    <p className="text-xs text-brand-text-muted leading-relaxed mb-4 bg-brand-primary/40 p-2.5 rounded-lg border border-brand-border/40">
                                        {item.description}
                                    </p>

                                    <div className="space-y-2 text-xs text-brand-text-muted border-t border-brand-border/60 pt-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={13} className="text-brand-text-muted/70" />
                                            <span>Periode: <strong className="text-brand-text">{item.start_datetime}</strong> s/d <strong className="text-brand-text">{item.end_datetime}</strong></span>
                                        </div>

                                        <div className="pt-2">
                                            <span className="text-brand-text-muted/70 block mb-1 font-medium flex items-center gap-1">
                                                <FileText size={12} /> Catatan / Laporan Pengerjaan:
                                            </span>
                                            {item.notes ? (
                                                <p className="text-brand-text bg-brand-muted/70 p-2 rounded text-[11px] italic">
                                                    "{item.notes}"
                                                </p>
                                            ) : (
                                                <p className="text-brand-text-muted/50 text-[11px] italic">
                                                    Belum ada laporan pengerjaan.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-brand-border/40 flex flex-col gap-2.5">
                                    <span className="text-[11px] text-brand-text-muted truncate">
                                        Tim: {item.team_members.map(m => m.name).join(', ') || '-'}
                                    </span>
                                    <button
                                        onClick={() => openUpdateModal(item)}
                                        className="w-full bg-brand-primary border border-brand-border hover:bg-brand-muted hover:text-brand-accent text-brand-text py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                    >
                                        <Wrench size={13} /> Update Status & Laporan
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedItem && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                                <Wrench size={18} className="text-brand-accent" />
                                Update Pekerjaan Maintenance
                            </h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-brand-text-muted hover:text-brand-accent transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUpdate} className="p-6 space-y-4">
                            <div>
                                <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Target Proyek</div>
                                <div className="font-semibold text-brand-text">{selectedItem.title}</div>
                                <div className="text-xs text-brand-text-muted mt-0.5">
                                    {selectedItem.order_number} — {selectedItem.customer_name}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                    Status Pengerjaan
                                </label>
                                <select
                                    value={modalForm.status}
                                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60"
                                >
                                    <option value="scheduled">Scheduled (Terjadwal)</option>
                                    <option value="in_progress">In Progress (Sedang Dikerjakan)</option>
                                    <option value="completed">Completed (Selesai)</option>
                                    <option value="cancelled">Cancelled (Dibatalkan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                                    Catatan / Laporan Hasil Pengerjaan (Notes)
                                </label>
                                <textarea
                                    rows={4}
                                    value={modalForm.notes}
                                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                                    placeholder="Contoh: Database telah dibackup, update patch keamanan v1.2 selesai diuji, performa server optimal..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 resize-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    Simpan Laporan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}