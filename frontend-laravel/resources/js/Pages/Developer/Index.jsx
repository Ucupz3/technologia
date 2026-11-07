import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  PlayCircle, CheckCircle2, Clock, AlertCircle,
  Briefcase, FolderKanban, ChevronDown, ChevronRight, RefreshCw,
  User, Lock, Star, Calendar, Search
} from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':     return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    case 'in_progress': return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
    case 'completed':   return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    case 'cancelled':   return 'bg-red-500/15 text-red-600 border-red-500/30';
    default:            return 'bg-gray-500/15 text-gray-600 border-gray-500/30';
  }
};

export default function DeveloperIndex() {
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
  const [expandedProjects, setExpandedProjects] = useState({});
  const [search, setSearch] = useState('');

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
          setStats(res.data.stats || {
            total_projects: fetchedProjects.length,
            total_active: 0,
            total_completed: 0,
            total_pending: 0,
            total_overdue: 0,
          });

          // Otomatis buka proyek pertama saat pertama kali load
          if (fetchedProjects.length > 0) {
            setExpandedProjects((prev) => {
              if (Object.keys(prev).length === 0) {
                return { [fetchedProjects[0].order_id]: true };
              }
              return prev;
            });
          }
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

  const toggleProject = (orderId) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const customer = (p.customer_name || '').toLowerCase();
    const service = (p.service_name || '').toLowerCase();
    const orderNumber = (p.order_number || '').toLowerCase();
    const hasMatchingJob = p.jobs?.some((j) => (j.job_name || '').toLowerCase().includes(q));
    return customer.includes(q) || service.includes(q) || orderNumber.includes(q) || hasMatchingJob;
  });

  return (
    <RoleLayout>
      <Head title="Developer Dashboard" />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            Workspace Developer
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Pantau proyek dan rincian pekerjaan (job) yang ditugaskan kepada Anda.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm font-medium transition shadow-sm disabled:opacity-50 w-fit"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sinkronisasi...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-4 rounded-xl mb-6 flex items-center justify-between text-sm">
          <p>{error}</p>
          <button onClick={loadDashboard} className="underline font-bold">Coba Lagi</button>
        </div>
      )}

      {/* STATISTIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Proyek Saya" value={stats.total_projects || projects.length} icon={FolderKanban} color="purple" />
        <StatCard title="Job Aktif" value={stats.total_active} icon={PlayCircle} color="blue" />
        <StatCard title="Job Selesai" value={stats.total_completed} icon={CheckCircle2} color="emerald" />
        <StatCard title="Menunggu / Terkunci" value={stats.total_pending} icon={Clock} color="amber" />
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input
          type="text"
          placeholder="Cari nama klien, layanan, atau no. order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
        />
      </div>

      <div>
        {/* DAFTAR PROYEK (LEVEL 1 -> KLIK UNTUK LIHAT JOB) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-brand-text text-lg flex items-center gap-2">
              <Briefcase size={20} className="text-brand-accent" />
              Daftar Proyek Penugasan
            </h2>
            <span className="text-xs text-brand-text-muted">
              Menampilkan {filteredProjects.length} proyek
            </span>
          </div>

          {loading ? (
            <div className="bg-brand-secondary border border-brand-border rounded-xl p-12 text-center text-brand-text-muted">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
              Memuat data proyek...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-brand-secondary border border-brand-border rounded-xl p-12 text-center text-brand-text-muted">
              <CheckCircle2 size={44} className="mx-auto mb-3 text-brand-text-muted/40" />
              <p className="font-semibold text-brand-text mb-1">Tidak ada proyek yang ditemukan</p>
              <p className="text-xs">Belum ada penugasan proyek untuk akun Anda saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const isExpanded = Boolean(expandedProjects[project.order_id]);
                const jobCount = project.jobs?.length || 0;

                return (
                  <div
                    key={project.order_id}
                    className="bg-brand-secondary border border-brand-border rounded-xl overflow-hidden shadow-sm transition hover:border-brand-accent/40"
                  >
                    {/* HEADER KARTU PROYEK (Bisa diklik untuk buka/tutup rincian job) */}
                    <button
                      type="button"
                      onClick={() => toggleProject(project.order_id)}
                      className="w-full p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-brand-muted/20 transition"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent shrink-0 mt-0.5">
                          <FolderKanban size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text-muted">
                              {project.order_number}
                            </span>
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                              {jobCount} Job Anda
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-brand-text truncate">
                            {project.customer_name}
                          </h3>
                          <p className="text-xs text-brand-text-muted truncate mt-0.5">
                            {project.service_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-[11px] text-brand-text-muted uppercase block">Jadwal Proyek</span>
                          <span className="text-xs font-medium text-brand-text flex items-center gap-1">
                            <Calendar size={12} className="text-brand-text-muted" />
                            {project.start_date_project && project.end_date_project
                              ? `${project.start_date_project} s/d ${project.end_date_project}`
                              : project.end_date_project
                              ? `Deadline: ${project.end_date_project}`
                              : '—'}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-brand-muted/50 border border-brand-border text-brand-text-muted">
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-brand-accent' : ''}`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* DETAIL PEKERJAAN (LEVEL 2: JOB PENUGASAN DEVELOPER DI DALAM PROYEK INI) */}
                    {isExpanded && (
                      <div className="p-5 pt-0 border-t border-brand-border/60 bg-brand-primary/20 space-y-3">
                        <div className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider pt-4 pb-1">
                          Pekerjaan (Job) Anda di Proyek Ini:
                        </div>

                        {jobCount === 0 ? (
                          <p className="text-xs text-brand-text-muted italic py-3">
                            Tidak ada penugasan job khusus untuk Anda di proyek ini.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {project.jobs.map((job) => (
                              <div
                                key={job.assignment_id}
                                className="bg-brand-secondary border border-brand-border p-4 rounded-xl space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 border border-purple-500/30">
                                      Fase {job.phase_order || 1}
                                    </span>
                                    <span className="text-sm font-bold text-brand-text">
                                      {job.job_name}
                                    </span>
                                    {job.is_lead && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                        <Star size={11} className="fill-amber-500" /> Lead
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {job.is_locked ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded">
                                        <Lock size={12} /> Terkunci
                                      </span>
                                    ) : job.status === 'completed' || job.progress === 100 ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded">
                                        <CheckCircle2 size={12} /> Selesai 100%
                                      </span>
                                    ) : job.status === 'in_progress' ? (
                                      <Link
                                        href="/developer/tasks"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 px-2.5 py-1 rounded transition"
                                      >
                                        <PlayCircle size={12} /> Sedang Dikerjakan
                                      </Link>
                                    ) : (
                                      <Link
                                        href="/developer/tasks"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 px-2.5 py-1 rounded transition"
                                      >
                                        <Clock size={12} /> Mulai Kerjakan
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                {job.is_locked && job.lock_reason && (
                                  <div className="text-xs text-amber-600/90 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                                    <Lock size={13} className="shrink-0" />
                                    <span>{job.lock_reason}</span>
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brand-border/40 text-xs">
                                  <span className={`flex items-center gap-1.5 text-brand-text-muted ${job.is_overdue ? 'text-red-500 font-semibold' : ''}`}>
                                    <Clock size={13} className={job.is_overdue ? 'text-red-500' : 'text-brand-text-muted'} />
                                    {job.start_date && job.end_date
                                      ? `Jadwal: ${job.start_date} s/d ${job.end_date}`
                                      : `Deadline: ${job.deadline}`}
                                  </span>

                                  <div className="flex items-center gap-3 sm:w-48">
                                    <div className="w-full bg-brand-muted rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${
                                          job.status === 'completed'
                                            ? 'bg-emerald-500'
                                            : job.status === 'in_progress'
                                            ? 'bg-blue-500'
                                            : 'bg-gray-400'
                                        }`}
                                        style={{ width: `${job.progress}%` }}
                                      />
                                    </div>
                                    <span className="font-bold text-brand-text min-w-[32px] text-right">
                                      {job.progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-lg border ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium text-brand-text-muted mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-brand-text">{value}</h3>
      </div>
    </div>
  );
}
