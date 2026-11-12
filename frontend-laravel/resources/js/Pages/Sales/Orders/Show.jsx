import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';

export default function OrderShow() {
  return (
    <RoleLayout>
      <Head title="Detail Order" />
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold text-brand-text mb-2">Detail Order</h1>
        <p className="text-brand-text-muted">Halaman dalam pengembangan</p>
      </div>
    </RoleLayout>
  );
}
