import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Calendar as CalendarIcon, Clock, Users, AlertCircle, AlertTriangle,
  CheckCircle2, Plus, Search, Filter, Eye, Pencil, Trash2, X,
  ChevronLeft, ChevronRight, Download, ShieldCheck, Check,
  List, AlertOctagon, UserCheck, RefreshCw, Layers, MapPin, Flag, Bell,
  FileSpreadsheet, FileText, CheckCircle
} from 'lucide-react';
import ScheduleShow from './Show';

export default function SchedulesIndex() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Database State
  const [schedules, setSchedules] = useState([]);
  const [dbOrders, setDbOrders] = useState([]);
  const [dbTeams, setDbTeams] = useState([]);
  const [dbConflicts, setDbConflicts] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Active View / Detail Subpage
  const [detailSchedule, setDetailSchedule] = useState(null);

  // Modals State
  const [exportOpen, setExportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedScheduleForReassign, setSelectedScheduleForReassign] = useState(null);
  const [targetTeamId, setTargetTeamId] = useState('');

  // Export Modal Filters
  const [exportRange, setExportRange] = useState('all');
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportTeamFilter, setExportTeamFilter] = useState('all');

  // Create Modal Form State (Matching image_d2cc6c.png)
  const [formData, setFormData] = useState({
    order_id: '',
    team_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '09:00',
    jam_selesai: '15:00',
    milestone: 'Tahap 1 — Penarikan Kabel Backbone & Rack Setup',
    catatan_sop: 'Wajib safety shoes, kartu identitas tamu di lobby barat, koordinasi security lt. basement.',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load real data from Database via backend API
  const loadData = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/schedules')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const list = Array.isArray(d.data) ? d.data : [];
          setSchedules(list);
          setDbOrders(Array.isArray(d.orders) ? d.orders : []);
          setDbTeams(Array.isArray(d.teams) ? d.teams : []);
          setDbConflicts(Array.isArray(d.conflicts) ? d.conflicts : []);

          // Inisialisasi default form jika orders/teams ada
          if (d.orders && d.orders.length > 0 && !formData.order_id) {
            setFormData(prev => ({
              ...prev,
              order_id: String(d.orders[0].id),
              team_id: d.teams && d.teams.length > 0 ? String(d.teams[0].id) : '',
            }));
          }
        } else {
          setError(d.message || 'Gagal memuat jadwal dari database');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Gagal terhubung ke backend Express: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered schedules from database
  const filtered = schedules.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.order_number.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q) ||
      s.service_name.toLowerCase().includes(q) ||
      s.team_lead.toLowerCase().includes(q);

    const matchTeam = teamFilter === 'all' || s.team_name.toLowerCase().includes(teamFilter.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchSearch && matchTeam && matchStatus;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((validCurrentPage - 1) * pageSize, validCurrentPage * pageSize);

  // Dynamic KPIs derived 100% from database
  const totalAssignments = schedules.length;
  const inProgressCount = schedules.filter(s => s.status === 'in_progress').length;
  const conflictCount = dbConflicts.length || schedules.filter(s => s.has_conflict).length;
  const activeConflict = schedules.find(s => s.has_conflict) || dbConflicts[0];
  const availableTeamsCount = dbTeams.length > 0 ? Math.max(1, dbTeams.length - inProgressCount) : 0;

  // Selected order details for Create Modal
  const selectedOrderObj = dbOrders.find(o => String(o.id) === String(formData.order_id)) || dbOrders[0];
  const selectedTeamObj = dbTeams.find(t => String(t.id) === String(formData.team_id)) || dbTeams[0];

  // Dynamic AI Conflict Detection in Create Modal
  const modalConflictCheck = () => {
    if (!formData.team_id || !formData.tanggal) return { hasConflict: false };
    const matchingAssigned = schedules.find(s =>
      String(s.team_id) === String(formData.team_id) &&
      s.start_date_project &&
      new Date(s.start_date_project).toISOString().split('T')[0] === formData.tanggal &&
      String(s.id) !== String(formData.order_id)
    );
    if (matchingAssigned) {
      return {
        hasConflict: true,
        message: `${selectedTeamObj?.name || 'Tim ini'} telah dialokasikan pada order #${matchingAssigned.order_number} (${matchingAssigned.customer_name}) pada tanggal yang sama.`,
      };
    }
    return { hasConflict: false };
  };

  const currentModalConflict = modalConflictCheck();

  // Handle Save / Submit New Schedule & Allocation to Database
  const handleCreateScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.order_id) {
      showToast('error', 'Silakan pilih order terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        order_id: Number(formData.order_id),
        team_id: formData.team_id ? Number(formData.team_id) : null,
        start_date_project: `${formData.tanggal}T${formData.jam_mulai}:00.000Z`,
        end_date_project: `${formData.tanggal}T${formData.jam_selesai}:00.000Z`,
        status: 'in_progress',
        title: formData.milestone || 'Alokasi Proyek & Penugasan Lapangan',
        notes: formData.catatan_sop,
      };

      const res = await fetch('/api/v1/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Jadwal dan alokasi tim berhasil disimpan ke database!');
        setCreateOpen(false);
        loadData(); // Reload live data from database
      } else {
        showToast('error', data.message || 'Gagal menyimpan jadwal ke database.');
      }
    } catch (err) {
      showToast('error', 'Koneksi error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Reassign Team to Database
  const handleExecuteReassign = async () => {
    if (!selectedScheduleForReassign || !targetTeamId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/schedules/${selectedScheduleForReassign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: Number(targetTeamId) }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Alokasi tim berhasil diperbarui di database!');
        setReassignModalOpen(false);
        setSelectedScheduleForReassign(null);
        loadData();
      } else {
        showToast('error', data.message || 'Gagal mengupdate tim.');
      }
    } catch (err) {
      showToast('error', 'Koneksi error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Real Export to CSV/Text from Database Records
  const handleExportDownload = () => {
    if (schedules.length === 0) {
      showToast('error', 'Tidak ada data jadwal untuk diekspor.');
      return;
    }

    const exportList = schedules.filter(s => {
      const matchTeam = exportTeamFilter === 'all' || s.team_name.toLowerCase().includes(exportTeamFilter.toLowerCase());
      return matchTeam;
    });

    if (exportFormat === 'xlsx' || exportFormat === 'csv') {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'NO ORDER,PELANGGAN,ALAMAT,LAYANAN,TIM TEKNISI,LEAD PIC,TANGGAL,JAM,STATUS\n';
      exportList.forEach(item => {
        const row = [
          `"${item.order_number}"`,
          `"${item.customer_name}"`,
          `"${item.customer_address}"`,
          `"${item.service_name}"`,
          `"${item.team_name}"`,
          `"${item.team_lead}"`,
          `"${item.scheduled_date}"`,
          `"${item.scheduled_time}"`,
          `"${item.status_label}"`,
        ].join(',');
        csvContent += row + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Agenda-Jadwal-Tekna-${new Date().toISOString().split('T')[0]}.${exportFormat === 'xlsx' ? 'csv' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Berhasil mengunduh agenda database (${exportList.length} baris)!`);
      setExportOpen(false);
    } else {
      // PDF / TXT format
      let doc = `AGENDA PENUGASAN PROYEK & MONITORING JADWAL TEKNA\nTanggal Export: ${new Date().toLocaleString('id-ID')}\nTotal Data: ${exportList.length}\n\n`;
      exportList.forEach((s, idx) => {
        doc += `${idx + 1}. [${s.order_number}] ${s.customer_name}\n   Layanan: ${s.service_name}\n   Tim: ${s.team_name} (Lead: ${s.team_lead})\n   Waktu: ${s.scheduled_date} (${s.scheduled_time})\n   Status: ${s.status_label}\n\n`;
      });

      const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agenda-Tekna-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Dokumen agenda berhasil diunduh!');
      setExportOpen(false);
    }
  };

  // If user opened detail subview
  if (detailSchedule) {
    return (
      <ScheduleShow
        schedule={detailSchedule}
        scheduleId={detailSchedule.id}
        onBack={() => setDetailSchedule(null)}
        onUpdate={() => loadData()}
      />
    );
  }

  return (
    <RoleLayout>
      <Head title="Schedules & Project Assignment - Tekna" />

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

      {/* TOP HEADER & BREADCRUMB */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-text-muted mb-1.5">
            <span>Dashboard</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400 font-semibold">Schedules</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-text tracking-tight">
              Schedules & Project Assignment
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary border border-brand-border text-cyan-400">
              • Database Live Sync ({schedules.length} Order)
            </span>
          </div>
          <p className="text-xs text-brand-text-muted mt-1">
            Manajemen alokasi tim teknis dan monitoring jadwal aktif (Terkoneksi Database MySQL)
          </p>
        </div>

        {/* Top Right Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExportOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-brand-secondary hover:bg-brand-tertiary border border-brand-border text-brand-text text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <Download size={14} className="text-slate-300" /> Export Agenda
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Plus size={15} strokeWidth={2.5} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* CRITICAL CONFLICT BANNER IF DATABASE HAS CONFLICT */}
      {conflictCount > 0 && activeConflict && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/35 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-red-950/30">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  PERINGATAN BENTROK JADWAL (DATABASE REAL-TIME)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/30 text-red-300">
                  {conflictCount} Konflik Terdeteksi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeConflict.conflict_desc || activeConflict.description || 'Terdeteksi tim dengan alokasi waktu pengerjaan yang bertabrakan di database.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const targetOrder = schedules.find(s => s.has_conflict) || schedules[0];
                setSelectedScheduleForReassign(targetOrder);
                setTargetTeamId(dbTeams[0] ? String(dbTeams[0].id) : '');
                setReassignModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Atur Ulang Tim
            </button>
            <button
              onClick={() => {
                const targetOrder = schedules.find(s => s.has_conflict) || schedules[0];
                if (targetOrder) setDetailSchedule(targetOrder);
              }}
              className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-secondary border border-brand-border text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">
        
        {/* Total Jadwal */}
        <div className="p-4 rounded-xl bg-brand-secondary border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-brand-text-muted font-medium">Total Jadwal</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-brand-text">{totalAssignments}</span>
              <span className="text-[11px] text-brand-text-muted">Order</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold mt-1 inline-block">
              ↗ Live di Database
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <CalendarIcon size={18} />
          </div>
        </div>

        {/* Sedang Berjalan */}
        <div className="p-4 rounded-xl bg-brand-secondary border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-brand-text-muted font-medium">Sedang Berjalan</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-brand-text">{inProgressCount}</span>
              <span className="text-[11px] text-brand-text-muted">Proyek Aktif</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-semibold mt-1 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> On Duty
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
        </div>

        {/* Overlapping / Bentrok */}
        <div className="p-4 rounded-xl bg-brand-secondary border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-brand-text-muted font-medium">Overlapping / Bentrok</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${conflictCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {conflictCount}
              </span>
              <span className="text-[11px] text-brand-text-muted">Konflik</span>
            </div>
            <span className={`text-[10px] font-semibold mt-1 inline-block ${conflictCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {conflictCount > 0 ? '⚠ Butuh Re-assign' : '✓ Jadwal Aman'}
            </span>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${conflictCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
            <AlertOctagon size={18} />
          </div>
        </div>

        {/* Tim Tersedia */}
        <div className="p-4 rounded-xl bg-brand-secondary border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-brand-text-muted font-medium">Tim Terdaftar</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-brand-text">{dbTeams.length}</span>
              <span className="text-[11px] text-brand-text-muted">Tim Lapangan</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
              {availableTeamsCount} Tim Standby
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
        </div>

        {/* Mode Tampilan Switcher */}
        <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-border flex flex-col justify-between">
          <span className="text-[11px] text-brand-text-muted font-medium">Mode Tampilan</span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-brand-primary rounded-lg border border-brand-border mt-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-brand-text-muted hover:text-white'
              }`}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition ${
                viewMode === 'calendar'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-brand-text-muted hover:text-white'
              }`}
            >
              <CalendarIcon size={13} /> Kalender
            </button>
          </div>
        </div>

      </div>

      {/* FILTER & TOOLBAR */}
      <div className="p-3.5 rounded-xl bg-brand-secondary border border-brand-border mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Filter Tim (From DB) */}
          <select
            value={teamFilter}
            onChange={(e) => { setTeamFilter(e.target.value); setCurrentPage(1); }}
            className="bg-brand-primary border border-brand-border text-brand-text text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Tim ({dbTeams.length})</option>
            {dbTeams.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-brand-primary border border-brand-border text-brand-text text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">Diproses / In Progress</option>
            <option value="ready">Siap</option>
            <option value="completed">Selesai</option>
          </select>

          {/* Refresh DB Button */}
          <button
            onClick={loadData}
            title="Refresh data dari database"
            className="p-1.5 rounded-lg bg-brand-primary border border-brand-border text-brand-text-muted hover:text-cyan-400 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari order, pelanggan, layanan..."
              className="w-full bg-brand-primary border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-brand-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Aman
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Berjalan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Bentrok Waktu
          </span>
        </div>
      </div>

      {/* VIEW MODE: LIST TABLE */}
      {viewMode === 'list' && (
        <div className="rounded-xl bg-brand-secondary border border-brand-border overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-primary/50 text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">NO ORDER & PELANGGAN</th>
                  <th className="py-3 px-4">LAYANAN & PROJECT</th>
                  <th className="py-3 px-4">TIM PENANGGUNG JAWAB</th>
                  <th className="py-3 px-4">PROGRESS PEMBUATAN</th>
                  <th className="py-3 px-4">WAKTU & TANGGAL</th>
                  <th className="py-3 px-4 text-center">VALIDASI BENTROK</th>
                  <th className="py-3 px-4 text-center">STATUS JADWAL</th>
                  <th className="py-3 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-text-muted">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-cyan-400" />
                      Memuat jadwal dari database MySQL...
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-text-muted">
                      <AlertCircle size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
                      {search || teamFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tidak ada data jadwal yang sesuai dengan filter.'
                        : 'Belum ada data penugasan jadwal di database. Klik "+ Tambah Jadwal" untuk membuat.'}
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-primary/40 transition">
                      
                      {/* No Order & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            item.has_conflict ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            #{item.order_number}
                          </span>
                          <div>
                            <p className="font-bold text-brand-text leading-tight">{item.customer_name}</p>
                            <p className="text-[11px] text-brand-text-muted mt-0.5 truncate max-w-[180px]">{item.customer_address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Service & Project */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-brand-text">{item.service_name}</p>
                        <p className="text-[11px] text-brand-text-muted mt-0.5 truncate max-w-[200px]">{item.project_detail}</p>
                      </td>

                      {/* Team */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {item.team_initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{item.team_name}</p>
                            <p className="text-[11px] text-brand-text-muted">Lead: {item.team_lead}</p>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4 min-w-[150px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-brand-text-muted">{item.progress_stage}</span>
                          <span className="font-bold text-brand-text">{item.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{ width: `${item.progress_percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Time & Date */}
                      <td className="py-3.5 px-4">
                        <p className={`font-semibold ${item.has_conflict ? 'text-red-400' : 'text-brand-text'}`}>
                          {item.scheduled_date}
                        </p>
                        <p className={`text-[11px] ${item.has_conflict ? 'text-red-400 font-medium' : 'text-brand-text-muted'}`}>
                          {item.scheduled_time}
                        </p>
                      </td>

                      {/* Validasi Bentrok */}
                      <td className="py-3.5 px-4 text-center">
                        {item.has_conflict ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            Bentrok Waktu
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Aman
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          item.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          item.status === 'ready' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' :
                          'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}>
                          {item.status_label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.has_conflict && (
                            <button
                              onClick={() => {
                                setSelectedScheduleForReassign(item);
                                setTargetTeamId(dbTeams[0] ? String(dbTeams[0].id) : '');
                                setReassignModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] transition shadow-sm"
                            >
                              Re-assign
                            </button>
                          )}

                          <button
                            onClick={() => setDetailSchedule(item)}
                            title="Lihat Detail Penugasan"
                            className="p-1.5 rounded-lg text-brand-text-muted hover:text-cyan-400 hover:bg-brand-primary transition"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Interactive Pagination Footer */}
          <div className="p-3.5 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-text-muted">
            <span>
              Menampilkan {filtered.length === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1} – {Math.min(validCurrentPage * pageSize, filtered.length)} dari {filtered.length} Penugasan Terjadwal
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 rounded border border-brand-border hover:bg-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
              >
                Sebelumnya
              </button>
              
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    validCurrentPage === num
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'border border-brand-border hover:bg-brand-primary text-brand-text-muted'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 rounded border border-brand-border hover:bg-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition text-xs"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: CALENDAR (GANTT) */}
      {viewMode === 'calendar' && (
        <div className="rounded-xl bg-brand-secondary border border-brand-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-brand-text flex items-center gap-2">
              <CalendarIcon size={18} className="text-cyan-400" />
              Kalender Proyek & Penugasan (Bulan Berjalan)
            </h2>
            <button onClick={loadData} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <RefreshCw size={12} /> Sync Database
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-brand-text-muted py-1.5">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map(dateNum => {
              const matched = schedules.filter(s => {
                if (!s.start_date_project) return false;
                const d = new Date(s.start_date_project);
                return d.getDate() === dateNum;
              });

              return (
                <div
                  key={dateNum}
                  className="min-h-[90px] p-2 rounded-lg border bg-brand-primary/50 border-brand-border text-xs flex flex-col justify-between"
                >
                  <span className="font-bold text-slate-300">{dateNum}</span>
                  <div className="space-y-1 mt-1">
                    {matched.map(item => (
                      <div
                        key={item.id}
                        onClick={() => setDetailSchedule(item)}
                        className={`p-1 rounded text-[10px] truncate cursor-pointer font-medium ${
                          item.has_conflict ? 'bg-red-500/30 text-red-200' : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                        title={`${item.order_number} - ${item.customer_name}`}
                      >
                        {item.team_initial}: #{item.order_number}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOWER SECTION: TIMELINE & SLOT JAM KERJA AKTIF */}
      <div className="rounded-xl bg-brand-secondary border border-brand-border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-text">
                Timeline & Slot Jam Kerja Aktif Lapangan
              </h2>
              <p className="text-[11px] text-brand-text-muted">
                Visualisasi jadwal lapangan real-time per jam operasional dari database
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary border border-brand-border text-cyan-400">
            Jam Kerja: 08:00 - 18:00 WIB
          </span>
        </div>

        {/* Dynamic 3 Time Slot Cards from Database */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Order Aktif Pertama */}
          <div className="p-4 rounded-xl bg-brand-primary/80 border border-brand-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500 text-slate-950">
                  {schedules[0]?.scheduled_time ? schedules[0].scheduled_time.split(' ')[0] : '10:00 WIB'}
                </span>
                <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Live On Duty
                </span>
              </div>
              <h3 className="text-xs font-bold text-brand-text mt-1 truncate">
                {schedules[0] ? `${schedules[0].customer_name} (#${schedules[0].order_number})` : 'Belum Ada Penugasan'}
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-0.5 truncate">
                {schedules[0]?.service_name || 'Menunggu alokasi jadwal'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-brand-border text-xs">
              <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                ● {schedules[0]?.team_name || 'Tim Lapangan'}
              </span>
              <span className="font-bold text-cyan-400">{schedules[0]?.progress_percent || 0}% Progres</span>
            </div>
          </div>

          {/* Card 2: Status Bentrok atau Proyek Kedua */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-lg ${
            conflictCount > 0 ? 'bg-red-950/30 border-red-500/40 shadow-red-950/20' : 'bg-brand-primary/80 border-brand-border'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  conflictCount > 0 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-200'
                }`}>
                  13:30 WIB
                </span>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  conflictCount > 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {conflictCount > 0 ? <><AlertTriangle size={13} /> Bentrok Terdeteksi!</> : 'Slot Waktu Aman'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-brand-text mt-1 truncate">
                {conflictCount > 0 && activeConflict
                  ? (activeConflict.conflict_desc || `${activeConflict.customer_name} vs Order Lain`)
                  : (schedules[1] ? `${schedules[1].customer_name} (#${schedules[1].order_number})` : 'Antrean Bersih')}
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-0.5 truncate">
                {conflictCount > 0 ? 'Dua penugasan pada rentang waktu yang sama' : 'Tidak ada bentrok jadwal terdeteksi.'}
              </p>
            </div>
            <div className={`flex items-center justify-between pt-3 mt-3 border-t text-xs ${
              conflictCount > 0 ? 'border-red-500/30' : 'border-brand-border'
            }`}>
              <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                ● {activeConflict?.team_name || 'Tim B'}
              </span>
              {conflictCount > 0 ? (
                <button
                  onClick={() => {
                    const targetOrder = schedules.find(s => s.has_conflict) || schedules[0];
                    setSelectedScheduleForReassign(targetOrder);
                    setTargetTeamId(dbTeams[0] ? String(dbTeams[0].id) : '');
                    setReassignModalOpen(true);
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-300 underline"
                >
                  Selesaikan Segera
                </button>
              ) : (
                <span className="text-emerald-400 font-semibold">Terkonfirmasi</span>
              )}
            </div>
          </div>

          {/* Card 3: Proyek Ketiga / Standby */}
          <div className="p-4 rounded-xl bg-brand-primary/80 border border-brand-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-200">
                  15:30 WIB
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Slot Sore Berikutnya
                </span>
              </div>
              <h3 className="text-xs font-bold text-brand-text mt-1 truncate">
                {schedules[2] ? `${schedules[2].customer_name} (#${schedules[2].order_number})` : 'Slot Siap Pakai'}
              </h3>
              <p className="text-[11px] text-brand-text-muted mt-0.5 truncate">
                {schedules[2]?.service_name || 'Tim standby siap dipanggil'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-brand-border text-xs">
              <span className="font-semibold text-slate-300 truncate max-w-[150px]">
                ● {schedules[2]?.team_name || 'Tim Standby'}
              </span>
              <span className="font-semibold text-emerald-400">Standby Siap</span>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL TAMBAH JADWAL & ALOKASI PROYEK (EXACT MATCH image_d2cc6c.png) */}
      {/* ============================================================== */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-4xl shadow-2xl my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-brand-border flex items-start justify-between bg-brand-primary/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-brand-text">Tambah Jadwal & Alokasi Proyek</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-400">
                      TEKNA OPS
                    </span>
                  </div>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Alokasikan tim teknis, tentukan slot waktu, dan validasi bentrok jadwal pengerjaan secara real-time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-8 h-8 rounded-lg bg-brand-primary border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateScheduleSubmit}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
                
                {/* ============ LEFT COLUMN ============ */}
                <div className="space-y-4">
                  
                  {/* 1. Pilih Order / Pelanggan */}
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1.5">
                      Pilih Order / Pelanggan <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      required
                      className="w-full bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition shadow-sm"
                    >
                      {dbOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          #{o.order_number} - {o.customer_name} ({o.primary_service || o.services})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Ruang Lingkup Terdeteksi Card */}
                  <div className="p-4 rounded-xl bg-brand-primary border border-brand-border space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                        RUANG LINGKUP TERDETEKSI
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        High Priority (SLA 48h)
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text">
                          {selectedOrderObj?.primary_service || selectedOrderObj?.services || 'Enterprise Network Deployment'}
                        </h4>
                        <p className="text-[11px] text-brand-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[260px]">
                            {selectedOrderObj?.customer_address || 'Gedung Klien Lapangan, Jakarta'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-brand-border/60 text-[11px] text-brand-text-muted">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-cyan-400" /> Standar Mutu ISO
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} className="text-emerald-400" /> Surat Izin Kerja Terbit
                      </span>
                    </div>
                  </div>

                  {/* 3. Alokasi Tim Lapangan */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-brand-text">
                        Alokasi Tim Lapangan <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[11px] text-cyan-400 font-semibold">{dbTeams.length} Tim Aktif</span>
                    </div>

                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {dbTeams.map((t) => {
                        const isSelected = String(formData.team_id) === String(t.id);
                        return (
                          <div
                            key={t.id}
                            onClick={() => setFormData({ ...formData, team_id: String(t.id) })}
                            className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                                : 'bg-brand-primary border-brand-border hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="create_team_select"
                                checked={isSelected}
                                onChange={() => setFormData({ ...formData, team_id: String(t.id) })}
                                className="text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <p className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-brand-text'}`}>
                                  {t.name}
                                </p>
                                <p className="text-[11px] text-brand-text-muted">
                                  PIC: {t.lead_name} ({t.members_count} Teknisi)
                                </p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-500/15 text-emerald-400'
                            }`}>
                              {isSelected ? 'Terpilih' : 'Standby Lapangan'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Field Lead Engineer */}
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1">
                      Field Lead Engineer (On-Site PIC)
                    </label>
                    <div className="p-2.5 rounded-xl bg-brand-primary border border-brand-border flex items-center justify-between text-xs">
                      <span className="font-semibold text-brand-text">
                        {selectedTeamObj?.lead_name || 'Hendra Wijaya, S.Kom'} ({selectedTeamObj?.lead_id || 'TECH-042'})
                      </span>
                      <CheckCircle size={15} className="text-cyan-400" />
                    </div>
                  </div>

                </div>

                {/* ============ RIGHT COLUMN ============ */}
                <div className="space-y-4">
                  
                  {/* 1. Waktu Pelaksanaan */}
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1.5">
                      Waktu Pelaksanaan <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-brand-text-muted uppercase block mb-1">TANGGAL</span>
                        <input
                          type="date"
                          value={formData.tanggal}
                          onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                          required
                          className="w-full bg-brand-primary border border-brand-border rounded-xl px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-text-muted uppercase block mb-1">MULAI</span>
                        <input
                          type="time"
                          value={formData.jam_mulai}
                          onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                          required
                          className="w-full bg-brand-primary border border-brand-border rounded-xl px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-text-muted uppercase block mb-1">SELESAI (EST.)</span>
                        <input
                          type="time"
                          value={formData.jam_selesai}
                          onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                          required
                          className="w-full bg-brand-primary border border-brand-border rounded-xl px-2.5 py-2 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. AI Overlap Guard Engine Card */}
                  <div className="p-4 rounded-xl bg-brand-primary border border-brand-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-brand-text">
                        <span className={`w-2 h-2 rounded-full ${currentModalConflict.hasConflict ? 'bg-red-500' : 'bg-emerald-400'}`} />
                        AI Overlap Guard Engine
                      </div>
                      <span className={`text-[11px] font-bold ${currentModalConflict.hasConflict ? 'text-red-400' : 'text-emerald-400'}`}>
                        {currentModalConflict.hasConflict ? '● Status: Konflik Jadwal' : '● Status: Zero Conflict'}
                      </span>
                    </div>

                    <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      currentModalConflict.hasConflict
                        ? 'bg-red-950/30 border-red-500/30 text-red-300'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {currentModalConflict.hasConflict ? (
                        <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">
                          {currentModalConflict.hasConflict ? 'Peringatan Bentrok Jadwal Terdeteksi!' : 'Slot Waktu Aman Terkonfirmasi'}
                        </p>
                        <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                          {currentModalConflict.hasConflict
                            ? currentModalConflict.message
                            : `${selectedTeamObj?.name || 'Tim Lapangan'} tidak memiliki jadwal bersamaan pada ${formData.tanggal} (${formData.jam_mulai} - ${formData.jam_selesai} WIB). Tim siap penugasan.`}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Bar Visual */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-brand-text-muted mb-1">
                        <span>DISTRIBUSI WAKTU {formData.tanggal}</span>
                        <span>08:00 — 18:00 WIB</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                        <div className="w-1/6 bg-slate-800 h-full" />
                        <div className="w-1/3 bg-cyan-500 h-full shadow-sm shadow-cyan-400" />
                        <div className="w-1/2 bg-slate-800 h-full" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-brand-text-muted mt-1.5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Alokasi Baru
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Tugas Lain
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Target / Milestone Pengerjaan */}
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1">
                      Target / Milestone Pengerjaan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.milestone}
                        onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                        placeholder="Contoh: Tahap 1 — Penarikan Kabel Backbone & Rack Setup"
                        className="w-full bg-brand-primary border border-brand-border rounded-xl pl-3 pr-8 py-2 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition"
                      />
                      <Flag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    </div>
                  </div>

                  {/* 4. Catatan Khusus & SOP Lapangan */}
                  <div>
                    <label className="text-xs font-semibold text-brand-text block mb-1">
                      Catatan Khusus & SOP Lapangan
                    </label>
                    <textarea
                      rows={2}
                      value={formData.catatan_sop}
                      onChange={(e) => setFormData({ ...formData, catatan_sop: e.target.value })}
                      placeholder="Instruksi khusus K3, permit to work, atau kontak koordinator..."
                      className="w-full bg-brand-primary border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-brand-border bg-brand-primary/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-brand-text-muted flex items-center gap-1.5">
                  <Bell size={13} className="text-cyan-400" /> Notifikasi otomatis tersinkronisasi ke Lead Engineer & Klien
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-brand-text-muted hover:text-white transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <CalendarIcon size={14} />
                    {saving ? 'Menyimpan ke Database...' : 'Simpan & Jadwalkan'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL REASSIGN TIM (Database Real-time) */}
      {/* ============================================================== */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <h3 className="text-base font-bold text-brand-text flex items-center gap-2">
                <Users size={18} className="text-red-400" /> Atur Ulang Tim Penugasan
              </h3>
              <button onClick={() => setReassignModalOpen(false)} className="text-brand-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Pilih tim teknis pengganti untuk order <span className="text-cyan-400 font-bold">#{selectedScheduleForReassign?.order_number}</span>. Data akan langsung terupdate ke database MySQL.
              </p>

              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {dbTeams.map((t) => (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      String(targetTeamId) === String(t.id)
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white'
                        : 'bg-brand-primary border-brand-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="reassign_team"
                        checked={String(targetTeamId) === String(t.id)}
                        onChange={() => setTargetTeamId(String(t.id))}
                        className="text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-brand-text">{t.name}</p>
                        <p className="text-[11px] text-brand-text-muted">Lead: {t.lead_name} ({t.members_count} Teknisi)</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Standby
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
              <button
                onClick={() => setReassignModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-brand-text-muted hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteReassign}
                disabled={saving || !targetTeamId}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition shadow-lg shadow-cyan-500/20"
              >
                {saving ? 'Menyimpan...' : 'Konfirmasi Re-assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL EXPORT AGENDA (Connected to Database) */}
      {/* ============================================================== */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text">Unduh Agenda Penugasan & Jadwal Proyek</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Unduh ringkasan penugasan tim dari database langsung dalam format siap guna.
                </p>
              </div>
              <button onClick={() => setExportOpen(false)} className="text-brand-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-5">
              
              {/* Section 1: Rentang Waktu */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand-text uppercase tracking-wider">
                    1. RENTANG WAKTU AGENDA
                  </span>
                  <span className="text-[11px] text-cyan-400">ⓘ Zona Waktu WIB (UTC+7)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'all', label: 'Semua Jadwal Database' },
                    { key: 'active', label: 'Proyek Aktif (In Progress)' },
                    { key: 'completed', label: 'Selesai Saja' },
                  ].map(tabItem => (
                    <button
                      key={tabItem.key}
                      onClick={() => setExportRange(tabItem.key)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center ${
                        exportRange === tabItem.key
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-brand-primary border border-brand-border text-brand-text-muted hover:text-white'
                      }`}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Filter Tim */}
              <div>
                <span className="text-xs font-bold text-brand-text uppercase tracking-wider block mb-2">
                  2. FILTER TIM PENUGASAN
                </span>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setExportTeamFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      exportTeamFilter === 'all'
                        ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                        : 'bg-brand-primary border border-brand-border text-brand-text-muted hover:text-white'
                    }`}
                  >
                    Semua Tim ({dbTeams.length})
                  </button>
                  {dbTeams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setExportTeamFilter(t.name)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        exportTeamFilter === t.name
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-300'
                          : 'bg-brand-primary border border-brand-border text-brand-text-muted hover:text-white'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Format Berkas */}
              <div>
                <span className="text-xs font-bold text-brand-text uppercase tracking-wider block mb-2">
                  3. FORMAT BERKAS EKSPOR
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'xlsx', label: 'Excel / CSV (.csv)', desc: 'Tabel lengkap data order, tim, PIC, & tanggal jadwal.' },
                    { key: 'txt', label: 'Dokumen Agenda (.txt)', desc: 'Format ringkasan teks siap cetak untuk briefing tim.' },
                  ].map(f => (
                    <div
                      key={f.key}
                      onClick={() => setExportFormat(f.key)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        exportFormat === f.key
                          ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                          : 'bg-brand-primary border-brand-border hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-brand-text">{f.label}</span>
                        {exportFormat === f.key && <Check size={14} className="text-cyan-400" />}
                      </div>
                      <p className="text-[10px] text-brand-text-muted">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-brand-border">
              <span className="text-[11px] text-brand-text-muted flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-400" /> Tervalidasi Sistem Operasional Tekna
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setExportOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-brand-text-muted hover:text-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleExportDownload}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Download size={14} /> Unduh Data Real (.{exportFormat})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </RoleLayout>
  );
}
