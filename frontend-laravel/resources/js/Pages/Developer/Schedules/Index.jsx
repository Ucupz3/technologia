import { useEffect, useState, useMemo } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
  Calendar as CalendarIcon, CheckCircle2, AlertCircle, AlertTriangle,
  Users, Search, ChevronLeft, ChevronRight, Briefcase, List, X, Check,
  Crown, RefreshCw, UserCheck, Activity, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';

// ============ KONSTANTA & HELPER ============
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const MAX_VISIBLE_TRACKS = 3;
const BAR_H = 24;
const BAR_GAP = 4;
const TRACK_STEP = BAR_H + BAR_GAP;
const PAD_TOP = 6;
const PAD_BOTTOM = 8;

// Nama yang ditampilkan: nama project dari order (bukan kode order)
const getTitle = (item) => item.project_name || item.name || 'Tanpa nama project';

const getStatusBadge = (status) => {
  switch (status) {
    case 'in_progress':
      return {
        label: 'Berjalan',
        color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
        barColor: 'bg-blue-500',
        calendarBg: 'bg-blue-600/95 hover:bg-blue-600 text-white border-blue-400/60',
      };
    case 'completed':
      return {
        label: 'Selesai',
        color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
        barColor: 'bg-emerald-500',
        calendarBg: 'bg-emerald-600/95 hover:bg-emerald-600 text-white border-emerald-400/60',
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
        barColor: 'bg-red-500',
        calendarBg: 'bg-red-600/95 hover:bg-red-600 text-white border-red-400/60',
      };
    case 'pending':
    default:
      return {
        label: 'Menunggu',
        color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
        barColor: 'bg-amber-500',
        calendarBg: 'bg-amber-600/95 hover:bg-amber-600 text-white border-amber-400/60',
      };
  }
};

