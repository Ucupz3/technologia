import { Quote } from 'lucide-react';
import { TESTIMONIALS } from './data';

const AVATAR_COLORS = [
    'bg-brand-accent/15 text-brand-accent',
    'bg-brand-accent2/15 text-brand-accent2',
];

function Person({ t, i }) {
    return (
        <figcaption className="mt-6 flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                {t.name.charAt(0)}
            </span>
            <span>
                <span className="block text-sm font-semibold text-brand-text">{t.name}</span>
                <span className="block text-xs text-brand-text-muted">{t.role}</span>
            </span>
        </figcaption>
    );
}

export default function TestimonialsSection() {
    const [featured, ...rest] = TESTIMONIALS;

    return (
        <section
            id="testimonials"
            className="relative z-10 scroll-mt-24 bg-brand-primary/80 px-4 py-24 sm:px-6 lg:px-8"
        >
            {/*
             * ZONA TRANSISI:
             * - -top-24 (≈96px) = tinggi padding bawah ProjectsSection
             * - h-24 = tinggi gradient, dari 'transparent' (menampilkan projects bg)
             *   ke 'brand-primary/80' (warna TestimonialsSection)
             * - pointer-events-none: tidak menghalangi klik (globe bisa di-drag dari sini)
             */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-brand-primary/80"
            />

            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-brand-text md:text-5xl">What Our Clients Say</h2>
                    <p className="mt-4 text-base text-brand-text-muted md:text-lg">
                        We are proud to work with great companies.
                    </p>
                </div>

                <figure className="mt-14 border-l-2 border-brand-accent pl-6 md:pl-10">
                    <Quote className="h-8 w-8 text-brand-accent/70" strokeWidth={1.5} />
                    <blockquote className="mt-4 max-w-4xl text-2xl font-medium leading-snug tracking-tight text-brand-text md:text-4xl md:leading-snug">
                        {featured.quote}
                    </blockquote>
                    <Person t={featured} i={0} />
                </figure>

                <div className="mt-16 columns-1 gap-6 md:columns-2 lg:columns-3">
                    {rest.map((t, i) => (
                        <figure
                            key={t.name}
                            className="mb-6 break-inside-avoid rounded-2xl border border-brand-border bg-brand-secondary p-6"
                        >
                            <blockquote className="text-sm leading-relaxed text-brand-text-muted">{t.quote}</blockquote>
                            <Person t={t} i={i + 1} />
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}