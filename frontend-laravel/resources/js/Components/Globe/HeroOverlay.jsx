import { Link } from '@inertiajs/react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';

const cards = [
    { label: 'Active Projects', value: '120+', pos: 'right-[8%] top-[24%]' },
    { label: 'Global Reach', value: '8 Cities', pos: 'right-[26%] bottom-[22%]' },
    { label: 'Uptime', value: '99.9%', pos: 'right-[4%] bottom-[34%]' },
];

/**
 * `progress` = MotionValue 0..1 dari useScroll pada GlobeHero.
 * Tahap 1 (0 - 0.5): headline utama. Tahap 2 (0.5 - 1): pesan sekunder.
 */
export default function HeroOverlay({
    progress,
    badge = 'Software House • IoT • Mobile • Web',
    title = 'With Us Serving The Universe',
    description = 'Building scalable websites, mobile apps, and IoT solutions for the future.',
    primary = { label: 'Reach Us', href: '#contact' },
    secondary = { label: 'Our Projects', href: '#projects' },
    stage2 = { title: 'Innovation Meets Excellence', description: 'From concept to deployment, we deliver technology that transforms your business.' },
}) {
    const reduce = useReducedMotion();
    const o1 = useTransform(progress, [0, 0.35, 0.5], [1, 1, 0]);
    const y1 = useTransform(progress, [0, 0.5], [0, reduce ? 0 : -60]);
    const o2 = useTransform(progress, [0.45, 0.65, 1], [0, 1, 1]);
    const y2 = useTransform(progress, [0.45, 0.65], [reduce ? 0 : 40, 0]);
    const cardsO = useTransform(progress, [0, 0.4], [1, 0]);
    const hintO = useTransform(progress, [0, 0.1], [1, 0]);

    return (
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 lg:px-8">
            {/* Tahap 1 */}
            <motion.div style={{ opacity: o1, y: y1 }} className="max-w-xl">
                <motion.span
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-300"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {badge}
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
                    className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                    className="mt-5 text-base text-slate-600 dark:text-slate-300 sm:text-lg"
                >
                    {description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-8 flex flex-wrap gap-3"
                >
                    <Link href={primary.href} className="pointer-events-auto rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400">
                        {primary.label}
                    </Link>
                    <Link href={secondary.href} className="pointer-events-auto rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                        {secondary.label}
                    </Link>
                </motion.div>
            </motion.div>

            {/* Tahap 2 */}
            <motion.div style={{ opacity: o2, y: y2 }} className="absolute left-6 max-w-lg lg:left-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">{stage2.title}</h2>
                <p className="mt-4 text-slate-600 dark:text-slate-300">{stage2.description}</p>
            </motion.div>

            {/* Floating cards: hanya >= lg */}
            <motion.div style={{ opacity: cardsO }} className="hidden lg:block">
                {cards.map((c, i) => (
                    <motion.div
                        key={c.label}
                        animate={reduce ? undefined : { y: [0, -8, 0] }}
                        transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
                        className={`absolute ${c.pos} rounded-2xl border border-white/20 bg-white/70 px-4 py-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60`}
                    >
                        <div className="text-xs text-slate-500 dark:text-slate-400">{c.label}</div>
                        <div className="text-xl font-semibold text-slate-900 dark:text-white">{c.value}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div style={{ opacity: hintO }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="flex h-10 w-6 items-start justify-center rounded-full border border-slate-400/60 p-1 dark:border-white/40">
                    <motion.span
                        animate={reduce ? undefined : { y: [0, 14, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        className="h-2 w-1 rounded-full bg-slate-500 dark:bg-white"
                    />
                </div>
            </motion.div>
        </div>
    );
}
