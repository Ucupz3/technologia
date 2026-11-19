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
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading tim...
        </div>
      </RoleLayout>
    );
  }

  if (error || !team) {
    return (
      <RoleLayout>
        <Head title="Detail Tim" />
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href="/super-admin/master-data?tab=teams" className="text-brand-accent underline">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  const members = team.team_members || [];

  return (
    <RoleLayout>
      <Head title={`Detail Tim — ${team.name}`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-red-500/15 border-red-500/40 text-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-6">
        <Link href="/super-admin/master-data?tab=teams" className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3">
          <ArrowLeft size={16} /> Kembali ke Tim
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">{team.name}</h1>
            <p className="text-sm text-brand-text-muted mt-1">ID: {team.id}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setIsAddOpen(true); loadAvailableUsers(); }} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 transition text-sm font-semibold flex items-center gap-2">
              <UserPlus size={14} /> Tambah Anggota
            </button>
          </div>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border p-6 space-y-6 mb-6">
        <div>
          <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Deskripsi Tim</div>
          <p className="text-sm text-brand-text">{team.description || 'Tidak ada deskripsi'}</p>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border bg-brand-muted/30 flex items-center gap-2">
          <Users size={16} className="text-brand-text-muted" />
          <h3 className="text-sm font-bold text-brand-text">Anggota Tim ({members.length})</h3>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center text-brand-text-muted">Belum ada anggota di tim ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-primary/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">No</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Nama</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {members.map((m, i) => (
                  <tr key={m.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 text-brand-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-brand-text">{m.users?.name}</td>
                    <td className="px-4 py-3 text-brand-text-muted">{m.users?.email}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleRemoveMember(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition" title="Keluarkan">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH ANGGOTA */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-md flex flex-col">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-text">Tambah Anggota Tim</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-brand-text-muted hover:text-brand-accent text-2xl">×</button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Pilih User <span className="text-red-500">*</span></label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text"
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
            <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium">Batal</button>
              <button onClick={handleAddMember} disabled={submitting || !selectedUser} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}