import { lazy, Suspense, useEffect, useState } from 'react';

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

/** Globe sebagai background — posisi tetap, tidak menangkap pointer kecuali lewat canvas-nya. */
export default function GlobeBackground({ theme: themeProp, className = '' }) {
    const autoTheme = useTheme();
    const theme = themeProp || autoTheme;
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className={`absolute inset-0 ${className}`}>
<div
    className="absolute left-1/2 top-1/2 aspect-square w-[150vw] -translate-x-1/2 -translate-y-1/2
               sm:w-[120vw] md:w-[100vw] lg:w-[78vw] xl:w-[70vw] 2xl:max-w-[1400px]"
>
                {mounted && (
                    <Suspense fallback={null}>
                        <Globe theme={theme} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}