import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Invoices Saya" />
      <h1 className="text-2xl font-bold mb-2">Invoices Saya</h1>
      <p className="text-slate-500">Halaman Invoices Saya — segera diisi.</p>
    </RoleLayout>
  );
}
