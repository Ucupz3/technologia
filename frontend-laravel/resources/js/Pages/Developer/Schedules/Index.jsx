import RoleLayout from '@/Layouts/RoleLayout';
import { Head } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

export default function DeveloperSchedules() {
  return (
    <RoleLayout>
      <Head title="Jadwal Proyek" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
          <Calendar size={24} className="text-brand-accent" />
          Jadwal Proyek
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Daftar deadline dan jadwal pengerjaan proyek developer.
        </p>
      </div>

      <div className="bg-brand-secondary border border-brand-border rounded-xl p-12 text-center text-brand-text-muted">
        <Calendar size={48} className="mx-auto mb-3 text-brand-text-muted/40" />
        <p className="text-base font-semibold text-brand-text mb-1">Halaman Jadwal Proyek</p>
        <p className="text-sm">Halaman ini siap untuk dikembangkan.</p>
      </div>
    </RoleLayout>
  );
}
