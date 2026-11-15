import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import {
    ChevronLeft, ClipboardClock, CheckCircle2, AlertCircle,
    Wrench, Clock, Calendar, User, FileText, Save,
    Building2, Mail, Phone, MapPin, Users, ArrowRight,
    ShieldCheck, Check, History, Image as ImageIcon, ExternalLink,
    RefreshCw
} from 'lucide-react';

const formatDate = (d) => {
    if (!d || d === '-' || d === '—') return '—';
    try {
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
            const [y, m, day] = d.split('-').map(Number);
            const date = new Date(y, m - 1, day);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return d;
    }
};

const formatScheduleRange = (start, end, status, devProgress, updatedAt) => {
    const isValid = (d) => d && d !== '-' && d !== '—';
    const hasStart = isValid(start);
    const hasEnd = isValid(end);

    const parseDateObj = (d) => {
        if (!d || d === '-' || d === '—') return null;
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
            const [y, m, day] = d.split('-').map(Number);
            return new Date(y, m - 1, day);
        }
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
    };

    const formatShort = (dateObj) => {
        if (!dateObj) return '';
        return dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    // 1. Jika tanggal target selesai sudah ditentukan secara eksplisit
    if (hasStart && hasEnd) {
        const sDate = parseDateObj(start);
        const eDate = parseDateObj(end);
        if (sDate && eDate && sDate.getFullYear() === eDate.getFullYear()) {
            return `${formatShort(sDate)} – ${formatDate(end)}`;
        }
        return `${formatDate(start)} – ${formatDate(end)}`;
    }

    // 2. Jika tanggal target selesai belum diisi, tapi tiket / perbaikan sudah diselesaikan
    const isCompleted =
        status === 'completed' ||
        devProgress?.status === 'completed' ||
        devProgress?.progress_percentage === 100;
    const finishDate = isValid(updatedAt)
        ? updatedAt
        : isValid(devProgress?.updated_at)
        ? devProgress.updated_at
        : null;

    if (hasStart && isCompleted && finishDate) {
        const sDate = parseDateObj(start);
        const fDate = parseDateObj(finishDate);
        if (sDate && fDate && sDate.getFullYear() === fDate.getFullYear()) {
            return `${formatShort(sDate)} – ${formatDate(finishDate)}`;
        }
        return `${formatDate(start)} – ${formatDate(finishDate)}`;
    }

    // 3. Jika belum ada tanggal akhir dan masih berjalan: tampilkan – Selesai
    if (hasStart) {
        return `${formatDate(start)} – Selesai`;
    }

    if (hasEnd) {
        return `s/d ${formatDate(end)}`;
    }

    return 'Belum Ditentukan';
};

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
        notes: '',
        start_datetime: '',
        end_datetime: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const loadDetail = (silent = false) => {
        if (!silent) setLoading(true);
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

                    // Ambil catatan evaluasi bersih (abaikan jika berupa JSON gambar error atau catatan penugasan otomatis)
                    const extractCleanNotes = (rawNotes) => {
                        if (!rawNotes) return '';
                        const trimmed = String(rawNotes).trim();
                        if (trimmed.startsWith('Ditugaskan ke')) return '';
                        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                return parsed.admin_notes || parsed.evaluation_note || parsed.notes || '';
                            } catch {
                                return '';
                            }
                        }
                        return trimmed;
                    };

                    const adminNotes = extractCleanNotes(res.data.notes);

                    setForm({
                        status: currentStatus,
                        notes: adminNotes,
                        start_datetime: res.data.start_datetime && res.data.start_datetime !== '-' ? res.data.start_datetime : '',
                        end_datetime: res.data.end_datetime && res.data.end_datetime !== '-' ? res.data.end_datetime : '',
                    });
                } else {
                    if (!silent) setError(res.message || 'Gagal memuat detail maintenance');
                }
                if (!silent) setLoading(false);
            })
            .catch((err) => {
                if (!silent) setError(err.message || 'Terjadi kesalahan jaringan');
                if (!silent) setLoading(false);
            });
    };

    useEffect(() => {
        if (maintenanceId) loadDetail(false);
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

            // Update state secara mulus tanpa unmount halaman
            setData((prev) => ({
                ...prev,
                status: form.status,
                notes: form.notes,
                start_datetime: form.start_datetime || prev?.start_datetime,
                end_datetime: form.end_datetime || prev?.end_datetime,
                child_order: { ...(prev?.child_order || {}), status: form.status }
            }));

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
            showToast('success', 'Status & evaluasi tiket maintenance berhasil disimpan!');
            loadDetail(true);
        } catch (err) {
            showToast('error', err.message || 'Terjadi kesalahan saat menyimpan pembaruan.');
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

            {/* TOAST NOTIFIKASI */}
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* BREADCRUMB */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => {
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = '/super-admin/maintenance';
                        }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-text transition"
                >
                    <ChevronLeft size={16} />
                    Kembali
                </button>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>

            {/* PEMBERITAHUAN TIKET SIAP DISELESAIKAN (SETORAN DEVELOPER 100%) */}
            {data.status !== 'completed' &&
                data.status !== 'cancelled' &&
                (data.developer_progress?.progress_percentage === 100 || data.developer_progress?.status === 'completed') && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-brand-text">
                            Pemberitahuan: Perbaikan telah selesai 100% oleh developer. Silakan tinjau laporan dan sahkan status order pada form di bawah.
                        </span>
                    </div>
                )}

            {/* HEADER UTAMA */}
            <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2.5">
                        {/* BADGES METADATA */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-primary border border-brand-border text-brand-text shadow-xs">
                                {data.child_order.order_number}
                            </span>
                            {parent && (
                                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/25 flex items-center gap-1">
                                    Induk: <strong className="font-mono text-purple-300">{parent.order_number}</strong>
                                </span>
                            )}
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/25">
                                {data.assigned_developer?.job || 'Maintenance'}
                            </span>
                        </div>

                        {/* JUDUL TIKET */}
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight">
                            {data.title}
                        </h1>

                        {/* SUB-INFO: KLIEN & TANGGAL LAPOR */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-text-muted">
                            <span className="flex items-center gap-1.5">
                                <Building2 size={13} className="text-brand-text-muted/80" />
                                Klien: <strong className="text-brand-text font-semibold">{cust.name}</strong>
                            </span>
                            <span className="inline-block w-1 h-1 rounded-full bg-brand-border" />
                            <span className="flex items-center gap-1.5">
                                <Clock size={13} className="text-brand-text-muted/80" />
                                Dilaporkan {formatDate(data.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* JADWAL PERBAIKAN WIDGET */}
                    <div className="flex items-center gap-3.5 bg-brand-primary/60 border border-brand-border px-4 py-3 rounded-xl shrink-0 shadow-xs self-start lg:self-center">
                        <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted block leading-none mb-1">
                                Jadwal Perbaikan
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-brand-text block">
                                {formatScheduleRange(data.start_datetime, data.end_datetime, data.status, data.developer_progress, data.updated_at)}
                            </span>
                        </div>
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

                        {((data.error_images && data.error_images.length > 0) || data.error_image) && (() => {
                            const images = (data.error_images && data.error_images.length > 0)
                                ? data.error_images
                                : [data.error_image];

                            return (
                                <div className="mt-4 p-4 bg-brand-primary/40 border border-brand-border/60 rounded-xl">
                                    <div className="mb-3">
                                        <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-wider flex items-center gap-1.5">
                                            <ImageIcon size={14} /> Foto / Tangkapan Layar Kendala Error ({images.length} Foto)
                                        </span>
                                    </div>

                                    {images.length === 1 ? (
                                        <div className="space-y-2">
                                            <div className="rounded-xl overflow-hidden border border-brand-border bg-black/40 flex items-center justify-center max-h-96 group relative">
                                                <img
                                                    src={images[0]}
                                                    alt="Tangkapan Layar Kendala Error"
                                                    className="w-full max-h-96 object-contain rounded-xl transition duration-200 group-hover:scale-[1.01]"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="text-right">
                                                <a
                                                    href={images[0]}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-brand-accent hover:underline font-medium"
                                                >
                                                    <ExternalLink size={12} /> Buka Ukuran Asli di Tab Baru
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {images.map((imgUrl, idx) => (
                                                <a
                                                    key={idx}
                                                    href={imgUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group relative rounded-xl overflow-hidden border border-brand-border bg-black/40 hover:border-brand-accent transition block"
                                                >
                                                    <div className="h-48 w-full flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={imgUrl}
                                                            alt={`Bukti Error ${idx + 1}`}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-[11px] text-white">
                                                        <span>Foto #{idx + 1}</span>
                                                        <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition text-brand-accent font-medium">
                                                            <ExternalLink size={12} /> Buka
                                                        </span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* CARD 2: STATUS & LAPORAN PROGRES DEVELOPER */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <div className="pb-3 border-b border-brand-border mb-4">
                            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
                                <FileText size={18} className="text-blue-400" />
                                Laporan Progres Developer
                            </h2>
                        </div>

                        {/* Indikator Status Progres */}
                        {data.developer_progress?.status === 'completed' || data.developer_progress?.progress_percentage === 100 ? (
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                                    <span className="font-semibold text-sm text-brand-text">
                                        Perbaikan Selesai (100%)
                                    </span>
                                </div>
                                {data.developer_progress?.updated_at && (
                                    <span className="text-[11px] text-brand-text-muted">
                                        Diperbarui {formatDateTime(data.developer_progress.updated_at)}
                                    </span>
                                )}
                            </div>
                        ) : (data.developer_progress?.progress_percentage > 0 && data.developer_progress?.progress_percentage < 100) ? (
                            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 mb-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <Wrench size={18} className="text-blue-400 shrink-0" />
                                    <span className="font-semibold text-sm text-brand-text">
                                        Sedang Dikerjakan ({data.developer_progress?.progress_percentage}%)
                                    </span>
                                </div>
                                {data.developer_progress?.updated_at && (
                                    <span className="text-[11px] text-brand-text-muted">
                                        Diperbarui {formatDateTime(data.developer_progress.updated_at)}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-4 flex items-center gap-2.5">
                                <Clock size={18} className="text-amber-400 shrink-0" />
                                <span className="font-semibold text-sm text-brand-text">
                                    Belum Dikerjakan (Menunggu antrian pengerjaan)
                                </span>
                            </div>
                        )}

                        {/* Catatan Teknis Developer */}
                        <div>
                            <div className="text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Catatan Teknis Perbaikan:
                            </div>
                            {data.developer_progress?.notes ? (
                                <div className="bg-brand-primary/50 border border-brand-border/60 rounded-xl p-4 text-sm text-brand-text whitespace-pre-wrap leading-relaxed">
                                    {data.developer_progress.notes}
                                </div>
                            ) : (
                                <p className="text-xs text-brand-text-muted italic py-3 bg-brand-primary/20 border border-brand-border/40 rounded-xl px-4">
                                    Belum ada catatan laporan perbaikan dari developer.
                                </p>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    {submitting ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>Sahkan Status Order Pusat</span>
                                        </>
                                    )}
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

