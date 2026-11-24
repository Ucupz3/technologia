import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';

export default function ProductsIndex() {
  const [theme, setTheme] = useState('dark');
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [loading, setLoading] = useState(true);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    fetch('/api/v1/orders')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          // FILTER: Hanya ambil order yang berstatus COMPLETED
          const completedOnly = res.data.filter((order) => order.status === 'completed');
          setOrders(completedOnly);
        }
      })
      .catch((err) => console.error('Error fetching orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const customerOptions = useMemo(() => {
    const list = orders
      .map((o) => o.customers?.name || o.customer_name_snapshot)
      .filter(Boolean);
    return [...new Set(list)];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customers?.name && item.customers.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const customerName = item.customers?.name || item.customer_name_snapshot || '';
      const matchesCustomer =
        selectedCustomer === 'all' || customerName === selectedCustomer;

      return matchesSearch && matchesCustomer;
    });
  }, [searchQuery, selectedCustomer, orders]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text font-sans selection:bg-brand-accent selection:text-brand-white transition-colors duration-300">
      <Head title="Our Products & Completed Projects - Tekna" />
      <TeknaNavbar theme={theme} onToggleTheme={toggleTheme} />

      <main className="pt-[84px] pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          <header className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-text mb-2">
              Completed Products & Projects
            </h1>
            <p className="text-brand-text-muted text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Daftar produk dan solusi digital yang telah resmi diselesaikan dan diimplementasikan untuk klien enterprise.
            </p>
          </header>

          <div className="mb-4 bg-brand-secondary border border-brand-border rounded-xl p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            <div className="relative flex-1 w-full flex items-center">
              <svg className="absolute left-3 size-4 text-brand-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari produk atau proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-transparent text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <label htmlFor="customer-filter" className="text-xs font-semibold text-brand-text-muted whitespace-nowrap">
                Klien:
              </label>
              <select
                id="customer-filter"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="bg-brand-primary text-brand-text text-xs sm:text-sm border border-brand-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-accent cursor-pointer"
              >
                <option value="all">Semua Klien</option>
                {customerOptions.map((cust) => (
                  <option key={cust} value={cust} className="bg-brand-secondary text-brand-text">
                    {cust}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-brand-text-muted text-xs mb-5">
            <span className="text-brand-accent font-bold">{filteredOrders.length}</span> produk/proyek selesai ditemukan
          </p>

          {loading ? (
            <div className="text-center py-12 text-brand-text-muted text-sm">Loading data...</div>
          ) : filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="bg-brand-secondary border border-brand-border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-brand-accent/50 hover:shadow-xl transition-all duration-300 group"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-brand-tertiary flex items-center justify-center p-6 text-center border-b border-brand-border/40">
                      <span className="text-brand-accent font-bold text-xs tracking-wide bg-brand-accent/10 px-3 py-1 rounded-full border border-brand-accent/20">
                        {order.customers?.name || order.customer_name_snapshot || 'Enterprise Product'}
                      </span>
                    </div>

                    <div className="p-5 pb-3">
                      <h3 className="text-brand-text text-base md:text-lg font-bold mb-1 line-clamp-1 group-hover:text-brand-accent transition-colors">
                        {order.name}
                      </h3>

                      <p className="text-brand-text-muted text-xs md:text-sm leading-relaxed line-clamp-3 mb-4">
                        {order.notes || 'Sistem telah diselesaikan dan beroperasi penuh sesuai spesifikasi kebutuhan.'}
                      </p>

                      <div className="text-xs text-brand-accent font-semibold pt-2 border-t border-brand-border/40">
                        Nilai Proyek: {formatRupiah(order.grand_total || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-2">
                    <Link
                      href={`/products/${order.id}`}
                      className="w-full py-2.5 px-4 bg-brand-accent hover:bg-brand-accent2 text-brand-white font-semibold rounded-xl text-sm transition-colors block text-center shadow-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-brand-secondary rounded-2xl border border-brand-border">
              <h4 className="text-base font-semibold text-brand-text mb-1">Produk tidak ditemukan</h4>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCustomer('all'); }}
                className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-accent text-brand-white"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </main>

      <TeknaFooter />
    </div>
  );
}