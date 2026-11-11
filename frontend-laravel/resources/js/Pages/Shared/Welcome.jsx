import { useTheme } from '@/hooks/useTheme';
import GlobeBackground from '@/Components/Globe/GlobeBackground';
import GlobeHero from '@/Components/Globe/GlobeHero';
import TeknaNavbar from './Tekna/TeknaNavbar';
import AboutSection from './Tekna/AboutSection';
import ProjectsSection from './Tekna/ProjectsSection';
import TestimonialsSection from './Tekna/TestimonialsSection';
import ContactCta from './Tekna/ContactCta';
import TeknaFooter from './Tekna/TeknaFooter';

export default function Welcome() {
    const { theme, toggle } = useTheme();

    return (
        <div
            id="top"
            className="relative min-h-screen w-full overflow-x-hidden bg-brand-primary text-brand-text transition-colors duration-500"
        >
            {/* GLOBE: fixed di belakang semua konten */}
            <div className="fixed inset-0 z-0">
                <GlobeBackground theme={theme} />
            </div>

            <TeknaNavbar theme={theme} onToggleTheme={toggle} />

            {/*
             * KUNCI PERBAIKAN:
             * main diberi pointer-events-none → seluruh area hero "tembus" ke globe di belakang.
             * Hero buttons tetap bisa diklik karena di HeroOverlay sudah ada pointer-events-auto.
             * Konten di bawah hero dibungkus pointer-events-auto agar link/tombol tetap normal.
             */}
            <main className="pointer-events-none relative z-10">
                <GlobeHero
                    badge="Software House • IoT • Mobile • Web"
                    title="With Tekna Serving The Universe"
                    description="Building scalable websites, mobile apps, and IoT solutions for the future."
                    primary={{ label: 'Reach Us', href: '#contact' }}
                    secondary={{ label: 'Our Projects', href: '#projects' }}
                    stage2={{
                        title: 'Innovation Meets Excellence',
                        description:
                            'From concept to deployment, we deliver cutting-edge technology solutions that transform your business.',
                    }}
                />

                <div className="pointer-events-auto">
                    <AboutSection />
                    <ProjectsSection />
                    <TestimonialsSection />
                    <ContactCta />
                </div>
            </main>

            <TeknaFooter />
        </div>
    );
}