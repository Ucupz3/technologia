import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import HeroOverlay from './HeroOverlay';

export default function GlobeHero(props) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

    return (
        // pointer-events-none: area kosong hero tembus ke globe di belakang
        <section ref={ref} className="pointer-events-none relative h-[200vh]">
            <div className="pointer-events-none sticky top-0 h-screen overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-r " />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-32" />

                <HeroOverlay progress={scrollYProgress} {...props} />
            </div>
        </section>
    );
}