import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Code2, Users, Rocket, Package, Globe, Briefcase, Menu, X, Moon, Sun, LogIn } from 'lucide-react';
import { LOGO_SRC, NAV_LINKS } from './data';

const ICONS = { code: Code2, users: Users, rocket: Rocket, package: Package, globe: Globe, briefcase: Briefcase };
const SPY_IDS = ['about', 'projects', 'testimonials', 'contact'];

function Logo() {
    const [failed, setFailed] = useState(false);
    if (!failed) {
        return (
            <img
                src={LOGO_SRC || '/logo.webp'}
                alt="Tekna - serving the universe"
                onError={() => setFailed(true)}
                className="h-7 w-auto"
            />
        );
    }
    // Jika gambar gagal dimuat, tetap kosong (tidak ada fallback teks)
    return null;
}

export default function TeknaNavbar({ theme, onToggleTheme }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('top');

    const { auth } = usePage().props;

    useEffect(() => {
        const onScroll = () => {
            let current = 'top';
            for (const id of SPY_IDS) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top <= 160) current = id;
            }
            setActive(current);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const renderLink = (l, mobile = false) => {
        const Icon = ICONS[l.icon];
        const isActive = l.spy && l.spy === active;

        const className = `inline-flex items-center gap-2 text-[15px] transition-colors ${mobile ? 'rounded-md px-3 py-3' : ''
            } ${isActive
                ? 'font-semibold text-brand-text'
                : 'font-normal text-brand-text-muted hover:text-brand-text'
            }`;

        return (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className={className}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {l.label}
            </Link>
        );
    };

    const ThemeBtn = (
        <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent text-brand-white shadow-lg shadow-brand-accent/30 transition hover:bg-brand-accent2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent2"
        >
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
    );

    const AuthBtn = auth?.user ? (
        <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent/20 lg:inline-flex"
        >
            <Users className="h-4 w-4" />
            Dashboard
        </Link>
    ) : (
        <Link
            href="/login"
            className="hidden items-center gap-2 rounded-full border border-brand-accent/40 bg-brand-accent/10 px-4 py-2 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent/20 lg:inline-flex"
        >
            <LogIn className="h-4 w-4" />
            Sign In
        </Link>
    );

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border bg-brand-primary/90 backdrop-blur-md">
            <nav className="mx-auto flex h-[84px] max-w-[1600px] items-center justify-between px-6 lg:px-8" aria-label="Navigasi utama">
                <Link href="/" aria-label="Tekna" className="shrink-0">
                    <Logo />
                </Link>

                <div className="hidden items-center gap-9 lg:flex">{NAV_LINKS.map((l) => renderLink(l))}</div>

                <div className="flex items-center gap-3">
                    {AuthBtn}
                    {ThemeBtn}
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-label={open ? 'Tutup menu' : 'Buka menu'}
                        aria-expanded={open}
                        className="rounded-lg p-2 text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent lg:hidden"
                    >
                        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </nav>

            {open && (
                <div className="border-t border-brand-border bg-brand-primary px-4 pb-5 pt-2 lg:hidden">
                    <div className="flex flex-col">
                        {NAV_LINKS.map((l) => renderLink(l, true))}

                        {auth?.user ? (
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                                className="mt-2 inline-flex items-center gap-2 rounded-md bg-brand-accent/10 px-3 py-3 text-[15px] font-semibold text-brand-accent"
                            >
                                <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="mt-2 inline-flex items-center gap-2 rounded-md bg-brand-accent/10 px-3 py-3 text-[15px] font-semibold text-brand-accent"
                            >
                                <LogIn className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}