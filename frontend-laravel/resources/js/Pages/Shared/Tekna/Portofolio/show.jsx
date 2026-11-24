import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';

export default function PortfolioShow({ slug, id }) {
  const [theme, setTheme] = useState('dark');
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const serviceId = id || slug;

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (!serviceId) return;

    fetch(`/api/v1/services/${serviceId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && res.data.status === 'active') {
          setService(res.data);

          // Fetch related services (hanya yang active)
          fetch('/api/v1/services')
            .then((r) => r.json())
            .then((allRes) => {
              if (allRes.success) {
                const related = allRes.data
                  .filter(
                    (s) =>
                      s.status === 'active' &&
                      String(s.category_id) === String(res.data.category_id) &&
                      String(s.id) !== String(res.data.id)
                  )
                  .slice(0, 3);
                setRelatedServices(related);
              }
            });
        } else {
          setService(null);
        }
      })
      .catch((err) => console.error('Fetch error:', err))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleShare = () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: service?.name || 'Tekna Service',
          text: service?.description || 'Lihat detail layanan di Tekna',
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-primary text-brand-text flex items-center justify-center text-sm">
        Memuat detail layanan...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-brand-primary text-brand-text flex flex-col items-center justify-center gap-4">
        <p className="text-base font-semibold">Layanan tidak ditemukan atau sedang tidak aktif</p>
        <Link href="/portofolio" className="px-4 py-2 bg-brand-accent text-brand-white rounded-lg text-xs font-semibold">
          Kembali ke Portofolio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-primary text-brand-text font-sans selection:bg-brand-accent selection:text-brand-white transition-colors duration-300">
      <Head title={`${service.name} - Tekna`} />
      <TeknaNavbar theme={theme} onToggleTheme={toggleTheme} />

      <main className="pt-[84px] pb-20 relative z-10">
        <section className="bg-brand-secondary/60 border-b border-brand-border py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-brand-accent text-brand-white text-xs font-bold px-2.5 py-1 rounded-md">
                {service.service_categories?.name || 'Service'}
              </span>
              <span className="bg-brand-tertiary border border-brand-border text-brand-text-muted text-xs font-semibold px-2.5 py-1 rounded-md">
                Status: {service.status}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-text tracking-tight mb-4">
              {service.name}
            </h1>
            <p className="text-brand-text-muted text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed mb-8">
              {service.description || 'Layanan solusi teknologi komprehensif dari Tekna.'}
            </p>

            {/* BARIS TOMBOL KEMBALI & SHARE LINK */}
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/portofolio"
                className="inline-flex items-center gap-2 text-brand-text-muted hover:text-brand-text text-xs font-semibold transition-colors"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Portofolio
              </Link>

              <span className="text-brand-border hidden sm:inline">|</span>

              {/* Tombol Share */}
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
                    Bagikan Layanan
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
            <div className="lg:col-span-8">
              <div className="bg-brand-secondary border border-brand-border rounded-xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-base font-bold text-brand-text mb-1">
                  Deskripsi Layanan
                </h2>
                <p className="text-xs text-brand-text-muted mb-6">
                  Rincian spesifikasi layanan dari sistem
                </p>

                <div className="text-brand-text-muted text-xs sm:text-sm leading-relaxed space-y-4">
                  <p>{service.description || 'Tidak ada deskripsi tambahan.'}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-brand-secondary border border-brand-border rounded-xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-brand-text mb-4 pb-2 border-b border-brand-border/60">
                  Rincian Detail
                </h3>

                <div className="space-y-4">
                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Kategori</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-text">
                      {service.service_categories?.name || '-'}
                    </span>
                  </div>

                  <div className="pb-3 border-b border-brand-border/40">
                    <span className="block text-xs text-brand-text-muted mb-1">Harga Default</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-accent">
                      {formatRupiah(service.default_price)}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs text-brand-text-muted mb-1">Durasi Pengerjaan</span>
                    <span className="text-xs sm:text-sm font-bold text-brand-text">
                      {service.duration ? `${service.duration} Hari` : 'Disesuaikan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedServices.length > 0 && (
            <section className="pt-4 border-t border-brand-border/40">
              <h2 className="text-lg font-bold text-brand-text mb-6">
                Layanan Terkait
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedServices.map((item) => (
                  <article key={item.id} className="bg-brand-secondary border border-brand-border rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-brand-text font-bold text-sm mb-2">{item.name}</h3>
                      <p className="text-brand-text-muted text-xs line-clamp-2 mb-4">{item.description}</p>
                    </div>
                    <Link
                      href={`/portofolio/${item.id}`}
                      className="w-full py-2 bg-brand-accent text-brand-white text-xs font-semibold rounded-lg text-center block"
                    >
                      View Details
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <TeknaFooter />
    </div>
  );
}