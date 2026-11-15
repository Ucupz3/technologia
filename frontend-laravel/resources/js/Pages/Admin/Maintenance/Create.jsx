import { useEffect, useState, useRef } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    CheckCircle2,
    AlertCircle,
    Briefcase,
    Users,
    FileText,
    Calendar,
    UploadCloud,
    Image as ImageIcon,
    X,
    Wrench,
    Check,
    Plus
} from 'lucide-react';

export default function AdminMaintenanceCreate() {
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const today = new Date();
    const defaultTarget = new Date();
    defaultTarget.setDate(today.getDate() + 3);

    const [form, setForm] = useState({
        parent_order_id: '',
        job_id: '',
        developer_user_id: '',
        title: '',
        description: '',
        start_datetime: today.toISOString().split('T')[0],
        end_datetime: defaultTarget.toISOString().split('T')[0],
        status: 'in_progress',
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const fileInputRef = useRef(null);

    // Fetch completed orders
    useEffect(() => {
        setLoadingOrders(true);
        fetch('/api/v1/maintenances/completed-orders', { cache: 'no-store' })
            .then((r) => r.json())
            .then((res) => {
                if (res.success && Array.isArray(res.data)) {
                    setCompletedOrders(res.data);
                }
                setLoadingOrders(false);
            })
            .catch(() => setLoadingOrders(false));
    }, []);

    const selectedParentOrder = completedOrders.find(
        (o) => String(o.id) === String(form.parent_order_id)
    );
    const availableJobs = selectedParentOrder?.assigned_members || [];

    const handleParentOrderChange = (orderId) => {
        const order = completedOrders.find((o) => String(o.id) === String(orderId));
        const firstMember = order?.assigned_members?.[0];
        setForm((prev) => ({
            ...prev,
            parent_order_id: orderId,
            job_id: firstMember?.job_id ? String(firstMember.job_id) : '',
            developer_user_id: firstMember?.user_id ? String(firstMember.user_id) : '',
        }));
    };

    const handleJobChange = (jobId) => {
        const matchingMember = availableJobs.find((m) => String(m.job_id) === String(jobId));
        setForm((prev) => ({
            ...prev,
            job_id: jobId,
            developer_user_id: matchingMember?.user_id ? String(matchingMember.user_id) : prev.developer_user_id,
        }));
    };

    const handleImagesSelect = (files) => {
        if (!files || files.length === 0) return;
        const newFiles = [];
        const newPreviews = [];

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} bukan format gambar valid.`);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert(`Ukuran file ${file.name} melebihi 10MB.`);
                return;
            }
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        if (newFiles.length > 0) {
            setImageFiles((prev) => [...prev, ...newFiles]);
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClearAllImages = () => {
        setImageFiles([]);
        setImagePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!form.parent_order_id) {
            setErrorMsg('Silakan pilih order induk yang berstatus selesai.');
            return;
        }
        if (!form.job_id || !form.developer_user_id) {
            setErrorMsg('Silakan pilih posisi dan developer penanggung jawab.');
            return;
        }
        if (!form.title.trim()) {
            setErrorMsg('Judul kendala wajib diisi.');
            return;
        }
        if (!form.description.trim()) {
            setErrorMsg('Rincian keluhan kendala klien wajib diisi.');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('parent_order_id', form.parent_order_id);
            formData.append('job_id', form.job_id);
            formData.append('developer_user_id', form.developer_user_id);
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('status', form.status);
            if (form.start_datetime) formData.append('start_datetime', form.start_datetime);
            if (form.end_datetime) formData.append('end_datetime', form.end_datetime);
            if (imageFiles.length > 0) {
                imageFiles.forEach((file) => {
                    formData.append('error_images', file);
                });
            }

            const res = await fetch('/api/v1/maintenances', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || 'Gagal membuat tiket maintenance');
            }

            router.visit('/admin/maintenance');
        } catch (err) {
            setErrorMsg(err.message || 'Terjadi kesalahan saat membuat tiket maintenance.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RoleLayout>
            <Head title="Admin — Buat Order Maintenance Baru" />

            {/* HEADER & NAVIGASI KEMBALI */}
            <div className="mb-6">
                <Link
                    href="/admin/maintenance"
                    className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-text transition mb-3 font-medium"
                >
                    <ArrowLeft size={16} /> Kembali ke Daftar Maintenance
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text">Buat Order Maintenance Baru</h1>
                        <p className="text-sm text-brand-text-muted mt-1">
                            Daftarkan tiket komplain / perbaikan kendala klien untuk order selesai dan tugaskan developer.
                        </p>
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold block">Gagal Menyimpan:</span>
                        <span>{errorMsg}</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 w-full">
                {/* CARD 1: PILIH ORDER INDUK */}
                <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                        <Briefcase size={18} className="text-brand-accent" />
                        1. Pilih Order Induk (Proyek Selesai)
                    </h2>

                    <div>
                        <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                            Order Induk <span className="text-red-400">*</span>
                        </label>
                        <select
                            required
                            value={form.parent_order_id}
                            onChange={(e) => handleParentOrderChange(e.target.value)}
                            disabled={loadingOrders}
                            className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
                        >
                            <option value="">
                                {loadingOrders ? '-- Memuat Daftar Order Selesai... --' : '-- Pilih Order yang Telah Selesai --'}
                            </option>
                            {completedOrders.map((ord) => (
                                <option key={ord.id} value={ord.id}>
                                    {ord.order_number} — {ord.customer_name} ({ord.services.join(', ')})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DETAIL SNAPSHOT ORDER INDUK */}
                    {selectedParentOrder && (
                        <div className="mt-4 p-4 bg-brand-primary/60 border border-brand-border/60 rounded-xl space-y-2.5 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-brand-border/40">
                                <span className="text-brand-text-muted">Customer / Klien:</span>
                                <span className="font-semibold text-brand-text">{selectedParentOrder.customer_name}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-brand-border/40">
                                <span className="text-brand-text-muted">Tim Asli Proyek:</span>
                                <span className="font-semibold text-brand-text">{selectedParentOrder.team_name}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-brand-border/40">
                                <span className="text-brand-text-muted">Layanan Terkait:</span>
                                <span className="text-brand-text font-medium">{selectedParentOrder.services.join(', ')}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-brand-text-muted">Periode Proyek:</span>
                                <span className="text-brand-text">
                                    {selectedParentOrder.start_date_project || '-'} s/d {selectedParentOrder.end_date_project || '-'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* CARD 2: PENUGASAN DEVELOPER & POSISI KENDALA */}
                <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                        <Users size={18} className="text-blue-400" />
                        2. Penugasan Developer & Bagian yang Error
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Posisi / Role yang Error <span className="text-red-400">*</span>
                            </label>
                            <select
                                required
                                value={form.job_id}
                                onChange={(e) => handleJobChange(e.target.value)}
                                disabled={!selectedParentOrder}
                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
                            >
                                <option value="">-- Pilih Posisi yang Error --</option>
                                {availableJobs.map((m) => (
                                    <option key={`${m.job_id}-${m.user_id}`} value={m.job_id}>
                                        {m.job_name} ({m.user_name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Developer Penanggung Jawab <span className="text-red-400">*</span>
                            </label>
                            <select
                                required
                                value={form.developer_user_id}
                                onChange={(e) => setForm({ ...form, developer_user_id: e.target.value })}
                                disabled={!selectedParentOrder}
                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 disabled:opacity-50"
                            >
                                <option value="">-- Pilih Developer --</option>
                                {availableJobs.map((m) => (
                                    <option key={m.user_id} value={m.user_id}>
                                        {m.user_name} — {m.job_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CARD 3: RINCIAN KENDALA & UPLOAD BUKTI ERROR */}
                <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                        <FileText size={18} className="text-amber-400" />
                        3. Rincian Kendala & Bukti Error Klien
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Judul Kendala / Laporan Error <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Perbaikan Bug Error 500 API Checkout / Tampilan Rusak di iOS"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">
                                Rincian Kendala & Keluhan Klien <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Jelaskan detail komplain dari klien, langkah-langkah untuk mereproduksi error, atau hasil yang diharapkan..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full bg-brand-primary border border-brand-border rounded-xl p-3.5 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 resize-none leading-relaxed"
                            />
                        </div>

                        {/* UPLOAD FOTO / SCREENSHOT ERROR */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-brand-text-muted uppercase">
                                    Foto / Bukti Tangkapan Layar (Screenshot) Error
                                </label>
                                {imageFiles.length > 0 && (
                                    <span className="text-xs text-brand-accent font-medium">
                                        {imageFiles.length} foto dipilih
                                    </span>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={(e) => handleImagesSelect(e.target.files)}
                            />

                            {/* Dropzone Upload */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleImagesSelect(e.dataTransfer.files);
                                }}
                                className="border-2 border-dashed border-brand-border hover:border-brand-accent/60 bg-brand-primary/40 hover:bg-brand-primary/70 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group mb-3"
                            >
                                <div className="w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center group-hover:scale-110 transition">
                                    <UploadCloud size={24} />
                                </div>
                                <div className="text-sm font-semibold text-brand-text">
                                    Klik untuk upload atau drag & drop foto error
                                </div>
                            </div>

                            {/* Daftar Preview Foto yang Terpilih */}
                            {imageFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                                            Daftar Foto Terlampir ({imageFiles.length})
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {imageFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className="relative group bg-brand-primary border border-brand-border rounded-xl overflow-hidden shadow-sm flex flex-col"
                                            >
                                                <div className="h-32 w-full bg-black/40 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={imagePreviews[idx]}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                                    />
                                                </div>
                                                <div className="p-2 flex items-center justify-between gap-1 text-[11px] bg-brand-primary/80">
                                                    <span className="truncate text-brand-text font-medium" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <span className="text-brand-text-muted shrink-0">
                                                        {(file.size / 1024).toFixed(0)} KB
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(idx);
                                                    }}
                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition shadow"
                                                    title="Hapus Foto Ini"
                                                >
                                                    <X size={13} />
                                                </button>
                                                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CARD 4: JADWAL PERBAIKAN */}
                <div className="bg-brand-secondary border border-brand-border rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-brand-text flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
                        <Calendar size={18} className="text-emerald-400" />
                        4. Jadwal & Batas Waktu Perbaikan
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* ACTION BUTTONS (BOTTOM) */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/admin/maintenance"
                        className="px-5 py-2.5 text-sm font-semibold text-brand-text-muted hover:text-brand-text rounded-xl transition"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-brand-accent text-brand-secondary px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-accent/90 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <Save size={16} />
                        {submitting ? 'Menyimpan & Menerbitkan...' : 'Simpan & Terbitkan Order Perbaikan'}
                    </button>
                </div>
            </form>
        </RoleLayout>
    );
}

