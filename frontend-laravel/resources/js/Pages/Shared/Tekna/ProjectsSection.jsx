import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Monitor, Smartphone, Layout, ShieldCheck } from 'lucide-react';

const ICONS = {
    'Web Development': Monitor,
    'Mobile Development': Smartphone,
    'Design Services': Layout,
};

function CategoryImage({ name }) {
    const Icon = ICONS[name] || Monitor;

    return (
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-brand-border bg-brand-tertiary flex items-center justify-center">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-accent/15 via-transparent to-brand-accent2/15">
                <Icon className="h-16 w-16 text-brand-accent/70" strokeWidth={1.25} />
            </div>
        </div>
    );
}

export default function ProjectsSection() {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/v1/service-categories').then((res) => res.json()),
            fetch('/api/v1/services').then((res) => res.json())
        ])
            .then(([catRes, servRes]) => {
                if (catRes.success) setCategories(catRes.data);
                if (servRes.success) setServices(servRes.data);
            })
            .catch((err) => console.error('Fetch error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <section id="projects" className="py-24 text-center text-brand-text-muted text-sm">
                Memuat data proyek...
            </section>
        );
    }

    return (
        <section
            id="projects"
            className="pointer-events-none relative z-10 scroll-mt-24 bg-brand-secondary/40 px-4 py-24 sm:px-6 lg:px-8"
        >
            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight text-brand-text md:text-5xl">Featured Projects</h2>
                    <p className="mt-4 text-base text-brand-text-muted md:text-lg">
                        Explore our latest project categories and see how we&rsquo;ve transformed businesses across industries.
                    </p>
                </div>

                <div className="mt-16 space-y-20 md:space-y-28">
                    {categories.map((cat, i) => {
                        const catServices = services.filter((s) => String(s.category_id) === String(cat.id));

                        return (
                            <article key={cat.id} className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
                                <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                                    <CategoryImage name={cat.name} />
                                </div>

                                <div className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                                    {/* Tag Layanan dari API /api/v1/services */}
                                    <div className="flex flex-wrap gap-2">
                                        {catServices.map((service) => (
                                            <span
                                                key={service.id}
                                                className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent"
                                            >
                                                {service.name}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="mt-5 text-2xl font-bold tracking-tight text-brand-text md:text-3xl">
                                        {cat.name}
                                    </h3>

                                    <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-text-muted md:text-base">
                                        {cat.description || 'Layanan profesional dengan standar kualitas tinggi.'}
                                    </p>

                                    <Link
                                        href={`/portofolio?category_id=${cat.id}`}
                                        className="pointer-events-auto mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent transition hover:gap-2.5 hover:text-brand-accent2"
                                    >
                                        Detail Proyek
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}