import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => reset('password');
  }, []);

  const submit = (e) => {
    e.preventDefault();
    post(route('login'));
  };

  return (
    <>
      <Head title="Login" />

      <div className="min-h-[100dvh] flex bg-brand-primary text-brand-text overflow-x-hidden">
        {/* ==================== LEFT: IMAGE + BRANDING ==================== */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
          <img
            src="/images/login-bg.webp"
            alt="Tekna background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-100 scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/90 via-brand-primary/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-primary/80 via-brand-primary/20 to-transparent" />

          <div className="absolute -top-32 -right-32 w-[300px] h-[300px] bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[300px] h-[300px] bg-brand-accent2/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col p-12 xl:p-16 w-full h-full">
            <div className="flex items-center justify-start shrink-0">
              <img
                src="/logo.webp"
                alt="Tekna"
                className="w-14 xl:w-16 h-14 xl:h-16 object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]"
                onError={(e) => {
                  e.currentTarget.outerHTML =
                    '<span class="text-brand-text font-bold text-2xl">T</span>';
                }}
              />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-brand-accent/30 backdrop-blur-md mb-6">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-brand-accent uppercase tracking-[0.18em]">
                    ERP Internal Platform
                  </span>
                </div>

                <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-brand-text leading-[1.08] mb-6 tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
                  Kelola bisnis jasa
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-accent2">
                    lebih cerdas.
                  </span>
                </h1>

                <p className="max-w-xl text-brand-text-muted text-base xl:text-lg leading-relaxed drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]">
                  Sentralisasi pelanggan, pesanan, jadwal, invoice, dan pembayaran dalam satu platform terintegrasi.
                </p>

                <div className="mt-8 flex items-center gap-3">
                  <div className="w-12 h-[2px] bg-brand-muted rounded-full" />
                  <div className="w-2 h-2 rounded-full bg-brand-muted" />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-start shrink-0">
              <div className="text-xs text-brand-text-muted drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                © {new Date().getFullYear()} Tekna.id — PT Sapujagat Nirmana Tekna
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT: LOGIN FORM ==================== */}
        <div className="w-full lg:w-2/5 flex items-center justify-center border-l border-brand-border/60 p-6 sm:p-8 lg:p-8 relative overflow-hidden">
          <div className="lg:hidden absolute -top-32 -right-32 w-72 sm:w-96 h-72 sm:h-96 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="lg:hidden absolute -bottom-32 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-brand-accent2/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-md relative z-10">
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <img
                src="/logo.webp"
                alt="Tekna"
                className="w-20 h-20 object-contain drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]"
                onError={(e) => {
                  e.currentTarget.outerHTML =
                    '<span class="text-brand-text font-bold text-2xl">T</span>';
                }}
              />
            </div>

            <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-text mb-2">
                Selamat Datang
              </h2>
              <p className="text-sm text-brand-text-muted">
                Silakan masuk ke akun Anda untuk melanjutkan.
              </p>
            </div>

            {status && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} />
                {status}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest mb-2"
                >
                  Email
                </label>
                <div className="relative group">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none group-focus-within:text-brand-accent transition"
                  />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="nama@perusahaan.com"
                    className={`w-full pl-10 pr-3 py-3 bg-brand-secondary border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/40 focus:outline-none transition ${
                      errors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-brand-border focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-brand-text-muted uppercase tracking-widest"
                  >
                    Password
                  </label>
                  {canResetPassword && (
                    <Link
                      href={route('password.request')}
                      className="text-xs text-brand-accent hover:text-brand-accent2 transition"
                    >
                      Lupa password?
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none group-focus-within:text-brand-accent transition"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={data.password}
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-3 bg-brand-secondary border rounded-lg text-sm text-brand-text placeholder:text-brand-text-muted/40 focus:outline-none transition ${
                      errors.password
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-brand-border focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-accent transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="rounded border-brand-border bg-brand-secondary text-brand-accent focus:ring-brand-accent focus:ring-offset-0"
                />
                <span className="text-sm text-brand-text-muted">Ingat saya di perangkat ini</span>
              </label>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-brand-accent to-brand-accent2 text-brand-primary font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group hover:shadow-lg hover:shadow-brand-accent/20"
              >
                {processing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-brand-border text-center text-xs text-brand-text-muted">
              Sistem internal Tekna.id — Akses terbatas khusus untuk karyawan berwenang.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}