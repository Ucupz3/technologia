import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Pencil, Trash2, X,
  Briefcase, Save, AlertCircle, CheckCircle2,
} from 'lucide-react';

export default function ServicesIndex() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedService, setSelectedService] = useState(null);
  const [editService, setEditService] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteService, setDeleteService] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/services').then((r) => r.json()),
      fetch('/api/v1/services/categories/options').then((r) => r.json()),
    ])
      .then(([s, c]) => {
        if (s.success) setServices(s.data || []);
        else setError(s.message || 'Gagal ambil data');
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
  }, []);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchCategory = !categoryFilter || String(s.category_id) === categoryFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Services" />

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

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Services</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {services.length} service
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 flex items-center gap-2 text-sm font-semibold transition"
          >
            <Plus size={16} /> Tambah Service
          </button>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari nama atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {(search || categoryFilter || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {services.length} service</span>
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1 transition"
            >
              <X size={12} /> Reset filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">Error: {error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline">Coba lagi</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Briefcase size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {services.length === 0 ? 'Belum ada service' : 'Tidak ada yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Nama Service</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Harga</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Durasi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-lg flex items-center justify-center shrink-0">
                          <Briefcase size={16} className="text-brand-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-brand-text">{s.name}</div>
                          <div className="text-xs text-brand-text-muted max-w-md truncate">
                            {s.description || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-brand-muted text-brand-text-muted border border-brand-border px-2 py-0.5 rounded-full">
                        {s.category_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent">
                      {formatRupiah(s.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {s.duration ? `${s.duration} menit` : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedService(s)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditService(s)}
                          title="Edit"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteService(s)}
                          title="Hapus"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-brand-border text-xs text-brand-text-muted">
            Menampilkan {filtered.length} service
          </div>
        )}
      </div>

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={() => { setEditService(selectedService); setSelectedService(null); }}
        />
      )}

      {editService && (
        <ServiceFormModal
          mode="edit"
          service={editService}
          categories={categories}
          onClose={() => setEditService(null)}
          onSuccess={(msg) => { setEditService(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <ServiceFormModal
          mode="create"
          categories={categories}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteService && (
        <ConfirmDeleteModal
          service={deleteService}
          onClose={() => setDeleteService(null)}
          onSuccess={(msg) => { setDeleteService(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL ============
function ServiceFormModal({ mode, service, categories, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    category_id: service?.category_id || '',
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || 0,
    status: service?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const url = isEdit
      ? `/api/v1/services/${service.id}`
      : '/api/v1/services';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess(isEdit ? 'Service berhasil diupdate' : 'Service berhasil dibuat');
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
          <h2 className="text-xl font-bold text-brand-text">
            {isEdit ? 'Edit Service' : 'Tambah Service Baru'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Kategori <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
                errors.category_id ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              }`}
              required
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.category_id[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Service <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Company Profile Web"
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none transition ${
                errors.name ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              }`}
              required
            />
            {errors.name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Jelaskan service ini..."
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                Harga (Rp) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
                  errors.price ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
                }`}
                required
              />
              {errors.price && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.price[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
                Durasi (menit)
              </label>
              <input
                type="number"
                min="0"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
              />
            </div>
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
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE CONFIRM ============
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
        onError(data.message || 'Gagal menghapus');
      } else {
        onSuccess('Service berhasil dihapus');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
          <button
            onClick={onClose}
            disabled={submitting}
            className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DETAIL MODAL ============
function ServiceDetailModal({ service, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md overflow-hidden">
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20" />
          <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
          <div className="px-6 -mt-12">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-2xl flex items-center justify-center border-4 border-brand-secondary">
              <Briefcase size={32} className="text-brand-primary" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-brand-text">{service.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={service.status} />
            <span className="text-xs text-brand-text-muted">{service.category_name}</span>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Harga</div>
              <div className="text-lg font-bold text-brand-accent">{formatRupiah(service.price)}</div>
            </div>
            <div>
              <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Durasi</div>
              <div className="text-sm text-brand-text">{service.duration ? `${service.duration} menit` : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Deskripsi</div>
              <p className="text-sm text-brand-text">{service.description || '—'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Tutup
          </button>
          <button onClick={onEdit} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2">
            <Pencil size={14} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ BADGE & HELPERS ============
function StatusBadge({ status }) {
  const colors = {
    active:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    inactive: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
  };
  const label = { active: 'Active', inactive: 'Inactive' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>
      {label[status] || status}
    </span>
  );
}

function formatRupiah(n) {
  if (!n) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}