import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function Page() {
  return (
    <RoleLayout>
      <Head title="Audit Logs" />
      <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
      <p className="text-slate-500">Halaman Audit Logs — segera diisi.</p>
    </RoleLayout>
  );
}
