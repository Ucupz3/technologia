import { Mail, MapPin } from 'lucide-react';
import { CONTACT } from './data';

export default function ContactCta() {
    return (
        <section
            id="contact"
            className="pointer-events-none relative z-10 scroll-mt-24 bg-brand-primary px-4 py-24 sm:px-6 lg:px-8"
        >
            {/* gradient transition: pointer-events-none → tembus ke globe */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-brand-primary"
            />

            {/* konten: pointer-events-auto → globe TERKUNCI di sini */}
            <div className="pointer-events-auto mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[1.4fr_1fr]">
                <div>
                    <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-brand-text md:text-5xl">
                        Punya ide produk digital? Mari kita wujudkan bersama.
                    </h2>
                    <p className="mt-5 max-w-xl text-base text-brand-text-muted md:text-lg">
                        Ceritakan kebutuhan website, aplikasi mobile, atau solusi IoT Anda. Tim kami akan menghubungi Anda kembali.
                    </p>
                    <a
                        href={`mailto:${CONTACT.email}`}
                        className="mt-8 inline-flex rounded-full bg-brand-accent px-7 py-3.5 text-sm font-semibold text-brand-white shadow-lg shadow-brand-accent/30 transition hover:bg-brand-accent2"
                    >
                        Reach Us
                    </a>
                </div>

                <ul className="space-y-5 text-sm text-brand-text-muted">
                    <li className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
                        <a href={`mailto:${CONTACT.email}`} className="hover:text-brand-accent">{CONTACT.email}</a>
                    </li>
                    <li className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
                        <span>{CONTACT.address}</span>
                    </li>
                </ul>
            </div>
        </section>
    );
}