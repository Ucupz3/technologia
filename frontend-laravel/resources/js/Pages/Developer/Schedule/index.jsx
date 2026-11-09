import { useEffect, useState, useMemo } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Users, Search, ChevronLeft, ChevronRight,
  Plus, TrendingUp, Briefcase, Layers, Eye, X, Check,
  Crown, RefreshCw, ArrowRight, ListFilter, UserCheck, Activity
} from 'lucide-react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'in_progress':
      return {
        label: 'Sedang Dikerjakan',
        color: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
        barColor: 'bg-blue-500',
        calendarBg: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-500'
      };
    case 'completed':
      return {
        label: 'Selesai',
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
        barColor: 'bg-emerald-500',
        calendarBg: 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500'
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        color: 'bg-red-500/15 text-red-400 border-red-500/40',
        barColor: 'bg-red-500',
        calendarBg: 'bg-red-600 text-white border-red-700 hover:bg-red-500'
      };
    case 'pending':
    default:
      return {
        label: 'Menunggu',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
        barColor: 'bg-amber-500',
        calendarBg: 'bg-amber-600 text-white border-amber-700 hover:bg-amber-500'
      };
  }
};

const formatDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function DeveloperSchedule() {
  const { auth } = usePage().props;
  const currentUser = auth?.user;

  // State data utama
  const [projects, setProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [stats, setStats] = useState({
    total_projects: 0,
    in_progress: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    upcoming_deadlines: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filter & View Mode
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'cards' | 'tasks'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Kalender
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Modal Detail Proyek
  const [selectedProject, setSelectedProject] = useState(null);

  // Modal Update Progres
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressProject, setProgressProject] = useState(null);
  const [progressForm, setProgressForm] = useState({
    title: '',
    description: '',
    progress_percentage: 50,
    notes: '',
  });
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Muat data dari Backend Express
  const loadData = () => {
    setLoading(true);
    setError('');

    const userIdParam = currentUser?.id ? `&user_id=${currentUser.id}` : '';
    const scopeParam = `&scope=${scope}`;
    const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';

    // Panggil endpoint backend schedule developer
    fetch(`/api/v1/schedules/developer?_t=${Date.now()}${userIdParam}${scopeParam}${statusParam}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Gagal memuat jadwal`);
        return res.json();
      })
      .then((resData) => {
        if (resData.success) {
          const data = resData.data || {};
          const projs = data.projects || [];
          setProjects(projs);
          setUpcomingTasks(data.upcoming_tasks || []);
          setStats(data.stats || {
            total_projects: projs.length,
            in_progress: projs.filter((p) => p.status === 'in_progress').length,
            pending: projs.filter((p) => p.status === 'pending').length,
            completed: projs.filter((p) => p.status === 'completed').length,
            overdue: projs.filter((p) => p.is_overdue).length,
            upcoming_deadlines: projs.filter(
              (p) => p.days_remaining !== null && p.days_remaining >= 0 && p.days_remaining <= 7 && p.status !== 'completed'
            ).length,
          });
        } else {
          // Fallback ke endpoint utama /api/v1/schedules jika endpoint developer belum ada
          return fetch(`/api/v1/schedules?_t=${Date.now()}${userIdParam}${scopeParam}${statusParam}`)
            .then((r) => r.json())
            .then((fallbackData) => {
              if (fallbackData.success) {
                const projs = fallbackData.data || [];
                setProjects(projs);
                setStats({
                  total_projects: projs.length,
                  in_progress: projs.filter((p) => p.status === 'in_progress').length,
                  pending: projs.filter((p) => p.status === 'pending').length,
                  completed: projs.filter((p) => p.status === 'completed').length,
                  overdue: projs.filter((p) => p.is_overdue).length,
                  upcoming_deadlines: projs.filter(
                    (p) => p.days_remaining !== null && p.days_remaining >= 0 && p.days_remaining <= 7 && p.status !== 'completed'
                  ).length,
                });
              } else {
                setError(fallbackData.message || 'Gagal memuat jadwal');
              }
            });
        }
      })
      .catch((err) => {
        setError(err.message || 'Gagal tersambung ke backend API');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [scope, statusFilter]);

  // Filter pencarian
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.toLowerCase();
    return projects.filter((p) => {
      const matchOrder = p.order_number?.toLowerCase().includes(term);
      const matchCust = (p.customer_name || p.customer_name_snapshot)?.toLowerCase().includes(term);
      const matchService = p.services?.some((s) => s.name?.toLowerCase().includes(term));
      const matchJob = p.my_assignment?.job_name?.toLowerCase().includes(term);
      return matchOrder || matchCust || matchService || matchJob;
    });
  }, [projects, search]);

  // Navigasi Kalender
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Logika Pembuatan Grid Kalender Bulanan Gantt Style
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const weeks = [];
    let currentWeek = Array(firstDay).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      currentWeek.push(i);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return weeks.map((week) => {
      const validDates = week.filter((d) => d !== null);
      if (validDates.length === 0) return { week, events: [] };

      const weekStartDate = new Date(currentYear, currentMonth, validDates[0]);
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(currentYear, currentMonth, validDates[validDates.length - 1]);
      weekEndDate.setHours(23, 59, 59, 999);

      const weekEvents = filteredProjects
        .filter((order) => {
          if (!order.start_date_project) return false;
          const start = new Date(order.start_date_project);
          const end = order.end_date_project ? new Date(order.end_date_project) : new Date(start);
          return start <= weekEndDate && end >= weekStartDate;
        })
        .map((order) => {
          const orderStart = new Date(order.start_date_project);
          const orderEnd = order.end_date_project ? new Date(order.end_date_project) : new Date(orderStart);

          let startCol = 0;
          if (orderStart > weekStartDate) {
            for (let i = 0; i < 7; i++) {
              if (week[i] !== null) {
                const d = new Date(currentYear, currentMonth, week[i]);
                if (d >= new Date(orderStart.getFullYear(), orderStart.getMonth(), orderStart.getDate())) {
                  startCol = i;
                  break;
                }
              }
            }
          }

          let endCol = 6;
          if (orderEnd < weekEndDate) {
            for (let i = 6; i >= 0; i--) {
              if (week[i] !== null) {
                const d = new Date(currentYear, currentMonth, week[i]);
                if (d <= new Date(orderEnd.getFullYear(), orderEnd.getMonth(), orderEnd.getDate())) {
                  endCol = i;
                  break;
                }
              }
            }
          }

          return { ...order, startCol, endCol };
        });

      weekEvents.sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));

      const tracks = [];
      weekEvents.forEach((event) => {
        let placed = false;
        for (let i = 0; i < tracks.length; i++) {
          const hasOverlap = tracks[i].some((e) => !(event.endCol < e.startCol || event.startCol > e.endCol));
          if (!hasOverlap) {
            tracks[i].push(event);
            event.track = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          event.track = tracks.length;
          tracks.push([event]);
        }
      });

      return { week, events: weekEvents };
    });
  }, [currentYear, currentMonth, filteredProjects]);

  // Handler Buka Modal Update Progres
  const openProgressModal = (project) => {
    setProgressProject(project);
    setProgressForm({
      title: `Update Progres ${project.order_number}`,
      description: '',
      progress_percentage: project.progress_percentage || 0,
      notes: '',
    });
    setIsProgressModalOpen(true);
  };

  // Submit Progres Baru
  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!progressProject) return;

    if (!progressForm.title.trim()) {
      showToast('error', 'Judul progres wajib diisi');
      return;
    }

    setSubmittingProgress(true);
    try {
      const payload = {
        title: progressForm.title.trim(),
        description: progressForm.description.trim() || null,
        progress_percentage: Number(progressForm.progress_percentage),
        notes: progressForm.notes.trim() || null,
        user_id: currentUser?.id || null,
        assignment_id: progressProject.my_assignment?.assignment_id || null,
      };

      const res = await fetch(`/api/v1/orders/${progressProject.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast('success', 'Progres pengerjaan berhasil dicatat!');
        setIsProgressModalOpen(false);
        loadData();
        if (selectedProject && selectedProject.id === progressProject.id) {
          setSelectedProject((prev) => ({
            ...prev,
            progress_percentage: payload.progress_percentage,
          }));
        }
      } else {
        showToast('error', resJson.message || 'Gagal menyimpan progres');
      }
    } catch (err) {
      showToast('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmittingProgress(false);
    }
  };

  return (
    <RoleLayout>
      <Head title="Developer Schedule — Jadwal Kerja" />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 border transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            : 'bg-red-950/90 text-red-200 border-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-text">Jadwal Kerja Developer</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
              Developer Portal
            </span>
          </div>
          <p className="text-sm text-brand-text-muted mt-1">
            Pantau rentang waktu proyek, penugasan peran kerja, dan target penyelesaian tugas Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Toggle: Proyek Saya vs Semua Proyek */}
          <div className="inline-flex rounded-lg border border-brand-border bg-brand-secondary p-1">
            <button
              onClick={() => setScope('mine')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                scope === 'mine'
                  ? 'bg-brand-accent text-brand-primary shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <UserCheck size={14} /> Tugas Saya
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                scope === 'all'
                  ? 'bg-brand-accent text-brand-primary shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Users size={14} /> Semua Proyek Tim
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            title="Muat Ulang Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-brand-accent' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Total Proyek</span>
            <Briefcase size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-brand-text">{stats.total_projects}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">{scope === 'mine' ? 'Ditugaskan ke Anda' : 'Total Proyek Aktif'}</div>
        </div>

        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Sedang Berjalan</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.in_progress}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">Fase pengerjaan</div>
        </div>

        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Menunggu</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">Belum dimulai</div>
        </div>

        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Selesai</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">Order terselesaikan</div>
        </div>

        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Deadline Dekat</span>
            <Clock size={16} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{stats.upcoming_deadlines}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">Kurang dari 7 hari</div>
        </div>

        <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-text-muted mb-2">
            <span className="text-xs font-medium">Terlambat</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.overdue}</div>
          <div className="text-[11px] text-brand-text-muted mt-1">Lewat batas waktu</div>
        </div>
      </div>

      {/* Filter Bar & View Mode Toggle */}
      <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order, customer, atau layanan..."
            className="w-full pl-9 pr-4 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
            <ListFilter size={14} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border text-brand-text text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-brand-accent"
          >
            <option value="all">Semua Status</option>
            <option value="in_progress">Sedang Dikerjakan</option>
            <option value="pending">Menunggu (Pending)</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="cancelled">Dibatalkan</option>
          </select>

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-brand-border bg-brand-primary p-0.5">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <CalendarIcon size={14} /> Kalender
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Layers size={14} /> Kartu Proyek
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                viewMode === 'tasks'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Clock size={14} /> Agenda Tugas
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="underline text-xs hover:text-white">Coba lagi</button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && projects.length === 0 ? (
        <div className="p-16 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-sm font-medium">Memuat jadwal kerja developer...</p>
        </div>
      ) : (
        <>
          {/* ========================================================
              VIEW 1: KALENDER GANTT CHART
             ======================================================== */}
          {viewMode === 'calendar' && (
            <div className="bg-brand-secondary border border-brand-border rounded-xl shadow-sm overflow-hidden mb-6">
              {/* Header Bulan Kalender */}
              <div className="p-4 border-b border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={20} className="text-brand-accent" />
                  <h2 className="text-lg font-bold text-brand-text">
                    {MONTHS[currentMonth]} {currentYear}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 bg-brand-primary border border-brand-border text-brand-text rounded-lg text-xs font-semibold hover:bg-brand-muted transition"
                  >
                    Hari Ini
                  </button>
                  <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 bg-brand-primary hover:bg-brand-muted text-brand-text transition"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 bg-brand-primary hover:bg-brand-muted text-brand-text transition border-l border-brand-border"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend Status */}
              <div className="px-4 py-2.5 bg-brand-primary/50 border-b border-brand-border flex flex-wrap items-center gap-4 text-xs">
                <span className="text-brand-text-muted font-medium">Keterangan:</span>
                <span className="flex items-center gap-1.5 text-brand-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> In Progress
                </span>
                <span className="flex items-center gap-1.5 text-brand-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending
                </span>
                <span className="flex items-center gap-1.5 text-brand-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-brand-text">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Cancelled
                </span>
                <span className="flex items-center gap-1.5 text-brand-text ml-auto text-[11px] text-brand-text-muted">
                  💡 Klik pada bar proyek untuk melihat rincian & tugas
                </span>
              </div>

              {/* Grid Hari Min-Sab */}
              <div className="grid grid-cols-7 border-b border-brand-border text-center text-xs font-semibold py-2.5 text-brand-text-muted bg-brand-primary/30">
                {DAYS.map((day, idx) => (
                  <div key={day} className={idx === 0 || idx === 6 ? 'text-red-400' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Tanggal & Gantt Bars */}
              <div className="divide-y divide-brand-border">
                {calendarData.map((weekData, wIdx) => {
                  const maxTrack = weekData.events.reduce((max, e) => Math.max(max, e.track || 0), -1);
                  const trackHeight = 34;
                  const containerHeight = Math.max(90, (maxTrack + 1) * trackHeight + 42);

                  return (
                    <div key={wIdx} className="relative min-h-[90px]" style={{ height: `${containerHeight}px` }}>
                      {/* Grid 7 Kolom Tanggal */}
                      <div className="absolute inset-0 grid grid-cols-7 divide-x divide-brand-border">
                        {weekData.week.map((day, dIdx) => {
                          const isToday =
                            day !== null &&
                            day === today.getDate() &&
                            currentMonth === today.getMonth() &&
                            currentYear === today.getFullYear();

                          return (
                            <div
                              key={dIdx}
                              className={`p-1.5 transition ${
                                day === null
                                  ? 'bg-brand-primary/20'
                                  : isToday
                                  ? 'bg-brand-accent/5'
                                  : 'hover:bg-brand-primary/30'
                              }`}
                            >
                              {day !== null && (
                                <span
                                  className={`inline-block text-xs font-bold w-6 h-6 leading-6 text-center rounded-full ${
                                    isToday
                                      ? 'bg-brand-accent text-brand-primary shadow'
                                      : dIdx === 0 || dIdx === 6
                                      ? 'text-red-400'
                                      : 'text-brand-text-muted'
                                  }`}
                                >
                                  {day}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Baris Event Proyek (Gantt Chart Bars) */}
                      <div className="absolute inset-0 pointer-events-none pt-8">
                        {weekData.events.map((event) => {
                          const badge = getStatusBadge(event.status);
                          const leftPct = (event.startCol / 7) * 100;
                          const widthPct = ((event.endCol - event.startCol + 1) / 7) * 100;
                          const topPx = (event.track || 0) * trackHeight;

                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedProject(event)}
                              style={{
                                left: `calc(${leftPct}% + 4px)`,
                                width: `calc(${widthPct}% - 8px)`,
                                top: `${topPx}px`,
                              }}
                              className={`absolute h-7 rounded-md px-2 flex items-center justify-between text-xs font-medium cursor-pointer transition shadow-sm pointer-events-auto border truncate ${badge.calendarBg}`}
                              title={`${event.order_number} - ${event.customer_name} (${formatDateShort(event.start_date_project)} s/d ${formatDateShort(event.end_date_project)})`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {event.my_assignment?.is_lead && <Crown size={12} className="text-amber-200 shrink-0" />}
                                <span className="font-bold truncate">{event.order_number}</span>
                                <span className="opacity-90 truncate hidden sm:inline">• {event.customer_name}</span>
                              </div>
                              <span className="text-[10px] opacity-90 pl-1 shrink-0 font-semibold">
                                {event.progress_percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: KARTU PROYEK (CARD LIST VIEW)
             ======================================================== */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-brand-secondary border border-brand-border rounded-xl">
                  <Briefcase size={36} className="mx-auto text-brand-text-muted mb-3 opacity-60" />
                  <p className="text-base font-medium text-brand-text">Tidak ada proyek yang cocok</p>
                  <p className="text-xs text-brand-text-muted mt-1">Coba ganti filter status atau kata kunci pencarian Anda</p>
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const badge = getStatusBadge(project.status);

                  return (
                    <div
                      key={project.id}
                      className="bg-brand-secondary border border-brand-border hover:border-brand-accent/50 rounded-xl p-5 shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Card: Order No & Status */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-brand-accent">
                              {project.order_number}
                            </span>
                            <h3 className="text-base font-bold text-brand-text leading-tight mt-0.5">
                              {project.customer_name}
                            </h3>
                          </div>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Layanan & Role Developer */}
                        <div className="space-y-2 mb-4 text-xs">
                          {project.services && project.services.length > 0 && (
                            <div className="text-brand-text-muted flex items-start gap-1.5">
                              <Layers size={14} className="text-brand-accent shrink-0 mt-0.5" />
                              <span className="line-clamp-1">
                                {project.services.map((s) => s.name).join(', ')}
                              </span>
                            </div>
                          )}

                          {project.my_assignment && (
                            <div className="flex items-center gap-1.5 bg-brand-primary/60 border border-brand-border rounded-md px-2.5 py-1 text-brand-text">
                              {project.my_assignment.is_lead ? (
                                <Crown size={13} className="text-amber-400 shrink-0" />
                              ) : (
                                <Briefcase size={13} className="text-blue-400 shrink-0" />
                              )}
                              <span className="font-semibold text-brand-text">
                                {project.my_assignment.job_name || 'Developer'}
                              </span>
                              {project.my_assignment.is_lead && (
                                <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">
                                  Lead
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-brand-text-muted font-medium">Progres Pengerjaan</span>
                            <span className="font-bold text-brand-text">{project.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-brand-primary h-2 rounded-full overflow-hidden border border-brand-border">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${badge.barColor}`}
                              style={{ width: `${project.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Jadwal Tanggal & Sisa Hari */}
                        <div className="bg-brand-primary/40 rounded-lg p-3 text-xs space-y-1.5 border border-brand-border/60 mb-4">
                          <div className="flex items-center justify-between text-brand-text-muted">
                            <span className="flex items-center gap-1">
                              <CalendarIcon size={12} /> Mulai:
                            </span>
                            <span className="font-medium text-brand-text">{formatDateShort(project.start_date_project)}</span>
                          </div>
                          <div className="flex items-center justify-between text-brand-text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> Deadline:
                            </span>
                            <span className="font-medium text-brand-text">{formatDateShort(project.end_date_project)}</span>
                          </div>
                          {project.days_remaining !== null && (
                            <div className="pt-1 border-t border-brand-border/40 flex items-center justify-between font-semibold">
                              <span className="text-brand-text-muted text-[11px]">Sisa Waktu:</span>
                              {project.is_overdue ? (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <AlertTriangle size={12} /> Terlambat {Math.abs(project.days_remaining)} hari
                                </span>
                              ) : project.days_remaining === 0 ? (
                                <span className="text-amber-400">Hari ini terakhir!</span>
                              ) : (
                                <span className="text-emerald-400">{project.days_remaining} hari tersisa</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Anggota Tim Lainnya */}
                        {project.assignments && project.assignments.length > 0 && (
                          <div className="mb-4">
                            <div className="text-[11px] text-brand-text-muted mb-1.5 font-medium flex items-center gap-1">
                              <Users size={12} /> Tim Proyek ({project.assignments.length}):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {project.assignments.slice(0, 4).map((m, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded bg-brand-primary border border-brand-border text-brand-text-muted flex items-center gap-1"
                                  title={`${m.user_name} (${m.job_name})`}
                                >
                                  {m.is_lead && <Crown size={10} className="text-amber-400" />}
                                  {m.user_name?.split(' ')[0]}
                                </span>
                              ))}
                              {project.assignments.length > 4 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary text-brand-text-muted">
                                  +{project.assignments.length - 4} lainnya
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-brand-border flex items-center gap-2">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="flex-1 py-1.5 px-3 bg-brand-primary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
                        >
                          <Eye size={13} /> Rincian
                        </button>
                        <button
                          onClick={() => openProgressModal(project)}
                          className="flex-1 py-1.5 px-3 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Plus size={13} /> Catat Progres
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================
              VIEW 3: AGENDA TUGAS & DEADLINE MENDATANG
             ======================================================== */}
          {viewMode === 'tasks' && (
            <div className="bg-brand-secondary border border-brand-border rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-brand-text">Agenda Tugas & Deadline Mendatang</h2>
                  <p className="text-xs text-brand-text-muted">Urutan prioritas proyek berdasarkan tanggal target selesai</p>
                </div>
              </div>

              <div className="divide-y divide-brand-border">
                {filteredProjects.length === 0 ? (
                  <div className="p-12 text-center text-brand-text-muted">Tidak ada jadwal tugas saat ini</div>
                ) : (
                  filteredProjects
                    .slice()
                    .sort((a, b) => new Date(a.end_date_project || 9999999999999) - new Date(b.end_date_project || 9999999999999))
                    .map((item) => {
                      const badge = getStatusBadge(item.status);

                      return (
                        <div key={item.id} className="p-4 hover:bg-brand-primary/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-lg border shrink-0 ${badge.color}`}>
                              <Briefcase size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-brand-accent">{item.order_number}</span>
                                <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                                {item.my_assignment?.is_lead && (
                                  <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center gap-1">
                                    <Crown size={10} /> Lead
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-brand-text mt-0.5">{item.customer_name}</h3>
                              <p className="text-xs text-brand-text-muted">
                                Peran: <strong className="text-brand-text">{item.my_assignment?.job_name || 'Developer'}</strong>
                                {item.services?.[0] ? ` • ${item.services[0].name}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 self-end sm:self-center">
                            <div className="text-right">
                              <div className="text-xs text-brand-text-muted">Batas Waktu:</div>
                              <div className="text-sm font-bold text-brand-text">{formatDateShort(item.end_date_project)}</div>
                              {item.days_remaining !== null && (
                                <div className={`text-[11px] font-semibold ${item.is_overdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {item.is_overdue ? `Terlambat ${Math.abs(item.days_remaining)} hari` : `${item.days_remaining} hari tersisa`}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openProgressModal(item)}
                                className="px-3 py-1.5 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition shadow-sm"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => setSelectedProject(item)}
                                className="p-1.5 bg-brand-primary border border-brand-border hover:bg-brand-muted text-brand-text rounded-lg transition"
                                title="Lihat Detail"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================
          MODAL DETAIL PROYEK
         ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Header Modal */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-secondary z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-accent/20 text-brand-accent rounded-lg">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-accent">{selectedProject.order_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(selectedProject.status).color}`}>
                      {getStatusBadge(selectedProject.status).label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-brand-text">{selectedProject.customer_name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg hover:bg-brand-primary transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Konten Modal */}
            <div className="p-6 space-y-6">
              {/* Ringkasan Durasi & Progres */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-brand-primary/60 border border-brand-border rounded-xl">
                <div>
                  <div className="text-[11px] text-brand-text-muted font-medium">Tanggal Mulai</div>
                  <div className="text-sm font-bold text-brand-text mt-0.5">{formatDateShort(selectedProject.start_date_project)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-brand-text-muted font-medium">Target Selesai (Deadline)</div>
                  <div className="text-sm font-bold text-brand-text mt-0.5">{formatDateShort(selectedProject.end_date_project)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-brand-text-muted font-medium">Progres Saat Ini</div>
                  <div className="text-sm font-bold text-brand-accent mt-0.5">{selectedProject.progress_percentage}% Selesai</div>
                </div>
              </div>

              {/* Progress Bar Visual */}
              <div>
                <div className="w-full bg-brand-primary h-3 rounded-full overflow-hidden border border-brand-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getStatusBadge(selectedProject.status).barColor}`}
                    style={{ width: `${selectedProject.progress_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Detail Layanan */}
              {selectedProject.services && selectedProject.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Layanan yang Dikerjakan</h4>
                  <div className="space-y-2">
                    {selectedProject.services.map((s, idx) => (
                      <div key={idx} className="p-3 bg-brand-primary border border-brand-border rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-brand-text">{s.name}</div>
                          {s.category && <div className="text-brand-text-muted text-[11px]">Kategori: {s.category}</div>}
                        </div>
                        <span className="font-mono text-brand-accent font-semibold">Qty: {s.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rekan Tim yang Ditugaskan */}
              <div>
                <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Tim & Penugasan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedProject.assignments && selectedProject.assignments.length > 0 ? (
                    selectedProject.assignments.map((member, idx) => (
                      <div key={idx} className="p-3 bg-brand-primary border border-brand-border rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent font-bold flex items-center justify-center text-xs">
                            {member.user_name ? member.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-brand-text flex items-center gap-1">
                              {member.user_name}
                              {member.is_lead && <Crown size={12} className="text-amber-400" />}
                            </div>
                            <div className="text-brand-text-muted text-[11px]">{member.job_name || 'Developer'}</div>
                          </div>
                        </div>
                        {member.is_lead && (
                          <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded font-bold">
                            Lead
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-brand-text-muted italic">Belum ada tim yang ditugaskan</div>
                  )}
                </div>
              </div>

              {/* Catatan / Catatan Proyek */}
              {selectedProject.notes && (
                <div>
                  <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Catatan & Petunjuk Proyek</h4>
                  <div className="p-3.5 bg-brand-primary border border-brand-border rounded-lg text-xs text-brand-text whitespace-pre-line leading-relaxed">
                    {selectedProject.notes}
                  </div>
                </div>
              )}

              {/* Riwayat Progres Pengerjaan */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Riwayat Update Progres</h4>
                  <button
                    onClick={() => {
                      openProgressModal(selectedProject);
                    }}
                    className="text-xs text-brand-accent hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus size={12} /> Tambah Update
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedProject.recent_progress && selectedProject.recent_progress.length > 0 ? (
                    selectedProject.recent_progress.map((prog, idx) => (
                      <div key={idx} className="p-3 bg-brand-primary border border-brand-border rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-text">{prog.title}</span>
                          <span className="font-mono text-brand-accent font-semibold">{prog.progress_percentage}%</span>
                        </div>
                        {prog.description && <p className="text-brand-text-muted">{prog.description}</p>}
                        <div className="text-[10px] text-brand-text-muted pt-1 flex items-center justify-between border-t border-brand-border/40">
                          <span>Oleh: {prog.author_name} ({prog.author_job || 'Dev'})</span>
                          <span>{formatDateShort(prog.created_at)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center bg-brand-primary/40 border border-brand-border rounded-lg text-xs text-brand-text-muted">
                      Belum ada riwayat progres yang dicatat untuk proyek ini.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-brand-border bg-brand-primary/40 flex items-center justify-end gap-2.5 rounded-b-2xl">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-brand-secondary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-lg transition"
              >
                Tutup
              </button>
              <button
                onClick={() => openProgressModal(selectedProject)}
                className="px-4 py-2 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} /> Catat Progres Kerja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL FORM UPDATE PROGRES KERJA CEPAT
         ======================================================== */}
      {isProgressModalOpen && progressProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-secondary">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-brand-accent" />
                <div>
                  <h3 className="text-base font-bold text-brand-text">Catat Progres Pengerjaan</h3>
                  <p className="text-xs text-brand-text-muted">{progressProject.order_number} • {progressProject.customer_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="text-brand-text-muted hover:text-brand-text p-1 rounded-lg hover:bg-brand-primary transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-6 space-y-4">
              {/* Judul Aktivitas */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">
                  Aktivitas / Milestone Yang Dikerjakan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={progressForm.title}
                  onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })}
                  placeholder="Misal: Menyelesaikan slicing UI & integrasi API login"
                  className="w-full px-3.5 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Slider Persentase */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-text">Tingkat Penyelesaian (Progres)</label>
                  <span className="text-sm font-bold font-mono text-brand-accent">
                    {progressForm.progress_percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressForm.progress_percentage}
                  onChange={(e) => setProgressForm({ ...progressForm, progress_percentage: Number(e.target.value) })}
                  className="w-full accent-brand-accent cursor-pointer h-2 bg-brand-primary rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-brand-text-muted mt-1 font-mono">
                  <span>0% (Belum)</span>
                  <span>50% (Separuh)</span>
                  <span>100% (Selesai)</span>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">Deskripsi Pekerjaan (Opsional)</label>
                <textarea
                  rows="3"
                  value={progressForm.description}
                  onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
                  placeholder="Jelaskan modul yang sudah selesai atau kendala yang dihadapi..."
                  className="w-full px-3.5 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent resize-none"
                ></textarea>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={progressForm.notes}
                  onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                  placeholder="Catatan untuk Lead / PM..."
                  className="w-full px-3.5 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Footer Form */}
              <div className="pt-4 border-t border-brand-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  disabled={submittingProgress}
                  className="px-4 py-2 bg-brand-primary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProgress}
                  className="px-4 py-2 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingProgress ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan Progres</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

