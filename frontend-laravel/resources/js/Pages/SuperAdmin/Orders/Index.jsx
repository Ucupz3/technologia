import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  RefreshCw, Search, Plus, Eye, Trash2,
  FileText, CheckCircle2, AlertCircle, Users, Save, Star
} from 'lucide-react';

// ============ HELPERS ============
const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function OrderStatusBadge({ status }) {
  const colors = {
    draft: 'bg-gray-500/15 text-gray-600 border-gray-500/40',
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
    completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-600 border-red-500/40',
  };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.draft}`}>{status}</span>;
}

// ============ MAIN ============
export default function OrdersIndex() {
  const [orders, setOrders] = useState([]);
  const [options, setOptions] = useState({ customers: [], services: [], sales: [], teams: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetch('/api/v1/orders').then((r) => r.json()),
      fetch('/api/v1/orders/options/customers').then((r) => r.json()),
      fetch('/api/v1/orders/options/services').then((r) => r.json()),
      fetch('/api/v1/orders/options/sales').then((r) => r.json()),
      fetch('/api/v1/orders/options/teams').then((r) => r.json()),
    ])
      .then(([o, c, s, sa, t]) => {
        if (o.success) setOrders(o.data || []);
        else setError(o.message || 'Gagal ambil data');
        setOptions({
          customers: c.success ? c.data : [],
          services: s.success ? s.data : [],
          sales: sa.success ? sa.data : [],
          teams: t.success ? t.data : [],
        });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.order_number?.toLowerCase().includes(q) || o.customer_name_snapshot?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <RoleLayout>
      <Head title="Orders" />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-red-500/15 border-red-500/40 text-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Orders</h1>
          <p className="text-sm text-brand-text-muted mt-1">Total {orders.length} order</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setCreateOpen(true)} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-accent2 flex items-center gap-2 text-sm font-semibold transition">
            <Plus size={16} /> Buat Order
          </button>
        </div>
      </div>

      <div className="py-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input type="text" placeholder="Cari no order atau customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-brand-primary border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center text-brand-text-muted"><RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />Loading...</div>}
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">Error: {error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="p-12 text-center"><FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Tidak ada order</p></div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">No Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Tim</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text text-sm font-mono">{o.order_number}</div>
                      <div className="text-xs text-brand-text-muted">{formatDate(o.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{o.customer_name_snapshot}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      {o.teams?.name ? <span className="inline-flex items-center gap-1 text-xs bg-brand-muted/50 px-2 py-1 rounded border border-brand-border"><Users size={12} /> {o.teams.name}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-accent">{formatRupiah(o.grand_total)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetailId(o.id)} className="p-2 rounded-lg text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition"><Eye size={16} /></button>
                        <button onClick={() => setDeleteOrder(o)} className="p-2 rounded-lg text-brand-text-muted hover:text-red-500 hover:bg-red-500/10 transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <OrderFormModal
          options={options}
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); load(); showToast('success', msg); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {detailId && (
        <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />
      )}

      {deleteOrder && (
        <ConfirmDeleteModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onSuccess={() => { setDeleteOrder(null); load(); showToast('success', 'Order dihapus'); }}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </RoleLayout>
  );
}

// ============ FORM MODAL (CREATE) ============
function OrderFormModal({ options, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    customer_id: '',
    team_id: '',
    service_id: '', 
    notes: '',
    assignments: {} // Menyimpan job & lead per anggota
  });
  const [submitting, setSubmitting] = useState(false);

  // Update state assignments saat tim dipilih
  const handleTeamChange = (e) => {
    const teamId = e.target.value;
    setForm(prev => {
      const newForm = { ...prev, team_id: teamId, assignments: {} };
      if (teamId) {
        const team = options.teams.find(t => String(t.id) === String(teamId));
        if (team && team.team_members) {
          team.team_members.forEach(tm => {
            const primaryJob = tm.users?.user_jobs?.find(uj => uj.is_primary) || tm.users?.user_jobs?.[0];
            newForm.assignments[tm.id] = {
              team_member_id: tm.id,
              job_id: primaryJob ? String(primaryJob.job_id) : '',
              is_lead: false
            };
          });
        }
      }
      return newForm;
    });
  };

  const handleAssignmentChange = (teamMemberId, field, value) => {
    setForm(prev => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        [teamMemberId]: {
          ...prev.assignments[teamMemberId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.customer_id) return onError('Customer wajib dipilih');
    if (!form.service_id) return onError('Layanan wajib dipilih');
    
    setSubmitting(true);

    const assignmentsArray = Object.values(form.assignments).filter(a => a.job_id !== '');

    const payload = {
      customer_id: form.customer_id,
      team_id: form.team_id || null,
      service_id: form.service_id,
      notes: form.notes || null,
      assignments: assignmentsArray // ✅ Kirim array assignments
    };

    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menyimpan order');
      } else {
        onSuccess('Order berhasil dibuat');
      }
    } catch {
      onError('Gagal menghubungi server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-text">Buat Order Baru</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Customer <span className="text-red-500">*</span></label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text" required>
                <option value="">— Pilih Customer —</option>
                {options.customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Layanan / Service <span className="text-red-500">*</span></label>
              <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text" required>
                <option value="">— Pilih Layanan —</option>
                {options.services?.map((s) => <option key={s.id} value={s.id}>{s.name} ({formatRupiah(s.price)})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Tim Pengerjaan</label>
            <select value={form.team_id} onChange={handleTeamChange} className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text">
              <option value="">— Pilih Tim —</option>
              {options.teams?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* ✅ LIST ANGGOTA TIM & JOB */}
          {form.team_id && Object.keys(form.assignments).length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-2">Atur Posisi Anggota Tim</label>
              <div className="space-y-2">
                {options.teams.find(t => String(t.id) === String(form.team_id))?.team_members?.map((tm) => {
                  const assign = form.assignments[tm.id] || {};
                  const userJobs = tm.users?.user_jobs || [];
                  return (
                    <div key={tm.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-brand-primary/40 border border-brand-border p-3 rounded-lg">
                      <div className="flex-1 min-w-0 font-medium text-brand-text">{tm.users?.name}</div>
                      <select
                        value={assign.job_id || ''}
                        onChange={(e) => handleAssignmentChange(tm.id, 'job_id', e.target.value)}
                        className="w-full sm:w-48 bg-brand-primary border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text"
                      >
                        <option value="">— Pilih Job —</option>
                        {userJobs.map(uj => (
                          <option key={uj.job_id} value={uj.job_id}>{uj.jobs?.name}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 cursor-pointer sm:w-24">
                        <input
                          type="checkbox"
                          checked={assign.is_lead || false}
                          onChange={(e) => handleAssignmentChange(tm.id, 'is_lead', e.target.checked)}
                          className="w-4 h-4 rounded border-brand-border text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-semibold text-brand-text-muted">Lead</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted uppercase mb-1.5">Catatan</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." className="w-full bg-brand-primary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text resize-none" />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-brand-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium">Batal</button>
          <button onClick={handleSubmit} disabled={submitting} className="bg-brand-accent text-brand-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {submitting ? 'Menyimpan...' : 'Buat Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DETAIL MODAL ============
function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/orders/${orderId}`).then(r => r.json()).then(d => {
      if (d.success) setOrder(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-brand-border w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-text">Detail Order</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-accent text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="p-8 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-accent" /></div>
          ) : !order ? (
            <p className="text-center text-brand-text-muted">Data tidak ditemukan</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-primary/40 p-4 rounded-lg border border-brand-border">
                <div>
                  <div className="text-xs text-brand-text-muted uppercase">No Order</div>
                  <div className="font-semibold text-brand-text font-mono">{order.order_number}</div>
                </div>
                <div>
                  <div className="text-xs text-brand-text-muted uppercase">Customer</div>
                  <div className="text-sm text-brand-text truncate">{order.customer_name_snapshot}</div>
                </div>
                <div>
                  <div className="text-xs text-brand-text-muted uppercase">Total</div>
                  <div className="text-sm font-semibold text-brand-accent">{formatRupiah(order.grand_total)}</div>
                </div>
                <div>
                  <div className="text-xs text-brand-text-muted uppercase">Status</div>
                  <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
                  <Users size={16} /> Tim yang Ditugaskan
                </h3>
                {(!order.order_assignments || order.order_assignments.length === 0) ? (
                  <div className="text-sm text-brand-text-muted italic p-4 text-center border border-brand-border rounded-lg">
                    Belum ada anggota tim.
                  </div>
                ) : (
                  <div className="border border-brand-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-brand-muted/50 border-b border-brand-border">
                        <tr>
                          <th className="px-4 py-2 font-medium text-brand-text-muted">Nama Anggota</th>
                          <th className="px-4 py-2 font-medium text-brand-text-muted">Posisi (Job)</th>
                          <th className="px-4 py-2 font-medium text-brand-text-muted text-center">Lead</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/50">
                        {order.order_assignments.map((a) => (
                          <tr key={a.id}>
                            <td className="px-4 py-2 font-medium text-brand-text">{a.team_members?.users?.name}</td>
                            <td className="px-4 py-2">
                              <span className="inline-block text-xs px-2 py-1 rounded bg-brand-muted border border-brand-border text-brand-text">
                                {a.jobs?.name || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              {a.is_lead ? <Star size={16} className="fill-amber-500 text-amber-500 inline" /> : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-brand-border flex justify-end">
          <button onClick={onClose} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ============ DELETE MODAL ============
function ConfirmDeleteModal({ order, onClose, onSuccess, onError }) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        onError(data.message || 'Gagal menghapus');
        setSubmitting(false);
      } else {
        onSuccess();
      }
    } catch {
      onError('Gagal menghubungi server');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-brand-secondary rounded-xl shadow-2xl border border-red-500/30 w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-full flex items-center justify-center">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text">Hapus Order?</h3>
            <p className="text-xs text-brand-text-muted">Aksi ini tidak bisa dibatalkan</p>
          </div>
        </div>
        <p className="text-sm text-brand-text mb-6">Yakin ingin menghapus order <strong className="text-brand-text">{order.order_number}</strong>?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="bg-brand-muted text-brand-text px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Batal</button>
          <button onClick={handleDelete} disabled={submitting} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {submitting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}