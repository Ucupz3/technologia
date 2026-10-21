import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  MapPin, Star, ChevronDown, Check
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

function getBasePath() {
  return window.location.pathname.replace(/\/orders.*$/, '');
}

const STATUS_OPTIONS = [
  { value: 'draft',       label: 'Draft' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

function OrderStatusBadge({ status }) {
  const labels = {
    draft: 'Draft',
    pending: 'Pending',
    in_progress: 'In Progress', // ✅ Label Badge
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  const colors = {
    draft: 'bg-gray-500/15 text-gray-600 border-gray-500/40',
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
    completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    cancelled: 'bg-red-500/15 text-red-600 border-red-500/40',
  };
  return <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.draft}`}>{labels[status] || status}</span>;
}

export default function OrderShow({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State untuk Dropdown Status
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);

  const basePath = getBasePath();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setError('');
    fetch(`/api/v1/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrder(d.data);
        else setError(d.message || 'Gagal mengambil data order');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    setIsStatusOpen(false);
    if (newStatus === order.status) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast('error', data.message || 'Gagal mengubah status');
      } else {
        load(); // Reload data order
        showToast('success', 'Status pengerjaan berhasil diupdate');
      }
    } catch {
      showToast('error', 'Gagal menghubungi server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Detail Order" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading order...
        </div>
      </RoleLayout>
    );
  }

  if (error || !order) {
    return (
      <RoleLayout>
        <Head title="Detail Order" />
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">Error: {error || 'Data tidak ditemukan'}</p>
          <Link href={`${basePath}/orders`} className="text-brand-accent underline">← Kembali ke daftar</Link>
        </div>
      </RoleLayout>
    );
  }

  const services = order.order_services || [];
  const assignments = order.order_assignments || [];

  return (
    <RoleLayout>
      <Head title={`Detail Order — ${order.order_number}`} />

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-red-500/15 border-red-500/40 text-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="mb-6">
        <Link href={`${basePath}/orders`} className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3">
          <ArrowLeft size={16} /> Kembali ke Orders
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-brand-text flex items-center gap-3">
              {order.order_number}
            </h1>
            <p className="text-sm text-brand-text-muted mt-1">
              Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            {/* ✅ CUSTOM DROPDOWN STATUS */}
            <div className="relative">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center justify-between gap-3 bg-brand-primary border border-brand-border rounded-xl px-4 py-2 text-sm font-semibold text-brand-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition min-w-[160px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-brand-text-muted font-normal">Status:</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <ChevronDown size={16} className={`text-brand-text-muted transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsStatusOpen(false)} />
                  <div className="absolute z-30 top-full right-0 mt-2 w-48 p-1 bg-brand-primary border border-brand-border rounded-xl shadow-xl">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => handleStatusChange(s.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                          order.status === s.value ? 'bg-brand-accent/15 text-brand-accent font-medium' : 'text-brand-text hover:bg-brand-border/40'
                        }`}
                      >
                        <span>{s.label}</span>
                        {order.status === s.value && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button onClick={load} className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KIRI: Info Customer & Sales */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Informasi Customer">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-brand-text-muted uppercase">Nama Customer</div>
                <div className="text-sm font-semibold text-brand-text">{order.customer_name_snapshot}</div>
              </div>
              <div>
                <div className="text-xs text-brand-text-muted uppercase">Alamat</div>
                <div className="text-sm text-brand-text flex items-start gap-1.5 mt-0.5">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-brand-text-muted" />
                  {order.customer_address_snapshot || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-brand-text-muted uppercase">PIC Customer</div>
                <div className="text-sm text-brand-text">{order.pic_name_snapshot || '—'}</div>
                <div className="text-xs text-brand-text-muted">{order.pic_email_snapshot || ''}</div>
              </div>
            </div>
          </Card>

          <Card title="Sales PIC">
            {order.sales_user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-semibold text-xs">
                  {order.sales_user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-brand-text">{order.sales_user.name}</div>
                  <div className="text-xs text-brand-text-muted">{order.sales_user.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">Tidak ada sales</p>
            )}
          </Card>

          <Card title="Catatan">
            <p className="text-sm text-brand-text whitespace-pre-line">
              {order.notes || 'Tidak ada catatan'}
            </p>
          </Card>
        </div>

        {/* KANAN: Layanan & Tim */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Layanan */}
          <Card title="Rincian Layanan">
            {services.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-4">Belum ada layanan.</p>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <div key={svc.id} className="flex justify-between items-start bg-brand-primary/40 border border-brand-border p-3 rounded-lg">
                    <div>
                      <div className="text-sm font-semibold text-brand-text">{svc.service_name_snapshot}</div>
                      <div className="text-xs text-brand-text-muted">{svc.quantity} x {formatRupiah(svc.price_deal)}</div>
                    </div>
                    <div className="text-sm font-bold text-brand-accent">
                      {formatRupiah(svc.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Ringkasan Total */}
            <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon</span>
                <span>-{formatRupiah(order.discount)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Pajak ({order.tax_rate}%)</span>
                <span>+{formatRupiah(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-accent pt-2 border-t border-brand-border mt-2">
                <span>Grand Total</span>
                <span>{formatRupiah(order.grand_total)}</span>
              </div>
            </div>
          </Card>

          {/* Tim Pengerjaan */}
          <Card title="Tim Pengerjaan">
            {assignments.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-4">Belum ada anggota tim yang ditugaskan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-muted/30 border-b border-brand-border">
                    <tr>
                      <th className="px-3 py-2 font-medium text-brand-text-muted">Nama Anggota</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted">Job / Posisi</th>
                      <th className="px-3 py-2 font-medium text-brand-text-muted text-center">Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-brand-muted/20">
                        <td className="px-3 py-2 text-brand-text">{a.team_members?.users?.name}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block text-xs px-2 py-0.5 rounded bg-brand-muted border border-brand-border">
                            {a.jobs?.name || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {a.is_lead ? <Star size={14} className="fill-amber-500 text-amber-500 inline" /> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </RoleLayout>
  );
}

// ============ CARD COMPONENT ============
function Card({ title, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border">
        <h2 className="text-sm font-bold text-brand-text uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}