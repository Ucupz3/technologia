import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import { Calendar as CalendarIcon, Clock, Briefcase, User, RefreshCw, AlertCircle } from 'lucide-react';

export default function DeveloperSchedules() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const loadSchedules = () => {
    if (!currentUserId) return;
    setLoading(true);
    // Menggunakan endpoint tasks yang sudah ada, karena di dalamnya terdapat data deadline
    fetch(`/api/v1/developer/tasks?user_id=${currentUserId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          // Urutkan berdasarkan deadline terdekat
          const sorted = d.data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          setTasks(sorted);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSchedules();
  }, [currentUserId]);

  return (
    <RoleLayout>
      <Head title="Jadwal Proyek" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <CalendarIcon size={24} className="text-brand-accent" />
            Jadwal Proyek
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Daftar deadline dan jadwal pengerjaan proyek yang ditugaskan kepada Anda.
          </p>
        </div>
        <button 
          onClick={loadSchedules} 
          disabled={loading}
          className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm font-medium transition shadow-sm disabled:opacity-50 w-fit"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Jadwal
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Memuat jadwal...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
          <CalendarIcon size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
          <p>Belum ada jadwal proyek yang ditugaskan kepada Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isOverdue = task.is_overdue;
            
            return (
              <div key={task.id} className="bg-brand-secondary border border-brand-border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-2 py-0.5 rounded">
                    {task.job_name}
                  </span>
                  {isOverdue ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-600 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertCircle size={10} /> Overdue
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded">
                      On Track
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-brand-text mb-3">{task.title}</h3>

                <div className="space-y-2 text-sm text-brand-text-muted">
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-brand-text-muted/70" />
                    <span className="font-mono text-xs">{task.order_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-brand-text-muted/70" />
                    <span className="truncate">{task.customer}</span>
                  </div>
                  <div className={`flex items-center gap-2 pt-2 border-t border-brand-border/40 mt-2 font-semibold ${isOverdue ? 'text-red-500' : 'text-brand-text'}`}>
                    <Clock size={14} className={isOverdue ? 'text-red-500' : 'text-brand-accent'} />
                    <span>Deadline: {task.deadline}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </RoleLayout>
  );
}