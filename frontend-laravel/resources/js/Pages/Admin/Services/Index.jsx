import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Manajemen Services" />
      <h1 className="text-2xl font-bold mb-2">Manajemen Services</h1>
      <p className="text-slate-500">Halaman Manajemen Services — segera diisi.</p>
    </RoleLayout>
  );
}
