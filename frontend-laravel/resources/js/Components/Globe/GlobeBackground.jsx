import { lazy, Suspense, useEffect, useState } from 'react';

// Three.js dimuat hanya di client -> aman untuk Inertia SSR & memperkecil bundle awal
const Globe = lazy(() => import('./Globe'));

function useTheme() {
    const [theme, setTheme] = useState('dark');
    useEffect(() => {
        const el = document.documentElement;
        const read = () => setTheme(el.classList.contains('dark') ? 'dark' : 'light');
        read();
        const mo = new MutationObserver(read);
        mo.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);
    return theme;
}

/**
 * Globe besar, digeser ke kanan pada desktop, di tengah pada mobile.
 * Wrapper induk harus `relative overflow-hidden` agar tidak ada horizontal scroll.
 */
export default function GlobeBackground({ theme: themeProp, className = '' }) {
    const autoTheme = useTheme();
    const theme = themeProp || autoTheme;
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className={`absolute inset-0 z-0 ${className}`}>
            <div
                className="absolute left-1/2 top-[48%] aspect-square w-[150vw] -translate-x-1/2 -translate-y-1/2
                           sm:top-1/2 sm:w-[120vw] md:w-[100vw] lg:left-[62%] lg:w-[78vw] xl:w-[70vw] 2xl:max-w-[1400px]"
            >
                {mounted && (
                    <Suspense fallback={null}>
                        <Globe theme={theme} />
                    </Suspense>
                )}
            </div>
            {/* Gradient agar teks tetap terbaca (tidak menangkap pointer) */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/90 via-white/30 to-transparent dark:from-[#030712] dark:via-[#030712]/40" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent dark:from-[#030712]" />
        </div>
    );
}
