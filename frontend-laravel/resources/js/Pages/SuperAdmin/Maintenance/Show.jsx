import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft, ClipboardClock, CheckCircle2, AlertCircle,
    Wrench, Clock, Calendar, User, FileText, Save,
    Building2, Mail, Phone, MapPin, Users, ArrowRight,
    ShieldCheck, Check, History
} from 'lucide-react';

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Scheduled',
                className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                icon: <Clock size={13} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                icon: <Wrench size={13} />
            };
        case 'completed':
            return {
                label: 'Completed',
                className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                icon: <CheckCircle2 size={13} />
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-400 border-red-500/30',
                icon: <AlertCircle size={13} />
            };
        default:
            return {
                label: status,
                className: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
                icon: <Clock size={13} />
            };
    }
};

export default function SuperAdminMaintenanceShow({ maintenanceId }) {
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
        fetch(`/api/v1/maintenances/${maintenanceId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.data) {
                    setData(res.data);
                    const currentStatus =
                        res.data.child_order?.status === 'completed'
                            ? 'completed'
                            : (res.data.status === 'completed' && res.data.child_order?.status !== 'completed'
                                ? 'in_progress'
                                : res.data.status || 'in_progress');

                    // Jangan prefill catatan evaluasi Super Admin dengan catatan penugasan awal developer
                    const adminNotes =
                        res.data.notes && !res.data.notes.startsWith('Ditugaskan ke')
                            ? res.data.notes
                            : '';

                    setForm({
                        status: currentStatus,
                        notes: adminNotes
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
            const res = await fetch(`/api/v1/maintenances/${maintenanceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const result = await res.json();

            if (!result.success) {
                throw new Error(result.message || 'Gagal menyimpan update');
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
            loadDetail();
        } catch (err) {
            alert(err.message || 'Terjadi kesalahan saat menyimpan pembaruan.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <RoleLayout>
                <Head title="Detail Maintenance" />
                <div className="p-16 text-center text-brand-text-muted">
                    <ClipboardClock size={32} className="animate-pulse mx-auto mb-3 text-brand-accent" />
                    Memuat rincian tiket maintenance...
                </div>
            </RoleLayout>
        );
    }

    if (error || !data) {
        return (
            <RoleLayout>
                <Head title="Detail Maintenance" />
                <div className="p-8 max-w-xl mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
                    <AlertCircle size={36} className="mx-auto mb-2 text-red-500" />
                    <h3 className="font-bold text-brand-text">Tidak Dapat Memuat Data</h3>
                    <p className="text-xs text-red-400 mt-1">{error || 'Data tidak ditemukan.'}</p>
                    <Link
                        href="/super-admin/maintenance"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-brand-secondary border border-brand-border text-brand-text rounded-xl text-xs font-semibold hover:bg-brand-muted"
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
            <Head title={`Super Admin — Detail Maintenance ${data.title}`} />

            {/* BREADCRUMB */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/super-admin/maintenance"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-text transition"
                >
                    <ChevronLeft size={16} />
                    Kembali ke Daftar Maintenance
                </Link>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>

            {/* HEADER UTAMA */}
            <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text">
                                Order Pemeliharaan: {data.child_order.order_number}
                            </span>
                            {parent && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Lanjutan dari Order Induk: <strong>{parent.order_number}</strong>
                                </span>
                            )}
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                                {data.assigned_developer?.job || 'Maintenance'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-brand-text">
                            {data.title}
                        </h1>
                        <p className="text-xs text-brand-text-muted mt-1">
                            Klien: <strong className="text-brand-text">{cust.name}</strong> • Dilaporkan pada {data.created_at}
                        </p>
                    </div>

                    <div className="bg-brand-primary/60 border border-brand-border/60 p-3.5 rounded-xl text-right shrink-0">
                        <span className="text-[11px] text-brand-text-muted uppercase block font-medium">Jadwal Perbaikan</span>
                        <span className="text-xs font-semibold text-brand-text flex items-center gap-1.5 mt-0.5 md:justify-end">
                            <Calendar size={13} className="text-brand-accent" />
                            {data.start_datetime} s/d {data.end_datetime}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* KOLOM KIRI (2 KOLOM): DETAIL ERROR, CATATAN DEVELOPER, FORM PENGESAHAN SUPER ADMIN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* CARD 1: RINCIAN KENDALA & KOMPLAIN KLIEN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                            <AlertCircle size={18} className="text-amber-500" />
                            Laporan Kendala / Komplain Klien
                        </h2>
                        <div className="bg-brand-primary/40 border border-brand-border/60 rounded-xl p-4 text-sm text-brand-text whitespace-pre-wrap leading-relaxed">
                            {data.description || 'Tidak ada keterangan rincian keluhan.'}
                        </div>
                    </div>

                    {/* CARD 2: STATUS & LAPORAN PROGRES DEVELOPER */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                                <FileText size={18} className="text-blue-400" />
                                Status & Laporan Progres Developer
                            </h2>
                            <span className="text-xs text-brand-text-muted">
                                Developer: <strong className="text-brand-text">{data.assigned_developer?.name || '-'}</strong>
                            </span>
                        </div>

                        {/* Indikator Status Setoran Progres Developer */}
                        {data.developer_progress?.status === 'completed' || data.developer_progress?.progress_percentage === 100 ? (
                            <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/40 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                                                {data.status === 'completed'
                                                    ? 'Pengerjaan & Tiket Selesai (Completed)'
                                                    : 'Setoran Developer: Sudah Dikerjakan (100% Selesai)'}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                                                100% Selesai
                                            </span>
                                        </div>
                                        <p className="text-xs text-emerald-800 dark:text-emerald-200/90 mt-1 leading-relaxed">
                                            {data.status === 'completed' ? (
                                                <span>
                                                    Developer telah menyelesaikan perbaikan kendala dan tiket maintenance ini telah disahkan selesai (Completed) oleh Super Admin.
                                                </span>
                                            ) : (
                                                <span>
                                                    Developer telah menyetorkan bahwa kendala teknis telah selesai diperbaiki. <strong>Status tiket pusat saat ini masih {data.status === 'in_progress' ? 'In Progress' : data.status}.</strong> Silakan verifikasi catatan teknis di bawah, lalu ubah status ke <strong>Completed</strong> pada form kontrol di bawah untuk mengesahkan penyelesaian.
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {data.status !== 'completed' && form.status !== 'completed' && (
                                    <button
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, status: 'completed' }))}
                                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5"
                                    >
                                        <Check size={14} /> Pilih Status Completed
                                    </button>
                                )}
                            </div>
                        ) : data.developer_progress?.status === 'in_progress' || (data.developer_progress?.progress_percentage > 0 && data.developer_progress?.progress_percentage < 100) ? (
                            <div className="p-4 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 dark:border-blue-500/40 mb-4 flex items-start gap-3">
                                <Wrench size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-blue-950 dark:text-blue-100">Setoran Developer: Sedang Dikerjakan</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 dark:bg-blue-500/25 text-blue-800 dark:text-blue-300 font-semibold border border-blue-500/30">
                                            {data.developer_progress?.progress_percentage || 50}% Pengerjaan
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-800 dark:text-blue-200/90 mt-1">
                                        Developer sedang aktif melakukan proses debugging dan perbaikan teknis.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 mb-4 flex items-start gap-3">
                                <Clock size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-amber-950 dark:text-amber-100">Setoran Developer: Belum Dikerjakan</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30">
                                            0% Menunggu
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-1">
                                        Menunggu developer penanggung jawab memulai penanganan kendala atau menyetorkan progres.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Catatan / Laporan Teknis Developer */}
                        <div>
                            <div className="text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Catatan & Rincian Solusi dari Developer:
                            </div>
                            {data.developer_progress?.notes ? (
                                <div className="bg-brand-primary/50 border border-brand-border/60 rounded-xl p-4 text-sm text-brand-text whitespace-pre-wrap leading-relaxed">
                                    {data.developer_progress.notes}
                                </div>
                            ) : (
                                <p className="text-xs text-brand-text-muted italic py-3 bg-brand-primary/20 border border-brand-border/40 rounded-xl px-4">
                                    Developer belum memberikan catatan laporan perbaikan.
                                </p>
                            )}
                            {data.developer_progress?.updated_at && (
                                <span className="text-[11px] text-brand-text-muted block mt-2">
                                    Pembaruan Setoran Developer: {formatDateTime(data.developer_progress.updated_at)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CARD 3: FORM KONTROL STATUS SUPER ADMIN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <div className="pb-3 border-b border-brand-border mb-4">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                Kontrol & Pengesahan Status Pusat (Super Admin)
                            </h2>
                            <p className="text-xs text-brand-text-muted mt-1">
                                Wewenang penuh pengesahan status tiket & order turunan berada di tangan Super Admin. Status tidak berubah menjadi <strong>Completed</strong> secara otomatis sebelum Anda mengesahkannya di sini.
                            </p>
                        </div>

                        {saveSuccess && (
                            <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                                <Check size={16} />
                                Perubahan status order pusat & catatan evaluasi berhasil disimpan!
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Status Tiket & Order Turunan Pusat
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                                >
                                    <option value="scheduled">Scheduled (Terjadwal / Antri)</option>
                                    <option value="in_progress">In Progress (Sedang Dikerjakan Developer)</option>
                                    <option value="completed">Completed (Selesai Diperbaiki & Disahkan)</option>
                                    <option value="cancelled">Cancelled (Dibatalkan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Catatan / Evaluasi Pengesahan Super Admin
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Tuliskan evaluasi pengesahan atau instruksi tambahan untuk penanganan kendala..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-brand-accent text-brand-secondary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-accent/90 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={15} />
                                    {submitting ? 'Menyimpan...' : 'Sahkan Status Order Pusat'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* CARD 4: RIWAYAT STATUS ORDER */}
                    {data.history?.length > 0 && (
                        <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                                <History size={18} className="text-brand-accent" />
                                Riwayat Log Perubahan Status
                            </h2>
                            <div className="space-y-3">
                                {data.history.map((h) => (
                                    <div key={h.id} className="p-3.5 bg-brand-primary/40 border border-brand-border/60 rounded-xl text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-brand-text">
                                                {h.from_status ? `${h.from_status} → ${h.to_status}` : h.to_status}
                                            </span>
                                            <span className="text-brand-text-muted">{h.created_at}</span>
                                        </div>
                                        <p className="text-brand-text-muted leading-relaxed">{h.notes}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN (1 KOLOM): INFO KLIEN, ORDER INDUK, DEVELOPER, TIM AWAL */}
                <div className="space-y-6">
                    {/* INFO DEVELOPER PENANGGUNG JAWAB */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                            <User size={18} className="text-brand-accent" />
                            Developer Penanggung Jawab
                        </h2>
                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-brand-text-muted block">Nama Developer:</span>
                                <span className="font-bold text-sm text-brand-text">{data.assigned_developer?.name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-brand-text-muted block">Posisi / Job:</span>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent font-semibold border border-brand-accent/20">
                                    {data.assigned_developer?.job || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* INFO KLIEN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                            <Building2 size={18} className="text-purple-400" />
                            Informasi Klien
                        </h2>
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-brand-text-muted block">Nama Klien / Perusahaan:</span>
                                <span className="font-bold text-sm text-brand-text">{cust.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-brand-text">
                                <Mail size={13} className="text-brand-text-muted" />
                                <span>{cust.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-brand-text">
                                <Phone size={13} className="text-brand-text-muted" />
                                <span>{cust.phone || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-brand-text">
                                <MapPin size={13} className="text-brand-text-muted shrink-0 mt-0.5" />
                                <span>{cust.address || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* INFO ORDER INDUK */}
                    {parent && (
                        <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                                <ClipboardClock size={18} className="text-blue-400" />
                                Order Induk (Proyek Awal)
                            </h2>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-brand-text-muted block">Nomor Order:</span>
                                    <span className="font-mono font-bold text-brand-text text-sm">{parent.order_number}</span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block">Jadwal Proyek:</span>
                                    <span className="text-brand-text">{parent.start_date} s/d {parent.end_date}</span>
                                </div>
                                {parent.services?.length > 0 && (
                                    <div>
                                        <span className="text-brand-text-muted block mb-1">Layanan yang Dipesan:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {parent.services.map((s, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-brand-primary border border-brand-border rounded text-[11px] text-brand-text">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TIM AWAL PROYEK INDUK */}
                    {data.original_team?.length > 0 && (
                        <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                                <Users size={18} className="text-emerald-400" />
                                Tim Awal Proyek Induk
                            </h2>
                            <div className="space-y-2.5">
                                {data.original_team.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-brand-primary/40 border border-brand-border/50 rounded-xl text-xs">
                                        <div>
                                            <p className="font-semibold text-brand-text">{m.name}</p>
                                            <p className="text-[11px] text-brand-text-muted">{m.email}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-brand-muted text-brand-text text-[10px] font-semibold border border-brand-border">
                                            {m.job}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RoleLayout>
    );
}

