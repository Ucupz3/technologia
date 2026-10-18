import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, X,
  Tag, CheckCircle2, AlertCircle, Save,
  ChevronDown, Check,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function CategoriesIndex({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/service-categories') // Sesuaikan dengan endpoint Express Anda
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data || []);
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
  }, []);

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* ============ FILTER BAR ============ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          
          {/* DIV A: SEARCH + STATUS */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-3 bg-brand-primary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Custom Dropdown Status */}
            <div className="relative sm:w-44 sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">
                  {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}
                </span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isStatusOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl backdrop-blur-md max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setStatusFilter(''); setIsStatusOpen(false); }}
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between transition-colors ${!statusFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                  >
                    <span>Semua Status</span>
                    {!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => {
                    const isSelected = statusFilter === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => { setStatusFilter(s.value); setIsStatusOpen(false); }}
                        className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between transition-colors ${isSelected ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                      >
                        <span className="truncate">{s.label}</span>
                        {isSelected && <Check size={14} className="text-brand-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* DIV B: REFRESH + TAMBAH (KANAN) */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button
              onClick={load}
              title="Refresh"
              className="bg-brand-primary border border-brand-border text-brand-text px-3 py-3 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-brand-accent text-brand-primary font-semibold px-4 py-3 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Tambah Kategori
            </button>
          </div>
        </div>

        {/* Info filter aktif */}
        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-3 rounded-xl backdrop-blur-sm">
            <span>
              Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {categories.length} kategori
            </span>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setIsStatusOpen(false); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition"
            >
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* ============ TABLE ============ */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading kategori...
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
            <Tag size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {categories.length === 0 ? 'Belum ada kategori' : 'Tidak ada kategori yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 w-16">NO</th>
                  <th className="px-4 py-3">NAMA KATEGORI</th>
                  <th className="px-4 py-3">DESKRIPSI</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50 text-sm">
                {filtered.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-brand-text-muted">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-brand-text">{cat.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-brand-text-muted truncate max-w-xs">{cat.description || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cat.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/super-admin/master-data/categories/${cat.id}`}
                          title="Detail"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition flex items-center gap-1"
                        >
                          <Eye size={14} /> Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREATE */}
      {createOpen && (
        <CategoryFormModal
          mode="create"
          category={null}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast?.('success', msg); }}
          onError={(msg) => showToast?.('error', msg)}
        />
      )}
    </div>
  );
}

// ============ FORM MODAL ============
function CategoryFormModal({ mode, category, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
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

    const url = isEdit ? `/api/v1/service-categories/${category.id}` : '/api/v1/service-categories';
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
        onError(data.message || 'Gagal menyimpan kategori');
      } else {
        onSuccess(isEdit ? 'Kategori berhasil diupdate' : 'Kategori berhasil dibuat');
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
            {isEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Web Development"
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
              placeholder="Jelaskan cakupan kategori..."
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
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Buat Kategori'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isAct = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
      isAct
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
        : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
      {isAct ? 'Active' : 'Inactive'}
    </span>
  );
}