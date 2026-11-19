import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  RefreshCw, Users, Shield, Plus, Save, AlertCircle, CheckCircle2, Eye,
} from 'lucide-react';

function getBasePath() {
  return window.location.pathname.replace(/\/roles.*$/, '');
}

export default function RolesIndex() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/roles')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRoles(d.data || []);
        else setError(d.message || 'Gagal ambil data');
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

  return (
    <RoleLayout>
      <Head title="Manajemen Roles" />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Manajemen Roles</h1>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 sm:mt-1">Total {roles.length} role</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={load}
            className="flex-1 sm:flex-initial justify-center bg-brand-secondary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl hover:bg-brand-accent2 flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition shadow-sm whitespace-nowrap"
          >
            <Plus size={16} /> Tambah Role
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-brand-secondary rounded-xl p-8 sm:p-12 text-center text-brand-text-muted border border-brand-border">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading roles...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 sm:p-8 text-center text-red-600 dark:text-red-400 text-xs sm:text-sm">
          Error: {error}
          <button onClick={load} className="ml-3 underline hover:no-underline font-semibold">Coba lagi</button>
        </div>
      )}

      {!loading && !error && roles.length === 0 && (
        <div className="bg-brand-secondary rounded-xl p-8 sm:p-12 text-center border border-brand-border">
          <Shield size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
          <p className="text-brand-text-muted text-xs sm:text-sm">Belum ada role</p>
        </div>
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} basePath={basePath} />
          ))}
        </div>
      )}

      {createOpen && (
        <RoleFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ KARTU ROLE (RESPONSIF) ============
function RoleCard({ role, basePath }) {
  const config = getRoleConfig(role.name);

  return (
    <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-5 hover:border-brand-accent/40 transition flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
            <Shield size={20} className={`${config.text} shrink-0`} />
          </div>
          {role.is_default && (
            <span className="text-[11px] sm:text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2.5 py-0.5 rounded-full font-medium">
              Default
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-brand-text mb-1 truncate">{role.name}</h3>
        <p className="text-xs sm:text-sm text-brand-text-muted mb-4 line-clamp-2 min-h-[36px] sm:min-h-[40px]">
          {role.description || '—'}
        </p>

        <div className="flex items-center gap-4 mb-4 pb-3.5 border-b border-brand-border">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users size={14} className="text-brand-text-muted shrink-0" />
            <span className="font-semibold text-brand-text">{role.user_count}</span>
            <span className="text-brand-text-muted">user</span>
          </div>
        </div>
      </div>

      <Link
        href={`${basePath}/roles/${role.id}`}
        className="w-full text-xs font-semibold bg-brand-muted text-brand-text hover:bg-brand-muted/70 px-3 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
      >
        <Eye size={14} /> Detail Role
      </Link>
    </div>
  );
}

// ============ FORM MODAL (RESPONSIF) ============
function RoleFormModal({ mode, role, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/v1/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess('Role berhasil dibuat');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-brand-text">Tambah Role Baru</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Role <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Finance"
              className={`w-full bg-brand-primary border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition ${
                errors.name ? 'border-red-500' : 'border-brand-border'
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
              placeholder="Jelaskan fungsi role ini..."
              className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition resize-none"
            />
          </div>
        </form>

        {/* Footer Modal Fixed */}
        <div className="px-5 py-4 border-t border-brand-border flex justify-end gap-2 shrink-0 bg-brand-secondary">
          <button type="button" onClick={onClose} className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Buat Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ HELPERS ============
function getRoleConfig(roleName) {
  const configs = {
    'Super Admin': { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
    'Admin':       { bg: 'bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400' },
    'CS':          { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    'Customer Service': { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    'Finance':     { bg: 'bg-amber-500/15',  text: 'text-amber-600 dark:text-amber-400' },
  };
  return configs[roleName] || { bg: 'bg-gray-500/15', text: 'text-gray-600 dark:text-gray-400' };
}