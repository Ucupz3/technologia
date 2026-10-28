import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Manajemen Customers" />
      <h1 className="text-2xl font-bold mb-2">Manajemen Customers</h1>
      <p className="text-slate-500">Halaman Manajemen Customers — segera diisi.</p>
    </RoleLayout>
  );
}
