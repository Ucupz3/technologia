import { useEffect, useState, useMemo } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Users, Search, ChevronLeft, ChevronRight,
  Plus, TrendingUp, Briefcase, Layers, Eye, X, Check,
  Crown, RefreshCw, ArrowRight, ListFilter, UserCheck, Activity,
  ChevronDown, ChevronUp, FileText
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
        calendarBg: 'bg-blue-600/95 hover:bg-blue-600 text-white border-blue-400/60 shadow-sm',
        dotColor: 'bg-blue-300',
      };
    case 'completed':
      return {
        label: 'Selesai',
        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
        barColor: 'bg-emerald-500',
        calendarBg: 'bg-emerald-600/95 hover:bg-emerald-600 text-white border-emerald-400/60 shadow-sm',
        dotColor: 'bg-emerald-300',
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        color: 'bg-red-500/15 text-red-400 border-red-500/40',
        barColor: 'bg-red-500',
        calendarBg: 'bg-red-600/95 hover:bg-red-600 text-white border-red-400/60 shadow-sm',
        dotColor: 'bg-red-300',
      };
    case 'pending':
    default:
      return {
        label: 'Menunggu',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
        barColor: 'bg-amber-500',
        calendarBg: 'bg-amber-600/95 hover:bg-amber-600 text-white border-amber-400/60 shadow-sm',
        dotColor: 'bg-amber-300',
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
  const [showAllCards, setShowAllCards] = useState(false);

  // Kalender
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [calendarDensity, setCalendarDensity] = useState('expanded'); // 'compact' | 'expanded'
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const toggleWeekExpand = (wIdx) => {
    setExpandedWeeks((prev) => ({ ...prev, [wIdx]: !prev[wIdx] }));
  };

  // Modal Detail Proyek
  const [selectedProject, setSelectedProject] = useState(null);

  // Modal Update Progres / Log Aktivitas
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [modalType, setModalType] = useState('progress'); // 'progress' | 'activity'
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
      if (validDates.length === 0) return { week, events: [], maxTrack: -1 };

      const firstValidCol = week.findIndex((d) => d !== null);
      const lastValidCol = 6 - [...week].reverse().findIndex((d) => d !== null);

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

          // Cari kolom mulai di minggu ini (dibatasi firstValidCol)
          let startCol = firstValidCol;
          for (let i = firstValidCol; i <= lastValidCol; i++) {
            if (week[i] !== null) {
              const d = new Date(currentYear, currentMonth, week[i], 0, 0, 0);
              const os = new Date(orderStart);
              os.setHours(0, 0, 0, 0);
              if (d >= os) {
                startCol = i;
                break;
              }
            }
          }

          // Cari kolom selesai di minggu ini (dibatasi lastValidCol)
          let endCol = lastValidCol;
          for (let i = lastValidCol; i >= firstValidCol; i--) {
            if (week[i] !== null) {
              const d = new Date(currentYear, currentMonth, week[i], 23, 59, 59);
              const oe = new Date(orderEnd);
              oe.setHours(23, 59, 59);
              if (d <= oe) {
                endCol = i;
                break;
              }
            }
          }

          if (startCol > endCol) startCol = endCol;

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

      const maxTrack = weekEvents.reduce((max, e) => Math.max(max, e.track || 0), -1);

      return { week, events: weekEvents, maxTrack };
    });
  }, [currentYear, currentMonth, filteredProjects]);

  // Handler Buka Modal Log Aktivitas Harian (Tambah Update)
  const openActivityModal = (project) => {
    if (!project.my_assignment) {
      showToast('error', 'Hanya anggota tim yang ditugaskan pada proyek ini yang dapat mencatat aktivitas.');
      return;
    }
    setProgressProject(project);
    setModalType('activity');
    setProgressForm({
      title: '',
      description: '',
      progress_percentage: project.progress_percentage || 0,
      notes: '',
    });
    setIsProgressModalOpen(true);
  };

  // Handler Buka Modal Update Persentase Progres Proyek (Catat Progres)
  const openProgressModal = (project) => {
    if (!project.my_assignment) {
      showToast('error', 'Hanya anggota tim yang ditugaskan pada proyek ini yang dapat mengubah progres.');
      return;
    }
    setProgressProject(project);
    setModalType('progress');
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

    if (!progressProject.my_assignment) {
      showToast('error', 'Hanya anggota tim yang ditugaskan pada proyek ini yang dapat mengubah progres.');
      return;
    }

    if (!progressProject.assignments || progressProject.assignments.length === 0) {
      showToast('error', 'Proyek ini belum memiliki penugasan tim. Harap tugaskan tim terlebih dahulu.');
      return;
    }

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
        showToast(
          'success',
          modalType === 'activity'
            ? 'Catatan aktivitas berhasil ditambahkan!'
            : 'Progres proyek berhasil diperbarui!'
        );
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
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 border transition-all ${toast.type === 'success'
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${scope === 'mine'
                  ? 'bg-brand-accent text-brand-primary shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
                }`}
            >
              <UserCheck size={14} /> Tugas Saya
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${scope === 'all'
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
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === 'calendar'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
                }`}
            >
              <CalendarIcon size={14} /> Kalender
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === 'cards'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
                }`}
            >
              <Layers size={14} /> Kartu Proyek
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === 'tasks'
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
              {/* Header Bulan Kalender & Kontrol Tampilan */}
              <div className="p-4 border-b border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-accent/15 text-brand-accent rounded-lg border border-brand-accent/20">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-brand-text">
                        {MONTHS[currentMonth]} {currentYear}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-brand-primary text-brand-text-muted border border-brand-border">
                        {filteredProjects.length} Proyek
                      </span>
                    </div>
                    <p className="text-xs text-brand-text-muted">
                      {scope === 'mine' ? 'Jadwal proyek yang ditugaskan ke Anda' : 'Jadwal seluruh proyek tim'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Mode Kerapatan Bar Kalender (Density) */}
                  <div className="inline-flex rounded-lg border border-brand-border bg-brand-primary p-0.5 text-xs">
                    <button
                      onClick={() => setCalendarDensity('expanded')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${calendarDensity === 'expanded'
                          ? 'bg-brand-accent text-brand-primary font-bold shadow-sm'
                          : 'text-brand-text-muted hover:text-brand-text'
                        }`}
                      title="Tampilkan seluruh bar proyek secara detail"
                    >
                      Tampilkan Semua Bar
                    </button>
                    <button
                      onClick={() => setCalendarDensity('compact')}
                      className={`px-2.5 py-1 rounded-md transition font-medium ${calendarDensity === 'compact'
                          ? 'bg-brand-accent text-brand-primary font-bold shadow-sm'
                          : 'text-brand-text-muted hover:text-brand-text'
                        }`}
                      title="Tampilkan maksimal 3 bar per minggu (lebih ringkas)"
                    >
                      Ringkas (Maks. 3)
                    </button>
                  </div>

                  {/* Navigasi Bulan */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={goToToday}
                      className="px-3 py-1.5 bg-brand-primary border border-brand-border text-brand-text rounded-lg text-xs font-semibold hover:bg-brand-muted transition shadow-sm"
                    >
                      Hari Ini
                    </button>
                    <div className="flex items-center border border-brand-border rounded-lg overflow-hidden bg-brand-primary shadow-sm">
                      <button
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-brand-muted text-brand-text transition"
                        title="Bulan Sebelumnya"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-brand-muted text-brand-text transition border-l border-brand-border"
                        title="Bulan Berikutnya"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend Status */}
              <div className="px-4 py-2.5 bg-brand-primary/50 border-b border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-brand-text-muted font-medium">Status:</span>
                  <span className="flex items-center gap-1.5 text-brand-text">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span> In Progress
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> Pending
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Completed
                  </span>
                  <span className="flex items-center gap-1.5 text-brand-text">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> Cancelled
                  </span>
                </div>
                <span className="text-[11px] text-brand-text-muted">
                  💡 Klik pada bar proyek untuk melihat rincian & tugas
                </span>
              </div>

              {/* Grid Hari Min-Sab */}
              <div className="grid grid-cols-7 border-b border-brand-border text-center text-xs font-bold py-2.5 text-brand-text-muted bg-brand-primary/40 uppercase tracking-wider">
                {DAYS.map((day, idx) => (
                  <div key={day} className={idx === 0 || idx === 6 ? 'text-red-400/90' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Tanggal & Gantt Bars */}
              <div className="divide-y divide-brand-border">
                {calendarData.map((weekData, wIdx) => {
                  const barHeight = 25;
                  const barGap = 4;
                  const trackStep = barHeight + barGap; // 29px
                  const paddingTop = 6;
                  const paddingBottom = 8;
                  const maxVisibleTracks = 3;

                  const isWeekExpanded = calendarDensity === 'expanded' || Boolean(expandedWeeks[wIdx]);
                  const hasHiddenEvents = weekData.events.some((e) => (e.track || 0) >= maxVisibleTracks);
                  const hiddenCount = weekData.events.filter((e) => (e.track || 0) >= maxVisibleTracks).length;

                  const visibleEvents = isWeekExpanded
                    ? weekData.events
                    : weekData.events.filter((e) => (e.track || 0) < maxVisibleTracks);

                  const currentVisibleTracks = isWeekExpanded
                    ? (weekData.maxTrack + 1)
                    : Math.min(weekData.maxTrack + 1, maxVisibleTracks);

                  let eventAreaHeight = paddingTop + currentVisibleTracks * trackStep + paddingBottom;
                  if (hasHiddenEvents && !isWeekExpanded) {
                    eventAreaHeight += 26; // ruang untuk tombol +X lainnya
                  } else if (hasHiddenEvents && isWeekExpanded && calendarDensity === 'compact') {
                    eventAreaHeight += 24; // ruang untuk tombol sembunyikan
                  }
                  if (eventAreaHeight < 52) eventAreaHeight = 52; // min height jika kosong

                  return (
                    <div key={wIdx} className="bg-brand-secondary transition">
                      {/* 1. ROW TANGGAL: Selalu Berada di Paling Atas (TIDAK AKAN PERNAH TERTUTUP) */}
                      <div className="grid grid-cols-7 divide-x divide-brand-border/40 bg-brand-primary/25 border-b border-brand-border/30 h-9">
                        {weekData.week.map((day, dIdx) => {
                          const isToday =
                            day !== null &&
                            day === today.getDate() &&
                            currentMonth === today.getMonth() &&
                            currentYear === today.getFullYear();
                          const isWeekend = dIdx === 0 || dIdx === 6;

                          return (
                            <div
                              key={dIdx}
                              className={`px-2 py-1 flex items-center justify-between text-xs transition ${day === null
                                  ? 'bg-brand-primary/20'
                                  : isToday
                                    ? 'bg-brand-accent/15'
                                    : isWeekend
                                      ? 'bg-brand-muted/10'
                                      : ''
                                }`}
                            >
                              {day !== null ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center justify-center font-bold text-xs rounded-full transition-all ${isToday
                                          ? 'bg-brand-accent text-brand-primary w-6 h-6 shadow'
                                          : isWeekend
                                            ? 'text-red-400 font-bold w-6 h-6'
                                            : 'text-brand-text w-6 h-6'
                                        }`}
                                    >
                                      {day}
                                    </span>
                                    {isToday && (
                                      <span className="text-[10px] font-bold text-brand-accent hidden sm:inline px-1.5 py-0.2 rounded bg-brand-accent/10 border border-brand-accent/30">
                                        Hari Ini
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-brand-text-muted/60 hidden md:inline">
                                    {DAYS[dIdx]}
                                  </span>
                                </>
                              ) : (
                                <span />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 2. ROW GANTT EVENTS: Berada di Bawah Tanggal (Dedicated Container) */}
                      <div className="relative" style={{ height: `${eventAreaHeight}px` }}>
                        {/* Grid Kolom Background */}
                        <div className="absolute inset-0 grid grid-cols-7 divide-x divide-brand-border/30 pointer-events-none">
                          {weekData.week.map((day, dIdx) => (
                            <div
                              key={dIdx}
                              className={`h-full ${day === null
                                  ? 'bg-brand-primary/10'
                                  : dIdx === 0 || dIdx === 6
                                    ? 'bg-brand-muted/5'
                                    : ''
                                }`}
                            />
                          ))}
                        </div>

                        {/* Baris Event Proyek */}
                        {visibleEvents.map((event) => {
                          const badge = getStatusBadge(event.status);
                          const leftPct = (event.startCol / 7) * 100;
                          const widthPct = ((event.endCol - event.startCol + 1) / 7) * 100;
                          const topPx = paddingTop + (event.track || 0) * trackStep;

                          return (
                            <div
                              key={event.id}
                              onClick={() => setSelectedProject(event)}
                              style={{
                                left: `calc(${leftPct}% + 4px)`,
                                width: `calc(${widthPct}% - 8px)`,
                                top: `${topPx}px`,
                              }}
                              className={`absolute h-[25px] rounded-md px-2 flex items-center justify-between text-xs cursor-pointer transition shadow-sm border truncate z-10 hover:brightness-110 ${badge.calendarBg}`}
                              title={`${event.order_number} - ${event.customer_name} (${formatDateShort(event.start_date_project)} s/d ${formatDateShort(event.end_date_project)})`}
                            >
                              <div className="flex items-center gap-1.5 truncate mr-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} shrink-0`} />
                                {event.my_assignment?.is_lead && (
                                  <Crown size={11} className="text-amber-300 shrink-0" title="Project Lead" />
                                )}
                                <span className="font-mono font-bold text-[11px] shrink-0 tracking-tight">
                                  {event.order_number}
                                </span>
                                <span className="opacity-90 text-[11px] truncate hidden sm:inline">
                                  • {event.customer_name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/10 shrink-0">
                                {event.progress_percentage}%
                              </span>
                            </div>
                          );
                        })}

                        {/* Tombol "+X Proyek Lainnya" jika Mode Compact */}
                        {hasHiddenEvents && !isWeekExpanded && (
                          <div
                            style={{ top: `${paddingTop + maxVisibleTracks * trackStep}px` }}
                            className="absolute left-2 right-2 flex items-center justify-center z-10"
                          >
                            <button
                              onClick={() => toggleWeekExpand(wIdx)}
                              className="text-[11px] font-semibold text-brand-accent hover:text-brand-accent2 bg-brand-primary/95 border border-brand-accent/30 hover:border-brand-accent px-3 py-0.5 rounded-full shadow-sm transition flex items-center gap-1"
                            >
                              + {hiddenCount} proyek lainnya di minggu ini <ChevronDown size={13} />
                            </button>
                          </div>
                        )}

                        {/* Tombol "Sembunyikan" jika Week ini di-expand secara manual di Mode Compact */}
                        {hasHiddenEvents && isWeekExpanded && calendarDensity === 'compact' && (
                          <div
                            style={{ top: `${paddingTop + (weekData.maxTrack + 1) * trackStep}px` }}
                            className="absolute left-2 right-2 flex items-center justify-center z-10"
                          >
                            <button
                              onClick={() => toggleWeekExpand(wIdx)}
                              className="text-[10px] font-semibold text-brand-text-muted hover:text-brand-text bg-brand-primary/80 border border-brand-border px-2.5 py-0.5 rounded-full transition flex items-center gap-1"
                            >
                              Sembunyikan sebagian <ChevronUp size={12} />
                            </button>
                          </div>
                        )}
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
          {viewMode === 'cards' && (() => {
            const displayedProjects = showAllCards ? filteredProjects : filteredProjects.slice(0, 6);

            return (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-brand-secondary border border-brand-border rounded-xl">
                      <Briefcase size={36} className="mx-auto text-brand-text-muted mb-3 opacity-60" />
                      <p className="text-base font-medium text-brand-text">Tidak ada proyek yang cocok</p>
                      <p className="text-xs text-brand-text-muted mt-1">Coba ganti filter status atau kata kunci pencarian Anda</p>
                    </div>
                  ) : (
                    displayedProjects.map((project) => {
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
                            {project.my_assignment ? (
                              <button
                                onClick={() => openProgressModal(project)}
                                className="flex-1 py-1.5 px-3 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Plus size={13} /> Catat Progres
                              </button>
                            ) : (
                              <span
                                className="flex-1 py-1.5 px-2 bg-brand-secondary border border-brand-border/60 text-brand-text-muted text-[11px] font-medium rounded-lg text-center select-none"
                                title="Hanya tim yang ditugaskan yang dapat mencatat progres"
                              >
                                Bukan Tim Anda
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Tombol Tampilkan Semua Kartu jika proyek > 6 */}
                {filteredProjects.length > 6 && (
                  <div className="mt-6 pt-2 flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => setShowAllCards(!showAllCards)}
                      className="px-6 py-2.5 bg-brand-secondary border border-brand-border hover:border-brand-accent/50 text-brand-text hover:text-brand-accent text-xs font-bold rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2 group hover:bg-brand-muted"
                    >
                      <span>
                        {showAllCards
                          ? 'Tampilkan Lebih Sedikit (6 Kartu)'
                          : `Tampilkan Semua Kartu (${filteredProjects.length} Proyek)`}
                      </span>
                      {showAllCards ? (
                        <ChevronUp size={16} className="text-brand-accent transition-transform group-hover:-translate-y-0.5" />
                      ) : (
                        <ChevronDown size={16} className="text-brand-accent transition-transform group-hover:translate-y-0.5" />
                      )}
                    </button>
                    <span className="text-[11px] text-brand-text-muted font-medium">
                      {showAllCards
                        ? `Menampilkan seluruh ${filteredProjects.length} proyek`
                        : `Menampilkan 6 dari ${filteredProjects.length} proyek`}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

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
                  <div>
                    <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Riwayat Update Progres</h4>
                    <p className="text-[11px] text-brand-text-muted mt-0.5">Catatan aktivitas dan log kemajuan dari tim developer</p>
                  </div>
                  {selectedProject.my_assignment ? (
                    <button
                      onClick={() => openActivityModal(selectedProject)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
                    >
                      <FileText size={12} /> Tambah Aktivitas
                    </button>
                  ) : (
                    <span className="text-[11px] text-brand-text-muted px-2.5 py-1 rounded bg-brand-primary border border-brand-border select-none">
                      Hanya Tim Proyek
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {selectedProject.recent_progress && selectedProject.recent_progress.length > 0 ? (
                    selectedProject.recent_progress.map((prog, idx) => (
                      <div key={idx} className="p-3.5 bg-brand-primary border border-brand-border rounded-xl text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-text text-sm">{prog.title}</span>
                          <span className="font-mono text-brand-accent font-bold px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
                            {prog.progress_percentage}%
                          </span>
                        </div>

                        {prog.description && (
                          <div className="text-brand-text-muted leading-relaxed">
                            <span className="text-[11px] font-semibold text-brand-text block mb-0.5">Deskripsi Pekerjaan:</span>
                            <p className="bg-brand-secondary/60 p-2 rounded-lg border border-brand-border/40 text-[11px] text-brand-text-muted whitespace-pre-line">
                              {prog.description}
                            </p>
                          </div>
                        )}

                        {prog.notes && (
                          <div className="text-brand-text-muted leading-relaxed">
                            <span className="text-[11px] font-semibold text-amber-400 block mb-0.5">Catatan Tambahan (Lead/PM):</span>
                            <p className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-200 text-[11px] whitespace-pre-line">
                              {prog.notes}
                            </p>
                          </div>
                        )}

                        <div className="text-[10px] text-brand-text-muted pt-1.5 flex items-center justify-between border-t border-brand-border/40">
                          <span className="flex items-center gap-1">
                            {prog.is_lead && <Crown size={11} className="text-amber-400" />}
                            Oleh: <strong className="text-brand-text">{prog.author_name}</strong> ({prog.author_job || 'Developer'})
                          </span>
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
            <div className="p-4 border-t border-brand-border bg-brand-primary/40 flex items-center justify-between gap-2.5 rounded-b-2xl">
              <div>
                {!selectedProject.my_assignment && (
                  <span className="text-xs text-brand-text-muted flex items-center gap-1.5">
                    <Users size={13} className="text-brand-text-muted" /> Mode Baca (Bukan Tim Ditugaskan)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 bg-brand-secondary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-lg transition"
                >
                  Tutup
                </button>
                {selectedProject.my_assignment && (
                  <button
                    onClick={() => openProgressModal(selectedProject)}
                    className="px-4 py-2 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    <TrendingUp size={14} /> Update Progres Proyek (%)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL FORM: CATAT AKTIVITAS vs UPDATE PROGRES PROYEK
         ======================================================== */}
      {isProgressModalOpen && progressProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-secondary">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${modalType === 'activity'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30'
                  }`}>
                  {modalType === 'activity' ? <FileText size={20} /> : <TrendingUp size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-text">
                    {modalType === 'activity' ? 'Tambah Catatan Aktivitas Kerja' : 'Update Progres Proyek (%)'}
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    {progressProject.order_number} • {progressProject.customer_name || progressProject.customer_name_snapshot}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg hover:bg-brand-primary transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-6 space-y-4">
              {/* Context Banner */}
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${modalType === 'activity'
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
                  : 'bg-brand-accent/10 border-brand-accent/25 text-brand-text'
                }`}>
                {modalType === 'activity' ? (
                  <>
                    <FileText size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-amber-300 font-semibold mb-0.5">Log Catatan Kerja Harian</strong>
                      <span>Mencatat tugas, modul yang diselesaikan, atau kendala pengerjaan yang akan masuk ke Riwayat Update Proyek.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="text-brand-accent mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-brand-accent font-semibold mb-0.5">Pembaruan Milestone & Tingkat Penyelesaian</strong>
                      <span>Memperbarui persentase progres keseluruhan proyek yang tampil di kalender, kartu proyek, dan laporan klien.</span>
                    </div>
                  </>
                )}
              </div>

              {/* Peringatan Jika Proyek Belum Memiliki Penugasan Tim */}
              {(!progressProject.assignments || progressProject.assignments.length === 0) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-red-200 font-semibold mb-0.5">Penugasan Tim Belum Ada</strong>
                    <span>Proyek ini belum memiliki anggota tim/developer yang ditugaskan. Admin atau Team Lead harus menugaskan anggota tim terlebih dahulu sebelum progres dapat disimpan.</span>
                  </div>
                </div>
              )}

              {/* Info jika user mencatat untuk proyek anggota tim lain */}
              {progressProject.assignments && progressProject.assignments.length > 0 && !progressProject.my_assignment && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/25 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                  <Users size={14} className="text-blue-400 shrink-0" />
                  <span>
                    Anda sedang memperbarui progres untuk tim proyek: <strong>{progressProject.assignments.map(a => a.user_name?.split(' ')[0]).join(', ')}</strong>
                  </span>
                </div>
              )}

              {/* JIKA UPDATE PROGRES PROYEK: Slider Persentase di Atas dengan Quick Chips */}
              {modalType === 'progress' && (
                <div className="p-4 bg-brand-primary/60 border border-brand-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-brand-text">Persentase Penyelesaian Proyek</label>
                      <p className="text-[11px] text-brand-text-muted">Tentukan progres keseluruhan milestone saat ini</p>
                    </div>
                    <span className="text-lg font-black font-mono px-3 py-1 rounded-lg bg-brand-accent/15 text-brand-accent border border-brand-accent/30">
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
                    className="w-full accent-brand-accent cursor-pointer h-2.5 bg-brand-secondary rounded-lg"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    {[0, 25, 50, 75, 90, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setProgressForm({ ...progressForm, progress_percentage: val })}
                        className={`flex-1 py-1 text-xs font-mono font-bold rounded border transition ${progressForm.progress_percentage === val
                            ? 'bg-brand-accent text-brand-primary border-brand-accent'
                            : 'bg-brand-secondary border-brand-border text-brand-text-muted hover:text-brand-text hover:border-brand-accent/40'
                          }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Judul Aktivitas / Milestone */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">
                  {modalType === 'activity' ? (
                    <>Tugas / Aktivitas Yang Dikerjakan <span className="text-red-400">*</span></>
                  ) : (
                    <>Nama Milestone / Fase Pembaruan <span className="text-red-400">*</span></>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={progressForm.title}
                  onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })}
                  placeholder={
                    modalType === 'activity'
                      ? 'Contoh: Slicing UI dashboard & integrasi endpoint auth'
                      : 'Contoh: Milestone Tahap 2 Selesai / Siap UAT'
                  }
                  className="w-full px-3.5 py-2.5 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* JIKA TAMBAH AKTIVITAS: Slider Progres ditaruh di bawah judul aktivitas (opsional/ringkas) */}
              {modalType === 'activity' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-brand-text">Tingkat Penyelesaian Tugas Ini / Proyek</label>
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
                    <span>0% (Mulai)</span>
                    <span>50% (Dalam Pengerjaan)</span>
                    <span>100% (Selesai Penuh)</span>
                  </div>
                </div>
              )}

              {/* Deskripsi Pekerjaan */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">
                  {modalType === 'activity' ? 'Deskripsi Detail Pekerjaan' : 'Rangkuman Kemajuan (Opsional)'}
                </label>
                <textarea
                  rows="3"
                  value={progressForm.description}
                  onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
                  placeholder={
                    modalType === 'activity'
                      ? 'Jelaskan apa saja yang telah dikerjakan, file/modul yang dimodifikasi, atau hasil pengetesan...'
                      : 'Rangkuman singkat modul atau pencapaian yang sudah dirampungkan dalam pembaruan ini...'
                  }
                  className="w-full px-3.5 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent resize-none"
                ></textarea>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1.5">
                  {modalType === 'activity' ? 'Catatan Kendala / Blocker (Opsional)' : 'Catatan untuk Lead / PM (Opsional)'}
                </label>
                <input
                  type="text"
                  value={progressForm.notes}
                  onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })}
                  placeholder={
                    modalType === 'activity'
                      ? 'Misal: Menunggu aset gambar dari desainer atau akses API staging...'
                      : 'Catatan penting mengenai target deadline atau review lead...'
                  }
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
                  disabled={submittingProgress || (!progressProject.assignments || progressProject.assignments.length === 0)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${modalType === 'activity'
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-brand-accent text-brand-primary hover:bg-brand-accent2'
                    }`}
                >
                  {submittingProgress ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : modalType === 'activity' ? (
                    <>
                      <FileText size={14} />
                      <span>Simpan Catatan Aktivitas</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Perbarui Progres Proyek</span>
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
