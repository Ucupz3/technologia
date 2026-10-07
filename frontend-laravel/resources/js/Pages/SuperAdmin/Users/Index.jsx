import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Pencil, Trash2,
  Users as UsersIcon, X, Mail, Phone, Shield, Calendar,
  Save, AlertCircle, CheckCircle2, KeyRound,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active' },
  { value: 'inactive',  label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending',   label: 'Pending' },
];

export default function UsersIndex() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data || []);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  const loadRoles = () => {
    fetch('/api/v1/users/roles/options')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRoles(d.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    loadRoles();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const roleOptions = Array.from(
    new Set(users.map((u) => u.roles?.name).filter(Boolean))
  );

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.roles?.name === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Manajemen Users" />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border transition ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Manajemen Users</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {users.length} user terdaftar
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 flex items-center gap-2 text-sm font-semibold transition"
          >
            <Plus size={16} />
            Tambah User
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari nama, email, atau phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Role</option>
            {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {(search || roleFilter || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {users.length} user</span>
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
              className="text-brand-accent hover:text-brand-accent2 flex items-center gap-1 transition"
            >
              <X size={12} /> Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Loading users...
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-3">Error: {error}</p>
            <button onClick={load} className="text-brand-accent underline hover:no-underline transition">Coba lagi</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-12 text-center">
            <UsersIcon size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {users.length === 0 ? 'Belum ada user terdaftar' : 'Tidak ada user yang cocok'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-brand-text truncate">{u.name}</div>
                          <div className="text-xs text-brand-text-muted truncate">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-brand-text flex items-center gap-1.5">
                        <Mail size={12} className="text-brand-text-muted shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-brand-text-muted shrink-0" />
                        <span>{u.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.roles?.name} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Lihat detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditUser(u)}
                          title="Edit"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
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
            Menampilkan {filtered.length} user
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={() => { setEditUser(selectedUser); setSelectedUser(null); }}
        />
      )}

      {editUser && (
        <UserFormModal
          mode="edit"
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onSuccess={(msg) => {
            setEditUser(null);
            load();
            showToast('success', msg);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <UserFormModal
          mode="create"
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => {
            setCreateOpen(false);
            load();
            showToast('success', msg);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteUser && (
        <ConfirmDeleteModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onSuccess={(msg) => {
            setDeleteUser(null);
            load();
            showToast('success', msg);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL ============
function UserFormModal({ mode, user, roles, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role_id: user?.roles?.id || '',
    phone: user?.phone || '',
    status: user?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    if (!payload.phone) payload.phone = null;

    const url = isEdit ? `/api/v1/users/${user.id}` : '/api/v1/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess(isEdit ? 'User berhasil diupdate' : 'User berhasil dibuat');
      }
    } catch (err) {
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
            {isEdit ? 'Edit User' : 'Tambah User Baru'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField
            label="Nama Lengkap"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            error={errors.name}
            placeholder="Contoh: Budi Santoso"
            required
          />
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            error={errors.email}
            placeholder="budi@erp.com"
            required
          />
          <FormField
            label={isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            error={errors.password}
            placeholder="Minimal 6 karakter"
            required={!isEdit}
            icon={KeyRound}
          />

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Role <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
              required
            >
              <option value="">Pilih role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errors.role_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.role_id[0]}</p>}
          </div>

          <FormField
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            error={errors.phone}
            placeholder="08123456789 (opsional)"
          />

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
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat User')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, error, placeholder, required, icon: Icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none transition ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'}`}
        />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error[0]}</p>}
    </div>
  );
}

// ============ DELETE CONFIRM ============
function ConfirmDeleteModal({ user, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus');
      } else {
        onSuccess('User berhasil dihapus');
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
            <h3 className="text-lg font-bold text-brand-text">Hapus User?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus user <strong className="text-brand-text">{user.name}</strong> ({user.email})?
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
function UserDetailModal({ user, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md overflow-hidden">
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20" />
          <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
          <div className="px-6 -mt-12">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-2xl border-4 border-brand-secondary">
              {getInitials(user.name)}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-brand-text">{user.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <RoleBadge role={user.roles?.name} />
            <StatusBadge status={user.status} />
          </div>

          <div className="mt-5 space-y-3">
            <DetailRow icon={Mail} label="Email" value={user.email} />
            <DetailRow icon={Phone} label="Phone" value={user.phone || '—'} />
            <DetailRow icon={Shield} label="Role" value={user.roles?.name || '—'} />
            <DetailRow icon={Calendar} label="Terdaftar" value={formatDate(user.created_at)} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg hover:bg-brand-muted/70 text-sm font-medium transition">
            Tutup
          </button>
          <button onClick={onEdit} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2">
            <Pencil size={14} /> Edit User
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-sm text-brand-text truncate">{value}</div>
      </div>
    </div>
  );
}

// ============ BADGES ============
function RoleBadge({ role }) {
  const colors = {
    'Super Admin': 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/40',
    Admin:         'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
    Sales:         'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[role] || 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'}`}>
      {role || '—'}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active:    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    inactive:  'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
    suspended: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
    pending:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
  };
  const dotColor = {
    active:    'bg-emerald-500 dark:bg-emerald-400',
    inactive:  'bg-gray-500 dark:bg-gray-400',
    suspended: 'bg-red-500 dark:bg-red-400',
    pending:   'bg-amber-500 dark:bg-amber-400',
  };
  const label = {
    active: 'Active', inactive: 'Inactive', suspended: 'Suspended', pending: 'Pending',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || dotColor.inactive}`} />
      {label[status] || status}
    </span>
  );
}

// ============ HELPERS ============
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}