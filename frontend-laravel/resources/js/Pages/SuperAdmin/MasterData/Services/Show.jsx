import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Pencil, Trash2,
  AlertCircle, CheckCircle2, Save
} from 'lucide-react';

export default function ServiceShow({ serviceId }) {
  const [service, setService] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`/api/v1/services/${serviceId}`).then((r) => r.json()),
      fetch('/api/v1/services/categories/options').then((r) => r.json()),
    ])
      .then(([s, c]) => {
        if (s.success) setService(s.data);
        else setError(s.message || 'Gagal mengambil data service');
        
        if (c.success) setCategories(c.data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [serviceId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Service" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading service...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !service) {
    return (
      <RoleLayout>
        <Head title="Detail Service" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/super-admin/master-data?tab=services" className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title={`Detail Service — ${service.name}`} />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/super-admin/master-data?tab=services"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Services
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text truncate">{service.name}</h1>
            <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 truncate">ID: {service.id}</p>
          </div>

          {/* Action Buttons (Full Width Grid di Mobile, Flex Auto di Desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={load}
              className="justify-center bg-brand-secondary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> <span>Refresh</span>
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="justify-center bg-brand-accent text-brand-primary px-3.5 py-2.5 rounded-xl hover:bg-brand-accent2 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Pencil size={14} /> <span>Edit</span>
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="justify-center bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-3.5 py-2.5 rounded-xl hover:bg-red-500/20 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Trash2 size={14} /> <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Service Details Card */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Kategori</div>
            <div>
              <span className="inline-block text-xs sm:text-sm px-3 py-1 rounded-lg bg-brand-muted text-brand-text border border-brand-border/60">
                {service.service_categories?.name || service.category_name || '—'}
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Status</div>
            <div>
              <StatusBadge status={service.status} />
            </div>
          </div>
        </div>

        <div className="pt-4 sm:pt-6 border-t border-brand-border">
          <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">Deskripsi</div>
          <div className="bg-brand-primary/40 rounded-xl p-3.5 sm:p-4 border border-brand-border/40">
            <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line break-words">
              {service.description || 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <ServiceEditModal
          service={service}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {/* DELETE MODAL */}
      {deleteOpen && (
        <ConfirmDeleteModal
          service={service}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Service berhasil dihapus');
            router.visit('/super-admin/master-data?tab=services');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ EDIT MODAL (RESPONSIF) ============
function ServiceEditModal({ service, categories, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    category_id: service?.category_id || '',
    name: service?.name || '',
    description: service?.description || '',
    default_price: service?.default_price || service?.price || '0',
    duration: service?.duration || 0,
    status: service?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      ...form,
      default_price: form.default_price === '' ? 0 : Number(form.default_price),
      duration: form.duration === '' ? 0 : Number(form.duration),
      category_id: form.category_id ? Number(form.category_id) : null,
    };

    try {
      const res = await fetch(`/api/v1/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan service');
      } else {
        onSuccess('Service berhasil diupdate');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-brand-text">Edit Service</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
            >
              <option value="">Pilih Kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Service <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>

        {/* Footer Modal Fixed */}
        <div className="px-5 py-4 border-t border-brand-border flex justify-end gap-2 shrink-0 bg-brand-secondary">
          <button type="button" onClick={onClose} className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE MODAL (RESPONSIF) ============
function ConfirmDeleteModal({ service, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/services/${service.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus service');
        setSubmitting(false);
      } else {
        onSuccess();
      }
    } catch {
      onError('Gagal menghubungi server');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-md p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-brand-text">Hapus Service?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-brand-text mb-6">
          Yakin ingin menghapus service <strong className="text-brand-text font-semibold">{service.name}</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleDelete} disabled={submitting} className="flex-1 sm:flex-initial justify-center bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isAct = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border ${
      isAct
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
        : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
      {isAct ? 'Active' : 'Inactive'}
    </span>
  );
}