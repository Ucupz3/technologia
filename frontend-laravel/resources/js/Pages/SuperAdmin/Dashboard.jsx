import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import {
  Users, FileText, DollarSign, AlertCircle,
  TrendingUp, Award, Package, Activity,
  RefreshCw, BarChart3,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/dashboard/super-admin')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <RoleLayout>
        <Head title="Dashboard" />
        <div className="p-12 text-center text-brand-text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-brand-accent" />
          Loading dashboard...
        </div>
      </RoleLayout>
    );
  }

  if (error) {
    return (
      <RoleLayout>
        <Head title="Dashboard" />
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center text-red-500 dark:text-red-400">
          Error: {error}
          <button onClick={load} className="ml-3 underline hover:no-underline">Coba lagi</button>
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <Head title="Dashboard" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Ringkasan sistem secara keseluruhan
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
          label="Total Users Aktif"
          value={data.stats.total_users}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={FileText}
          label="Order Bulan Ini"
          value={data.stats.total_orders}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue Bulan Ini"
          value={formatRupiah(data.stats.total_revenue)}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={AlertCircle}
          label="Total Outstanding"
          value={formatRupiah(data.stats.total_outstanding)}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Revenue 30 Hari</h2>
          </div>
          <RevenueChart data={data.revenue_chart} />
        </div>

        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Order per Status</h2>
          </div>
          <OrderStatusChart data={data.order_status_chart} />
        </div>
      </div>

      {/* Top Sales & Services Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Top 5 Sales</h2>
          </div>
          {data.top_sales.length === 0 ? (
            <EmptyState label="Belum ada data sales" />
          ) : (
            <div className="space-y-3">
              {data.top_sales.map((s, i) => (
                <RankRow
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  meta={`${s.order_count} order`}
                  value={formatRupiah(s.total_revenue)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">Top 5 Service</h2>
          </div>
          {data.top_services.length === 0 ? (
            <EmptyState label="Belum ada data service" />
          ) : (
            <div className="space-y-3">
              {data.top_services.map((s, i) => (
                <RankRow
                  key={s.id}
                  rank={i + 1}
                  name={s.name}
                  meta={`${s.order_count} kali dipesan`}
                  value={formatRupiah(s.total_revenue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-brand-secondary rounded-lg border border-brand-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-brand-accent" />
          <h2 className="text-sm font-semibold text-brand-text">Aktivitas Terbaru</h2>
        </div>
        {data.recent_audit_logs.length === 0 ? (
          <EmptyState label="Belum ada aktivitas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-border">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Waktu</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">User</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Aksi</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">Entity</th>
                  <th className="px-3 py-2 text-xs font-semibold text-brand-text-muted uppercase tracking-widest">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {data.recent_audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-3 py-2 text-brand-text-muted text-xs">{formatDateTime(log.created_at)}</td>
                    <td className="px-3 py-2 text-brand-text">{log.user_name}</td>
                    <td className="px-3 py-2">
                      <span className="text-xs bg-brand-accent/15 text-brand-accent border border-brand-accent/30 px-2 py-0.5 rounded font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-brand-text-muted text-xs">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-3 py-2 text-brand-text-muted text-xs font-mono">{log.ip_address || '—'}</td>
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
  if (data.length === 0) return <EmptyState label="Belum ada revenue 30 hari terakhir" />;

  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => {
          const height = (d.amount / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 group relative"
              title={`${d.date}: ${formatRupiah(d.amount)}`}
            >
              <div
                className="w-full bg-gradient-to-t from-brand-accent/60 to-brand-accent rounded-t transition hover:from-brand-accent hover:to-brand-accent2"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-brand-tertiary border border-brand-border text-brand-text text-xs rounded px-2 py-1 whitespace-nowrap z-10 shadow-lg">
                {formatRupiah(d.amount)}
                <div className="text-brand-text-muted text-[10px]">{d.date}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-brand-text-muted">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function OrderStatusChart({ data }) {
  if (data.length === 0) return <EmptyState label="Belum ada order" />;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Sesuai enum orders_status di DB baru (lowercase)
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
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(s) {
  if (!s) return '—';
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}