import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, Users, UserPlus, Trash2,
  AlertCircle, CheckCircle2, Save
} from 'lucide-react';

export default function TeamShow({ teamId }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // State Tambah Anggota
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/teams/${teamId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTeam(d.data);
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
  }, [teamId]);

  const loadAvailableUsers = () => {
    fetch('/api/v1/users')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const usersWithJob = d.data.filter(u => u.user_jobs && u.user_jobs.length > 0);
          const currentMemberIds = team?.team_members?.map(m => String(m.user_id)) || [];
          const available = usersWithJob.filter(u => !currentMemberIds.includes(String(u.id)));
          setAvailableUsers(available);
        }
      })
      .catch(() => {});
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/v1/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ team_id: teamId, user_id: selectedUser }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal menambahkan anggota');
      } else {
        setIsAddOpen(false);
        setSelectedUser('');
        load();
        showToast('success', 'Anggota berhasil ditambahkan');
      }
    } catch {
      setFormError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Yakin ingin mengeluarkan anggota ini dari tim?')) return;
    try {
      const res = await fetch(`/api/v1/team-members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal menghapus anggota');
      } else {
        load();
        showToast('success', 'Anggota berhasil dikeluarkan');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Tim" />
        <div className="p-8 sm:p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm">Loading tim...</p>
        </div>
      </RoleLayout>
    );
  }

  if (error || !team) {
    return (
      <RoleLayout>
        <Head title="Detail Tim" />
        <div className="p-6 sm:p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs sm:text-sm">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/super-admin/master-data?tab=teams" className="text-brand-accent underline hover:no-underline text-xs sm:text-sm font-medium">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  const members = team.team_members || [];

  return (
    <RoleLayout>
      <Head title={`Detail Tim — ${team.name}`} />

      {/* Toast Notification (Responsif: bawah di Mobile, atas di Desktop) */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] max-w-sm flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-red-500/15 dark:bg-red-950/90 border-red-500/40 text-red-600 dark:text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words">
            {toast.message}
          </span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="mb-4 sm:mb-6">
        <Link href="/super-admin/master-data?tab=teams" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-brand-text-muted hover:text-brand-accent transition mb-6">
          <ArrowLeft size={16} /> Kembali ke Tim
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text truncate">{team.name}</h1>
            <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5 truncate">ID: {team.id}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => { setIsAddOpen(true); loadAvailableUsers(); }} 
              className="w-full sm:w-auto justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl hover:bg-brand-accent2 transition text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <UserPlus size={16} /> Tambah Anggota
            </button>
          </div>
        </div>
      </div>

      {/* Deskripsi Tim Card */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-6 space-y-4 mb-4 sm:mb-6 shadow-sm">
        <div>
          <div className="text-[11px] sm:text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Deskripsi Tim</div>
          <div className="bg-brand-primary/40 rounded-xl p-3.5 sm:p-4 border border-brand-border/40">
            <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line break-words">
              {team.description || 'Tidak ada deskripsi'}
            </p>
          </div>
        </div>
      </div>

      {/* Anggota Tim Section */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-brand-border bg-brand-muted/30 flex items-center gap-2">
          <Users size={16} className="text-brand-text-muted shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-brand-text">Anggota Tim ({members.length})</h3>
        </div>

        {members.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted text-xs sm:text-sm">Belum ada anggota di tim ini.</div>
        ) : (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {members.map((m, i) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-brand-text-muted">#{i + 1}</span>
                      <h4 className="text-sm font-bold text-brand-text truncate">{m.users?.name || '—'}</h4>
                    </div>
                    <p className="text-xs text-brand-text-muted truncate mt-0.5">{m.users?.email || '—'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition shrink-0"
                    title="Keluarkan"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-primary/40 border-b border-brand-border text-xs font-semibold text-brand-text-muted uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 w-16">No</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {members.map((m, i) => (
                    <tr key={m.id} className="hover:bg-brand-muted/40 transition">
                      <td className="px-4 py-3 text-brand-text-muted">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-text">{m.users?.name}</td>
                      <td className="px-4 py-3 text-brand-text-muted">{m.users?.email}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleRemoveMember(m.id)} 
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition" 
                          title="Keluarkan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL TAMBAH ANGGOTA (RESPONSIF) */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
          <div className="bg-brand-secondary rounded-2xl shadow-2xl border border-brand-border w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-brand-text">Tambah Anggota Tim</h2>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-brand-text-muted hover:text-brand-accent p-1 text-xl leading-none">×</button>
            </div>

            {/* Body Modal Scrollable */}
            <form onSubmit={handleAddMember} autoComplete="off" className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Pilih User <span className="text-red-500">*</span></label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                  required
                >
                  <option value="">— Pilih User —</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="text-xs text-amber-500 mt-2">Tidak ada user tersedia (belum punya job / sudah masuk tim).</p>
                )}
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </form>

            {/* Footer Modal Fixed */}
            <div className="px-5 py-4 border-t border-brand-border flex justify-end gap-2 shrink-0 bg-brand-secondary">
              <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 sm:flex-initial bg-brand-muted text-brand-text px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition">Batal</button>
              <button onClick={handleAddMember} disabled={submitting || !selectedUser} className="flex-1 sm:flex-initial justify-center bg-brand-accent text-brand-primary px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition">
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}