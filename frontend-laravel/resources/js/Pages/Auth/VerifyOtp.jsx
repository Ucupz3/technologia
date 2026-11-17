import { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Shield, Mail, ArrowLeft, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';

export default function VerifyOtp({ email, status }) {
  const { data, setData, post, processing, errors } = useForm({ code: '' });
  const [resending, setResending] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Sync digits -> data.code
  useEffect(() => {
    setData('code', digits.join(''));
  }, [digits]);

  const handleChange = (index, value) => {
    const v = value.replace(/\D/g, '');
    if (!v) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Kalau user paste 6 digit sekaligus
    if (v.length > 1) {
      const pasted = v.slice(0, 6).split('');
      const next = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < 6) next[index + i] = d;
      });
      setDigits(next);
      const focusIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = v;
    setDigits(next);

    // Auto-focus ke input berikutnya
    if (index < 5 && v) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = (e) => {
    e.preventDefault();
    post(route('login.otp.verify'));
  };

  const handleResend = () => {
    setResending(true);
    setDigits(['', '', '', '', '', '']);
    router.post(route('login.otp.resend'), {}, {
      onFinish: () => {
        setResending(false);
        inputRefs.current[0]?.focus();
      },
    });
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <>
      <Head title="Verifikasi OTP" />

      <div className="min-h-[100dvh] md:min-h-screen flex items-center justify-center bg-brand-primary text-brand-text p-4 relative overflow-hidden">

        {/* bg images */}
        <img
          src="/images/login-bg.webp"
          alt="Tekna background"
          className="
            fixed md:absolute
            inset-0
            w-full h-full
            object-cover
            object-center
            md:scale-[1.03]
          "
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* overlay gelap */}
        <div
          className="
            fixed md:absolute
            inset-0
            bg-brand-primary/80
          "
        />

        {/* Radial vignette */}
        <div
          className="
            fixed md:absolute
            inset-0
            bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]
          "
        />

        {/* Subtle accent glow */}
        <div
          className="
            absolute
            -top-32
            -right-32
            w-[400px]
            h-[400px]
            bg-brand-muted/10
            rounded-full
            blur-3xl
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            -bottom-40
            -left-40
            w-[400px]
            h-[400px]
            bg-brand-muted/10
            rounded-full
            blur-3xl
            pointer-events-none
          "
        />

        {/* content */}
        <div className="relative z-10 w-full max-w-md">

          <div className="relative rounded-2xl p-[1px] to-brand-accent2/10 shadow-2xl shadow-black/40">
            <div className="rounded-2xl bg-brand-primary backdrop-blur-xl p-6 sm:p-8 relative overflow-hidden">
          
              {/* hiasan atasss */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent" />
              {/* kemabli ke halamn login */}
              <Link
                href={route('login')}
                aria-label="Kembali ke halaman login"
                className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full text-brand-text-muted hover:text-brand-accent hover:border-brand-accent/50 transition"
              >
                <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </Link>
              {/* logosssss*/}
              <div className="flex items-center justify-center mb-5 sm:mb-10">
                <img
                  src="/logo.webp"
                  alt="Tekna"
                  className="
                    w-16 h-16
                    sm:w-20 sm:h-20
                    md:w-24 md:h-24
                    object-contain
                    drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]
                  "
                  onError={(e) => {
                    e.currentTarget.outerHTML =
                      '<span class="text-brand-text font-bold text-2xl">T</span>';
                  }}
                />
              </div>

              {/* Heading */}
              <div className="relative text-center mb-6 sm:mb-10">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-text mb-2">
                  Verifikasi OTP<span className="text-brand-accent">.</span>
                </h1>
                <p className="text-sm text-brand-text-muted">
                  Kode 6 digit telah dikirim ke email{' '}
                  <span className="font-medium text-brand-text">
                    {(() => {
                      const [name, domain] = (email || '').split('@');
                      if (!domain) return email;
                      const visible = name.slice(0, 4);
                      const masked = '*'.repeat(Math.max(name.length - 4, 3));
                      return `${visible}${masked}@${domain}`;
                    })()}
                  </span>
                </p>
              </div>

              {/* Status */}
              {status && (
                <div className="mb-5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
                  {status}
                </div>
              )}

              {/* Form */}
              <form onSubmit={submit} className="">
                {/* 6-box OTP input */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-brand-text-muted uppercase tracking-widest mb-4 text-center">
                    Masukkan Kode OTP
                  </label>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`w-10 h-12 text-xl sm:w-12 sm:h-14 sm:text-2xl md:w-12 md:h-16 md:text-3xl text-center font-bold rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          errors.code
                            ? 'border-red-500/60 bg-red-500/5 text-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                            : digit
                            ? 'border-brand-accent/60 bg-brand-accent/10 text-brand-accent shadow-[0_0_0_4px_rgba(3,194,201,0.08)]'
                            : 'border-brand-border bg-brand-primary/60 text-brand-text focus:border-brand-accent focus:bg-brand-primary focus:shadow-[0_0_0_4px_rgba(3,194,201,0.1)]'
                        }`}
                      />
                    ))}
                  </div>

                  {errors.code && (
                    <p className="mt-3 text-xs sm:text-sm text-red-400 flex items-center justify-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full" />
                      {errors.code}
                    </p>
                  )}

                  <p className="mt-12 mb-4 text-xs sm:text-sm text-brand-text-muted text-center">
                    Kode berlaku <span className="text-brand-accent font-medium">5 menit</span>
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={processing || !isComplete}
                  className="relative w-full bg-gradient-to-r from-brand-accent to-brand-accent2 text-brand-primary font-bold py-3 text-base sm:py-4 sm:text-lg rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group overflow-hidden shadow-lg shadow-brand-accent/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  <span className="relative flex items-center justify-center gap-2">
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Verifikasi & Masuk
                      </>
                    )}
                  </span>
                </button>

                {/* Resend + Back */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-sm sm:text-sm">
                    <span className="text-brand-text-muted">
                      Tidak menerima kode?
                    </span>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="flex items-center gap-1.5 font-medium text-brand-accent hover:text-brand-accent2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resending ? 'Mengirim ulang...' : 'Kirim ulang kode OTP'}
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>

          {/* Bottom note */}
          <p className="mt-6 text-center text-xs text-brand-text-muted/70">
            © {new Date().getFullYear()} Tekna.id — PT Sapujagat Nirmana Tekna
          </p>
        </div>
      </div>
    </>
  );
}