import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import { RefreshCw, Search, Database, X, ChevronDown, Check } from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    inactive: 'bg-gray-500/15 text-gray-600 border-gray-500/40',
  };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>{status}</span>;
}

export default function ServicesIndex() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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

  useEffect(() => { load(); }, []);

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
    const matchCategory = !categoryFilter || String(s.category_id) === String(categoryFilter);
    return matchSearch && matchCategory;
  });

  return (
    <RoleLayout>
      <Head title="Manajemen Services" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Manajemen Services</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {services.length} service</p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-brand-primary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative sm:w-48 sm:shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">
                  {categoryFilter ? categories.find((c) => String(c.id) === String(categoryFilter))?.name : 'Semua Kategori'}
                </span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isCategoryOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button type="button" onClick={() => { setCategoryFilter(''); setIsCategoryOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!categoryFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                    <span>Semua Kategori</span>{!categoryFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {categories.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setCategoryFilter(c.id); setIsCategoryOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${String(categoryFilter) === String(c.id) ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                      <span className="truncate">{c.name}</span>{String(categoryFilter) === String(c.id) && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={load} className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm lg:ml-auto">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
          </button>
        </div>

        {(search || categoryFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {services.length} service</span>
            <button onClick={() => { setSearch(''); setCategoryFilter(''); }} className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition">
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-accent" /></div>}
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">{error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="p-12 text-center"><Database size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Tidak ada service</p></div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Nama Service</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Harga Default</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Durasi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text text-sm">{s.name}</div>
                      {s.description && <div className="text-xs text-brand-text-muted mt-0.5 line-clamp-1">{s.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{s.service_categories?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent">{formatRupiah(s.default_price)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{s.duration} hari</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}
