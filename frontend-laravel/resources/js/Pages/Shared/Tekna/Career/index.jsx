import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';
import {
    Search,
    MapPin,
    Clock,
    Star,
    Building2,
    Users,
    TrendingUp,
    Briefcase,
    Share2,
    UserPlus,
    ChevronDown,
} from 'lucide-react';

const jobs = [
    {
        id: 'senior-full-stack-developer',
        title: 'Senior Full Stack Developer',
        location: 'Jakarta Office',
        type: 'Full-time',
        salary: 'Rp 15M - Rp 25M',
        featured: true,
        level: 'Senior Level',
        posted: 'Nov 8',
        postedLong: '08/11/2025',
        department: 'Engineering',
        description: (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold border-b border-[rgb(var(--brand-border))] pb-2">
                    Senior Full Stack Developer
                </h1>
                <p className="text-sm text-[rgb(var(--brand-text-muted))] leading-relaxed">
                    We are looking for an experienced Full Stack Developer to join our growing
                    engineering team. You will be responsible for developing and maintaining our
                    web applications using React, Next.js, and Node.js.
                </p>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What You&apos;ll Do
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Develop and maintain web applications using React and Next.js</li>
                    <li>Build robust backend APIs using Node.js and PostgreSQL</li>
                    <li>Collaborate with design and product teams</li>
                    <li>Mentor junior developers</li>
                    <li>Participate in code reviews and architecture decisions</li>
                </ul>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Tech Stack
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Frontend: React, Next.js, TypeScript, Tailwind CSS</li>
                    <li>Backend: Node.js, Express, PostgreSQL</li>
                    <li>Infrastructure: Docker, AWS, Vercel</li>
                    <li>Tools: Git, GitHub, Linear, Figma</li>
                </ul>
            </div>
        ),
        requirements: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>5+ years of experience in full stack development</li>
                    <li>Strong proficiency in JavaScript/TypeScript</li>
                    <li>Experience with React and Next.js</li>
                    <li>Experience with Node.js and Express</li>
                    <li>Knowledge of PostgreSQL or similar databases</li>
                    <li>Experience with Git and version control</li>
                    <li>Strong problem-solving skills</li>
                    <li>Excellent communication skills</li>
                </ul>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Preferred Qualifications
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Experience with cloud platforms (AWS, GCP, Azure)</li>
                    <li>Knowledge of Docker and containerization</li>
                    <li>Experience with testing frameworks</li>
                    <li>Contributions to open source projects</li>
                </ul>
            </div>
        ),
        benefits: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What We Offer
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Competitive salary and equity package</li>
                    <li>Health insurance coverage</li>
                    <li>Flexible working hours</li>
                    <li>Remote work options</li>
                    <li>Professional development budget</li>
                    <li>Modern office in Jakarta SCBD</li>
                    <li>Free meals and snacks</li>
                    <li>Team building activities</li>
                    <li>Learning and development opportunities</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'ui-ux-designer',
        title: 'UI/UX Designer',
        location: 'Remote Indonesia',
        type: 'Full-time',
        salary: 'Rp 10M - Rp 18M',
        featured: true,
        level: 'Mid Level',
        posted: 'Nov 8',
        postedLong: '08/11/2025',
        department: 'Design',
        description: (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold border-b border-[rgb(var(--brand-border))] pb-2">
                    UI/UX Designer
                </h1>
                <p className="text-sm text-[rgb(var(--brand-text-muted))] leading-relaxed">
                    Kami mencari UI/UX Designer yang berpengalaman untuk merancang pengalaman
                    digital yang intuitif dan menarik bagi pengguna produk kami.
                </p>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What You&apos;ll Do
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Merancang wireframe, prototype, dan high-fidelity mockup</li>
                    <li>Melakukan user research dan usability testing</li>
                    <li>Berkolaborasi dengan engineer dan product manager</li>
                    <li>Membangun dan memelihara design system</li>
                </ul>
            </div>
        ),
        requirements: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>3+ tahun pengalaman sebagai UI/UX Designer</li>
                    <li>Mahir menggunakan Figma, Sketch, atau Adobe XD</li>
                    <li>Portofolio yang menunjukkan kemampuan desain</li>
                    <li>Pemahaman kuat tentang prinsip UX dan accessibility</li>
                </ul>
            </div>
        ),
        benefits: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What We Offer
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Remote work yang fleksibel</li>
                    <li>Budget belajar tahunan</li>
                    <li>Asuransi kesehatan</li>
                    <li>Tim yang kolaboratif</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'frontend-developer-intern',
        title: 'Frontend Developer Intern',
        location: 'Jakarta Office',
        type: 'Internship',
        salary: 'Rp 3M - Rp 5M',
        featured: false,
        level: 'Entry Level',
        posted: 'Nov 8',
        postedLong: '08/11/2025',
        department: 'Engineering',
        description: (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold border-b border-[rgb(var(--brand-border))] pb-2">
                    Frontend Developer Intern
                </h1>
                <p className="text-sm text-[rgb(var(--brand-text-muted))] leading-relaxed">
                    Program magang 6 bulan untuk mahasiswa atau fresh graduate yang ingin
                    mendalami pengembangan frontend modern.
                </p>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What You&apos;ll Learn
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>React, Next.js, dan TypeScript</li>
                    <li>Responsive design dengan Tailwind CSS</li>
                    <li>Version control dan code review</li>
                    <li>Kolaborasi tim Agile</li>
                </ul>
            </div>
        ),
        requirements: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Mahasiswa tingkat akhir atau fresh graduate</li>
                    <li>Dasar HTML, CSS, dan JavaScript</li>
                    <li>Keinginan kuat untuk belajar</li>
                </ul>
            </div>
        ),
        benefits: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What We Offer
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Uang saku bulanan</li>
                    <li>Mentoring dari senior engineer</li>
                    <li>Peluang konversi ke full-time</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'product-manager',
        title: 'Product Manager',
        location: 'Jakarta Office',
        type: 'Full-time',
        salary: 'Rp 12M - Rp 20M',
        featured: false,
        level: 'Mid Level',
        posted: 'Nov 8',
        postedLong: '08/11/2025',
        department: 'Product',
        description: (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold border-b border-[rgb(var(--brand-border))] pb-2">
                    Product Manager
                </h1>
                <p className="text-sm text-[rgb(var(--brand-text-muted))] leading-relaxed">
                    Memimpin pengembangan produk dari konsep hingga peluncuran, bekerja sama
                    dengan engineer, designer, dan stakeholder bisnis.
                </p>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What You&apos;ll Do
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Mendefinisikan roadmap dan prioritas produk</li>
                    <li>Menulis PRD dan user stories</li>
                    <li>Memimpin sprint planning dan review</li>
                    <li>Analisis data untuk pengambilan keputusan</li>
                </ul>
            </div>
        ),
        requirements: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>3+ tahun pengalaman sebagai Product Manager</li>
                    <li>Pemahaman metodologi Agile/Scrum</li>
                    <li>Kemampuan analitis dan komunikasi yang baik</li>
                </ul>
            </div>
        ),
        benefits: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What We Offer
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Gaji kompetitif + bonus performa</li>
                    <li>Asuransi kesehatan keluarga</li>
                    <li>Learning budget</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'digital-marketing-specialist',
        title: 'Digital Marketing Specialist',
        location: 'Remote Indonesia',
        type: 'Full-time',
        salary: 'Rp 8M - Rp 15M',
        featured: false,
        level: 'Mid Level',
        posted: 'Nov 8',
        postedLong: '08/11/2025',
        department: 'Marketing',
        description: (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold border-b border-[rgb(var(--brand-border))] pb-2">
                    Digital Marketing Specialist
                </h1>
                <p className="text-sm text-[rgb(var(--brand-text-muted))] leading-relaxed">
                    Merancang dan mengeksekusi strategi pemasaran digital untuk meningkatkan brand
                    awareness dan akuisisi pelanggan.
                </p>
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What You&apos;ll Do
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Mengelola kampanye Google Ads, Meta Ads, dan LinkedIn</li>
                    <li>Membuat content marketing dan copywriting</li>
                    <li>Analisis performa dan optimasi konversi</li>
                </ul>
            </div>
        ),
        requirements: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    Requirements
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>2+ tahun pengalaman digital marketing</li>
                    <li>Mahir Google Analytics dan Ads Manager</li>
                    <li>Kreatif dan berorientasi data</li>
                </ul>
            </div>
        ),
        benefits: (
            <div className="space-y-4">
                <h2 className="text-xl font-bold border-b border-[rgb(var(--brand-border))] pb-1">
                    What We Offer
                </h2>
                <ul className="list-disc pl-6 space-y-1 text-sm text-[rgb(var(--brand-text-muted))]">
                    <li>Remote work</li>
                    <li>BPJS Kesehatan dan Ketenagakerjaan</li>
                    <li>Bonus performa</li>
                </ul>
            </div>
        ),
    },
];

