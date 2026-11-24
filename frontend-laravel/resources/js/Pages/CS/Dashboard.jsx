import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  Users, FileText, DollarSign, AlertCircle,
  TrendingUp, Award, Package, Activity,
  RefreshCw, BarChart3, ArrowRight,
} from 'lucide-react';

export default function CustomerServiceDashboard() {
  const { auth } = usePage().props;
  const currentUserId = auth?.user?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartMode, setChartMode] = useState('orders'); // 'orders' or 'revenue'

  const load = () => {
    setLoading(true);
    setError('');

    Promise.all([
      fetch('/api/v1/orders').then((r) => r.json()),
      fetch('/api/v1/customers').then((r) => r.json()),
    ])
      .then(([ordersRes, custRes]) => {
        const rawOrders = ordersRes.success ? ordersRes.data || [] : [];
        const rawCustomers = custRes.success ? custRes.data || [] : [];

        // 1. Filter Pesanan KHUSUS yang ditangani/dibuat oleh CS ini
        const myOrders = rawOrders.filter(
          (o) =>
            o.created_by === currentUserId ||
            o.cs_id === currentUserId ||
            o.user_id === currentUserId
        );

        // 2. Filter Pelanggan yang ditangani oleh CS ini
        const myCustomerIds = new Set(myOrders.map((o) => o.customer_id));
        const myCustomers = rawCustomers.filter(
          (c) =>
            myCustomerIds.has(c.id) ||
            c.created_by === currentUserId ||
            c.cs_id === currentUserId
        );

        // 3. Hitung Top 5 Pelanggan milik CS ini
        const custMap = {};
        myCustomers.forEach((c) => {
          custMap[c.id] = {
            id: c.id,
            name: c.name,
            order_count: 0,
            total_revenue: 0,
          };
        });

        myOrders.forEach((o) => {
          const cid = o.customer_id;
          if (custMap[cid]) {
            custMap[cid].order_count += 1;
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

        // 4. Hitung Top Services yang berhasil dijual oleh CS ini
        const serviceMap = {};
        myOrders.forEach((o) => {
          const items = o.items || o.order_items || [];
          items.forEach((item) => {
            const sid = item.service_id || item.id || item.name;
            const name = item.service_name || item.name || 'Service';
            if (!serviceMap[sid]) {
              serviceMap[sid] = { id: sid, name, order_count: 0, total_revenue: 0 };
            }
            serviceMap[sid].order_count += 1;
            serviceMap[sid].total_revenue += Number(item.subtotal || item.price || 0);
          });
        });

        const top_services = Object.values(serviceMap)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 5);

        // 5. Agregasi Grafik Status Pesanan milik CS ini
        const statusCounts = {};
        myOrders.forEach((o) => {
          const st = o.status || 'draft';
          statusCounts[st] = (statusCounts[st] || 0) + 1;
        });
        const order_status_chart = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        }));

        // 6. 5 Pesanan Terbaru milik CS ini
        const recent_orders = myOrders.slice(0, 5);

        // 7. Agregasi 30 Hari Tren Pesanan & Pelunasan milik CS ini
        const dailyOrdersMap = {};
        const dailyPaidMap = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          dailyOrdersMap[key] = 0;
          dailyPaidMap[key] = 0;
        }

        myOrders.forEach((o) => {
          if (!o.created_at) return;
          const key = new Date(o.created_at).toISOString().slice(0, 10);
          if (dailyOrdersMap[key] !== undefined) {
            dailyOrdersMap[key] += Number(o.grand_total || 0);
          }
          if (o.payment_status === 'paid' && dailyPaidMap[key] !== undefined) {
            dailyPaidMap[key] += Number(o.grand_total || 0);
          }
        });

        const orders_chart = Object.entries(dailyOrdersMap).map(([date, amount]) => ({
          date,
          amount,
        }));
        const revenue_chart = Object.entries(dailyPaidMap).map(([date, amount]) => ({
          date,
          amount,
        }));

        // 8. Hitung Total Omzet & Piutang Pesanan CS ini
        const total_revenue = myOrders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0);
        const total_outstanding = myOrders
          .filter((o) => o.payment_status === 'unpaid' || o.payment_status === 'partial')
          .reduce((acc, o) => acc + Number(o.grand_total || 0), 0);

        setData({
          stats: {
            total_customers: myCustomers.length,
            total_orders: myOrders.length,
            total_revenue,
            total_outstanding,
          },
          orders_chart,
          revenue_chart,
          order_status_chart,
          top_customers,
          top_services,
          recent_orders,
        });

        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Failed to load dashboard data');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [currentUserId]);

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
          <h1 className="text-2xl font-bold text-brand-text">My CS Dashboard</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Ringkasan operasional pelanggan dan pesanan yang Anda tangani secara langsung.
          </p>
        </div>

        <button
          onClick={load}
          className="bg-brand-secondary border border-brand-border text-brand-text px-3 py-2 rounded-lg hover:bg-brand-muted flex items-center gap-2 text-sm transition"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="My Active Customers"
          value={data.stats.total_customers}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={FileText}
          label="My Handled Orders"
          value={data.stats.total_orders}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="My Total Sales Value"
          value={formatRupiah(data.stats.total_revenue)}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={AlertCircle}
          label="My Outstanding Invoices"
          value={formatRupiah(data.stats.total_outstanding)}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-accent" />
              <h2 className="text-sm font-semibold text-brand-text">
                {chartMode === 'orders' ? '30-Day My Order Value Trend' : '30-Day My Paid Revenue'}
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
            <h2 className="text-sm font-semibold text-brand-text">My Orders by Status</h2>
          </div>
          <OrderStatusChart data={data.order_status_chart} />
        </div>
      </div>

      {/* Top Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-brand-accent" />
              <h2 className="text-sm font-semibold text-brand-text">My Top 5 Customers</h2>
            </div>
            <Link href="/cs/customers" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
              All Customers <ArrowRight size={12} />
            </Link>
          </div>
          {data.top_customers.length === 0 ? (
            <EmptyState label="Belum ada data pelanggan yang ditangani" />
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
            <h2 className="text-sm font-semibold text-brand-text">My Top Sold Services</h2>
          </div>
          {data.top_services.length === 0 ? (
            <EmptyState label="Belum ada layanan yang terjual" />
          ) : (
            <div className="space-y-3">
              {data.top_services.map((s, i) => (
                <RankRow
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  meta={`${s.order_count} ${s.order_count === 1 ? 'order' : 'orders'}`}
                  value={formatRupiah(s.total_revenue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">My Recent Orders</h2>
          </div>
          <Link href="/cs/orders" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
            View All My Orders <ArrowRight size={12} />
          </Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <EmptyState label="Belum ada pesanan terbaru yang Anda tangani" />
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
                        href={`/cs/orders/${order.id}`}
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

// ============ SUB COMPONENTS ============
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
            <div key={i} className="flex-1 h-full flex items-end group relative cursor-pointer">
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  isZero
                    ? 'bg-brand-muted/30 hover:bg-brand-muted h-1'
                    : 'bg-gradient-to-t from-brand-accent/60 to-brand-accent hover:from-brand-accent hover:to-brand-accent2 shadow-sm'
                }`}
                style={!isZero ? { height: `${Math.max(height, 8)}%` } : undefined}
              />
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
  if (!data || data.length === 0) return <EmptyState label="No orders found" />;

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