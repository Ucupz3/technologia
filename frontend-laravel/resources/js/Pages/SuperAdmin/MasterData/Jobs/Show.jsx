import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Briefcase, Pencil, Trash2,
  AlertCircle, CheckCircle2, Save, Users, Star,
} from 'lucide-react';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

const userStatusBadge = (status) =>
  status === 'active'
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
    : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40';

export default function JobShow({ jobId }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setJob(d.data);
        else setError(d.message || 'Gagal mengambil data job');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [jobId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Job" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading job...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !job) {
    return (
      <RoleLayout>
        <Head title="Detail Job" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/super-admin/master-data?tab=jobs" className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">
            ← Kembali ke daftar
          </Link>
        </div>
      </RoleLayout>
    );
  }

  const stats = job.stats || {};

  return (
    <RoleLayout>
      <Head title={`Detail Job — ${job.name}`} />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-6 sm:left-auto sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/super-admin/master-data?tab=jobs"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Kembali ke Jobs
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text flex items-center gap-2 truncate">
              <Briefcase size={22} className="text-brand-accent shrink-0" />
              <span className="truncate">{job.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 truncate">ID: {job.id}</p>
          </div>

          {/* Action Buttons (Full Width Grid di Mobile, Flex Auto di Desktop) */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={load}
              className="justify-center bg-brand-secondary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> <span>Refresh</span>
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="justify-center bg-brand-accent text-brand-primary px-3.5 py-2.5 rounded-xl hover:bg-brand-accent2 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Pencil size={14} /> <span>Edit</span>
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="justify-center bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-3.5 py-2.5 rounded-xl hover:bg-red-500/20 transition text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Trash2 size={14} /> <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
        <StatCard icon={<Users size={18} />} label="Total User" value={stats.total_users ?? 0} tone="accent" />
        <StatCard icon={<Star size={18} />} label="User Primary" value={stats.primary_users ?? 0} tone="amber" />
        <StatCard icon={<Briefcase size={18} />} label="Total Assignment" value={stats.total_assignments ?? 0} tone="emerald" />
      </div>

      {/* INFO JOB */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-6 space-y-4 sm:space-y-6 mb-4 sm:mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Nama Job</div>
            <div className="text-base sm:text-lg font-bold text-brand-text flex items-center gap-2">
              <Briefcase size={18} className="text-brand-accent shrink-0" />
              <span className="break-words">{job.name}</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Status</div>
            <div>
              <StatusBadge status={job.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-brand-border">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Dibuat</div>
            <div className="text-xs sm:text-sm text-brand-text">{formatDateTime(job.created_at)}</div>
          </div>
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1">Terakhir diupdate</div>
            <div className="text-xs sm:text-sm text-brand-text">{formatDateTime(job.updated_at)}</div>
          </div>
        </div>

        <div className="pt-4 sm:pt-6 border-t border-brand-border">
          <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2">Deskripsi</div>
          <div className="bg-brand-primary/40 rounded-xl p-3.5 sm:p-4 border border-brand-border/40">
            <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line break-words">
              {job.description || 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>
      </div>

      {/* USER DENGAN JOB INI */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-brand-text uppercase tracking-widest flex items-center gap-2">
            <Users size={16} className="text-brand-accent shrink-0" /> User dengan Job Ini
          </h2>
          <span className="text-xs text-brand-text-muted">{job.users?.length || 0} user</span>
        </div>
        {!job.users?.length ? (
          <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-brand-text-muted">
            Belum ada user yang memakai job ini.
          </div>
        ) : (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {job.users.map((uj, idx) => (
                <div key={uj.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-brand-text-muted">#{idx + 1}</span>
                        <h4 className="text-sm font-bold text-brand-text truncate">{uj.user?.name || '—'}</h4>
                      </div>
                      <p className="text-xs text-brand-text-muted truncate mt-0.5">{uj.user?.email || '—'}</p>
                    </div>
                    {uj.user?.status && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${userStatusBadge(uj.user.status)}`}>
                        {uj.user.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-brand-border/40">
                    <div className="flex items-center gap-1.5">
                      {uj.is_primary ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/40 font-semibold">
                          <Star size={10} /> Primary
                        </span>
                      ) : (
                        <span className="text-brand-text-muted text-[11px]">Secondary</span>
                      )}
                    </div>
                    <span className="text-[11px] text-brand-text-muted">{formatDate(uj.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-muted/40 border-b border-brand-border text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 w-12">NO</th>
                    <th className="px-4 py-3">NAMA</th>
                    <th className="px-4 py-3">EMAIL</th>
                    <th className="px-4 py-3">PRIMARY</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">DITAMBAHKAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {job.users.map((uj, idx) => (
                    <tr key={uj.id} className="hover:bg-brand-muted/30 transition">
                      <td className="px-4 py-3 text-brand-text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">{uj.user?.name || '—'}</td>
                      <td className="px-4 py-3 text-brand-text-muted">{uj.user?.email || '—'}</td>
                      <td className="px-4 py-3">
                        {uj.is_primary ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/40 font-semibold">
                            <Star size={10} /> Primary
                          </span>
                        ) : (
                          <span className="text-xs text-brand-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {uj.user?.status ? (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${userStatusBadge(uj.user.status)}`}>
                            {uj.user.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-brand-text-muted text-xs">{formatDate(uj.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {editOpen && (
        <JobEditModal
          job={job}
          onClose={() => setEditOpen(false)}
          onSuccess={(msg) => { setEditOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {deleteOpen && (
        <ConfirmDeleteModal
          job={job}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => {
            showToast('success', 'Job berhasil dihapus');
            router.visit('/super-admin/master-data?tab=jobs');
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ STAT CARD (RESPONSIF) ============
function StatCard({ icon, label, value, tone = 'accent' }) {
  const toneMap = {
    accent:  'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
    amber:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  };
  return (
    <div className="bg-brand-secondary border border-brand-border rounded-xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2.5 rounded-xl border shrink-0 ${toneMap[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] text-brand-text-muted uppercase tracking-widest font-semibold truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-brand-text mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ============ EDIT MODAL (RESPONSIF) ============
function JobEditModal({ job, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    name: job?.name || '',
    description: job?.description || '',
    status: job?.status || 'active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) setErrors(data.errors);
        onError(data.message || 'Gagal menyimpan job');
      } else {
        onSuccess(data.message || 'Job berhasil diupdate');
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
          <h2 className="text-base sm:text-lg font-bold text-brand-text">Edit Job</h2>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
        </div>

        {/* Body Modal Scrollable */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">
              Nama Job <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
            {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE MODAL (RESPONSIF) ============
function ConfirmDeleteModal({ job, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus job');
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-md p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-brand-text">Hapus Job?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-brand-text mb-2">
          Yakin ingin menghapus job <strong className="text-brand-text font-semibold">{job.name}</strong>?
        </p>
        <p className="text-[11px] sm:text-xs text-brand-text-muted mb-6">
          Catatan: job yang sudah dipakai di assignment order tidak dapat dihapus — nonaktifkan saja.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleDelete} disabled={submitting} className="flex-1 sm:flex-initial justify-center bg-red-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ STATUS BADGE ============
function StatusBadge({ status }) {
  const isAct = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium border ${
      isAct
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
        : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/40'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-500 dark:bg-gray-400'}`} />
      {isAct ? 'Active' : 'Inactive'}
    </span>
  );
}