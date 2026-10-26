import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle,
  MapPin, Star, User, Mail, Phone, Calendar, Briefcase, Users
} from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

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
    pending:     'bg-amber-500/15 text-amber-400 border-amber-500/40',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    cancelled:   'bg-red-500/15 text-red-400 border-red-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.draft}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentStatusBadge({ status }) {
  const labels = {
    unpaid:   'Unpaid',
    partial:  'Partial (DP)',
    paid:     'Paid',
    refunded: 'Refunded',
    failed:   'Failed',
  };
  const colors = {
    unpaid:   'bg-red-500/15 text-red-400 border-red-500/40',
    partial:  'bg-amber-500/15 text-amber-400 border-amber-500/40',
    paid:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    refunded: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    failed:   'bg-gray-500/15 text-gray-400 border-gray-500/40',
  };
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CustomerServiceOrderShow({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

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
        else setError(d.message || 'Order data not found');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to connect to server');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [orderId]);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Order Detail" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading order details...
        </div>
      </RoleLayout>
    );
  }

  if (error || !order) {
    return (
      <RoleLayout>
        <Head title="Order Detail" />
        <div className="p-8 text-center">
          <p className="text-red-500 dark:text-red-400 mb-3">Error: {error || 'Order not found'}</p>
          <Link href="/sales/orders" className="text-brand-accent underline">
            ← Back to Orders list
          </Link>
        </div>
      </RoleLayout>
    );
  }

  const services = order.order_services || [];
  const assignments = order.order_assignments || [];

  return (
    <RoleLayout>
      <Head title={`Order Detail — ${order.order_number}`} />

      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-red-500/15 border-red-500/40 text-red-400'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/sales/orders"
          className="inline-flex items-center gap-2 text-sm text-brand-text-muted hover:text-brand-accent transition mb-3"
        >
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-brand-text font-mono">
              {order.order_number}
            </h1>
            <p className="text-sm text-brand-text-muted mt-1">
              Created on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex gap-2.5 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>

            <button
              onClick={load}
              className="bg-brand-secondary border border-brand-border text-brand-text px-3.5 py-2 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Exact Super Admin 2-Column Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN: Customer Info, CS PIC, Schedule & Notes */}
        <div className="lg:col-span-1 space-y-5">
          {/* Customer Information Card */}
          <Card title="Customer Information">
            <div className="space-y-3.5 text-sm">
              <div>
                <div className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Customer Name</div>
                <div className="text-base font-bold text-brand-text mt-0.5">
                  {order.customer_name_snapshot || order.customers?.name || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold">Address</div>
                <div className="text-sm text-brand-text flex items-start gap-1.5 mt-1">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-brand-text-muted" />
                  <span>{order.customer_address_snapshot || order.customers?.address || 'No address provided'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-brand-border/60">
                <div className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold mb-1">
                  Customer PIC (Contact)
                </div>
                <div className="font-semibold text-brand-text">
                  {order.pic_name_snapshot || order.customer_pics?.name || '—'}
                </div>
                {(order.pic_email_snapshot || order.customer_pics?.email) && (
                  <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-1">
                    <Mail size={13} className="shrink-0" />
                    <span>{order.pic_email_snapshot || order.customer_pics?.email}</span>
                  </div>
                )}
                {order.customer_pics?.phone && (
                  <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-1">
                    <Phone size={13} className="shrink-0" />
                    <span>{order.customer_pics.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Customer Service / Sales Representative */}
          <Card title="Customer Service / Sales">
            {order.sales_user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-accent/15 border border-brand-accent/40 rounded-full flex items-center justify-center text-brand-accent font-bold text-sm">
                  {order.sales_user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-brand-text">{order.sales_user.name}</div>
                  <div className="text-xs text-brand-text-muted">{order.sales_user.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">No sales assigned</p>
            )}
          </Card>

          {/* Timeline & Schedule */}
          <Card title="Project Timeline">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-brand-border/50">
                <span className="text-brand-text-muted">Start Date:</span>
                <span className="font-medium text-brand-text">
                  {order.start_date_project ? formatDate(order.start_date_project) : 'Not scheduled'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-brand-text-muted">Target Completion:</span>
                <span className="font-medium text-brand-text">
                  {order.end_date_project ? formatDate(order.end_date_project) : 'Not set'}
                </span>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card title="Order Notes">
            <p className="text-sm text-brand-text whitespace-pre-line">
              {order.notes || 'No notes provided for this order.'}
            </p>
          </Card>
        </div>

        {/* RIGHT COLUMN: Service Details & Team Assignments */}
        <div className="lg:col-span-2 space-y-5">
          {/* Services Ordered */}
          <Card title="Ordered Services">
            {services.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-6">
                No services added to this order.
              </p>
            ) : (
              <div className="space-y-3">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex justify-between items-start bg-brand-primary/40 border border-brand-border p-3.5 rounded-xl hover:bg-brand-muted/20 transition"
                  >
                    <div>
                      <div className="text-sm font-semibold text-brand-text">
                        {svc.service_name_snapshot}
                      </div>
                      {svc.category_name_snapshot && (
                        <div className="text-xs text-brand-text-muted mt-0.5">
                          {svc.category_name_snapshot}
                        </div>
                      )}
                      <div className="text-xs text-brand-text-muted mt-1 font-mono">
                        {svc.quantity} &times; {formatRupiah(svc.price_deal)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-accent whitespace-nowrap">
                      {formatRupiah(svc.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Financial Summary */}
            <div className="mt-5 pt-4 border-t border-brand-border space-y-2 text-sm">
              <div className="flex justify-between text-brand-text-muted">
                <span>Subtotal</span>
                <span className="font-medium text-brand-text">{formatRupiah(order.subtotal)}</span>
              </div>
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount</span>
                  <span className="font-medium">-{formatRupiah(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-text-muted">
                <span>Tax ({order.tax_rate}%)</span>
                <span className="font-medium text-brand-text">+{formatRupiah(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-accent pt-3 border-t border-brand-border mt-2">
                <span>Grand Total</span>
                <span>{formatRupiah(order.grand_total)}</span>
              </div>
            </div>
          </Card>

          {/* Assigned Team & Members */}
          <Card title={`Execution Team: ${order.teams?.name || 'Not Assigned'}`}>
            {assignments.length === 0 ? (
              <p className="text-sm text-brand-text-muted italic text-center py-6">
                No team members assigned yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-muted/30 border-b border-brand-border">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Member Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Job / Position</th>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-center">Team Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {assignments.map((a) => (
                      <tr key={a.id} className="hover:bg-brand-muted/20 transition">
                        <td className="px-4 py-3 font-medium text-brand-text">
                          {a.team_members?.users?.name || `Member #${a.team_member_id}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block text-xs px-2.5 py-0.5 rounded bg-brand-muted border border-brand-border text-brand-text-muted">
                            {a.jobs?.name || 'Task Assignment'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.is_lead ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                              <Star size={12} className="fill-amber-400" /> Lead
                            </span>
                          ) : (
                            <span className="text-brand-text-muted text-xs">—</span>
                          )}
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

// Subcomponent Card (Exact Super Admin Style)
function Card({ title, children }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-brand-border">
        <h2 className="text-xs font-bold text-brand-text uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
