// resources/js/Pages/Shared/Tekna/data.js
// Semua teks & link landing page dikumpulkan di sini supaya mudah diedit.

export const SITE = 'https://tekna.id';

export const CONTACT = {
    email: 'info@tekna.id',
    address: 'Klipang Raya, Semarang, Jawa Tengah, Indonesia',
    website: 'tekna.id',
    twitter: 'https://twitter.com/teknasapujagat',
    facebook: 'https://facebook.com/tekna',
    instagram: 'https://instagram.com/tekna',
    linkedin: 'https://linkedin.com/company/tekna',
};

// Isi path logo Anda (mis. '/images/tekna-logo.png' di folder public).
// Jika null, tampil logo teks sebagai pengganti sementara.
export const LOGO_SRC = null;

export const NAV_LINKS = [
    { label: 'Beranda', href: '/', icon: 'code' },
    { label: 'Tentang Kami', href: '/#about', icon: 'users' },
    { label: 'Proyek', href: '/projects', icon: 'rocket' }, // Ubah ke /projects
    { label: 'Product', href: '/products', icon: 'package' }, // Ubah ke /products
    { label: 'Blog', href: '/blog', icon: 'globe' },          // Ubah ke /blog
    { label: 'Career', href: '/career', icon: 'briefcase' },  // Ubah ke /career
];

export const DISCIPLINES = [
    {
        key: 'iot',
        title: 'IoT Development',
        desc: 'Sensor, gateway, dan dashboard monitoring real-time untuk peralatan industri dan kondisi lingkungan.',
    },
    {
        key: 'mobile',
        title: 'Mobile App',
        desc: 'Aplikasi iOS dan Android yang cepat dan nyaman dipakai, dari tim lapangan sampai pelanggan akhir.',
    },
    {
        key: 'web',
        title: 'Web Development',
        desc: 'Platform web modern, mulai dari company profile, e-commerce, sampai sistem ERP skala enterprise.',
    },
];

export const PROJECTS = [
    {
        slug: 'tekna-web-platform',
        title: 'Tekna Web Platform',
        image: `${SITE}/images/projects/tekna-web.jpg`,
        icon: 'monitor',
        tags: ['IoT', 'Web'],
        desc: 'A comprehensive IoT monitoring platform designed to provide real-time insights and control over industrial equipment and environmental conditions.',
    },
    {
        slug: 'tekna-mobile-app',
        title: 'Tekna Mobile App',
        image: `${SITE}/images/projects/tekna-mobile.jpg`,
        icon: 'phone',
        tags: ['IoT', 'Mobile'],
        desc: 'Native mobile application for IoT monitoring that provides field engineers and managers with on-the-go access to critical system data.',
    },
    {
        slug: 'erp-tekna',
        title: 'ERP Tekna',
        image: `${SITE}/images/projects/erp-tekna.jpg`,
        icon: 'building',
        tags: ['ERP', 'Web'],
        desc: 'Enterprise Resource Planning system tailored for modern businesses, featuring integrated modules for inventory management, financial tracking, human resources, and project management.',
    },
    {
        slug: 'midea-e-warranty-mobile',
        title: 'Midea E-Warranty Mobile',
        image: `${SITE}/images/projects/midea-warranty.jpg`,
        icon: 'shield',
        tags: ['Mobile', 'Customer Service'],
        desc: 'Digital warranty management application for Midea home appliances, enabling customers to register products, claim warranties, and track service requests.',
    },
];

export const TESTIMONIALS = [
    {
        quote: 'Tekna has helped us develop a highly effective digital platform. Their team is professional and the results exceeded our expectations.',
        name: 'Ahmad Rizki',
        role: 'CEO, PT Maju Bersama',
    },
    {
        quote: 'Collaboration with Tekna is very enjoyable. They understand our business needs and provide targeted solutions.',
        name: 'Sarah Wijaya',
        role: 'Marketing Director, Global Solutions Indonesia',
    },
    {
        quote: "Tekna's work quality is very high. They not only develop applications but also ensure optimal scalability and security.",
        name: 'Budi Santoso',
        role: 'CTO, TechStart Indonesia',
    },
    {
        quote: 'The Tekna team is very responsive and communicative. They always provide clear updates and accommodate our feedback well.',
        name: 'Diana Putri',
        role: 'Product Manager, Innovate Digital',
    },
    {
        quote: 'Tekna helped our startup from idea to launch-ready product. Their expertise in modern technology is very impressive.',
        name: 'Rendra Kusuma',
        role: 'Founder, StartupHub Jakarta',
    },
    {
        quote: 'The e-commerce platform developed by Tekna has significantly increased our sales. The user experience they created is very user-friendly.',
        name: 'Maya Sari',
        role: 'Operations Director, E-Commerce Pro',
    },
];
