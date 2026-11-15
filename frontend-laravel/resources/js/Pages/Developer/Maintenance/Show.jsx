import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronLeft, ClipboardClock, CheckCircle2, AlertCircle,
    Wrench, Clock, Calendar, User, FileText, Save,
    Building2, Mail, Phone, MapPin, Layers,
    ShieldAlert, Users, ArrowRight, Image as ImageIcon, ExternalLink
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

    // 2. Jika tanggal target selesai belum diisi, tapi perbaikan sudah diselesaikan
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

const getStatusBadge = (status) => {
    switch (status) {
        case 'scheduled':
            return {
                label: 'Scheduled',
                className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                icon: <Clock size={14} />
            };
        case 'in_progress':
            return {
                label: 'In Progress',
                className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                icon: <Wrench size={14} />
            };
        case 'completed':
            return {
                label: 'Completed',
                className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                icon: <CheckCircle2 size={14} />
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                className: 'bg-red-500/15 text-red-400 border-red-500/30',
                icon: <AlertCircle size={14} />
            };
        default:
            return {
                label: status,
                className: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
                icon: <Clock size={14} />
            };
    }
};

export default function DeveloperMaintenanceShow({ maintenanceId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        status: 'scheduled',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');

    const loadDetail = (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        fetch(`/api/v1/developer/maintenance/${maintenanceId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.data) {
                    setData(res.data);
                    setForm({
                        status: res.data.developer_progress?.status || (res.data.developer_progress?.progress_percentage === 100 ? 'completed' : 'scheduled'),
                        notes: res.data.developer_progress?.notes || ''
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
        setSaveError('');

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
            loadDetail(true);
        } catch (err) {
            setSaveError(err.message || 'Terjadi kesalahan saat menyimpan laporan.');
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
                        href="/developer/maintenance"
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
            <Head title={`Detail Maintenance — ${data.title}`} />

            {/* TOP BAR / BREADCRUMB */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/developer/maintenance"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-text transition"
                >
                    <ChevronLeft size={16} />
                    Kembali ke Daftar Maintenance
                </Link>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.className}`}>
                    {badge.icon} {badge.label}
                </span>
            </div>

            {/* HEADER JUDUL KENDALA */}
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
                {/* KOLOM KIRI (2 KOLOM): RINCIAN ERROR & FORM UPDATE STATUS */}
                <div className="lg:col-span-2 space-y-6">
                    {/* CARD 1: RINCIAN KENDALA & KOMPLAIN KLIEN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                            <ShieldAlert size={18} className="text-amber-500" />
                            Rincian Kendala & Keluhan Klien
                        </h2>

                        <div className="p-4 bg-brand-primary/60 border border-brand-border/60 rounded-xl mb-4">
                            <span className="text-[11px] font-semibold text-amber-400 block mb-1 uppercase tracking-wider">
                                Laporan Kendala yang Diterima Super Admin:
                            </span>
                            <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                                {data.description}
                            </p>
                        </div>

                        {((data.error_images && data.error_images.length > 0) || data.error_image) && (() => {
                            const images = (data.error_images && data.error_images.length > 0)
                                ? data.error_images
                                : [data.error_image];

                            return (
                                <div className="p-4 bg-brand-primary/60 border border-brand-border/60 rounded-xl mb-4">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-brand-muted/40 border border-brand-border/40 rounded-xl">
                                <span className="text-brand-text-muted block text-[11px]">Bagian yang Diperbaiki:</span>
                                <span className="font-bold text-brand-text text-sm mt-0.5 block">
                                    {data.assigned_developer.job}
                                </span>
                            </div>
                            <div className="p-3 bg-brand-muted/40 border border-brand-border/40 rounded-xl">
                                <span className="text-brand-text-muted block text-[11px]">Penanggung Jawab:</span>
                                <span className="font-bold text-brand-text text-sm mt-0.5 block">
                                    {data.assigned_developer.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: FORM UPDATE PROGRES & STATUS PENYELESAIAN */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                            <Wrench size={18} className="text-brand-accent" />
                            Progres & Laporan Perbaikan Developer
                        </h2>

                        {saveSuccess && (
                            <div className="p-3.5 mb-4 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                                Laporan perbaikan berhasil disimpan ke server!
                            </div>
                        )}

                        {saveError && (
                            <div className="p-3.5 mb-4 bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2 font-medium">
                                <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                                {saveError}
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                                <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <p className="leading-relaxed text-[11px] text-blue-800 dark:text-blue-200/90">
                                    <strong className="text-blue-950 dark:text-blue-100 font-semibold">Perhatian Hak Akses:</strong> Anda hanya menyetorkan laporan progres perbaikan tugas (apakah sudah dikerjakan atau belum). <strong className="text-blue-950 dark:text-blue-100 font-semibold">Status order pusat</strong> tetap berada di bawah wewenang Super Admin.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Status Pengerjaan Perbaikan (Setoran Progres)
                                </label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
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
                                        <p className="font-semibold text-emerald-950 dark:text-emerald-100">Tugas Perbaikan Selesai 100%</p>
                                        <p className="text-[11px] text-emerald-800 dark:text-emerald-200/90 mt-0.5">
                                            Laporan perbaikan Anda akan disetorkan ke Super Admin untuk ditinjau dan disahkan ke sistem pusat.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                    Catatan Teknis Perbaikan (Fix Report)
                                </label>
                                <textarea
                                    rows={5}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Tuliskan langkah-langkah debugging yang dilakukan, file atau baris kode yang diubah, dan hasil pengujian..."
                                    className="w-full bg-brand-primary border border-brand-border rounded-xl p-3 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-brand-accent text-brand-secondary font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-brand-accent/90 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {submitting ? 'Menyimpan...' : 'Simpan Laporan Perbaikan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* KOLOM KANAN: INFORMASI ORDER INDUK & TIM */}
                <div className="space-y-6">
                    {/* INFORMASI ORDER SEBELUMNYA (ORDER INDUK) */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-brand-text text-sm flex items-center gap-2 pb-3 border-b border-brand-border">
                            <Layers size={16} className="text-purple-400" />
                            Informasi Order Sebelumnya (Induk)
                        </h3>

                        {parent ? (
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-brand-text-muted block text-[11px]">Nomor Order Induk:</span>
                                    <span className="font-mono font-bold text-brand-text">{parent.order_number}</span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[11px]">Layanan Awal:</span>
                                    <span className="font-medium text-brand-text">
                                        {parent.services?.length > 0 ? parent.services.join(', ') : '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[11px]">Periode Pengerjaan Induk:</span>
                                    <span className="text-brand-text">{parent.start_date} s/d {parent.end_date}</span>
                                </div>
                                <div>
                                    <span className="text-brand-text-muted block text-[11px]">Status Order Induk:</span>
                                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
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
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-5 shadow-sm space-y-3 text-xs">
                        <h3 className="font-bold text-brand-text text-sm flex items-center gap-2 pb-3 border-b border-brand-border">
                            <Building2 size={16} className="text-blue-400" />
                            Data Klien / Pelapor
                        </h3>

                        <div className="space-y-2">
                            <p className="font-bold text-brand-text text-sm">{cust.name}</p>
                            {cust.email && (
                                <p className="text-brand-text-muted flex items-center gap-1.5 truncate">
                                    <Mail size={12} className="shrink-0 text-brand-accent" />
                                    {cust.email}
                                </p>
                            )}
                            {cust.phone && (
                                <p className="text-brand-text-muted flex items-center gap-1.5">
                                    <Phone size={12} className="shrink-0 text-brand-accent" />
                                    {cust.phone}
                                </p>
                            )}
                            {cust.address && (
                                <p className="text-brand-text-muted flex items-start gap-1.5">
                                    <MapPin size={12} className="shrink-0 mt-0.5 text-brand-accent" />
                                    {cust.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* TIM YANG MENGERJAKAN PROYEK AWAL */}
                    <div className="bg-brand-secondary border border-brand-border rounded-2xl p-5 shadow-sm space-y-3">
                        <h3 className="font-bold text-brand-text text-sm flex items-center gap-2 pb-3 border-b border-brand-border">
                            <Users size={16} className="text-emerald-400" />
                            Anggota Tim Proyek Asal
                        </h3>

                        {data.original_team.length === 0 ? (
                            <p className="text-xs text-brand-text-muted italic">Tidak ada catatan tim asal.</p>
                        ) : (
                            <div className="space-y-2.5">
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

