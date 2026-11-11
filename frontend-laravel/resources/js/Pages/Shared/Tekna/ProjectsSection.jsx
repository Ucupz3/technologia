import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Monitor, Smartphone, Building2, ShieldCheck } from 'lucide-react';
import { PROJECTS } from './data';

const ICONS = { monitor: Monitor, phone: Smartphone, building: Building2, shield: ShieldCheck };

function ProjectImage({ src, alt, icon }) {
    const [failed, setFailed] = useState(false);
    const Icon = ICONS[icon] || Monitor;

    return (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-brand-border bg-brand-tertiary">
            {failed ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-accent/15 via-transparent to-brand-accent2/15">
                    <Icon className="h-14 w-14 text-brand-accent/70" strokeWidth={1.25} />
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            )}
        </div>
    );
}

export default function ProjectsSection() {
    return (
        <section
            id="projects"
            className="pointer-events-none relative z-10 scroll-mt-24 bg-brand-secondary/40 px-4 py-24 sm:px-6 lg:px-8"
        >
            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-brand-text md:text-5xl">Featured Projects</h2>
                    <p className="mt-4 text-base text-brand-text-muted md:text-lg">
                        Explore our latest projects and see how we&rsquo;ve transformed businesses across industries.
                    </p>
                </div>

                <div className="mt-16 space-y-20 md:space-y-28">
                    {PROJECTS.map((p, i) => (
                        <article key={p.slug} className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
                            <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                                <ProjectImage src={p.image} alt={p.title} icon={p.icon} />
                            </div>

                            <div className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                                <div className="flex flex-wrap gap-2">
                                    {p.tags.map((t) => (
                                        <span
                                            key={t}
                                            className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="mt-5 text-2xl font-bold tracking-tight text-brand-text md:text-3xl">
                                    {p.title}
                                </h3>
                                <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-text-muted md:text-base">
                                    {p.desc}
                                </p>
                                <Link
                                    href={`/projects/${p.slug}`}
                                    className="pointer-events-auto mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent transition hover:gap-2.5 hover:text-brand-accent2"
                                >
                                    Detail Proyek
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}