function JobListItem({ job, active, onClick }) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick(job)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(job)}
            className={`group cursor-pointer rounded-xl py-4 px-3 transition-all duration-200 border hover:border-[rgb(var(--brand-accent))]/30 hover:shadow-md ${
                active
                    ? 'border-[rgb(var(--brand-accent))] bg-[rgb(var(--brand-accent))]/5 shadow-md'
                    : 'border-[rgb(var(--brand-border))] bg-[rgb(var(--brand-secondary))] shadow-sm'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[rgb(var(--brand-muted))] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-[rgb(var(--brand-text-muted))]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[rgb(var(--brand-text))] text-sm line-clamp-1 group-hover:text-[rgb(var(--brand-accent))] transition-colors">
                            {job.title}
                        </h4>
                    </div>
                    <p className="text-sm text-[rgb(var(--brand-text-muted))] mb-2">
                        Company Name
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[rgb(var(--brand-text-muted))] mb-2 flex-wrap">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{job.type}</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-[rgb(var(--brand-accent))] mb-2">
                        {job.salary}
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            {job.featured && (
                                <span className="inline-flex items-center gap-1 rounded-md text-xs px-2 py-1 bg-[rgb(var(--brand-accent))]/10 text-[rgb(var(--brand-accent))]">
                                    <Star className="w-3 h-3 fill-current" />
                                    Featured
                                </span>
                            )}
                            <span className="inline-flex items-center rounded-md text-xs px-2 py-1 text-[rgb(var(--brand-text))] bg-[rgb(var(--brand-muted))]">
                                {job.level}
                            </span>
                        </div>
                        <span className="text-xs text-[rgb(var(--brand-text-muted))]">
                            {job.posted}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function JobDetail({ job }) {
    return (
        <div className="bg-[rgb(var(--brand-secondary))] rounded-lg border border-[rgb(var(--brand-border))] shadow-sm p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                            {job.featured && (
                                <span className="inline-flex items-center gap-1 rounded-md text-xs font-medium px-2 py-0.5 bg-[rgb(var(--brand-accent))]/15 text-[rgb(var(--brand-accent))]">
                                    <Star className="w-3 h-3 fill-current" />
                                    Featured
                                </span>
                            )}
                            <span className="inline-flex items-center rounded-md text-xs font-medium px-2 py-0.5 bg-[rgb(var(--brand-accent))] text-[rgb(var(--brand-white))]">
                                open
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-[rgb(var(--brand-text))] mb-2">
                            {job.title}
                        </h2>
                        <div className="text-lg font-semibold text-[rgb(var(--brand-accent))]">
                            {job.salary}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-md border border-[rgb(var(--brand-border))] bg-[rgb(var(--brand-primary))] text-[rgb(var(--brand-text))] text-sm hover:bg-[rgb(var(--brand-muted))] transition-colors">
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <a
                            href={`/career/${job.id}/apply`}
                            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[rgb(var(--brand-accent))] text-[rgb(var(--brand-white))] text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <UserPlus className="w-4 h-4" />
                            Apply Now
                        </a>
                    </div>
                </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-[rgb(var(--brand-muted))]/30 rounded-lg border border-[rgb(var(--brand-border))]">
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--brand-text-muted))] mb-2">
                        Department
                    </h4>
                    <p className="text-[rgb(var(--brand-text))]">{job.department}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--brand-text-muted))] mb-2">
                        Location
                    </h4>
                    <p className="text-[rgb(var(--brand-text))]">{job.location}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--brand-text-muted))] mb-2">
                        Employment Type
                    </h4>
                    <p className="text-[rgb(var(--brand-text))]">{job.type}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--brand-text-muted))] mb-2">
                        Experience Level
                    </h4>
                    <p className="text-[rgb(var(--brand-text))]">{job.level}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-[rgb(var(--brand-text-muted))] mb-2">
                        Posted
                    </h4>
                    <p className="text-[rgb(var(--brand-text))]">{job.postedLong}</p>
                </div>
            </div>

            {/* Description */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-[rgb(var(--brand-text))] mb-3">
                    Job Description
                </h3>
                {job.description}
            </div>

            {/* Requirements */}
            <div className="mb-6">{job.requirements}</div>

            {/* Benefits */}
            <div className="mb-6">{job.benefits}</div>
        </div>
    );
}

export default function CareerIndex() {
    const { theme, toggle } = useTheme();
    const [selected, setSelected] = useState(jobs[0]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [location, setLocation] = useState('All');
    const [jobType, setJobType] = useState('All');
    const [level, setLevel] = useState('All');

    const filtered = jobs.filter((j) => {
        if (
            search &&
            !`${j.title} ${j.department} ${j.location}`
                .toLowerCase()
                .includes(search.toLowerCase())
        )
            return false;
        if (category !== 'All' && j.department !== category) return false;
        if (location !== 'All' && j.location !== location) return false;
        if (jobType !== 'All' && j.type !== jobType) return false;
        if (level !== 'All' && j.level !== level) return false;
        return true;
    });

    const uniqueLocations = ['All', ...new Set(jobs.map((j) => j.location))];
    const uniqueTypes = ['All', ...new Set(jobs.map((j) => j.type))];
    const uniqueLevels = ['All', ...new Set(jobs.map((j) => j.level))];
    const uniqueDepts = ['All', ...new Set(jobs.map((j) => j.department))];

    return (
        <div
            id="top"
            className="relative min-h-screen w-full overflow-x-hidden bg-[rgb(var(--brand-primary))] text-[rgb(var(--brand-text))] transition-colors duration-500"
        >
            <TeknaNavbar theme={theme} onToggleTheme={toggle} />

            {/* Hero */}
            <section
                className="relative text-[rgb(var(--brand-white))] overflow-hidden"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgb(var(--brand-accent)), rgb(var(--brand-accent) / 0.9), rgb(var(--brand-accent) / 0.8))',
                }}
            >
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[rgb(var(--brand-white))]/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[rgb(var(--brand-white))]/10 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 container mx-auto px-4 py-12 md:px-6 lg:py-16">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1
                            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl bg-clip-text text-transparent mb-6"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, rgb(var(--brand-white)), rgb(var(--brand-white) / 0.8))',
                            }}
                        >
                            Find Your Dream Career
                        </h1>
                        <p className="text-lg sm:text-xl text-[rgb(var(--brand-white))]/90 mb-8 leading-relaxed">
                            Join our innovative team and shape the future of technology. Discover
                            opportunities that match your passion and skills.
                        </p>
                        <div className="max-w-2xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--brand-white))]/60 h-5 w-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search jobs, skills, or companies..."
                                    className="w-full h-12 bg-[rgb(var(--brand-white))]/20 border border-[rgb(var(--brand-white))]/30 text-[rgb(var(--brand-white))] placeholder:text-[rgb(var(--brand-white))]/60 focus:bg-[rgb(var(--brand-white))]/30 focus:ring-2 focus:ring-[rgb(var(--brand-white))]/50 rounded-xl pl-12 pr-4 outline-none text-sm transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-[rgb(var(--brand-white))]/80">
                            <div className="flex items-center gap-2 bg-[rgb(var(--brand-white))]/10 px-4 py-2 rounded-full">
                                <Building2 className="w-4 h-4" />
                                <span>{jobs.length} Open Positions</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[rgb(var(--brand-white))]/10 px-4 py-2 rounded-full">
                                <Users className="w-4 h-4" />
                                <span>8 Departments</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[rgb(var(--brand-white))]/10 px-4 py-2 rounded-full">
                                <MapPin className="w-4 h-4" />
                                <span>5 Locations</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[rgb(var(--brand-white))]/10 px-4 py-2 rounded-full">
                                <TrendingUp className="w-4 h-4" />
                                <span>{jobs.filter((j) => j.featured).length} Featured Jobs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Positions */}
            <section className="py-12 bg-gradient-to-b from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-muted))]/5">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--brand-accent))]/10 text-[rgb(var(--brand-accent))] text-sm font-medium rounded-full mb-6">
                            <Briefcase className="w-4 h-4" />
                            Career Opportunities
                        </div>
                        <h2
                            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent mb-6"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, rgb(var(--brand-text)), rgb(var(--brand-text) / 0.9), rgb(var(--brand-text-muted)))',
                            }}
                        >
                            Available Positions
                        </h2>
                        <p className="max-w-2xl mx-auto text-lg text-[rgb(var(--brand-text-muted))] leading-relaxed">
                            Discover opportunities that match your skills and aspirations
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="mb-8">
                        <div className="bg-[rgb(var(--brand-secondary))] rounded-lg border border-[rgb(var(--brand-border))] shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-[rgb(var(--brand-text))]">
                                    Filters
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-[rgb(var(--brand-text))] mb-2 block">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-[rgb(var(--brand-border))] bg-transparent text-[rgb(var(--brand-text))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--brand-accent))]/50"
                                    >
                                        {uniqueDepts.map((d) => (
                                            <option key={d} value={d}>
                                                {d === 'All' ? 'All Categorys' : d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[rgb(var(--brand-text))] mb-2 block">
                                        Location
                                    </label>
                                    <select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-[rgb(var(--brand-border))] bg-transparent text-[rgb(var(--brand-text))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--brand-accent))]/50"
                                    >
                                        {uniqueLocations.map((l) => (
                                            <option key={l} value={l}>
                                                {l === 'All' ? 'All Locations' : l}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[rgb(var(--brand-text))] mb-2 block">
                                        Job Type
                                    </label>
                                    <select
                                        value={jobType}
                                        onChange={(e) => setJobType(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-[rgb(var(--brand-border))] bg-transparent text-[rgb(var(--brand-text))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--brand-accent))]/50"
                                    >
                                        {uniqueTypes.map((t) => (
                                            <option key={t} value={t}>
                                                {t === 'All' ? 'All Job Types' : t}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[rgb(var(--brand-text))] mb-2 block">
                                        Experience Level
                                    </label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-[rgb(var(--brand-border))] bg-transparent text-[rgb(var(--brand-text))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--brand-accent))]/50"
                                    >
                                        {uniqueLevels.map((lv) => (
                                            <option key={lv} value={lv}>
                                                {lv === 'All' ? 'All Experience Levels' : lv}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Jobs List */}
                        <div className="w-full lg:w-2/5">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-[rgb(var(--brand-text))]">
                                        {filtered.length} Jobs
                                    </h3>
                                    <div className="relative">
                                        <select className="appearance-none w-40 h-9 rounded-lg border border-[rgb(var(--brand-border))] bg-transparent text-[rgb(var(--brand-text))] px-3 pr-8 text-xs outline-none focus:ring-2 focus:ring-[rgb(var(--brand-accent))]/50">
                                            <option>Latest Posts</option>
                                            <option>Oldest Posts</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[900px] overflow-y-auto">
                                    {filtered.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-[rgb(var(--brand-text-muted))]">
                                            Tidak ada lowongan yang cocok dengan filter.
                                        </div>
                                    ) : (
                                        filtered.map((j) => (
                                            <JobListItem
                                                key={j.id}
                                                job={j}
                                                active={selected.id === j.id}
                                                onClick={setSelected}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detail Panel */}
                        <div className="w-full lg:w-3/5" id="job-detail">
                            <JobDetail job={selected} />
                        </div>
                    </div>
                </div>
            </section>

            <TeknaFooter />
        </div>
    );
}