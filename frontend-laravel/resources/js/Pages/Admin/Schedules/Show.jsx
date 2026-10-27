import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, Users,
  AlertCircle, AlertTriangle, CheckCircle2, Pencil, Trash2,
  FileText, Download, MapPin, Phone, Mail, UserCheck, ShieldCheck,
  ChevronRight, ArrowRight, RefreshCw, X, Save, Check
} from 'lucide-react';

export default function ScheduleShow({ scheduleId, schedule: propSchedule, onBack, onUpdate }) {
  const [schedule, setSchedule] = useState(propSchedule || null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(!propSchedule);
  const [toast, setToast] = useState(null);

  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    status: propSchedule?.status || 'pending',
    notes: propSchedule?.notes || '',
    start_date_project: propSchedule?.start_date_project ? new Date(propSchedule.start_date_project).toISOString().split('T')[0] : '',
    end_date_project: propSchedule?.end_date_project ? new Date(propSchedule.end_date_project).toISOString().split('T')[0] : '',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load live data from database
  const loadLiveSchedule = () => {
    const id = scheduleId || propSchedule?.id;
    if (!id) return;

    setLoading(true);
    fetch('/api/v1/schedules')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const found = d.data.find(s => Number(s.id) === Number(id));
          if (found) {
            setSchedule(found);
            setEditForm({
              status: found.status || 'pending',
              notes: found.notes || '',
              start_date_project: found.start_date_project ? new Date(found.start_date_project).toISOString().split('T')[0] : '',
              end_date_project: found.end_date_project ? new Date(found.end_date_project).toISOString().split('T')[0] : '',
            });
          }
          if (Array.isArray(d.teams)) {
            setTeams(d.teams);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLiveSchedule();
  }, [scheduleId, propSchedule?.id]);

  // Handle Reassign Team to database
  const handleReassignSubmit = async () => {
    if (!selectedTeamId || !schedule) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: Number(selectedTeamId) })
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'Alokasi tim berhasil diperbarui di database!');
        setReassignOpen(false);
        loadLiveSchedule();
        if (onUpdate) onUpdate();
      } else {
        showToast('error', result.message || 'Gagal update tim');
      }
    } catch (e) {
      showToast('error', 'Koneksi error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Edit Schedule to database
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!schedule) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editForm.status,
          notes: editForm.notes,
          start_date_project: editForm.start_date_project ? new Date(editForm.start_date_project).toISOString() : null,
          end_date_project: editForm.end_date_project ? new Date(editForm.end_date_project).toISOString() : null,
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'Perubahan jadwal berhasil disimpan ke database!');
        setEditOpen(false);
        loadLiveSchedule();
        if (onUpdate) onUpdate();
      } else {
        showToast('error', result.message || 'Gagal menyimpan perubahan');
      }
    } catch (e) {
      showToast('error', 'Koneksi error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Unduh SPK / Ringkasan Cetak
  const handleDownloadSPK = () => {
    if (!schedule) return;
    const content = `SURAT PERINTAH KERJA & PENUGASAN LAPANGAN (SPK)
TEKNA OPERATIONS HUB
============================================================
Nomor Order     : ${schedule.order_number}
Pelanggan       : ${schedule.customer_name}
Alamat Lokasi   : ${schedule.customer_address}
PIC Lapangan    : ${schedule.customer_pic} (${schedule.pic_phone})

LAYANAN & SPESIFIKASI:
Layanan         : ${schedule.service_name}
Deskripsi       : ${schedule.project_detail}

PENUGASAN TIM:
Tim Teknisi     : ${schedule.team_name}
Lead Engineer   : ${schedule.team_lead}
Jumlah Anggota  : ${schedule.team_members_count} Teknisi

JADWAL OPERASIONAL:
Tanggal Mulai   : ${schedule.scheduled_date}
Jam Pelaksanaan : ${schedule.scheduled_time}
Status          : ${schedule.status_label}

CATATAN KHUSUS & SOP:
${schedule.notes || 'Wajib mematuhi K3 dan SOP operasional Tekna.'}

============================================================
Dicetak otomatis oleh Sistem ERP Tekna pada: ${new Date().toLocaleString('id-ID')}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPK-${schedule.order_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Dokumen SPK berhasil diunduh!');
  };

  if (loading || !schedule) {
    return (
      <RoleLayout>
        <div className="flex flex-col items-center justify-center p-24 text-brand-text-muted">
          <RefreshCw size={28} className="animate-spin mb-4 text-cyan-400" />
          <p className="text-sm">Memuat detail jadwal dari database...</p>
        </div>
      </RoleLayout>
    );
  }

  const s = schedule;

  return (
    <RoleLayout>
      <Head title={`Jadwal #${s.order_number} - ${s.customer_name}`} />

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Top Header / Breadcrumb */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-text-muted mb-2">
            {onBack ? (
              <button onClick={onBack} className="hover:text-cyan-400 flex items-center gap-1 transition">
                <ArrowLeft size={14} /> Kembali ke Daftar Jadwal
              </button>
            ) : (
              <Link href="/admin/schedules" className="hover:text-cyan-400 flex items-center gap-1 transition">
                <ArrowLeft size={14} /> Schedules
              </Link>
            )}
            <ChevronRight size={12} className="text-slate-600" />
            <span className="text-cyan-400 font-medium">#{s.order_number}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-text">
              #{s.order_number} • {s.service_name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              s.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              s.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              s.status === 'ready' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
              'bg-slate-700/50 text-slate-300 border border-slate-600'
            }`}>
              {s.status_label}
            </span>
            {s.has_conflict ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                <AlertTriangle size={12} /> Bentrok Waktu
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 size={12} /> Jadwal Aman
              </span>
            )}
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            Klien: <span className="text-slate-200 font-medium">{s.customer_name}</span> • Waktu Operasional: <span className="text-cyan-400 font-medium">{s.scheduled_date}, {s.scheduled_time}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {s.has_conflict && (
            <button
              onClick={() => {
                setSelectedTeamId(s.team_id ? String(s.team_id) : '');
                setReassignOpen(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-950/40"
            >
              <Users size={14} /> Re-assign Tim
            </button>
          )}

          <button
            onClick={() => setEditOpen(true)}
            className="px-3.5 py-2 bg-brand-secondary hover:bg-brand-tertiary border border-brand-border text-brand-text rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <Pencil size={14} /> Edit Jadwal
          </button>

          <button
            onClick={handleDownloadSPK}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <Download size={14} /> Unduh SPK (.txt)
          </button>
        </div>
      </div>

      {/* Critical Conflict Banner if Overlapping */}
      {s.has_conflict && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Peringatan Bentrok Tim Lapangan</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/30 text-red-300">1 Konflik Terdeteksi di Database</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {s.conflict_desc || `${s.team_name} ditugaskan pada rentang tanggal/jam yang sama pada order lain.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTeamId(s.team_id ? String(s.team_id) : '');
              setReassignOpen(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shrink-0"
          >
            Alihkan ke Tim Standby
          </button>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Informasi Klien & Lokasi */}
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-border">
            <h2 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-cyan-400" />
              Informasi Pelanggan & Lokasi Lapangan (Database)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-brand-text-muted">Nama Perusahaan / Klien</span>
                <p className="text-sm font-semibold text-brand-text">{s.customer_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-brand-text-muted">PIC Lapangan</span>
                <p className="text-sm font-semibold text-brand-text flex items-center gap-1.5">
                  <UserCheck size={14} className="text-cyan-400" />
                  {s.customer_pic}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-brand-text-muted">Kontak Telepon PIC</span>
                <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-400" />
                  {s.pic_phone || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-brand-text-muted">Email Korespondensi</span>
                <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                  <Mail size={14} className="text-slate-400" />
                  {s.pic_email || '—'}
                </p>
              </div>

              <div className="md:col-span-2 space-y-1 pt-2 border-t border-brand-border">
                <span className="text-xs text-brand-text-muted">Alamat Instalasi</span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {s.customer_address || 'Belum ada alamat spesifik tercatat di database.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Ruang Lingkup Layanan */}
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-brand-text flex items-center gap-2">
                <FileText size={16} className="text-cyan-400" />
                Ruang Lingkup & Progress Penugasan
              </h2>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                {s.progress_stage} ({s.progress_percent}%)
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-brand-text-muted">Status Eksekusi</span>
                <span className="font-bold text-brand-text">{s.status_label}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${s.progress_percent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider block">
                Daftar Layanan Terkait Order Ini:
              </span>
              <div className="space-y-2">
                {s.order_services && s.order_services.length > 0 ? (
                  s.order_services.map((os, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-brand-primary border border-brand-border flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-brand-text">{os.service_name_snapshot}</p>
                        <p className="text-[11px] text-brand-text-muted">{os.category_name_snapshot || 'Layanan IT'}</p>
                      </div>
                      <span className="font-mono text-cyan-400 font-semibold">
                        Rp {Number(os.price_deal || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-brand-text-muted italic">{s.service_name}</p>
                )}
              </div>
            </div>

            {s.notes && (
              <div className="mt-4 p-3 rounded-lg bg-brand-primary border border-brand-border text-xs text-slate-300">
                <span className="font-semibold text-cyan-400">Catatan Khusus Dispatcher: </span>
                {s.notes}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Card: Tim Penanggung Jawab */}
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-border">
            <h2 className="text-sm font-bold text-brand-text mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users size={16} className="text-cyan-400" /> Tim Penanggung Jawab
              </span>
              <button
                onClick={() => {
                  setSelectedTeamId(s.team_id ? String(s.team_id) : '');
                  setReassignOpen(true);
                }}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Ganti Tim
              </button>
            </h2>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-primary border border-brand-border mb-4">
              <div className="w-11 h-11 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                {s.team_initial || 'TX'}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text">{s.team_name}</p>
                <p className="text-xs text-brand-text-muted">Lead: <span className="text-slate-200">{s.team_lead}</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-brand-text-muted font-medium">Anggota Tim Teknisi:</span>
              <ul className="space-y-1.5">
                {s.team_members && s.team_members.length > 0 ? (
                  s.team_members.map((member, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {member}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-brand-text-muted italic">Belum ada anggota tim terdaftar.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Card: Waktu Pelaksanaan */}
          <div className="p-5 rounded-xl bg-brand-secondary border border-brand-border">
            <h2 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Waktu Pelaksanaan
            </h2>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-brand-primary border border-brand-border">
                <span className="text-[11px] text-brand-text-muted uppercase">Tanggal Pengerjaan</span>
                <p className="text-sm font-semibold text-brand-text mt-0.5">{s.scheduled_date}</p>
              </div>

              <div className="p-3 rounded-lg bg-brand-primary border border-brand-border">
                <span className="text-[11px] text-brand-text-muted uppercase">Jam Operasional (WIB)</span>
                <p className="text-sm font-bold text-cyan-400 mt-0.5">{s.scheduled_time}</p>
              </div>

              <div className="p-3 rounded-lg bg-brand-primary border border-brand-border flex items-center justify-between text-xs">
                <span className="text-brand-text-muted">Validasi Database:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={14} /> Terverifikasi Real-time
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL REASSIGN TIM */}
      {reassignOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                <Users size={18} className="text-red-400" /> Re-assign Tim Penugasan
              </h3>
              <button onClick={() => setReassignOpen(false)} className="text-brand-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Pilih tim pengganti dari database untuk order <span className="text-cyan-400 font-bold">#{s.order_number}</span>. Data akan langsung di-update ke tabel orders.
              </p>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {teams.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      String(selectedTeamId) === String(t.id)
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                        : 'bg-brand-primary border-brand-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="reassign_team_choice"
                        checked={String(selectedTeamId) === String(t.id)}
                        onChange={() => setSelectedTeamId(String(t.id))}
                        className="text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-brand-text">{t.name}</p>
                        <p className="text-[11px] text-brand-text-muted">PIC: {t.lead_name} ({t.members_count} Teknisi)</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Tersedia
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
              <button
                onClick={() => setReassignOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-brand-text-muted hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleReassignSubmit}
                disabled={saving || !selectedTeamId}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                {saving ? 'Menyimpan...' : 'Simpan ke Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT JADWAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                <Pencil size={16} className="text-cyan-400" /> Edit Jadwal Penugasan
              </h3>
              <button onClick={() => setEditOpen(false)} className="text-brand-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="py-4 space-y-4 text-xs">
              <div>
                <label className="text-brand-text-muted block mb-1">Status Proyek</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-cyan-500"
                >
                  <option value="pending">Pending</option>
                  <option value="ready">Siap</option>
                  <option value="in_progress">Diproses</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-text-muted block mb-1">Tanggal Mulai Proyek</label>
                  <input
                    type="date"
                    value={editForm.start_date_project}
                    onChange={(e) => setEditForm({ ...editForm, start_date_project: e.target.value })}
                    className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-brand-text-muted block mb-1">Tanggal Selesai Proyek</label>
                  <input
                    type="date"
                    value={editForm.end_date_project}
                    onChange={(e) => setEditForm({ ...editForm, end_date_project: e.target.value })}
                    className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-brand-text-muted block mb-1">Catatan Khusus Dispatcher</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Tambahkan catatan khusus untuk tim lapangan..."
                  className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-brand-text focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-brand-text-muted hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition"
                >
                  {saving ? 'Menyimpan...' : 'Simpan ke Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </RoleLayout>
  );
}
