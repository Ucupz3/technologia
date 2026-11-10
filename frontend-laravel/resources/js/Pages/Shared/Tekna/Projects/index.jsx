// resources/js/Pages/Shared/Tekna/Projects/index.jsx
import { useTheme } from '@/hooks/useTheme';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';
import ProjectsSection from '../ProjectsSection';

export default function ProjectsIndex() {
    const { theme, toggle } = useTheme();

    return (
        <div
            id="top"
            className="relative min-h-screen w-full overflow-x-hidden bg-white text-slate-900 transition-colors duration-500 dark:bg-[#030712] dark:text-white"
        >
            <TeknaNavbar theme={theme} onToggleTheme={toggle} />
            
            {/* pt-[84px] agar konten tidak tertutup navbar yang fixed */}
            <main className="pt-[84px]">
                <ProjectsSection />
            </main>

            <TeknaFooter />
        </div>
    );
}