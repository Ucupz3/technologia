import RoleLayout from '@/Layouts/RoleLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { ShieldCheck, Mail, ShieldAlert } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;

    return (
        <RoleLayout>
            <Head title="Profile Saya" />

            {/* Header Halaman */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-brand-text">Profile Saya</h1>
                <p className="text-sm text-brand-text-muted mt-1">
                    Perbarui informasi profil, kata sandi, dan pengaturan keamanan akun Anda.
                </p>
            </div>

            {/* GRID LAYOUT 2 KOLOM */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                
                {/* KOLOM KIRI (Lebar 2/3): Form Profil & Password */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-brand-secondary border border-brand-border p-6 sm:p-8 rounded-xl shadow-sm">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    <div className="bg-brand-secondary border border-brand-border p-6 sm:p-8 rounded-xl shadow-sm">
                        <UpdatePasswordForm />
                    </div>
                </div>

                {/* KOLOM KANAN (Lebar 1/3): Info Akun & Danger Zone */}
                <div className="xl:col-span-1 space-y-6">
                    
                    {/* Card Info Akun */}
                    <div className="bg-brand-secondary border border-brand-border p-6 rounded-xl shadow-sm">
                        <h2 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-brand-accent" /> Informasi Akun
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Nama Akun</p>
                                <p className="text-sm font-medium text-brand-text flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xs">
                                        {auth.user.name.charAt(0)}
                                    </span>
                                    {auth.user.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Email</p>
                                <p className="text-sm text-brand-text flex items-center gap-2 break-all">
                                    <Mail size={14} className="text-brand-text-muted" />
                                    {auth.user.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-brand-text-muted uppercase tracking-wider font-semibold mb-1">Status Keamanan</p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Terverifikasi
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card Hapus Akun (Danger Zone) */}
                    <div className="bg-brand-secondary border border-red-500/20 p-6 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert size={80} className="text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <DeleteUserForm />
                        </div>
                    </div>

                </div>
            </div>
        </RoleLayout>
    );
}