import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import GlobeBackground from './GlobeBackground';
import HeroOverlay from './HeroOverlay';

/** Section 200vh dengan stage sticky 100vh: globe tetap, konten berganti saat scroll. */
export default function GlobeHero(props) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

    return (
        <section ref={ref} className="relative h-[200vh] bg-white dark:bg-[#030712]">
            <div className="sticky top-0 h-screen overflow-hidden">
                <GlobeBackground />
                <HeroOverlay progress={scrollYProgress} {...props} />
            </div>
        </section>
    );
}
