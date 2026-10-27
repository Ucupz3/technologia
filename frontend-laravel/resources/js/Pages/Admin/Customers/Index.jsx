import { useEffect, useState } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link } from '@inertiajs/react';
import { RefreshCw, Search, Contact, X, Mail, Phone } from 'lucide-react';

function getBasePath() {
  return window.location.pathname.replace(/\/customers.*$/, '');
}

export default function CustomersIndex() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const basePath = getBasePath();

  const load = () => {
    setLoading(true);
    setError('');
    fetch('/api/v1/customers')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomers(d.data || []);
        else setError(d.message || 'Gagal ambil data');
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  });

  return (
    <RoleLayout>
      <Head title="Manajemen Customers" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Manajemen Customers</h1>
        <p className="text-sm text-brand-text-muted mt-1">Total {customers.length} customer</p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Cari nama, email, atau phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-brand-primary border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all shadow-sm"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition">
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={load} className="bg-brand-primary border border-brand-border text-brand-text px-3 py-2.5 rounded-xl hover:bg-brand-muted flex items-center gap-2 text-sm transition shadow-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>Refresh</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg border border-brand-border overflow-hidden">
        {loading && <div className="p-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-brand-accent" /></div>}
        {error && <div className="p-8 text-center"><p className="text-red-500 mb-3">{error}</p><button onClick={load} className="text-brand-accent underline">Coba lagi</button></div>}
        {!loading && !error && filtered.length === 0 && <div className="p-12 text-center"><Contact size={48} className="mx-auto mb-3 text-brand-text-muted/40" /><p className="text-brand-text-muted">Tidak ada customer</p></div>}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-muted/40 border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Nama</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase">Sales PIC</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-text-muted uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-muted/40 transition">
                    <td className="px-4 py-3 font-medium text-brand-text text-sm">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      <div className="flex items-center gap-1.5"><Mail size={12} />{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text-muted">
                      <div className="flex items-center gap-1.5"><Phone size={12} />{c.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-text">{c.sales_user?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/customers/${c.id}`}
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
