import { useEffect } from 'react';
import RoleLayout from '@/Layouts/RoleLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Newspaper, ArrowRight } from 'lucide-react';

export default function PaymentsPage() {
  useEffect(() => {
    router.visit('/admin/invoices');
  }, []);

  return (
    <RoleLayout>
      <Head title="Manajemen Pembayaran & Invoices" />
      <div className="p-8 text-center bg-brand-secondary rounded-xl border border-brand-border max-w-lg mx-auto mt-12 shadow-sm">
        <Newspaper size={48} className="mx-auto mb-4 text-brand-accent" />
        <h1 className="text-xl font-bold text-brand-text mb-2">
          Manajemen Pembayaran & Invoices
        </h1>
        <p className="text-sm text-brand-text-muted mb-6">
          Sistem manajemen pembayaran dan pelacakan transaksi terpusat di halaman Invoices. Mengarahkan Anda...
        </p>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 bg-brand-accent text-brand-primary px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-accent2 transition"
        >
          <span>Buka Halaman Invoices</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </RoleLayout>
  );
}
