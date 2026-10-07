import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Users, Shield, Plus, Pencil, Trash2,
  Save, AlertCircle, CheckCircle2, Eye,
} from 'lucide-react';

export default function RolesIndex() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedRole, setSelectedRole] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState(null);
  const [toast, setToast] = useState(null);

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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Manajemen Roles</h1>
          <p className="text-sm text-brand-text-muted mt-1">Total {roles.length} role</p>
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
            <Plus size={16} /> Tambah Role
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-brand-secondary rounded-lg p-8 text-center text-brand-text-muted border border-brand-border">
          Loading...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center text-red-600 dark:text-red-400">
          Error: {error}
          <button onClick={load} className="ml-3 underline hover:no-underline">Coba lagi</button>
        </div>
      )}

      {!loading && !error && roles.length === 0 && (
        <div className="bg-brand-secondary rounded-lg p-12 text-center border border-brand-border">
          <Shield size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
          <p className="text-brand-text-muted">Belum ada role</p>
        </div>
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onView={() => setSelectedRole(role)}
              onEdit={() => setEditRole(role)}
              onDelete={() => setDeleteRole(role)}
            />
          ))}
        </div>
      )}

      {selectedRole && (
        <RoleDetailModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
        />
      )}

      {editRole && (
        <RoleFormModal
          mode="edit"
          role={editRole}
          onClose={() => setEditRole(null)}
          onSuccess={(msg) => { setEditRole(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <RoleFormModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteRole && (
        <ConfirmDeleteModal
          role={deleteRole}
          onClose={() => setDeleteRole(null)}
          onSuccess={(msg) => { setDeleteRole(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ KARTU ROLE ============
function RoleCard({ role, onView, onEdit, onDelete }) {
  const config = getRoleConfig(role.name);

  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border p-5 hover:border-brand-accent/40 transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.bg}`}>
          <Shield size={22} className={config.text} />
        </div>
        {role.is_default && (
          <span className="text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2 py-0.5 rounded-full font-medium">
            Default
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-brand-text mb-1">{role.name}</h3>
      <p className="text-sm text-brand-text-muted mb-4 line-clamp-2 min-h-[40px]">
        {role.description || '—'}
      </p>

      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-1.5 text-sm">
          <Users size={14} className="text-brand-text-muted" />
          <span className="font-semibold text-brand-text">{role.user_count}</span>
          <span className="text-brand-text-muted">user</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onView}
          className="text-xs font-medium bg-brand-muted text-brand-text hover:bg-brand-muted/70 px-3 py-2 rounded transition flex items-center justify-center gap-1"
        >
          <Eye size={12} /> Detail
        </button>
        <button
          onClick={onEdit}
          className="text-xs font-medium bg-brand-muted text-brand-text hover:bg-brand-muted/70 px-3 py-2 rounded transition flex items-center justify-center gap-1"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={onDelete}
          disabled={role.is_default}
          className="text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 px-3 py-2 rounded transition flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} /> Hapus
        </button>
      </div>
    </div>
  );
}

// ============ FORM MODAL ============
function RoleFormModal({ mode, role, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
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

    const url = isEdit ? `/api/v1/roles/${role.id}` : '/api/v1/roles';
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
        onSuccess(isEdit ? 'Role berhasil diupdate' : 'Role berhasil dibuat');
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
          <h2 className="text-xl font-bold text-brand-text">
            {isEdit ? 'Edit Role' : 'Tambah Role Baru'}
          </h2>
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
              disabled={isEdit && role?.is_default}
              className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none transition ${
                errors.name ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              required
            />
            {isEdit && role?.is_default && (
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
              placeholder="Jelaskan fungsi role ini..."
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition resize-none"
            />
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
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Role')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ CONFIRM DELETE ============
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
      } else {
        onSuccess('Role berhasil dihapus');
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
            <h3 className="text-lg font-bold text-brand-text">Hapus Role?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus role <strong className="text-brand-text">{role.name}</strong>?
          {role.user_count > 0 && (
            <span className="block mt-2 text-amber-600 dark:text-amber-400 text-xs">
              ⚠️ Role ini masih dipakai oleh {role.user_count} user — pindahkan user dulu.
            </span>
          )}
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
function RoleDetailModal({ role, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/roles/${role.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDetail(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-text">{role.name}</h2>
            <p className="text-sm text-brand-text-muted">{role.description || '—'}</p>
          </div>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xs font-semibold text-brand-accent uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users size={14} /> User dengan Role Ini ({detail?.users?.length || 0})
          </h3>

          {loading ? (
            <p className="text-center text-brand-text-muted py-4">Loading...</p>
          ) : detail?.users?.length === 0 ? (
            <p className="text-sm text-brand-text-muted italic">Belum ada user dengan role ini</p>
          ) : (
            <div className="border border-brand-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-muted/40">
                  <tr>
                    <th className="px-3 py-2 font-medium text-brand-text-muted">Nama</th>
                    <th className="px-3 py-2 font-medium text-brand-text-muted">Email</th>
                    <th className="px-3 py-2 font-medium text-brand-text-muted">Phone</th>
                    <th className="px-3 py-2 font-medium text-brand-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {detail.users.map((u) => (
                    <tr key={u.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-3 py-2 text-brand-text">{u.name}</td>
                      <td className="px-3 py-2 text-brand-text-muted">{u.email}</td>
                      <td className="px-3 py-2 text-brand-text-muted">{u.phone || '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SMALL COMPONENTS ============
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
    'Finance':     { bg: 'bg-amber-500/15',  text: 'text-amber-600 dark:text-amber-400' },
  };
  return configs[roleName] || { bg: 'bg-gray-500/15', text: 'text-gray-600 dark:text-gray-400' };
}