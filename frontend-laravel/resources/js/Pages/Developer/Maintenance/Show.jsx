import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft, ClipboardClock, CheckCircle2, AlertCircle,
    Wrench, Clock, Calendar, User, FileText, Save,
    Building2, Mail, Phone, MapPin, Layers,
    ShieldAlert, Users, ArrowRight
} from 'lucide-react';

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Scheduled',
                className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                icon: <Clock size={14} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                icon: <Wrench size={14} />
            };
        case 'completed':
            return {
                label: 'Completed',
                className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                icon: <CheckCircle2 size={14} />
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
                icon: <AlertCircle size={14} />
            };
        default:
            return {
                label: status,
                className: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
                icon: <Clock size={14} />
            };
    }
};

export default function DeveloperMaintenanceShow({ maintenanceId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        status: 'in_progress',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadDetail = () => {
        setLoading(true);
        setError('');
        fetch(`/api/v1/developer/maintenance/${maintenanceId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.data) {
                    setData(res.data);
                    setForm({
                        status: res.data.developer_progress?.status || (res.data.developer_progress?.progress_percentage === 100 ? 'completed' : 'in_progress'),
                        notes: res.data.developer_progress?.notes || ''
                    });
                } else {
                    setError(res.message || 'Gagal memuat detail maintenance');
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Terjadi kesalahan jaringan');
                setLoading(false);
            });
    };

    useEffect(() => {
        if (maintenanceId) loadDetail();
    }, [maintenanceId]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSaveSuccess(false);

        try {
            const res = await fetch(`/api/v1/developer/maintenance/${maintenanceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const result = await res.json();

            if (!result.success) throw new Error(result.message || 'Gagal menyimpan update');

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
            loadDetail();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan saat menyimpan laporan.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <RoleLayout>
                <Head title="Detail Maintenance" />
                <div className="p-8 sm:p-16 text-center text-brand-text-muted">
                    <ClipboardClock size={32} className="animate-pulse mx-auto mb-3 text-brand-accent" />
                    <p className="text-xs sm:text-sm">Memuat rincian tiket maintenance...</p>
                </div>
            </RoleLayout>
        );
    }

    if (error || !data) {
        return (
            <RoleLayout>
                <Head title="Detail Maintenance" />
                <div className="p-6 sm:p-8 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                    <AlertCircle size={36} className="mx-auto mb-2 text-red-500" />
                    <h3 className="font-bold text-brand-text text-base sm:text-lg">Tidak Dapat Memuat Data</h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error || 'Data tidak ditemukan.'}</p>
                    <Link
                        href="/developer/maintenance"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-brand-secondary border border-brand-border text-brand-text rounded-xl text-xs font-semibold hover:bg-brand-muted transition shadow-sm"
                    >
                        <ChevronLeft size={14} /> Kembali ke Maintenance
                    </Link>
                </div>
            </RoleLayout>
        );
    }

    const badge = getStatusBadge(data.status);
    const parent = data.parent_order;
    const cust = data.customer;

    return (
        <RoleLayout>
            <Head title={`Detail Maintenance — ${data.title}`} />

            {/* TOP BAR / BREADCRUMB */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <Link
                    href="/developer/maintenance"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-text transition"
                >
                    <ChevronLeft size={16} />
                    <span>Kembali ke Daftar Maintenance</span>
                </Link>
                <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 ${badge.className}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>

            {/* HEADER JUDUL KENDALA */}
            <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                            <span className="font-mono text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text">
                                Order Pemeliharaan: {data.child_order.order_number}
                            </span>
                            {parent && (
                                <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                    Lanjutan Induk: <strong className="font-mono">{parent.order_number}</strong>
                                </span>
                            )}
                        </div>
                        <h1 className="text-lg sm:text-2xl font-bold text-brand-text">
                            {data.title}
                        </h1>
                        <p className="text-xs text-brand-text-muted mt-1">
                            Klien: <strong className="text-brand-text">{cust.name}</strong> &bull; Dilaporkan pada {data.created_at}
                        </p>
                    </div>

                    <div className="bg-brand-primary/60 border border-brand-border/60 p-3.5 rounded-xl text-left md:text-right shrink-0">
                        <span className="text-[10px] sm:text-[11px] text-brand-text-muted uppercase block font-medium">Jadwal Perbaikan</span>
                        <span className="text-xs font-semibold text-brand-text flex items-center gap-1.5 mt-0.5 md:justify-end">
                            <Calendar size={13} className="text-brand-accent shrink-0" />
                            <span>{data.start_datetime} s/d {data.end_datetime}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* KOLOM KIRI (2 KOLOM): RINCIAN ERROR & FORM UPDATE STATUS */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* CARD 1: RINCIAN KENDALA & KOMPLAIN KLIEN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                        <h2 className="text-sm sm:text-base font-bold text-brand-text flex items-center gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-brand-border">
                            <ShieldAlert size={18} className="text-amber-500 shrink-0" />
                            <span>Rincian Kendala & Keluhan Klien</span>
                        </h2>

                        <div className="p-3.5 sm:p-4 bg-brand-primary/60 border border-brand-border/60 rounded-xl mb-4">
                            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1 uppercase tracking-wider">
                                Laporan Kendala yang Diterima Super Admin:
                            </span>
                            <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                                {data.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                            <div className="p-3 bg-brand-muted/40 border border-brand-border/40 rounded-xl">
                                <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Bagian yang Diperbaiki:</span>
                                <span className="font-bold text-brand-text text-xs sm:text-sm mt-0.5 block">
                                    {data.assigned_developer.job}
                                </span>
                            </div>
                            <div className="p-3 bg-brand-muted/40 border border-brand-border/40 rounded-xl">
                                <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Penanggung Jawab:</span>
                                <span className="font-bold text-brand-text text-xs sm:text-sm mt-0.5 block">
                                    {data.assigned_developer.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: FORM UPDATE PROGRES & STATUS PENYELESAIAN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                        <h2 className="text-sm sm:text-base font-bold text-brand-text flex items-center gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-brand-border">
                            <Wrench size={18} className="text-brand-accent shrink-0" />
                            <span>Progres & Laporan Perbaikan Developer</span>
                        </h2>

                        {saveSuccess && (
                            <div className="p-3.5 mb-4 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Laporan perbaikan berhasil disimpan ke server!</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="p-3.5 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <p className="leading-relaxed text-[11px] sm:text-xs text-blue-800 dark:text-blue-200/90">
                                    <strong className="text-blue-950 dark:text-blue-100 font-semibold">Perhatian Hak Akses:</strong> Anda hanya menyetorkan laporan progres perbaikan tugas (apakah sudah dikerjakan atau belum). <strong className="text-blue-950 dark:text-blue-100 font-semibold">Status order pusat</strong> tetap berada di bawah wewenang Super Admin.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                                    Status Pengerjaan Perbaikan (Setoran Progres)
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition shadow-sm"
                                >
                                    <option value="scheduled">Belum Dikerjakan (Terjadwal / Menunggu)</option>
                                    <option value="in_progress">Sedang Dikerjakan (Proses Perbaikan)</option>
                                    <option value="completed">Sudah Dikerjakan (Perbaikan Selesai 100%)</option>
                                </select>
                            </div>

                            {form.status === 'completed' && (
                                <div className="p-3.5 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm">Tugas Perbaikan Selesai 100%</p>
                                        <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-200/90 mt-0.5">
                                            Laporan perbaikan Anda akan disetorkan ke Super Admin untuk ditinjau dan disahkan ke sistem pusat.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                                    Catatan Teknis Perbaikan (Fix Report)
                                </label>
                                <textarea
                                    rows={5}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Tuliskan langkah-langkah debugging yang dilakukan, file atau baris kode yang diubah, dan hasil pengujian..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none transition shadow-sm"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto bg-brand-accent text-brand-primary font-semibold px-6 py-2.5 rounded-xl text-xs sm:text-sm hover:bg-brand-accent2 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    <span>{submitting ? 'Menyimpan...' : 'Simpan Laporan Perbaikan'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* KOLOM KANAN: INFORMASI ORDER INDUK & TIM */}
                <div className="space-y-4 sm:space-y-6">
                    {/* INFORMASI ORDER SEBELUMNYA (ORDER INDUK) */}
                    <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
                        <h3 className="font-bold text-brand-text text-xs sm:text-sm flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-brand-border">
                            <Layers size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                            <span>Informasi Order Sebelumnya (Induk)</span>
                        </h3>

                        {parent ? (
                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Nomor Order Induk:</span>
                                    <span className="font-mono font-bold text-brand-text text-xs sm:text-sm">{parent.order_number}</span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Layanan Awal:</span>
                                    <span className="font-medium text-brand-text">
                                        {parent.services?.length > 0 ? parent.services.join(', ') : '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Periode Pengerjaan Induk:</span>
                                    <span className="text-brand-text">{parent.start_date} s/d {parent.end_date}</span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold mb-0.5">Status Order Induk:</span>
                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                                        {parent.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-brand-text-muted italic">
                                Tiket maintenance ini berdiri mandiri (tanpa order induk).
                            </p>
                        )}
                    </div>

                    {/* KONTAK KLIEN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 text-xs">
                        <h3 className="font-bold text-brand-text text-xs sm:text-sm flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-brand-border">
                            <Building2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>Data Klien / Pelapor</span>
                        </h3>

                        <div className="space-y-2">
                            <p className="font-bold text-brand-text text-xs sm:text-sm">{cust.name}</p>
                            {cust.email && (
                                <p className="text-brand-text-muted flex items-center gap-1.5 truncate">
                                    <Mail size={13} className="shrink-0 text-brand-accent" />
                                    <span className="truncate">{cust.email}</span>
                                </p>
                            )}
                            {cust.phone && (
                                <p className="text-brand-text-muted flex items-center gap-1.5">
                                    <Phone size={13} className="shrink-0 text-brand-accent" />
                                    <span>{cust.phone}</span>
                                </p>
                            )}
                            {cust.address && (
                                <p className="text-brand-text-muted flex items-start gap-1.5">
                                    <MapPin size={13} className="shrink-0 mt-0.5 text-brand-accent" />
                                    <span>{cust.address}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* TIM YANG MENGERJAKAN PROYEK AWAL */}
                    <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                        <h3 className="font-bold text-brand-text text-xs sm:text-sm flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-brand-border">
                            <Users size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Anggota Tim Proyek Asal</span>
                        </h3>

                        {data.original_team.length === 0 ? (
                            <p className="text-xs text-brand-text-muted italic">Tidak ada catatan tim asal.</p>
                        ) : (
                            <div className="space-y-2">
                                {data.original_team.map((m, idx) => (
                                    <div key={idx} className="p-2.5 rounded-xl bg-brand-primary/40 border border-brand-border/40 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-semibold text-brand-text">{m.name}</p>
                                            <p className="text-[11px] text-brand-text-muted">{m.job}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}