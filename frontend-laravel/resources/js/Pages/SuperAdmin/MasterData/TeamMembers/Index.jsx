import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Pencil, Trash2, X,
  Users as UsersIcon, Save, AlertCircle, CheckCircle2, UserPlus,
} from 'lucide-react';

export default function TeamMembersIndex() {
  const [members, setMembers] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedMember, setSelectedMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteMember, setDeleteMember] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/team-members').then((r) => r.json()),
      fetch('/api/v1/team-members/users/options').then((r) => r.json()),
    ])
      .then(([m, u]) => {
        if (m.success) setMembers(m.data || []);
        else setError(m.message || 'Gagal ambil data');
        if (u.success) setUserOptions(u.data || []);
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

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.user_name?.toLowerCase().includes(q) ||
      m.user_email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Team Members" />

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Team Members</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Total {members.length} anggota tim
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
            <UserPlus size={16} /> Tambah Anggota
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg p-4 mb-4">
        <p className="text-xs text-brand-text-muted">
          💡 <strong className="text-brand-text">Team Member</strong> adalah user sistem (role apapun)
          yang ditugaskan mengerjakan order. Pilih dari user yang sudah ada di sistem.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="busy">Busy</option>
            <option value="off">Off</option>
          </select>
        </div>
        {(search || statusFilter) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-text-muted">
            <span>Menampilkan <strong className="text-brand-text">{filtered.length}</strong> dari {members.length} anggota</span>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); }}
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
            <UsersIcon size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted">
              {members.length === 0 ? 'Belum ada team member' : 'Tidak ada yang cocok'}
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
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Role di Tim</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((m, i) => (
                  <tr key={m.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-semibold text-xs shrink-0">
                          {getInitials(m.user_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-brand-text truncate">{m.user_name}</div>
                          <div className="text-xs text-brand-text-muted truncate">
                            {m.user_email} {m.user_role && <span className="text-brand-accent">· {m.user_role}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.role ? (
                        <span className="text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/40 px-2 py-0.5 rounded-full font-medium">
                          {m.role}
                        </span>
                      ) : (
                        <span className="text-xs text-brand-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">{m.phone || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedMember(m)}
                          title="Detail"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditMember(m)}
                          title="Edit"
                          className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent2 hover:bg-brand-accent2/10 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteMember(m)}
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
            Menampilkan {filtered.length} anggota tim
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onEdit={() => { setEditMember(selectedMember); setSelectedMember(null); }}
        />
      )}

      {editMember && (
        <MemberFormModal
          mode="edit"
          member={editMember}
          userOptions={userOptions}
          onClose={() => setEditMember(null)}
          onSuccess={(msg) => { setEditMember(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {createOpen && (
        <MemberFormModal
          mode="create"
          userOptions={userOptions}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteMember && (
        <ConfirmDeleteModal
          member={deleteMember}
          onClose={() => setDeleteMember(null)}
          onSuccess={(msg) => { setDeleteMember(null); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL ============
function MemberFormModal({ mode, member, userOptions, onClose, onSuccess, onError }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    user_id: member?.user_id || '',
    role: member?.role || '',
    phone: member?.phone || '',
    status: member?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const url = isEdit
      ? `/api/v1/team-members/${member.id}`
      : '/api/v1/team-members';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = isEdit
      ? { role: form.role, phone: form.phone, status: form.status }
      : form;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan');
      } else {
        onSuccess(isEdit ? 'Team member berhasil diupdate' : 'Team member berhasil ditambahkan');
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
            {isEdit ? 'Edit Team Member' : 'Tambah Team Member'}
          </h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Pilih User <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            {isEdit ? (
              <div className="bg-brand-muted border border-brand-border rounded-lg px-3 py-2">
                <div className="text-sm text-brand-text">{member.user_name}</div>
                <div className="text-xs text-brand-text-muted">{member.user_email}</div>
              </div>
            ) : (
              <>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  className={`w-full bg-brand-primary border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none transition ${
                    errors.user_id ? 'border-red-500/50' : 'border-brand-border focus:border-brand-accent/60'
                  }`}
                  required
                >
                  <option value="">Pilih user...</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) {u.role_name ? `· ${u.role_name}` : ''}
                    </option>
                  ))}
                </select>
                {errors.user_id && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.user_id[0]}</p>}
                {userOptions.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Semua user sudah terdaftar sebagai team member. Tambah user baru dulu di halaman Users.
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Role di Tim
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Contoh: Tech Lead, Backend Developer"
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08123456789 (opsional)"
              className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-accent/60 transition"
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="busy">Busy</option>
              <option value="off">Off</option>
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
            {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Tambah')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE CONFIRM ============
function ConfirmDeleteModal({ member, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/team-members/${member.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus');
      } else {
        onSuccess('Team member berhasil dihapus');
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
            <h3 className="text-lg font-bold text-brand-text">Hapus Team Member?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-sm text-brand-text mb-6">
          Yakin ingin menghapus <strong className="text-brand-text">{member.user_name}</strong> dari tim?
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
function MemberDetailModal({ member, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md overflow-hidden">
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-brand-accent/20 to-brand-accent2/20" />
          <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-muted hover:text-brand-accent text-2xl leading-none transition">×</button>
          <div className="px-6 -mt-12">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-2xl border-4 border-brand-secondary">
              {getInitials(member.user_name)}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-brand-text">{member.user_name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={member.status} />
            {member.user_role && (
              <span className="text-xs text-brand-text-muted">· {member.user_role}</span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <DetailRow label="Email" value={member.user_email || '—'} />
            <DetailRow label="Role di Tim" value={member.role || '—'} />
            <DetailRow label="Phone" value={member.phone || '—'} />
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

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
      <div className="text-sm text-brand-text">{value}</div>
    </div>
  );
}

// ============ BADGE & HELPERS ============
function StatusBadge({ status }) {
  const colors = {
    active:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    inactive: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40',
    busy:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    off:      'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/40',
  };
  const dotColor = {
    active: 'bg-emerald-500 dark:bg-emerald-400',
    inactive: 'bg-gray-500 dark:bg-gray-400',
    busy: 'bg-amber-500 dark:bg-amber-400',
    off: 'bg-slate-500 dark:bg-slate-400',
  };
  const label = { active: 'Active', inactive: 'Inactive', busy: 'Busy', off: 'Off' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status] || dotColor.inactive}`} />
      {label[status] || status}
    </span>
  );
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}