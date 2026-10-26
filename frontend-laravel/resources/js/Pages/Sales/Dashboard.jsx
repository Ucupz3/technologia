import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import {
  Users, FileText, DollarSign, AlertCircle,
  TrendingUp, Award, Package, Activity,
  RefreshCw, BarChart3, ArrowRight,
} from 'lucide-react';

export default function CustomerServiceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');

    Promise.all([
      fetch('/api/v1/dashboard/super-admin').then((r) => r.json()),
      fetch('/api/v1/orders').then((r) => r.json()),
      fetch('/api/v1/customers').then((r) => r.json()),
    ])
      .then(([dashRes, ordersRes, custRes]) => {
        const rawOrders = ordersRes.success ? ordersRes.data || [] : [];
        const rawCustomers = custRes.success ? custRes.data || [] : [];
        const dashData = dashRes.success ? dashRes.data : null;

        // Hitung Top 5 Pelanggan berdasarkan total nilai order
        const custMap = {};
        rawCustomers.forEach((c) => {
          custMap[c.id] = {
            id: c.id,
            name: c.name,
            order_count: c.order_count || 0,
            total_revenue: 0,
          };
        });

        rawOrders.forEach((o) => {
          const cid = o.customer_id;
          if (custMap[cid]) {
            custMap[cid].total_revenue += Number(o.grand_total || 0);
          } else if (cid) {
            custMap[cid] = {
              id: cid,
              name: o.customer_name_snapshot || o.customers?.name || `Customer #${cid}`,
              order_count: 1,
              total_revenue: Number(o.grand_total || 0),
            };
          }
        });

        const top_customers = Object.values(custMap)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 5);

        // Ambil 5 pesanan terbaru untuk tabel aktivitas
        const recent_orders = rawOrders.slice(0, 5);

        // Agregasi 30 hari untuk Nilai Pesanan CS
        const dailyOrdersMap = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dailyOrdersMap[key] = 0;
        }
        rawOrders.forEach((o) => {
          if (!o.created_at) return;
          const key = new Date(o.created_at).toISOString().slice(0, 10);
          if (dailyOrdersMap[key] !== undefined) {
            dailyOrdersMap[key] += Number(o.grand_total || 0);
          }
        });
        const orders_chart = Object.entries(dailyOrdersMap).map(([date, amount]) => ({
          date,
          amount,
        }));

        setData({
          stats: {
            total_customers: rawCustomers.length,
            total_orders: rawOrders.length,
            total_revenue: dashData?.stats?.total_revenue || rawOrders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0),
            total_outstanding: dashData?.stats?.total_outstanding || 0,
          },
          orders_chart,
          revenue_chart: dashData?.revenue_chart || [],
          order_status_chart: dashData?.order_status_chart || [],
          top_customers,
          top_services: dashData?.top_services || [],
          recent_orders,
        });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  const [chartMode, setChartMode] = useState('orders'); // 'orders' or 'revenue'

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Customer Service Dashboard" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading dashboard data...
        </div>
      </RoleLayout>
    );
  }

  if (error) {
    return (
      <RoleLayout>
        <Head title="Customer Service Dashboard" />
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center text-red-500 dark:text-red-400">
          Error: {error}
          <button onClick={load} className="ml-3 underline hover:no-underline">Try again</button>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title="Customer Service Dashboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Customer Service Dashboard</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Operational summary of customers, orders, and billing for Customer Service
          </p>
        </div>

        <button
          onClick={load}
          className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stat Cards - Exact Super Admin Format */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Total Active Customers"
          value={data.stats.total_customers}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={FileText}
          label="Total Orders Received"
          value={data.stats.total_orders}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value={formatRupiah(data.stats.total_revenue)}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={AlertCircle}
          label="Total Outstanding Invoices"
          value={formatRupiah(data.stats.total_outstanding)}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Charts Row - Exact Super Admin Format */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-accent" />
              <h2 className="text-sm font-semibold text-brand-text">
                {chartMode === 'orders' ? '30-Day Sales Trend (Order Value)' : '30-Day Revenue (Paid Invoices)'}
              </h2>
            </div>
            <div className="flex items-center bg-brand-primary border border-brand-border rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setChartMode('orders')}
                className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                  chartMode === 'orders'
                    ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                    : 'text-brand-text-muted hover:text-brand-text'
                }`}
              >
                Order Value
              </button>
              <button
                type="button"
                onClick={() => setChartMode('revenue')}
                className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                  chartMode === 'revenue'
                    ? 'bg-brand-accent text-brand-primary font-semibold shadow-sm'
                    : 'text-brand-text-muted hover:text-brand-text'
                }`}
              >
                Paid Invoices
              </button>
            </div>
          </div>
          <RevenueChart data={chartMode === 'orders' ? data.orders_chart : data.revenue_chart} />
        </div>

        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Orders by Status</h2>
          </div>
          <OrderStatusChart data={data.order_status_chart} />
        </div>
      </div>

      {/* Top Rows - Exact Super Admin Format */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-brand-accent" />
              <h2 className="text-sm font-semibold text-brand-text">Top 5 Customers</h2>
            </div>
            <Link href="/sales/customers" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
              All Customers <ArrowRight size={12} />
            </Link>
          </div>
          {data.top_customers.length === 0 ? (
            <EmptyState label="No customer data available" />
          ) : (
            <div className="space-y-3">
              {data.top_customers.map((c, i) => (
                <RankRow
                  key={c.id}
                  rank={i + 1}
                  name={c.name}
                  meta={`${c.order_count} ${c.order_count === 1 ? 'order' : 'orders'}`}
                  value={formatRupiah(c.total_revenue)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Top 5 Best-Selling Services</h2>
          </div>
          {data.top_services.length === 0 ? (
            <EmptyState label="No service data available" />
          ) : (
            <div className="space-y-3">
              {data.top_services.map((s, i) => (
                <RankRow
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  meta={`${s.order_count} ${s.order_count === 1 ? 'order placed' : 'orders placed'}`}
                  value={formatRupiah(s.total_revenue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table - Exact Super Admin Recent Logs Format */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Recent Customer Orders</h2>
          </div>
          <Link href="/sales/orders" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
            View All Orders <ArrowRight size={12} />
          </Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <EmptyState label="No recent orders found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-border">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order No.</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Customer</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Team</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Total Amount</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Order Status</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {data.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-brand-text whitespace-nowrap">
                      {order.order_number}
                    </td>
                    <td className="px-3 py-2 text-brand-text font-medium">
                      {order.customer_name_snapshot || order.customers?.name || '—'}
                    </td>
                    <td className="px-3 py-2 text-brand-text-muted text-xs">
                      {order.teams?.name ? (
                        <span className="inline-flex items-center gap-1 bg-brand-muted/50 px-2 py-0.5 rounded border border-brand-border">
                          <Users size={12} /> {order.teams.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold text-brand-accent whitespace-nowrap">
                      {formatRupiah(order.grand_total)}
                    </td>
                    <td className="px-3 py-2">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/sales/orders/${order.id}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition inline-block"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleLayout>
  );
}

// ============ SUB COMPONENTS PERSIS SUPER ADMIN ============
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-brand-text">{value}</div>
      <div className="text-xs text-brand-text-muted mt-1">{label}</div>
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) return <EmptyState label="No transaction data in this period" />;

  const max = Math.max(...data.map((d) => Number(d.amount || 0)), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5 h-44 pt-6 pb-2">
        {data.map((d, i) => {
          const val = Number(d.amount || 0);
          const isZero = val === 0;
          const height = max > 0 ? (val / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 h-full flex items-end group relative cursor-pointer"
            >
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isZero
                    ? 'bg-brand-muted/30 hover:bg-brand-muted h-1'
                    : 'bg-gradient-to-t from-brand-accent/60 to-brand-accent hover:from-brand-accent hover:to-brand-accent2 shadow-sm'
                }`}
                style={!isZero ? { height: `${Math.max(height, 8)}%` } : undefined}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-brand-tertiary border border-brand-border text-brand-text text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap z-30 shadow-xl pointer-events-none">
                <div className="font-semibold text-brand-accent">{formatRupiah(val)}</div>
                <div className="text-brand-text-muted text-[10px]">{d.date}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-brand-text-muted border-t border-brand-border/40 pt-2">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function OrderStatusChart({ data }) {
  if (data.length === 0) return <EmptyState label="No orders found" />;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const statusColor = {
    draft:       'bg-slate-500',
    pending:     'bg-amber-500',
    in_progress: 'bg-cyan-500',
    completed:   'bg-emerald-500',
    cancelled:   'bg-red-500',
  };

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.status}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-brand-text font-medium">{formatStatus(d.status)}</span>
              <span className="text-brand-text-muted">
                {d.count} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 bg-brand-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColor[d.status] || 'bg-gray-500'} rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankRow({ rank, name, meta, value }) {
  const rankColor = {
    1: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40',
    2: 'bg-gray-400/20 text-gray-600 dark:text-gray-300 border-gray-400/40',
    3: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40',
  };
  const color = rankColor[rank] || 'bg-brand-muted text-brand-text-muted border-brand-border';

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${color}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-brand-text font-medium truncate">{name}</div>
        <div className="text-xs text-brand-text-muted">{meta}</div>
      </div>
      <div className="text-sm font-semibold text-brand-accent">{value}</div>
    </div>
  );
}

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
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${colors[status] || colors.draft}`}>
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
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>
      {labels[status] || status}
    </span>
  );
}

function EmptyState({ label }) {
  return (
    <div className="py-8 text-center text-brand-text-muted text-sm">{label}</div>
  );
}

// ============ HELPERS ============
function formatRupiah(n) {
  if (!n) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(s) {
  const statusLabels = {
    draft:       'Draft',
    pending:     'Pending',
    in_progress: 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
  };
  return statusLabels[s] || (s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
}