const formatDateShort = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Badge sisa waktu
const getDeadlineBadge = (p) => {
  if (p.status === 'completed' || p.days_remaining === null || p.days_remaining === undefined) return null;
  if (p.is_overdue) {
    return { text: 'Terlambat', cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' };
  }
  if (p.days_remaining === 0) {
    return { text: 'Hari ini', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
  }
  return {
    text: `${p.days_remaining} hari lagi`,
    cls: p.days_remaining <= 3
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  };
};

function MiniProgress({ value = 0, status }) {
  const color = getStatusBadge(status).barColor;
  return (
    <div className="flex items-center gap-2 w-28 shrink-0">
      <div className="flex-1 bg-brand-primary h-1.5 rounded-full overflow-hidden border border-brand-border">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs font-semibold text-brand-text w-9 text-right">{value}%</span>
    </div>
  );
}

// ============ KOMPONEN UTAMA ============
export default function DeveloperSchedule() {
  const { auth } = usePage().props;
  const currentUser = auth?.user;

  const [projects, setProjects] = useState([]);
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

  // Filter & tampilan
  const [scope, setScope] = useState('mine'); // 'mine' | 'all'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Kalender
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const toggleWeekExpand = (wIdx) => {
    setExpandedWeeks((prev) => ({ ...prev, [wIdx]: !prev[wIdx] }));
  };

  // Modal detail & modal update progres
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressProject, setProgressProject] = useState(null);
  const [progressForm, setProgressForm] = useState({
    title: '',
    description: '',
    progress_percentage: 50,
  });
  const [submittingProgress, setSubmittingProgress] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Muat data dari backend
  const loadData = () => {
    setLoading(true);
    setError('');

    const userIdParam = currentUser?.id ? `&user_id=${currentUser.id}` : '';
    const scopeParam = `&scope=${scope}`;
    const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';

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
          setStats(data.stats || {
            total_projects: projs.length,
            in_progress: projs.filter((p) => p.status === 'in_progress').length,
            pending: projs.filter((p) => p.status === 'pending').length,
            completed: projs.filter((p) => p.status === 'completed').length,
            overdue: projs.filter((p) => p.is_overdue).length,
            upcoming_deadlines: 0,
          });
        } else {
          setError(resData.message || 'Gagal memuat jadwal');
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

  // Pencarian
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const term = search.toLowerCase();
    return projects.filter((p) => {
      return (
        (p.project_name || '').toLowerCase().includes(term) ||
        (p.customer_name || p.customer_name_snapshot || '').toLowerCase().includes(term) ||
        (p.my_assignment?.job_name || '').toLowerCase().includes(term)
      );
    });
  }, [projects, search]);

  // Urutan daftar: belum selesai dulu berdasarkan deadline, selesai di bawah
  const sortedProjects = useMemo(() => {
    const far = 9999999999999;
    return filteredProjects.slice().sort((a, b) => {
      const aDone = a.status === 'completed' ? 1 : 0;
      const bDone = b.status === 'completed' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return new Date(a.end_date_project || far) - new Date(b.end_date_project || far);
    });
  }, [filteredProjects]);

  // Navigasi kalender
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setExpandedWeeks({});
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setExpandedWeeks({});
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setExpandedWeeks({});
  };

  // Grid kalender bulanan bergaya Gantt
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

  // Modal update progres
  const openProgressModal = (project) => {
    if (!project.my_assignment) {
      showToast('error', 'Hanya anggota tim proyek ini yang dapat mengubah progres.');
      return;
    }
    setProgressProject(project);
    setProgressForm({
      title: `Update progres ${getTitle(project)}`,
      description: '',
      progress_percentage: project.progress_percentage || 0,
    });
    setIsProgressModalOpen(true);
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!progressProject) return;

    if (!progressProject.my_assignment) {
      showToast('error', 'Hanya anggota tim proyek ini yang dapat mengubah progres.');
      return;
    }

    if (!progressForm.title.trim()) {
      showToast('error', 'Judul progres wajib diisi');
      return;
    }

    // Cari assignment milik user yang login
    const myA = progressProject.assignments?.find(
      (a) => String(a.user_id) === String(currentUser?.id)
    );

    setSubmittingProgress(true);
    try {
      const payload = {
        title: progressForm.title.trim(),
        description: progressForm.description.trim() || null,
        progress_percentage: Number(progressForm.progress_percentage),
        notes: null,
        user_id: currentUser?.id || null,
        assignment_id: progressProject.my_assignment?.assignment_id || myA?.id || null,
      };

      const res = await fetch(`/api/v1/orders/${progressProject.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        showToast('success', 'Progres proyek berhasil diperbarui!');
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

  const statCards = [
    { label: 'Total Proyek', value: stats.total_projects, icon: Briefcase, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Berjalan', value: stats.in_progress, icon: Activity, color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Selesai', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Terlambat', value: stats.overdue, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <RoleLayout>
      <Head title="Jadwal Kerja" />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 border transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            : 'bg-red-950/90 text-red-200 border-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            : <AlertCircle size={18} className="text-red-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text flex items-center gap-2">
            <CalendarIcon size={24} className="text-brand-accent shrink-0 sm:w-7 sm:h-7" />
            <span>Jadwal Kerja</span>
          </h1>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
            Pantau jadwal dan progres proyek Anda secara visual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-brand-border bg-brand-secondary p-1 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                scope === 'mine'
                  ? 'bg-brand-accent text-brand-primary shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <UserCheck size={14} /> Tugas Saya
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                scope === 'all'
                  ? 'bg-brand-accent text-brand-primary shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <Users size={14} /> Semua Proyek
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-xl hover:bg-brand-muted flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition shadow-sm w-full sm:w-auto"
            title="Muat ulang data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-brand-accent' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-brand-secondary border border-brand-border rounded-xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] sm:text-xs font-medium text-brand-text-muted">{s.label}</div>
                <div className={`text-xl sm:text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</div>
              </div>
              <Icon size={20} className={`${s.color} shrink-0`} />
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-brand-secondary border border-brand-border rounded-xl p-3 mb-4 sm:mb-6 shadow-sm flex flex-col md:flex-row gap-2.5 sm:gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari proyek atau customer..."
            className="w-full pl-9 pr-8 py-2 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent transition shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-brand-primary border border-brand-border text-brand-text text-base sm:text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-accent flex-1 sm:flex-none shadow-sm"
          >
            <option value="all">Semua Status</option>
            <option value="in_progress">Berjalan</option>
            <option value="pending">Menunggu</option>
            <option value="completed">Selesai</option>
          </select>

          <div className="inline-flex rounded-xl border border-brand-border bg-brand-primary p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <CalendarIcon size={14} /> Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                  : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              <List size={14} /> Daftar
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="underline text-xs hover:text-white shrink-0 ml-2">Coba lagi</button>
        </div>
      )}

      {loading && projects.length === 0 ? (
        <div className="p-8 sm:p-16 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl shadow-sm">
          <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-brand-accent" />
          <p className="text-xs sm:text-sm font-medium">Memuat jadwal proyek...</p>
        </div>
      ) : (
        <>
          {/* ================= VIEW: KALENDER ================= */}
          {viewMode === 'calendar' && (
            <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl shadow-sm overflow-hidden mb-6">
              <div className="p-3.5 sm:p-4 border-b border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <h2 className="text-base sm:text-lg font-bold text-brand-text flex items-center gap-2">
                  <CalendarIcon size={18} className="text-brand-accent shrink-0" />
                  <span>{MONTHS[currentMonth]} {currentYear}</span>
                </h2>

                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="px-3 py-1.5 bg-brand-primary border border-brand-border text-brand-text rounded-xl text-xs font-semibold hover:bg-brand-muted transition shadow-sm"
                  >
                    Hari Ini
                  </button>
                  <div className="flex items-center border border-brand-border rounded-xl overflow-hidden bg-brand-primary shadow-sm">
                    <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-brand-muted text-brand-text transition" title="Bulan sebelumnya">
                      <ChevronLeft size={16} />
                    </button>
                    <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-brand-muted text-brand-text transition border-l border-brand-border" title="Bulan berikutnya">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="px-3.5 py-2 bg-brand-primary/50 border-b border-brand-border flex flex-wrap items-center gap-3.5 text-xs text-brand-text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completed</span>
              </div>

              {/* Pembungkus Scroll Horizontal untuk Grid Kalender di Mobile */}
              <div className="overflow-x-auto scrollbar-none">
                <div className="min-w-[650px]">
                  {/* Hari */}
                  <div className="grid grid-cols-7 border-b border-brand-border text-center text-[11px] font-bold py-2 text-brand-text-muted bg-brand-primary/40 uppercase tracking-wider">
                    {DAYS.map((day, idx) => (
                      <div key={day} className={idx === 0 || idx === 6 ? 'text-red-500 dark:text-red-400' : ''}>{day}</div>
                    ))}
                  </div>

                  {/* Minggu */}
                  <div className="divide-y divide-brand-border">
                    {calendarData.map((weekData, wIdx) => {
                      const isExpanded = Boolean(expandedWeeks[wIdx]);
                      const hiddenCount = weekData.events.filter((e) => (e.track || 0) >= MAX_VISIBLE_TRACKS).length;
                      const hasHidden = hiddenCount > 0;

                      const visibleEvents = isExpanded
                        ? weekData.events
                        : weekData.events.filter((e) => (e.track || 0) < MAX_VISIBLE_TRACKS);

                      const visibleTracks = isExpanded
                        ? weekData.maxTrack + 1
                        : Math.min(weekData.maxTrack + 1, MAX_VISIBLE_TRACKS);

                      let areaHeight = PAD_TOP + visibleTracks * TRACK_STEP + PAD_BOTTOM;
                      if (hasHidden) areaHeight += 26;
                      if (areaHeight < 52) areaHeight = 52;

                      return (
                        <div key={wIdx} className="bg-brand-secondary">
                          {/* Baris tanggal */}
                          <div className="grid grid-cols-7 divide-x divide-brand-border/40 bg-brand-primary/25 border-b border-brand-border/30 h-8">
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
                                  className={`px-2 py-1 flex items-center text-xs ${
                                    day === null ? 'bg-brand-primary/20' : isToday ? 'bg-brand-accent/15' : isWeekend ? 'bg-brand-muted/10' : ''
                                  }`}
                                >
                                  {day !== null && (
                                    <span
                                      className={`inline-flex items-center justify-center font-bold text-xs rounded-full w-6 h-6 ${
                                        isToday
                                          ? 'bg-brand-accent text-brand-primary shadow'
                                          : isWeekend
                                          ? 'text-red-500 dark:text-red-400'
                                          : 'text-brand-text'
                                      }`}
                                    >
                                      {day}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Area bar proyek */}
                          <div className="relative" style={{ height: `${areaHeight}px` }}>
                            <div className="absolute inset-0 grid grid-cols-7 divide-x divide-brand-border/30 pointer-events-none">
                              {weekData.week.map((day, dIdx) => (
                                <div
                                  key={dIdx}
                                  className={`h-full ${
                                    day === null ? 'bg-brand-primary/10' : dIdx === 0 || dIdx === 6 ? 'bg-brand-muted/5' : ''
                                  }`}
                                />
                              ))}
                            </div>

                            {visibleEvents.map((event) => {
                              const badge = getStatusBadge(event.status);
                              const leftPct = (event.startCol / 7) * 100;
                              const widthPct = ((event.endCol - event.startCol + 1) / 7) * 100;
                              const topPx = PAD_TOP + (event.track || 0) * TRACK_STEP;

                              return (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedProject(event)}
                                  style={{
                                    left: `calc(${leftPct}% + 4px)`,
                                    width: `calc(${widthPct}% - 8px)`,
                                    top: `${topPx}px`,
                                    height: `${BAR_H}px`,
                                  }}
                                  className={`absolute rounded-lg px-2 flex items-center justify-between gap-2 text-xs cursor-pointer transition shadow-sm border z-10 hover:brightness-110 ${badge.calendarBg}`}
                                  title={`${getTitle(event)} (${event.order_number}) - ${event.customer_name}\n${formatDateShort(event.start_date_project)} s/d ${formatDateShort(event.end_date_project)}`}
                                >
                                  <span className="font-semibold text-[11px] truncate">{getTitle(event)}</span>
                                  <span className="text-[10px] font-mono font-bold px-1.5 rounded bg-black/40 shrink-0">
                                    {event.progress_percentage}%
                                  </span>
                                </div>
                              );
                            })}

                            {hasHidden && (
                              <div
                                style={{
                                  top: `${PAD_TOP + visibleTracks * TRACK_STEP}px`,
                                }}
                                className="absolute left-2 right-2 flex items-center justify-center z-10"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleWeekExpand(wIdx)}
                                  className="text-[11px] font-semibold text-brand-accent bg-brand-primary/95 border border-brand-accent/30 hover:border-brand-accent px-3 py-0.5 rounded-full shadow-sm transition flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>Sembunyikan <ChevronUp size={12} /></>
                                  ) : (
                                    <>+{hiddenCount} lainnya <ChevronDown size={12} /></>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW: DAFTAR ================= */}
          {viewMode === 'list' && (
            <div className="bg-brand-secondary border border-brand-border rounded-xl sm:rounded-2xl shadow-sm overflow-hidden mb-6">
              {sortedProjects.length === 0 ? (
                <div className="py-12 sm:py-16 text-center">
                  <Briefcase size={36} className="mx-auto text-brand-text-muted mb-3 opacity-60" />
                  <p className="text-sm font-medium text-brand-text">Tidak ada proyek ditemukan</p>
                  <p className="text-xs text-brand-text-muted mt-1">Coba ubah filter atau kata kunci pencarian.</p>
                </div>
              ) : (
                <>
                  {/* 1. CARD VIEW (MOBILE - < md) */}
                  <div className="block md:hidden divide-y divide-brand-border/50">
                    {sortedProjects.map((item) => {
                      const badge = getStatusBadge(item.status);
                      const dl = getDeadlineBadge(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedProject(item)}
                          className="p-4 space-y-3 hover:bg-brand-muted/30 transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-brand-text block truncate">
                                {getTitle(item)}
                              </span>
                              <span className="text-[11px] text-brand-text-muted block mt-0.5 truncate">
                                {item.customer_name || '—'}
                              </span>
                            </div>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border shrink-0 ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="bg-brand-primary/40 rounded-xl p-3 border border-brand-border/40 flex items-center justify-between gap-2">
                            <span className="text-brand-text-muted text-[11px] font-semibold uppercase tracking-wider">Progres Proyek</span>
                            <MiniProgress value={item.progress_percentage} status={item.status} />
                          </div>

                          <div className="flex items-center justify-between pt-0.5 text-xs">
                            <div className="text-brand-text-muted text-[11px]">
                              Selesai: <span className="text-brand-text font-medium">{formatDateShort(item.end_date_project)}</span>
                            </div>
                            {dl && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${dl.cls}`}>
                                {dl.text}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. TABLE VIEW (DESKTOP - >= md) */}
                  <div className="hidden md:block divide-y divide-brand-border">
                    {sortedProjects.map((item) => {
                      const badge = getStatusBadge(item.status);
                      const dl = getDeadlineBadge(item);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setSelectedProject(item)}
                          className="w-full text-left p-4 hover:bg-brand-primary/40 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-brand-text truncate">{getTitle(item)}</div>
                            <div className="text-xs text-brand-text-muted mt-0.5 truncate">{item.customer_name}</div>
                          </div>

                          <div className="flex items-center gap-5">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${badge.color}`}>
                              {badge.label}
                            </span>

                            <MiniProgress value={item.progress_percentage} status={item.status} />

                            <div className="w-32 text-right">
                              <div className="text-xs text-brand-text">{formatDateShort(item.end_date_project)}</div>
                              {dl && (
                                <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${dl.cls}`}>
                                  {dl.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= MODAL DETAIL PROYEK ================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between gap-3 bg-brand-primary/40 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-lg font-bold text-brand-text truncate">{getTitle(selectedProject)}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(selectedProject.status).color}`}>
                    {getStatusBadge(selectedProject.status).label}
                  </span>
                </div>
                <p className="text-xs text-brand-text-muted mt-0.5 truncate">{selectedProject.customer_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg hover:bg-brand-primary transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Periode & progres */}
              <div className="p-3.5 bg-brand-primary/60 border border-brand-border rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-text-muted flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-brand-accent shrink-0" />
                    <span>{formatDateShort(selectedProject.start_date_project)} – {formatDateShort(selectedProject.end_date_project)}</span>
                  </span>
                  <span className="font-bold text-brand-accent font-mono">{selectedProject.progress_percentage}%</span>
                </div>
                <div className="w-full bg-brand-primary h-2 rounded-full overflow-hidden border border-brand-border">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getStatusBadge(selectedProject.status).barColor}`}
                    style={{ width: `${selectedProject.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Layanan */}
              {selectedProject.services && selectedProject.services.length > 0 && (
                <div className="text-xs">
                  <span className="text-brand-text-muted">Layanan: </span>
                  <span className="text-brand-text font-medium">
                    {selectedProject.services.map((s) => s.name).join(', ')}
                  </span>
                </div>
              )}

              {/* Tim */}
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Tim</h4>
                {selectedProject.assignments && selectedProject.assignments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.assignments.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-brand-primary border border-brand-border text-brand-text flex items-center gap-1.5"
                      >
                        {m.is_lead && <Crown size={11} className="text-amber-400 shrink-0" />}
                        <strong>{m.user_name}</strong>
                        <span className="text-brand-text-muted">· {m.job_name || 'Developer'}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-text-muted italic">Belum ada tim yang ditugaskan</p>
                )}
              </div>

              {/* Catatan proyek */}
              {selectedProject.notes && (
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">Catatan</h4>
                  <div className="p-3 bg-brand-primary border border-brand-border rounded-xl text-xs text-brand-text whitespace-pre-line leading-relaxed">
                    {selectedProject.notes}
                  </div>
                </div>
              )}

              {/* Riwayat progres (3 terbaru) */}
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Update Terbaru</h4>
                {selectedProject.recent_progress && selectedProject.recent_progress.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProject.recent_progress.slice(0, 3).map((prog, idx) => (
                      <div key={idx} className="p-3 bg-brand-primary border border-brand-border rounded-xl text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-brand-text truncate">{prog.title}</span>
                          <span className="font-mono font-bold text-brand-accent shrink-0">{prog.progress_percentage}%</span>
                        </div>
                        {prog.description && (
                          <p className="text-brand-text-muted mt-1 line-clamp-2">{prog.description}</p>
                        )}
                        <div className="text-[10px] text-brand-text-muted mt-1.5">
                          {prog.author_name} · {formatDateShort(prog.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-text-muted italic">Belum ada update progres.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-brand-border bg-brand-primary/40 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <span className="text-xs text-brand-text-muted text-center sm:text-left">
                {!selectedProject.my_assignment && 'Mode baca (bukan tim Anda)'}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-brand-secondary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-xl transition"
                >
                  Tutup
                </button>
                {selectedProject.my_assignment && (
                  <button
                    type="button"
                    onClick={() => openProgressModal(selectedProject)}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <TrendingUp size={14} /> Update Progres
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL UPDATE PROGRES ================= */}
      {isProgressModalOpen && progressProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm" onClick={() => setIsProgressModalOpen(false)}>
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-brand-text">Update Progres</h3>
                <p className="text-xs text-brand-text-muted truncate">{getTitle(progressProject)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProgressModalOpen(false)}
                className="text-brand-text-muted hover:text-brand-text p-1.5 rounded-lg hover:bg-brand-primary transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {(!progressProject.assignments || progressProject.assignments.length === 0) && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                  <span>Proyek ini belum punya penugasan tim, progres belum bisa disimpan.</span>
                </div>
              )}

              {/* Persentase */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-text">Progres</label>
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
                  className="w-full accent-brand-accent cursor-pointer"
                />
              </div>

              {/* Judul */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text mb-1.5">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={progressForm.title}
                  onChange={(e) => setProgressForm({ ...progressForm, title: e.target.value })}
                  placeholder="Contoh: Integrasi API selesai"
                  className="w-full px-3.5 py-2.5 sm:py-2 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent transition shadow-sm"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-brand-text mb-1.5">Keterangan (opsional)</label>
                <textarea
                  rows="3"
                  value={progressForm.description}
                  onChange={(e) => setProgressForm({ ...progressForm, description: e.target.value })}
                  placeholder="Apa yang sudah dikerjakan..."
                  className="w-full px-3.5 py-2 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-accent resize-none transition shadow-sm"
                />
              </div>

              <div className="pt-3 border-t border-brand-border flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  disabled={submittingProgress}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-brand-primary border border-brand-border hover:bg-brand-muted text-brand-text text-xs font-semibold rounded-xl transition text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProgress || !progressProject.assignments || progressProject.assignments.length === 0}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-brand-accent text-brand-primary hover:bg-brand-accent2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingProgress ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan</span>
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