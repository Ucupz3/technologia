import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function OrderCreate() {
  return (
    <RoleLayout>
      <Head title="Buat Order" />
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold text-brand-text mb-2">Buat Order Baru</h1>
        <p className="text-brand-text-muted">Halaman dalam pengembangan</p>
      </div>
    </RoleLayout>
  );
}
