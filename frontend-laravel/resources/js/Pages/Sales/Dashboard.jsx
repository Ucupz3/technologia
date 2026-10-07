import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Dashboard Sales" />
      <h1 className="text-2xl font-bold mb-2">Dashboard Sales</h1>
      <p className="text-slate-500">Halaman Dashboard Sales — segera diisi.</p>
    </RoleLayout>
  );
}
