import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Mail, Phone, Shield, Calendar,
  Pencil, Trash2, CheckCircle2, AlertCircle, Save, KeyRound
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

export default function UserShow({ userId }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  
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
    fetch(`/api/v1/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data);
        else setError(d.message || 'Gagal ambil data user');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  const loadOptions = () => {
    fetch('/api/v1/users/roles/options').then(r => r.json()).then(d => { if(d.success) setRoles(d.data) });
    fetch('/api/v1/users/jobs/options').then(r => r.json()).then(d => { if(d.success) setJobsList(d.data) });
  };

  useEffect(() => {
    load();
    loadOptions();
  }, [userId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail User" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading user...
        </div>
      </RoleLayout>
    );
  }

  if (error || !user) {
    return (
      <RoleLayout>
        <Head title="Detail User" />
        <div className="p-8 text-center">
          <p className="text-red-500 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href={`${basePath}/users`} className="text-brand-accent underline">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title={`User — ${user.name}`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
          toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-red-500/15 border-red-500/40 text-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-6">
        <Link href={`${basePath}/users`} className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3">
          <ArrowLeft size={16} /> Kembali ke Users
        </Link>
        
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-accent to-brand-accent2 rounded-full flex items-center justify-center text-brand-primary font-bold text-xl shrink-0">
              {getInitials(user.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text">{user.name}</h1>
              <p className="text-sm text-brand-text-muted mt-0.5">
                ID: {user.id} · Terdaftar {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => setEditOpen(true)} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2">
              <Pencil size={14} /> Edit User
            </button>
            <button onClick={() => setDeleteOpen(true)} className="bg-red-500/10 text-red-600 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/20 transition text-sm font-semibold flex items-center gap-2">
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <Card title="Informasi Akun">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone || '—'} />
            <div className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
                <Shield size={14} className="text-brand-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-brand-text-muted uppercase tracking-widest">Role Akses</div>
                <div className="text-sm text-brand-text mt-0.5"><RoleBadge role={user.roles?.name} /></div>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-brand-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-brand-text-muted uppercase tracking-widest">Status Akun</div>
                <div className="text-sm text-brand-text mt-0.5"><StatusBadge status={user.status} /></div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card title="Pekerjaan / Jobs">
             <div className="flex flex-wrap gap-2 bg-brand-primary/40 border border-brand-border rounded-lg p-4 min-h-[100px]">
                {user.user_jobs && user.user_jobs.length > 0 ? (
                  user.user_jobs.map((uj) => (
                    <span key={uj.id || uj.job_id} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-brand-muted text-brand-text border border-brand-border">
                      {uj.jobs?.name} {uj.is_primary && <span className="text-brand-accent text-xs font-bold">(Utama)</span>}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-brand-text-muted">Belum ada job yang di-assign.</span>
                )}
             </div>
          </Card>
        </div>
      </div>

      {editOpen && (
        <UserEditModal
          user={user} roles={roles} jobsList={jobsList} onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOpen && (
        <ConfirmDeleteModal
          user={user} onClose={() => setDeleteOpen(false)}
          onSuccess={() => { showToast('success', 'User berhasil dihapus'); router.visit(`${basePath}/users`); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ KOMPONEN PENDUKUNG ============
function Card({ title, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border"><h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2></div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <div className="w-8 h-8 bg-brand-muted/60 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-brand-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-brand-text-muted uppercase tracking-widest">{label}</div>
        <div className="text-sm text-brand-text break-words">{value}</div>
      </div>
    </div>
  );
}

// ============ MODAL EDIT USER ============
function UserEditModal({ user, roles, jobsList, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: user.name || '', email: user.email || '', password: '', role_id: user.roles?.id || user.role_id || '', phone: user.phone || '', status: user.status || 'active', job_ids: user.user_jobs?.map((uj) => Number(uj.job_id)) || [],
  });
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
    if (!payload.password) delete payload.password;
    if (!payload.phone) payload.phone = null;

    try {
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { if (data.errors) setErrors(data.errors); onError(data.message || 'Gagal menyimpan'); }
      else { onSuccess('User berhasil diupdate'); }
    } catch { onError('Gagal menghubungi server'); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-text">Edit User</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <FormField label="Nama Lengkap" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} required />
          <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} required />
          <FormField label="Password Baru (kosongkan jika tidak diubah)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} error={errors.password} icon={KeyRound} />
          
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

          <FormField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} error={errors.phone} />
          
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
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MODAL HAPUS ============
function ConfirmDeleteModal({ user, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);
  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/users/${user.id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (!res.ok || !data.success) { onError(data.message || 'Gagal menghapus'); setSubmitting(false); }
      else { onSuccess(); }
    } catch { onError('Gagal menghubungi server'); setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-red-500/30 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center"><AlertCircle size={20} className="text-red-500" /></div>
          <div><h3 className="text-lg font-bold text-brand-text">Hapus User?</h3><p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p></div>
        </div>
        <p className="text-sm text-brand-text mb-6">Yakin ingin menghapus <strong>{user.name}</strong>?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium">Batal</button>
          <button onClick={handleDelete} disabled={submitting} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SHARED FORM & BADGES ============
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
  const colors = { 'Super Admin': 'bg-orange-500/15 text-orange-600 border-orange-500/40', Admin: 'bg-blue-500/15 text-blue-600 border-blue-500/40', CS: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[role] || 'bg-gray-500/15 text-gray-600 border-gray-500/40'}`}>{role || '—'}</span>;
}
function StatusBadge({ status }) {
  const colors = { active: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40', inactive: 'bg-gray-500/15 text-gray-600 border-gray-500/40', suspended: 'bg-red-500/15 text-red-600 border-red-500/40', pending: 'bg-amber-500/15 text-amber-600 border-amber-500/40' };
  const label = { active: 'Active', inactive: 'Inactive', suspended: 'Suspended', pending: 'Pending' };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.inactive}`}>{label[status] || status}</span>;
}
function getInitials(name) { if (!name) return '?'; return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(); }
function formatDate(dateStr) { if (!dateStr) return '—'; return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }