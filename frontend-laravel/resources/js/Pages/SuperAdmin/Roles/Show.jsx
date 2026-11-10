import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Users, Shield, Pencil, Trash2,
  AlertCircle, CheckCircle2, Save
} from 'lucide-react';

function getBasePath() {
  return window.location.pathname.replace(/\/roles.*$/, '');
}

export default function RoleShow({ roleId }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/roles/${roleId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRole(d.data);
        else setError(d.message || 'Gagal ambil data role');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [roleId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Role" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading role...
        </div>
      </RoleLayout>
    );
  }

  if (error || !role) {
    return (
      <RoleLayout>
        <Head title="Detail Role" />
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href={`${basePath}/roles`} className="text-brand-accent underline">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  const config = getRoleConfig(role.name);

  return (
    <RoleLayout>
      <Head title={`Role — ${role.name}`} />

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
          href={`${basePath}/roles`}
          className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Roles
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
              <Shield size={32} className={config.text} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text flex items-center gap-3">
                {role.name}
                {role.is_default && (
                  <span className="text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
              </h1>
              <p className="text-sm text-brand-text-muted mt-1">ID: {role.id}</p>
            </div>
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
              <Pencil size={14} /> Edit Role
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={role.is_default}
              className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-widest mb-3">Deskripsi</h3>
          <p className="text-sm text-brand-text">{role.description || 'Tidak ada deskripsi.'}</p>
        </div>

        <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border bg-brand-muted/30 flex items-center gap-2">
            <Users size={16} className="text-brand-text-muted" />
            <h3 className="text-sm font-bold text-brand-text">User dengan Role Ini ({role.users?.length || 0})</h3>
          </div>

          {!role.users || role.users.length === 0 ? (
            <div className="p-12 text-center text-brand-text-muted">Belum ada user dengan role ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-primary/40 border-b border-brand-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">No</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Nama</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {role.users.map((u, i) => (
                    <tr key={u.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-4 py-3 text-brand-text-muted">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">{u.name}</td>
                      <td className="px-4 py-3 text-brand-text-muted">{u.email}</td>
                      <td className="px-4 py-3 text-brand-text-muted">{u.phone || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <RoleEditModal
          role={role}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOpen && (
        <ConfirmDeleteModal
          role={role}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Role berhasil dihapus');
            router.visit(`${basePath}/roles`);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ EDIT MODAL ============
function RoleEditModal({ role, onClose, onSuccess, onError }) {
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
      const res = await fetch(`/api/v1/roles/${role.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess('Role berhasil diupdate');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">Edit Role</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Role <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Finance"
              disabled={role?.is_default}
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none transition ${
                errors.name ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              required
            />
            {role?.is_default && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Role default tidak bisa diubah namanya</p>
            )}
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
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE MODAL ============
function ConfirmDeleteModal({ role, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/roles/${role.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus');
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
            <h3 className="text-lg font-bold text-brand-text">Hapus Role?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus role <strong className="text-brand-text">{role.name}</strong>?
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
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

// ============ HELPERS ============
function StatusBadge({ status }) {
  const colors = {
    active:    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    inactive:  'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
    suspended: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    pending:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
  };
  const label = {
    active: 'Active', inactive: 'Inactive', suspended: 'Suspended', pending: 'Pending',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>
      {label[status] || status}
    </span>
  );
}

function getRoleConfig(roleName) {
  const configs = {
    'Super Admin': { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
    'Admin':       { bg: 'bg-blue-500/15',   text: 'text-blue-600 dark:text-blue-400' },
    'Sales':       { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
    'CS':          { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }, // ✅ CS Hijau
    'Customer Service': { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' }, // ✅ CS Hijau
    'Finance':     { bg: 'bg-amber-500/15',  text: 'text-amber-600 dark:text-amber-400' },
  };
  return configs[roleName] || { bg: 'bg-gray-500/15', text: 'text-gray-600 dark:text-gray-400' };
}