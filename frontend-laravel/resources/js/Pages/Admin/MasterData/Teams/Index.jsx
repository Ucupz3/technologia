import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, X,
  Users, AlertCircle, CheckCircle2, Save,
  ChevronDown, Check,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function TeamsIndex({ showToast }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/teams')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTeams(d.data || []);
        else setError(d.message || 'Gagal mengambil data tim');
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

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* ============ FILTER BAR (RESPONSIF) ============ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          
          {/* SEARCH + STATUS */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama tim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              />
              {search && (
                <button 
                  type="button" 
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Custom Dropdown Status */}
            <div className="relative sm:w-44 shrink-0">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">{STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}</span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isStatusOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button 
                    type="button"
                    onClick={() => { setStatusFilter(''); setIsStatusOpen(false); }} 
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${!statusFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                  >
                    <span>Semua Status</span>{!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button 
                      key={s.value} 
                      type="button"
                      onClick={() => { setStatusFilter(s.value); setIsStatusOpen(false); }} 
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${statusFilter === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}
                    >
                      <span className="truncate">{s.label}</span>{statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REFRESH + TAMBAH */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button 
              onClick={load} 
              className="flex-1 sm:flex-initial justify-center bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 sm:py-3 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <button 
              onClick={() => setCreateOpen(true)} 
              className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 sm:py-3 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} /> Tambah Tim
            </button>
          </div>
        </div>

        {/* Info Filter Aktif */}
        {(search || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2.5 rounded-xl backdrop-blur-sm">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {teams.length} tim</span>
            <button 
              onClick={() => { setSearch(''); setStatusFilter(''); setIsStatusOpen(false); }} 
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition"
            >
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* ============ DATA VIEW CONTAINER ============ */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            <p className="text-xs sm:text-sm">Loading tim...</p>
          </div>
        )}
        
        {error && (
          <div className="p-6 sm:p-8 text-center">
            <p className="text-red-500 mb-3 text-xs sm:text-sm">Error: {error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">Coba lagi</button>
          </div>
        )}
        
        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <Users size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted text-xs sm:text-sm">
              {teams.length === 0 ? 'Belum ada tim' : 'Tidak ada tim yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {filtered.map((team, idx) => (
                <div key={team.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider">No. {idx + 1}</span>
                      <h4 className="text-sm font-bold text-brand-text truncate mt-0.5">{team.name}</h4>
                      <div className="mt-1">
                        <span className="inline-block text-[11px] px-2.5 py-0.5 rounded bg-brand-muted text-brand-text border border-brand-border/60">
                          {team._count?.team_members || 0} Member
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>

                  {team.description && (
                    <p className="text-xs text-brand-text-muted line-clamp-2 bg-brand-primary/40 rounded-lg p-2.5 border border-brand-border/40">
                      {team.description}
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-end">
                    <Link
                      href={`/admin/master-data/teams/${team.id}`}
                      className="w-full text-center px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} /> Detail Tim
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-muted/40 border-b border-brand-border text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 w-16">NO</th>
                    <th className="px-4 py-3">NAMA TIM</th>
                    <th className="px-4 py-3">DESKRIPSI</th>
                    <th className="px-4 py-3">JUMLAH MEMBER</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50 text-sm">
                  {filtered.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-4 py-3 text-brand-text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">{team.name}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-brand-text-muted truncate max-w-xs">{team.description || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs px-2.5 py-1 rounded bg-brand-muted text-brand-text border border-brand-border">
                          {team._count?.team_members || 0} Member
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={team.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/master-data/teams/${team.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition flex items-center gap-1">
                            <Eye size={14} /> Detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* FORM MODAL CREATE */}
      {createOpen && (
        <TeamFormModal
          mode="create"
          team={null}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast?.('success', msg); }}
          onError={(msg) => showToast?.('error', msg)}
        />
      )}
    </div>
  );
}

// ============ FORM MODAL (RESPONSIF) ============
function TeamFormModal({ mode, team, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    name: team?.name || '',
    description: team?.description || '',
    status: team?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const url = isEdit ? `/api/v1/teams/${team.id}` : '/api/v1/teams';
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
        onError(data.message || 'Gagal menyimpan tim');
      } else {
        onSuccess(isEdit ? 'Tim berhasil diupdate' : 'Tim berhasil dibuat');
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
          <h2 className="text-base sm:text-lg font-bold text-brand-text">{isEdit ? 'Edit Tim' : 'Tambah Tim Baru'}</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Tim <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Contoh: Tim Alpha" 
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
              placeholder="Jelaskan fungsi tim ini..." 
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
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Tim')}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isAct = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border ${isAct ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40' : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
      {isAct ? 'Active' : 'Inactive'}
    </span>
  );
}