import { Cpu, Smartphone, Globe2 } from 'lucide-react';
import { DISCIPLINES } from './data';

const ICONS = { iot: Cpu, mobile: Smartphone, web: Globe2 };

export default function AboutSection() {
    return (
        <section id="about" className="relative z-10 scroll-mt-24 bg-brand-primary/20 px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight tracking-tight text-brand-text md:text-4xl">
                            Software house dari Semarang untuk bisnis yang ingin bergerak lebih cepat.
                        </h2>
                    </div>
                    <p className="max-w-xl text-base leading-relaxed text-brand-text-muted lg:pt-2 lg:text-lg">
                        PT. Sapujagat Nirmana Tekna (Tekna.id) telah lebih dari 5 tahun membantu perusahaan dan startup
                        membangun produk digital, dari perangkat IoT di lapangan sampai aplikasi yang dipegang
                        pelanggan setiap hari.
                    </p>
                </div>

                <div className="mt-14 grid overflow-hidden rounded-3xl border border-brand-border md:grid-cols-3">
                    {DISCIPLINES.map((d, i) => {
                        const Icon = ICONS[d.key];
                        return (
                            <div
                                key={d.key}
                                className={`bg-brand-secondary p-8 ${
                                    i > 0 ? 'border-t border-brand-border md:border-l md:border-t-0' : ''
                                }`}
                            >
                                <Icon className="h-7 w-7 text-brand-accent" strokeWidth={1.75} />
                                <h3 className="mt-6 text-lg font-semibold text-brand-text">{d.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">{d.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}