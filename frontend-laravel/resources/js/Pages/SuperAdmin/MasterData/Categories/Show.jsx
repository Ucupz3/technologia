import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Tag, Pencil, Trash2,
  AlertCircle, CheckCircle2, Save
} from 'lucide-react';

export default function CategoryShow({ categoryId }) {
  const [category, setCategory] = useState(null);
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
    fetch(`/api/v1/service-categories/${categoryId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategory(d.data);
        else setError(d.message || 'Gagal mengambil data kategori');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Kategori" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading kategori...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !category) {
    return (
      <RoleLayout>
        <Head title="Detail Kategori" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/super-admin/master-data?tab=categories" className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title={`Detail Kategori — ${category.name}`} />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/15 dark:bg-red-950/90 border-red-500/40 text-red-600 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words">
            {toast.message}
          </span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/super-admin/master-data?tab=categories"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-6"
        >
          <ArrowLeft size={16} /> Kembali ke Kategori
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text truncate">{category.name}</h1>
            <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 truncate">ID: {category.id}</p>
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

      {/* Category Details Card */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Nama Kategori</div>
            <div className="text-base sm:text-lg font-bold text-brand-text flex items-center gap-2">
              <Tag size={18} className="text-brand-accent shrink-0" />
              <span className="break-words">{category.name}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Status</div>
            <div>
              <StatusBadge status={category.status} />
            </div>
          </div>
        </div>

        <div className="pt-4 sm:pt-6 border-t border-brand-border">
          <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">Deskripsi</div>
          <div className="bg-brand-primary/40 rounded-xl p-3.5 sm:p-4 border border-brand-border/40">
            <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line break-words">
              {category.description || 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <CategoryEditModal
          category={category}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {/* DELETE MODAL */}
      {deleteOpen && (
        <ConfirmDeleteModal
          category={category}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Kategori berhasil dihapus');
            router.visit('/super-admin/master-data?tab=categories');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ EDIT MODAL (RESPONSIF) ============
function CategoryEditModal({ category, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    status: category?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/v1/service-categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan kategori');
      } else {
        onSuccess('Kategori berhasil diupdate');
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
          <h2 className="text-base sm:text-lg font-bold text-brand-text">Edit Kategori</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
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
function ConfirmDeleteModal({ category, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/service-categories/${category.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus kategori');
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
            <h3 className="text-base sm:text-lg font-bold text-brand-text">Hapus Kategori?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-brand-text mb-6">
          Yakin ingin menghapus kategori <strong className="text-brand-text font-semibold">{category.name}</strong>?
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