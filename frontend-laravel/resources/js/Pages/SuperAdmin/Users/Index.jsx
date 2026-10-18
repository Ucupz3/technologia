import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, X, Mail, Phone, 
  CheckCircle2, AlertCircle, Users as UsersIcon,
  ChevronDown, Check, Save, KeyRound
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending',   label: 'Pending' },
];

function getBasePath() {
  return window.location.pathname.replace(/\/users.*$/, '');
}

export default function UsersIndex() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const basePath = getBasePath();

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data || []);
        else setError(d.message || 'Gagal ambil data user');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  const loadOptions = () => {
    fetch('/api/v1/users/roles/options')
      .then((r) => r.json())
      .then((d) => { if (d.success) setRoles(d.data || []); })
      .catch(() => {});
    fetch('/api/v1/users/jobs/options')
      .then((r) => r.json())
      .then((d) => { if (d.success) setJobsList(d.data || []); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadOptions();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const roleOptions = Array.from(new Set(users.map((u) => u.roles?.name).filter(Boolean)));

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.roles?.name === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Manajemen Users" />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-red-500/15 border-red-500/40 text-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Manajemen Users</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {users.length} user terdaftar</p>
      </div>

      {/* ============ FILTER BAR (SEJAJAR) ============ */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          
          {/* DIV A: Search + Role + Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Cari nama, email, atau phone..."
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

            <div className="relative sm:w-44 sm:shrink-0">
              <button
                type="button"
                onClick={() => { setIsRoleOpen(!isRoleOpen); setIsStatusOpen(false); }}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">{roleFilter || 'Semua Role'}</span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isRoleOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>
              {isRoleOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button type="button" onClick={() => { setRoleFilter(''); setIsRoleOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!roleFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                    <span>Semua Role</span>{!roleFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {roleOptions.map((r) => (
                    <button key={r} type="button" onClick={() => { setRoleFilter(r); setIsRoleOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${roleFilter === r ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                      <span className="truncate">{r}</span>{roleFilter === r && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative sm:w-40 sm:shrink-0">
              <button
                type="button"
                onClick={() => { setIsStatusOpen(!isStatusOpen); setIsRoleOpen(false); }}
                className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
              >
                <span className="truncate">{STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}</span>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${isStatusOpen ? 'rotate-180 text-brand-accent' : ''}`} />
              </button>
              {isStatusOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  <button type="button" onClick={() => { setStatusFilter(''); setIsStatusOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!statusFilter ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                    <span>Semua Status</span>{!statusFilter && <Check size={14} className="text-brand-accent" />}
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} type="button" onClick={() => { setStatusFilter(s.value); setIsStatusOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${statusFilter === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'}`}>
                      <span className="truncate">{s.label}</span>{statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DIV B: Refresh + Tambah User */}
          <div className="flex items-center gap-2 lg:shrink-0 lg:ml-auto">
            <button onClick={() => { load(); loadOptions(); }} className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <button onClick={() => setCreateOpen(true)} className="bg-brand-accent text-brand-primary font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-sm transition shadow-sm whitespace-nowrap">
              <Plus size={16} /> Tambah User
            </button>
          </div>
        </div>

        {/* Info filter aktif */}
        {(search || roleFilter || statusFilter) && (
          <div className="flex items-center justify-between text-xs text-brand-text-muted bg-brand-primary/60 border border-brand-border/60 px-3.5 py-2 rounded-xl backdrop-blur-sm">
            <span>Menampilkan <strong className="text-brand-text font-semibold">{filtered.length}</strong> dari {users.length} user</span>
            <button onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setIsRoleOpen(false); setIsStatusOpen(false); }} className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1.5 font-medium transition">
              <X size={13} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center text-brand-text-muted"><RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />Loading users...</div>}
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">Error: {error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="p-12 text-center"><UsersIcon size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Tidak ada user yang cocok</p></div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0">{getInitials(u.name)}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-brand-text truncate">{u.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-brand-text flex items-center gap-1.5"><Mail size={12} />{u.email}</div>
                      <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-0.5"><Phone size={12} />{u.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.roles?.name} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Link href={`${basePath}/users/${u.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition">
                          Detail
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

      {createOpen && (
        <UserCreateModal
          roles={roles} jobsList={jobsList} onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ MODAL CREATE ============
function UserCreateModal({ roles, jobsList, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', phone: '', status: 'active', job_ids: [] });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleJobToggle = (jobId) => {
    const id = Number(jobId);
    setForm((prev) => ({ ...prev, job_ids: prev.job_ids.includes(id) ? prev.job_ids.filter((j) => j !== id) : [...prev.job_ids, id] }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true); setErrors({});
    const payload = { ...form };
    if (!payload.phone) payload.phone = null;

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { if (data.errors) setErrors(data.errors); onError(data.message || 'Gagal menyimpan'); }
      else { onSuccess('User berhasil dibuat'); }
    } catch { onError('Gagal menghubungi server'); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-text">Tambah User Baru</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} required />
          <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} required />
          <FormField label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} required icon={KeyRound} />
          
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Role <span className="text-red-500">*</span></label>
            <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text" required>
              <option value="">Pilih Role...</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Jobs</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-brand-primary/40 border border-brand-border rounded-lg p-3 max-h-44 overflow-y-auto">
              {jobsList.map((j) => {
                const checked = form.job_ids.includes(Number(j.id));
                return (
                  <label key={j.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${checked ? 'bg-brand-accent/15 border-brand-accent text-brand-text' : 'border-brand-border/60 text-brand-text-muted'}`}>
                    <input type="checkbox" checked={checked} onChange={() => handleJobToggle(j.id)} className="rounded text-brand-accent" />
                    <span>{j.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <FormField label="Phone (opsional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} />
          
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </form>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} type="button" className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Buat User
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ HELPERS ============
function FormField({ label, type = 'text', value, onChange, error, required, icon: Icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text ${Icon ? 'pl-9' : ''} ${error ? 'border-red-500' : 'border-brand-border'}`} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
    </div>
  );
}

function RoleBadge({ role }) {
  const isCsOrSales = role === 'CS' || role === 'Sales' || role === 'Customer Service';
  
  const colors = { 
    'Super Admin': 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/40', 
    Admin: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/40', 
  };
  
  let colorClass = colors[role];
  if (isCsOrSales) {
    colorClass = 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/40';
  }
  
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colorClass || 'bg-gray-500/15 text-gray-600 border-gray-500/40'}`}>
      {role || '—'}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = { active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40', inactive: 'bg-gray-500/15 text-gray-600 border-gray-500/40', suspended: 'bg-red-500/15 text-red-600 border-red-500/40', pending: 'bg-amber-500/15 text-amber-600 border-amber-500/40' };
  const label = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', pending: 'Pending' };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>{label[status] || status}</span>;
}

function getInitials(name) { if (!name) return '?'; return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(); }