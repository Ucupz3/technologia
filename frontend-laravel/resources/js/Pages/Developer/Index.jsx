import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  PlayCircle, CheckCircle2, Clock, AlertCircle,
  Briefcase, ListTodo, Activity, ChevronRight, RefreshCw, User
} from 'lucide-react';

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':     return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    case 'in_progress': return 'bg-blue-500/15 text-blue-600 border-blue-500/30';
    case 'completed':   return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    default:            return 'bg-gray-500/15 text-gray-600 border-gray-500/30';
  }
};

const getProgressColor = (status) => {
  if (status === 'completed') return 'bg-emerald-500';
  if (status === 'in_progress') return 'bg-blue-500';
  return 'bg-gray-300 dark:bg-gray-600';
};

export default function DeveloperIndex() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total_active: 0, total_completed: 0, total_pending: 0, total_overdue: 0 });
  const [tasks, setTasks] = useState([]);

  const loadDashboard = () => {
    if (!currentUserId) return;
    setLoading(true);
    setError('');
    
    fetch(`/api/v1/developer/dashboard?user_id=${currentUserId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.data.stats);
          setTasks(d.data.tasks);
        } else {
          setError(d.message || 'Gagal mengambil data');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUserId]);

  // Ambil 3 Task Deadline Terdekat
  const closestDeadlineTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (a.deadline === '-') return 1;
      if (b.deadline === '-') return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    })
    .slice(0, 3); 

  return (
    <RoleLayout>
      <Head title="Developer Dashboard" />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            Workspace Developer
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Pantau task, progress, dan deadline pengerjaan proyek Anda.
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-4 rounded-xl mb-6 flex items-center justify-between">
          <p>Error: {error}</p>
          <button onClick={loadDashboard} className="underline text-sm font-bold">Coba Lagi</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Task Aktif" value={stats.total_active} icon={PlayCircle} color="blue" />
        <StatCard title="Selesai" value={stats.total_completed} icon={CheckCircle2} color="emerald" />
        <StatCard title="Menunggu (Pending)" value={stats.total_pending} icon={Clock} color="amber" />
        <StatCard title="Terlewat (Overdue)" value={stats.total_overdue} icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-brand-text text-lg flex items-center gap-2">
              <ListTodo size={20} className="text-brand-accent" />
              3 Deadline Terdekat
            </h2>
            <Link href="/developer/tasks" className="text-sm font-semibold text-brand-accent hover:underline flex items-center gap-1">
              Lihat Semua Task <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-brand-secondary border border-brand-border rounded-xl p-10 text-center text-brand-text-muted">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
              Memuat daftar task...
            </div>
          ) : closestDeadlineTasks.length === 0 ? (
            <div className="bg-brand-secondary border border-brand-border rounded-xl p-10 text-center text-brand-text-muted">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500/50" />
              <p>Belum ada task yang ditugaskan kepada Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {closestDeadlineTasks.map((task) => (
                <Link 
                  key={task.id} 
                  href="/developer/tasks"
                  className="block bg-brand-secondary border border-brand-border rounded-xl p-4 hover:border-brand-accent/50 hover:shadow-md transition shadow-sm group cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-2 py-0.5 rounded">
                          {task.job_name}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.is_overdue && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-600 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-brand-text group-hover:text-brand-accent transition">{task.title}</h3>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-brand-text-muted">
                        <span className="font-mono flex items-center gap-1"><Briefcase size={12} /> {task.order_number}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {task.customer}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-brand-text-muted font-medium">Progress</span>
                      <span className="font-bold text-brand-text">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-brand-muted rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(task.status)}`} style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-brand-text-muted border-t border-brand-border/40 pt-3">
                    <span className={`flex items-center gap-1 ${task.is_overdue ? 'text-red-500 font-semibold' : ''}`}>
                      <Clock size={12} /> Deadline: {task.deadline}
                    </span>
                    <span className="text-brand-accent font-semibold group-hover:underline flex items-center gap-1">
                      Kelola Task <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-brand-text mb-4 flex items-center gap-2">
              <Activity size={16} className="text-brand-accent" /> Panduan Task
            </h2>
            <div className="text-sm text-brand-text-muted space-y-3">
              <p>Di halaman ini, Anda hanya melihat task yang <strong>ditugaskan langsung kepada Anda</strong>.</p>
              <p>Jika tabel masih kosong, berarti Anda belum dimasukkan ke dalam Tim di halaman Order oleh Admin.</p>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="bg-brand-secondary border border-brand-border rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium text-brand-text-muted mb-0.5">{title}</p>
        <h3 className="text-2xl font-bold text-brand-text">{value}</h3>
      </div>
    </div>
  );
}