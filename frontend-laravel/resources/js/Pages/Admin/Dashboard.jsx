import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Dashboard Admin" />
      <h1 className="text-2xl font-bold mb-2">Dashboard Admin</h1>
      <p className="text-slate-500">Halaman Dashboard Admin — segera diisi.</p>
    </RoleLayout>
  );
}
