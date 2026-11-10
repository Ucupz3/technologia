import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Code2, Users, Rocket, Package, Globe, Briefcase, Menu, X, Moon, Sun } from 'lucide-react';
import { LOGO_SRC, NAV_LINKS } from './data';

const ICONS = { code: Code2, users: Users, rocket: Rocket, package: Package, globe: Globe, briefcase: Briefcase };
const SPY_IDS = ['about', 'projects', 'testimonials', 'contact'];

function Logo() {
    const [failed, setFailed] = useState(false);
    if (LOGO_SRC && !failed) {
        return <img src={LOGO_SRC} alt="Tekna - serving the universe" onError={() => setFailed(true)} className="h-10 w-auto" />;
    }
    return (
        <span className="flex flex-col leading-none">
            <span className="text-2xl font-semibold tracking-tight text-brand-accent">tekna</span>
            <span className="mt-0.5 text-[8px] tracking-wide text-brand-text-muted">serving the universe</span>
        </span>
    );
}

export default function TeknaNavbar({ theme, onToggleTheme }) {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState('top');

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

        const className = `inline-flex items-center gap-2 text-[15px] transition-colors ${
            mobile ? 'rounded-md px-3 py-3' : ''
        } ${
            isActive
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

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-border bg-brand-primary/90 backdrop-blur-md">
            <nav className="mx-auto flex h-[84px] max-w-[1600px] items-center justify-between px-6 lg:px-8" aria-label="Navigasi utama">
                <Link href="/" aria-label="Tekna" className="shrink-0">
                    <Logo />
                </Link>

                <div className="hidden items-center gap-9 lg:flex">{NAV_LINKS.map((l) => renderLink(l))}</div>

                <div className="flex items-center gap-3">
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
                    <div className="flex flex-col">{NAV_LINKS.map((l) => renderLink(l, true))}</div>
                </div>
            )}
        </header>
    );
}