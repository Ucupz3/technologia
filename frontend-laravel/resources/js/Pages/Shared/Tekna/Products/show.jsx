import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';

export default function ProductsShow({ id, slug }) {
  const [theme, setTheme] = useState('dark');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const productId = id || slug;

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/v1/orders/${productId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && res.data.status === 'completed') {
          setOrder(res.data);
        } else {
          setOrder(null);
        }
      })
      .catch((err) => console.error('Error fetching product detail:', err))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleShare = () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: order?.name || 'Tekna Completed Product',
          text: `Lihat detail solusi sistem ${order?.name} di Tekna`,
          url: currentUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-primary text-brand-text flex items-center justify-center text-sm">
        Memuat detail produk...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-primary text-brand-text flex flex-col items-center justify-center gap-4">
        <p className="text-base font-semibold">Produk / Proyek tidak ditemukan atau belum selesai</p>
        <Link href="/products" className="px-4 py-2 bg-brand-accent text-brand-white rounded-lg text-xs font-semibold">
          Kembali ke Products
        </Link>
      </div>
    );
  }

  // Extract real data from backend response
  const customerName = order.customers?.name || order.customer_name_snapshot || 'Klien Enterprise';
  const customerEmail = order.customers?.email || order.pic_email_snapshot || order.customer_pics?.email || null;
  const customerPhone = order.customers?.phone || order.customer_pics?.phone || null;
  const customerAddress = order.customer_address_snapshot || order.customers?.address || null;
  const salesUser = order.sales_user;

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text font-sans selection:bg-brand-accent selection:text-brand-white transition-colors duration-300">
      <Head title={`${order.name} - Tekna Products`} />
      <TeknaNavbar theme={theme} onToggleTheme={toggleTheme} />

      <main className="pt-[84px] pb-20 relative z-10">
        <section className="bg-brand-secondary/60 border-b border-brand-border py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-brand-accent text-brand-white text-xs font-bold px-2.5 py-1 rounded-md">
                {customerName}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-text tracking-tight mb-4">
              {order.name}
            </h1>
            <p className="text-brand-text-muted text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed mb-8">
              {order.notes || 'Sistem dan solusi digital berbasis arsitektur enterprise yang telah resmi diselesaikan dan diimplementasikan.'}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-brand-text-muted hover:text-brand-text text-xs font-semibold transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Products
              </Link>

              <span className="text-brand-border hidden sm:inline">|</span>

              <button
                onClick={handleShare}
                type="button"
                className="inline-flex items-center gap-2 text-brand-accent hover:text-brand-accent2 text-xs font-semibold transition-colors focus:outline-none"
              >
                {copied ? (
                  <>
                    <svg className="size-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-500">Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Bagikan Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-brand-secondary border border-brand-border rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-brand-text mb-1">
                  Gambaran Umum Solusi
                </h2>
                <p className="text-xs text-brand-text-muted mb-6">
                  Deskripsi dan spesifikasi hasil implementasi sistem
                </p>

                <div className="text-brand-text-muted text-xs sm:text-sm leading-relaxed space-y-4">
                  <p>{order.notes || 'Pengembangan sistem ini diselesaikan sesuai standar kualitas dan timeline kesepakatan.'}</p>
                </div>
              </div>

              {order.order_services && order.order_services.length > 0 && (
                <div className="bg-brand-secondary border border-brand-border rounded-xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-base font-bold text-brand-text mb-1">
                    Cakupan Fitur & Layanan Terintegrasi
                  </h2>
                  <p className="text-xs text-brand-text-muted mb-6">
                    Layanan dan modul yang diimplementasikan pada produk ini
                  </p>

                  <div className="space-y-3">
                    {order.order_services.map((os) => (
                      <div
                        key={os.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-brand-tertiary/50 border border-brand-border/60 rounded-xl gap-2"
                      >
                        <div>
                          <span className="text-xs font-bold text-brand-accent block mb-0.5">
                            {os.category_name_snapshot || 'Layanan'}
                          </span>
                          <h4 className="text-sm font-semibold text-brand-text">
                            {os.service_name_snapshot}
                          </h4>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-semibold text-brand-text">
                            {formatRupiah(os.price_deal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-secondary border border-brand-border rounded-xl p-6 shadow-sm sticky top-28">
                <h3 className="text-base font-bold text-brand-text mb-4 pb-2 border-b border-brand-border/60">
                  Spesifikasi Proyek
                </h3>

                <div className="space-y-4">
                  {/* DETAIL KLIEN ENTERPRISE */}
                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Klien Enterprise</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-text block">
                      {customerName}
                    </span>
                    {customerEmail && (
                      <span className="text-xs text-brand-text-muted block mt-0.5">
                        Email: {customerEmail}
                      </span>
                    )}
                    {customerPhone && (
                      <span className="text-xs text-brand-text-muted block mt-0.5">
                        Telp: {customerPhone}
                      </span>
                    )}
                    {customerAddress && (
                      <span className="text-xs text-brand-text-muted block mt-0.5">
                        Alamat: {customerAddress}
                      </span>
                    )}
                  </div>

                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Total Nilai Proyek</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-accent">
                      {formatRupiah(order.grand_total)}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Tanggal Mulai</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-text">
                      {formatDate(order.start_date_project)}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Tanggal Selesai</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      {formatDate(order.end_date_project || order.created_at)}
                    </span>
                  </div>

                  {/* KONTAK CUSTOMER SERVICE (CS) / SALES */}
                  <div>
                    <span className="block text-xs text-brand-text-muted mb-1">Customer Service (Penanggung Jawab)</span>
                    {salesUser ? (
                      <>
                        <span className="text-xs sm:text-sm font-bold text-brand-text block">
                          {salesUser.name}
                        </span>
                        {salesUser.email && (
                          <span className="text-xs text-brand-text-muted block mt-0.5">
                            Email: {salesUser.email}
                          </span>
                        )}
                        {salesUser.phone && (
                          <span className="text-xs text-brand-text-muted block mt-0.5">
                            Telp: {salesUser.phone}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-brand-text-muted italic block">
                        Tidak ada CS yang ditugaskan
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <TeknaFooter />
    </div>
  );
}