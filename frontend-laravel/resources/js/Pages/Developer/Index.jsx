import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  PlayCircle, CheckCircle2, Clock,
  Briefcase, FolderKanban, ChevronDown, RefreshCw,
  Lock, Calendar, Search, X, Check, FileText,
  TrendingUp, BarChart3, Wrench, ArrowRight
} from 'lucide-react';

// ============ HELPERS ============
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getDaysLeft = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

// Nama yang ditampilkan: nama project dari order (bukan kode order)
const getTitle = (item) => item.project_name || item.name || 'Tanpa nama project';

// Rata-rata progres dari semua job milik developer di proyek tersebut
const getAvgProgress = (jobs = []) => {
  if (!jobs || jobs.length === 0) return 0;
  const total = jobs.reduce((acc, j) => acc + (j.progress || 0), 0);
  return Math.round(total / jobs.length);
};

// Opsi filter status proyek
const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

function OrderStatusBadge({ status }) {
  const labels = {
    draft:       'Draft',
    pending:     'Pending',
    in_progress: 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
  };
  const colors = {
    draft:       'bg-gray-500/15 text-gray-400 border-gray-500/40',
    pending:     'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
    completed:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
    cancelled:   'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
  };
  return (
    <span className={`inline-block text-[11px] sm:text-xs px-2.5 py-0.5 sm:py-1 rounded-full font-medium border shrink-0 ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

// Progress bar mini: satu bar + persen
function MiniProgress({ value = 0, status }) {
  const color =
    value === 100 ? 'bg-emerald-500' : status === 'in_progress' || value > 0 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
      <div className="flex-1 bg-brand-muted rounded-full h-1.5 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs font-semibold text-brand-text w-8 sm:w-9 text-right">{value}%</span>
    </div>
  );
}

export default function DeveloperDashboard() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total_projects: 0,
    total_active: 0,
    total_completed: 0,
    total_pending: 0,
    total_overdue: 0,
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activityChart, setActivityChart] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Modal Detail Proyek
  const [selectedProject, setSelectedProject] = useState(null);

  const loadDashboard = () => {
    if (!currentUserId) return;
    setLoading(true);
    setError('');

    fetch(`/api/v1/developer/dashboard?user_id=${currentUserId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const fetchedProjects = res.data.projects || [];
          setProjects(fetchedProjects);
          setTasks(res.data.tasks || []);
          setActivityChart(res.data.activity_chart || []);
          setRecentMaintenance(res.data.recent_maintenance || []);
          setStats(res.data.stats || {
            total_projects: fetchedProjects.length,
            total_active: 0,
            total_completed: 0,
            total_pending: 0,
            total_overdue: 0,
          });
        } else {
          setError(res.message || 'Gagal mengambil data dari server');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Gagal menghubungi backend: ' + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUserId]);

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const projectName = (p.project_name || '').toLowerCase();
    const customer = (p.customer_name || '').toLowerCase();
    const service = (p.service_name || '').toLowerCase();
    const orderNumber = (p.order_number || '').toLowerCase();
    const hasMatchingJob = p.jobs?.some((j) => (j.job_name || '').toLowerCase().includes(q));
    const matchSearch =
      !q || projectName.includes(q) || customer.includes(q) || service.includes(q) || orderNumber.includes(q) || hasMatchingJob;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Tampilkan 5 penugasan terbaru saja
  const displayedProjects = filteredProjects.slice(0, 5);

  // Ambil 4 tugas dengan deadline terdekat
  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== 'completed' && t.deadline && t.deadline !== '-')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  return (
    <RoleLayout>
      <Head title="Developer — Dashboard" />

      {/* HEADER UTAMA */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-text">Dashboard Developer</h1>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
            Ikhtisar penugasan proyek, aktivitas setoran progres, dan status pekerjaan teknis Anda.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="bg-brand-secondary border border-brand-border text-brand-text px-3.5 py-2.5 sm:py-2 rounded-xl hover:bg-brand-muted flex items-center justify-center gap-2 text-xs sm:text-sm transition shadow-sm disabled:opacity-50 w-full sm:w-auto font-medium"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 sm:p-4 rounded-xl mb-4 sm:mb-6 flex items-center justify-between text-xs sm:text-sm">
          <p>{error}</p>
          <button onClick={loadDashboard} className="underline font-bold shrink-0 ml-2">Coba Lagi</button>
        </div>
      )}

      {/* 1. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          icon={FolderKanban}
          label="Total Proyek Saya"
          value={stats.total_projects || projects.length}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={PlayCircle}
          label="Job Sedang Aktif"
          value={stats.total_active}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={CheckCircle2}
          label="Job Selesai 100%"
          value={stats.total_completed}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={Clock}
          label="Menunggu / Terkunci"
          value={stats.total_pending}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 sm:mb-6">
        <div className="lg:col-span-2 bg-brand-secondary rounded-xl sm:rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-accent shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-brand-text">Aktivitas Setoran Progres 30 Hari</h2>
            </div>
            <span className="text-[11px] sm:text-xs text-brand-text-muted">Frekuensi update laporan teknis</span>
          </div>
          <ActivityBarChart data={activityChart} />
        </div>

        <div className="bg-brand-secondary rounded-xl sm:rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-brand-accent shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold text-brand-text">Distribusi Status Job</h2>
          </div>
          <JobStatusProgressChart stats={stats} totalTasks={tasks.length} />
        </div>
      </div>

      {/* 3. ROW SECONDARY: DEADLINE & MAINTENANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 sm:mb-6">
        {/* PANEL DEADLINE TERDEKAT */}
        <div className="bg-brand-secondary rounded-xl sm:rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500 dark:text-amber-400 shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-brand-text">Deadline Terdekat</h2>
            </div>
            <Link
              href="/developer/tasks"
              className="text-xs text-brand-accent hover:underline flex items-center gap-1 font-medium"
            >
              Semua Tugas <ArrowRight size={12} />
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="py-6 sm:py-8 text-center text-brand-text-muted text-xs">
              Tidak ada tugas dengan deadline mendesak.
            </div>
          ) : (
            <div className="divide-y divide-brand-border/50">
              {upcomingTasks.map((t, idx) => {
                const daysLeft = getDaysLeft(t.deadline);
                const isOverdue = t.is_overdue || daysLeft < 0;
                const badgeText = isOverdue ? 'Terlambat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`;
                const badgeColor = isOverdue
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                  : daysLeft <= 3
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                return (
                  <div key={t.id || idx} className="flex items-center justify-between gap-3 py-2.5 sm:py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-brand-text truncate">{getTitle(t)}</div>
                      <div className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5">{formatDate(t.deadline)}</div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-medium border ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL MAINTENANCE */}
        <div className="bg-brand-secondary rounded-xl sm:rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-brand-accent shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-brand-text">Tiket Kendala & Maintenance Aktif</h2>
            </div>
            <Link
              href="/developer/maintenance"
              className="text-xs text-brand-accent hover:underline flex items-center gap-1 font-medium"
            >
              Buka Maintenance <ArrowRight size={12} />
            </Link>
          </div>

          {recentMaintenance.length === 0 ? (
            <div className="py-6 sm:py-8 text-center text-brand-text-muted text-xs">
              Tidak ada tiket kendala maintenance yang ditugaskan kepada Anda saat ini.
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {recentMaintenance.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-brand-primary/40 border border-brand-border/60 rounded-xl text-xs space-y-1 hover:border-brand-accent/40 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text truncate">
                        {m.order_number}
                      </span>
                      {m.parent_order_number && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 truncate">
                          Induk: {m.parent_order_number}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase shrink-0 ${
                      m.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    }`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-brand-text text-xs sm:text-sm truncate pt-0.5">{m.title}</h3>
                  <div className="text-[11px] text-brand-text-muted flex items-center justify-between pt-0.5">
                    <span>Dilaporkan: {formatDate(m.created_at)}</span>
                    <Link
                      href={`/developer/maintenance/${m.id}`}
                      className="text-brand-accent hover:underline font-semibold"
                    >
                      Buka Tiket &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. PENUGASAN TERBARU */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-brand-accent shrink-0 sm:w-5 sm:h-5" />
          <h2 className="font-bold text-brand-text text-base sm:text-lg">Penugasan Terbaru</h2>
        </div>
        <Link
          href="/developer/tasks"
          className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1 shrink-0"
        >
          Lihat Semua ({projects.length}) <ArrowRight size={13} />
        </Link>
      </div>

      {/* Toolbar Pencarian & Filter Status */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Cari proyek, customer, atau job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 sm:py-2 bg-brand-primary border border-brand-border rounded-xl text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Filter Status */}
        <div className="relative sm:w-44 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="w-full flex items-center justify-between bg-brand-primary border border-brand-border rounded-xl px-3.5 py-2.5 sm:py-2 text-xs sm:text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
          >
            <span className="truncate">
              {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || 'Semua Status'}
            </span>
            <ChevronDown
              size={16}
              className={`text-brand-text-muted transition-transform duration-200 shrink-0 ${
                isStatusOpen ? 'rotate-180 text-brand-accent' : ''
              }`}
            />
          </button>

          {isStatusOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1.5 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('');
                  setIsStatusOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
                  !statusFilter
                    ? 'bg-brand-accent/15 text-brand-accent font-medium'
                    : 'text-brand-text hover:bg-brand-border/40'
                }`}
              >
                <span>Semua Status</span>
                {!statusFilter && <Check size={14} className="text-brand-accent" />}
              </button>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(s.value);
                    setIsStatusOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs sm:text-sm flex items-center justify-between transition-colors ${
                    statusFilter === s.value
                      ? 'bg-brand-accent/15 text-brand-accent font-medium'
                      : 'text-brand-text hover:bg-brand-border/40'
                  }`}
                >
                  <span className="truncate">{s.label}</span>
                  {statusFilter === s.value && <Check size={14} className="text-brand-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {(search || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setIsStatusOpen(false);
            }}
            className="text-xs text-brand-accent hover:text-brand-accent2 flex items-center gap-1 font-medium transition"
          >
            <X size={13} /> Reset Filter
          </button>
        )}
      </div>

      {/* DATA VIEW CONTAINER */}
      <div className="bg-brand-secondary rounded-xl border border-brand-border overflow-hidden shadow-sm">
        {loading && (
          <div className="p-8 sm:p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            <p className="text-xs sm:text-sm">Memuat data proyek...</p>
          </div>
        )}

        {!loading && displayedProjects.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
            <p className="text-brand-text-muted font-medium text-xs sm:text-sm">Tidak ada penugasan ditemukan</p>
            <p className="text-xs text-brand-text-muted/70 mt-1">Coba ubah kata kunci atau filter status.</p>
          </div>
        )}

        {!loading && displayedProjects.length > 0 && (
          <>
            {/* 1. CARD VIEW (MOBILE - < md) */}
            <div className="block md:hidden divide-y divide-brand-border/50">
              {displayedProjects.map((project) => (
                <div key={project.order_id} className="p-4 space-y-3 hover:bg-brand-muted/30 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-brand-text block truncate">
                        {getTitle(project)}
                      </span>
                      <span className="text-[11px] text-brand-text-muted block mt-0.5 truncate">
                        {project.customer_name || '—'}
                      </span>
                    </div>
                    <OrderStatusBadge status={project.status} />
                  </div>

                  <div className="bg-brand-primary/40 rounded-xl p-3 border border-brand-border/40 flex items-center justify-between gap-2">
                    <span className="text-brand-text-muted text-[11px] font-semibold uppercase tracking-wider">Rata-Rata Progres</span>
                    <MiniProgress value={getAvgProgress(project.jobs)} status={project.status} />
                  </div>

                  <div className="flex items-center justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
                    >
                      Detail Proyek
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. TABLE VIEW (DESKTOP - >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-primary/50 border-b border-brand-border text-brand-text-muted">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Proyek</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest">Progres</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {displayedProjects.map((project) => (
                    <tr key={project.order_id} className="hover:bg-brand-primary/40 transition">
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-brand-text truncate max-w-xs">
                          {getTitle(project)}
                        </div>
                        <div className="text-xs text-brand-text-muted mt-0.5 truncate max-w-xs">
                          {project.customer_name}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderStatusBadge status={project.status} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <MiniProgress value={getAvgProgress(project.jobs)} status={project.status} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProject(project)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition shadow-sm"
                        >
                          Detail
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

      {/* MODAL DETAIL PROYEK (RESPONSIF MOBILE) */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-brand-secondary border border-brand-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-brand-border flex items-center justify-between bg-brand-primary/40 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent shrink-0">
                  <Briefcase size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-brand-text truncate">
                      {getTitle(selectedProject)}
                    </span>
                    <OrderStatusBadge status={selectedProject.status} />
                  </div>
                  <p className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5 truncate">
                    <span className="font-mono">{selectedProject.order_number}</span> &bull; {selectedProject.customer_name} &bull; {selectedProject.service_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-1.5 text-brand-text-muted hover:text-brand-text hover:bg-brand-muted rounded-lg transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                <div className="p-3 bg-brand-primary/50 border border-brand-border/60 rounded-xl">
                  <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Jadwal Periode Proyek:</span>
                  <span className="font-semibold text-brand-text text-xs mt-0.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand-accent shrink-0" />
                    <span>
                      {selectedProject.start_date_project && selectedProject.end_date_project
                        ? `${formatDate(selectedProject.start_date_project)} s/d ${formatDate(selectedProject.end_date_project)}`
                        : selectedProject.end_date_project
                        ? `Deadline: ${formatDate(selectedProject.end_date_project)}`
                        : '—'}
                    </span>
                  </span>
                </div>
                <div className="p-3 bg-brand-primary/50 border border-brand-border/60 rounded-xl">
                  <span className="text-brand-text-muted block text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Total Job Ditugaskan:</span>
                  <span className="font-semibold text-brand-text text-xs mt-0.5 block">
                    {selectedProject.jobs?.length || 0} Tugas Spesialisasi
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center justify-between">
                  <span>Daftar Pekerjaan (Job) Anda di Proyek Ini</span>
                  <span className="text-[11px] text-brand-text-muted font-normal lowercase">
                    {selectedProject.jobs?.length || 0} pekerjaan
                  </span>
                </h3>

                <div className="space-y-2.5 sm:space-y-3">
                  {selectedProject.jobs?.map((job) => (
                    <div
                      key={job.assignment_id}
                      className="p-3.5 sm:p-4 bg-brand-primary/40 border border-brand-border/60 rounded-xl space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            Fase {job.phase_order || 1}
                          </span>
                          <span className="font-semibold text-brand-text text-xs sm:text-sm">
                            {job.job_name}
                          </span>
                        </div>

                        <div>
                          {job.is_locked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                              <Lock size={12} /> Terkunci
                            </span>
                          ) : job.status === 'completed' || job.progress === 100 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> 100% Selesai
                            </span>
                          ) : job.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                              <PlayCircle size={12} /> Sedang Dikerjakan ({job.progress}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                              <Clock size={12} /> Belum Dikerjakan
                            </span>
                          )}
                        </div>
                      </div>

                      {job.is_locked && job.lock_reason && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                          <Lock size={13} className="shrink-0" />
                          <span>{job.lock_reason}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-brand-border/40 text-xs">
                        <span className="text-brand-text-muted flex items-center gap-1.5 truncate">
                          <Calendar size={12} className="text-brand-accent shrink-0" />
                          <span className="truncate">
                            {job.start_date && job.end_date
                              ? `Jadwal: ${formatDate(job.start_date)} s/d ${formatDate(job.end_date)}`
                              : `Deadline: ${formatDate(job.deadline)}`}
                          </span>
                        </span>

                        <div className="flex items-center gap-2 sm:w-44 shrink-0">
                          <div className="w-full bg-brand-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                job.status === 'completed' || job.progress === 100
                                  ? 'bg-emerald-500'
                                  : job.status === 'in_progress'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-brand-text min-w-[32px] text-right">
                            {job.progress || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-brand-border flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 bg-brand-primary/40 shrink-0">
              <Link
                href="/developer/tasks"
                className="w-full sm:w-auto text-center text-xs font-semibold text-brand-accent hover:underline flex items-center justify-center gap-1.5"
              >
                <PlayCircle size={14} /> Buka Halaman Tugas untuk Update Setoran &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="w-full sm:w-auto px-4 py-2 bg-brand-primary border border-brand-border text-brand-text rounded-xl text-xs font-semibold hover:bg-brand-muted transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}

// ============ SUB-COMPONENTS ============

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-brand-secondary rounded-xl border border-brand-border p-4 sm:p-5 shadow-sm hover:border-brand-accent/30 transition">
      <div className="flex items-start justify-between mb-2.5 sm:mb-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-brand-text">{value}</div>
      <div className="text-xs text-brand-text-muted mt-0.5 sm:mt-1">{label}</div>
    </div>
  );
}

// Vertical Bar Chart untuk Aktivitas 30 Hari
function ActivityBarChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="py-8 sm:py-12 text-center text-brand-text-muted text-xs">Belum ada aktivitas setoran dalam 30 hari terakhir</div>;
  }

  const max = Math.max(...data.map((d) => d.count || 0), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-32 sm:h-36">
        {data.map((d, i) => {
          const height = ((d.count || 0) / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 group relative flex flex-col justify-end h-full"
            >
              <div
                className={`w-full rounded-t transition-all duration-200 ${
                  d.count > 0
                    ? 'bg-gradient-to-t from-brand-accent/60 to-brand-accent hover:from-brand-accent hover:to-brand-accent'
                    : 'bg-brand-muted/40 hover:bg-brand-muted/70'
                }`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-brand-primary border border-brand-border text-brand-text text-xs rounded-lg px-2.5 py-1 whitespace-nowrap z-20 shadow-xl pointer-events-none">
                <div className="font-bold text-brand-accent">{d.count} Setoran</div>
                <div className="text-brand-text-muted text-[10px]">{formatDate(d.date)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-xs text-brand-text-muted pt-2 border-t border-brand-border/40">
        <span>{formatDate(data[0]?.date)}</span>
        <span className="font-medium text-brand-text-muted">Aktivitas Harian</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

// Horizontal Progress Bar per Status
function JobStatusProgressChart({ stats, totalTasks }) {
  const total = totalTasks || 1;

  const items = [
    { label: 'Selesai 100%', count: stats.total_completed, color: 'bg-emerald-500' },
    { label: 'Sedang Dikerjakan', count: stats.total_active, color: 'bg-blue-500' },
    { label: 'Menunggu / Terkunci', count: stats.total_pending, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4 pt-1">
      {items.map((item) => {
        const pct = totalTasks > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-brand-text font-medium">{item.label}</span>
              <span className="text-brand-text-muted">
                <strong className="text-brand-text">{item.count}</strong> ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 bg-brand-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-xs text-brand-text-muted">
        <span>Total Seluruh Job:</span>
        <strong className="text-brand-text">{totalTasks} Tugas</strong>
      </div>
    </div>
  );
}