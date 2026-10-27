import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import { RefreshCw, FileText } from 'lucide-react';

const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

function getBasePath() {
  return window.location.pathname.replace(/\/invoices.*$/, '') || '/admin';
}

function PaymentStatusBadge({ status }) {
  const colors = {
    unpaid: 'bg-red-500/15 text-red-600 border-red-500/40',
    partial: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    paid: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    cancelled: 'bg-gray-500/15 text-gray-600 border-gray-500/40',
  };
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || colors.unpaid}`}>{status}</span>;
}

export default function InvoicesIndex() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const basePath = getBasePath();

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/invoices')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoices(d.data || []);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  return (
    <RoleLayout>
      <Head title="Invoices — Admin" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Invoices</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {invoices.length} tagihan</p>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-accent" /></div>}
        
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">{error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}

        {!loading && !error && invoices.length === 0 && (
          <div className="p-12 text-center"><FileText size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Belum ada invoice</p></div>
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Invoice</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Total Tagihan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Dibayar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Sisa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-brand-text font-semibold">{inv.invoice_number}</div>
                      <div className="text-xs text-brand-text-muted">{inv.order_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{inv.customer_name}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatRupiah(inv.grand_total)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-500 font-semibold">{formatRupiah(inv.total_paid)}</td>
                    <td className="px-4 py-3 text-sm text-red-500">{formatRupiah(inv.remaining)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {/* ✅ Mengarah ke halaman Show Admin */}
                      <Link
                        href={`${basePath}/invoices/${inv.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-accent border border-brand-accent/40 hover:bg-brand-accent/10 transition"
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
