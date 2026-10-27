import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout'; // ✅ Tambah import RoleLayout
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Clock, Pencil, Trash2,
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
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading service...
        </div>
      </RoleLayout>
    );
  }

  if (error || !service) {
    return (
      <RoleLayout>
        <Head title="Detail Service" />
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/admin/services" className="text-brand-accent underline">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title={`Detail Service — ${service.name}`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Services
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">{service.name}</h1>
            <p className="text-sm text-brand-text-muted mt-1">ID: {service.id}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2"
            >
              <Pencil size={14} /> Edit Service
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-semibold flex items-center gap-2"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Kategori</div>
            <span className="inline-block text-sm px-3 py-1 rounded bg-brand-muted text-brand-text border border-brand-border">
              {service.service_categories?.name || service.category_name || '—'}
            </span>
          </div>

          <div>
            <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Status</div>
            <StatusBadge status={service.status} />
          </div>
        </div>

        <div className="pt-6 border-t border-brand-border">
          <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-2">Deskripsi</div>
          <p className="text-sm text-brand-text leading-relaxed whitespace-pre-line">
            {service.description || 'Tidak ada deskripsi'}
          </p>
        </div>
      </div>

      {/* MODALS */}
      {editOpen && (
        <ServiceEditModal
          service={service}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOpen && (
        <ConfirmDeleteModal
          service={service}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Service berhasil dihapus');
            router.visit('/admin/services');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ EDIT MODAL ============
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">Edit Service</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
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
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
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
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE MODAL ============
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-red-500/30 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">Hapus Service?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus service <strong className="text-brand-text">{service.name}</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleDelete} disabled={submitting} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
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
    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium border ${
      isAct
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
        : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
      {isAct ? 'Active' : 'Inactive'}
    </span>
  );
}

function formatRupiah(val) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}