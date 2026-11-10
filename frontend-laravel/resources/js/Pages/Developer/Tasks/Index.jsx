import { useEffect, useState, useRef } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import {
  CheckCircle2, Clock, AlertCircle,
  Briefcase, ListTodo, RefreshCw, User,
  Save, X, Search, UploadCloud, FileImage, Trash2
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

export default function DeveloperTasksIndex() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({ status: 'pending', progress_percentage: 0, notes: '' });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const loadTasks = () => {
    if (!currentUserId) return;
    setLoading(true);
    
    fetch(`/api/v1/developer/tasks?user_id=${currentUserId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTasks(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, [currentUserId]);

  const openModal = (task) => {
    setSelectedTask(task);
    setForm({
      status: task.status,
      progress_percentage: task.progress,
      notes: task.notes || ''
    });
    setFiles([]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/v1/developer/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      if (files.length > 0) {
        const targetId = data.new_id || selectedTask.id;
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const uploadRes = await fetch(`/api/v1/developer/tasks/${targetId}/attachments`, {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) alert('Progress tersimpan, tapi gagal upload gambar.');
      }

      setSelectedTask(null);
      loadTasks(); 
    } catch (err) {
      alert(err.message || 'Gagal update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.order_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleLayout>
      <Head title="Task & Progress" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
            <ListTodo size={24} className="text-brand-accent" />
            Task & Progress
          </h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Kelola pengerjaan dan update status progress proyek Anda.
          </p>
        </div>
        <button 
          onClick={loadTasks} 
          disabled={loading}
          className="bg-brand-secondary border border-brand-border text-brand-text px-4 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm font-medium transition shadow-sm disabled:opacity-50 w-fit"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
        <input
          type="text"
          placeholder="Cari nama task atau no. order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-brand-secondary border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-brand-text-muted">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
            Memuat data...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-brand-text-muted bg-brand-secondary border border-brand-border rounded-xl">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-500/40" />
            <p>Belum ada task yang ditugaskan kepada Anda.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bg-brand-secondary border border-brand-border rounded-xl p-5 hover:border-brand-accent/50 transition shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
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
                  
                  <h3 className="text-lg font-bold text-brand-text">{task.title}</h3>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-brand-text-muted">
                    <span className="font-mono flex items-center gap-1.5 bg-brand-muted px-2 py-1 rounded-md"><Briefcase size={14} /> {task.order_number}</span>
                    <span className="flex items-center gap-1.5"><User size={14} /> {task.customer}</span>
                    <span className={`flex items-center gap-1.5 ${task.is_overdue ? 'text-red-500 font-semibold' : ''}`}>
                      <Clock size={14} /> {task.deadline}
                    </span>
                  </div>
                </div>

                <div className="lg:w-72 shrink-0 space-y-3 border-t lg:border-t-0 lg:border-l border-brand-border pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-brand-text-muted font-medium">Progress</span>
                      <span className="font-bold text-brand-text">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-brand-muted rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(task.status)}`} style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(task)}
                    className="w-full bg-brand-primary border border-brand-border text-brand-text py-2 rounded-lg hover:bg-brand-muted hover:text-brand-accent transition text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    Update Progress
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL UPDATE PROGRESS */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-secondary z-10">
              <h2 className="text-lg font-bold text-brand-text">Update Task</h2>
              <button onClick={() => setSelectedTask(null)} className="text-brand-text-muted hover:text-brand-accent transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div>
                <div className="text-xs text-brand-text-muted uppercase tracking-widest mb-1">Task</div>
                <div className="font-semibold text-brand-text">{selectedTask.title}</div>
                <div className="text-sm text-brand-text-muted mt-1">{selectedTask.order_number} - {selectedTask.customer}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Progress (%)</span>
                  <span className="text-brand-accent">{form.progress_percentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.progress_percentage}
                  onChange={(e) => setForm({ ...form, progress_percentage: parseInt(e.target.value) })}
                  className="w-full accent-brand-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Tambahkan catatan pengerjaan..."
                  className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent/60 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-1.5">Upload Bukti (Gambar/Dokumen)</label>
                
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-brand-border hover:border-brand-accent/60 rounded-lg p-4 text-center cursor-pointer transition"
                >
                  <UploadCloud size={24} className="mx-auto text-brand-text-muted mb-2" />
                  <p className="text-sm text-brand-text font-medium">Klik untuk pilih file</p>
                  <p className="text-xs text-brand-text-muted mt-1">Maks. 5 file, 5MB per file</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-brand-primary border border-brand-border p-2 rounded-lg">
                        <div className="flex items-center gap-2 truncate">
                          <FileImage size={16} className="text-brand-accent shrink-0" />
                          <span className="text-xs text-brand-text truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-600 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 sticky bottom-0 bg-brand-secondary pb-2">
                <button type="button" onClick={() => setSelectedTask(null)} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium transition">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Simpan & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}