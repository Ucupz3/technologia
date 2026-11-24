// resources/js/Pages/Shared/Tekna/data.js

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

export const LOGO_SRC = null;

export const NAV_LINKS = [
    { label: 'Beranda', href: '/', icon: 'code' },
    { label: 'Tentang Kami', href: '/#about', icon: 'users' },
    { label: 'Portofolio', href: '/portofolio', icon: 'rocket' },
    { label: 'Product', href: '/products', icon: 'package' },
    { label: 'Blog', href: '/blog', icon: 'globe' },
    { label: 'Career', href: '/career', icon: 'briefcase' },
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
        id: 'tekna-erp',
        slug: 'tekna-erp',
        title: 'ERP Tekna',
        date: '08/11/2025',
        category: 'Web Application',
        description: 'Sistem ERP komprehensif dengan analitik canggih, otomatisasi workflow, dan arsitektur multi-tenant untuk bisnis modern.',
        overview: 'Digital enterprise resource planning system tailored for modern businesses, featuring integrated modules for inventory management, financial tracking, human resources, and real-time operational analytics.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'November 8, 2025',
        updatedDate: 'November 8, 2025',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        tags: ['Laravel 13', 'React', 'Inertia.js', 'Tailwind CSS', 'MySQL'],
        demoUrl: '#',
        githubUrl: '#',
        featured: true,
        gallery: [
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'tekna-web-platform',
        slug: 'tekna-web-platform',
        title: 'Tekna Web Platform',
        date: '08/11/2025',
        category: 'Web Application',
        description: 'Platform monitoring IoT canggih dengan dashboard real-time, sistem peringatan cerdas, dan pelaporan komprehensif untuk bisnis.',
        overview: 'A comprehensive IoT monitoring platform designed to provide real-time insights and control over industrial equipment and environmental conditions, integrating secure API routes and instant data streaming.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'November 8, 2025',
        updatedDate: 'November 8, 2025',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        tags: ['React', 'Vite', 'Tailwind CSS', 'Supabase'],
        demoUrl: 'https://nusa-quest.truecupzz.tech',
        githubUrl: '#',
        featured: true,
        gallery: [
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'tekna-mobile-app',
        slug: 'tekna-mobile-app',
        title: 'Tekna Mobile App',
        date: '08/11/2025',
        category: 'UI/UX Design',
        description: 'Aplikasi mobile profesional untuk monitoring IoT dengan kemampuan offline canggih, fitur AR, dan operasi lapangan yang efisien.',
        overview: 'Professional mobile application for IoT monitoring that provides field engineers and managers with on-the-go access to critical system data, interactive AR maintenance overlays, and offline sync support.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'November 8, 2025',
        updatedDate: 'November 8, 2025',
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        tags: ['Figma', 'UI/UX Prototype', 'Mobile App Design'],
        demoUrl: '#',
        githubUrl: '#',
        featured: true,
        gallery: [
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'midea-e-warranty-mobile',
        slug: 'midea-e-warranty-mobile',
        title: 'Midea E-Warranty Mobile',
        date: '08/11/2025',
        category: 'UI/UX Design',
        description: 'Solusi manajemen garansi digital komprehensif dengan QR scanning, dukungan multibahasa, dan integrasi layanan seamless.',
        overview: 'Digital warranty management application for Midea home appliances, enabling customers to register products, claim warranties, and track service requests. The app features advanced QR code scanning with product verification, comprehensive multilingual support for global markets, and seamless integration with service centers and customer support systems.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'November 8, 2025',
        updatedDate: 'November 8, 2025',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        tags: ['Figma', 'Mobile UI', 'Prototyping'],
        demoUrl: '#',
        githubUrl: '#',
        featured: true,
        gallery: [
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'traffic-monitoring',
        slug: 'traffic-monitoring',
        title: 'Computer Vision Traffic Monitor',
        date: '15/10/2025',
        category: 'AI & Computer Vision',
        description: 'Dashboard pemantauan dan deteksi pelanggaran kendaraan secara real-time menggunakan alur pengolahan kamera dan pemodelan YOLOv8.',
        overview: 'Real-time vehicle violation tracking dashboard powered by custom YOLOv8 computer vision model pipelines and OpenCV Flask server.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'October 15, 2025',
        updatedDate: 'October 15, 2025',
        image: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
        tags: ['Python', 'OpenCV', 'YOLOv8', 'Flask'],
        demoUrl: '#',
        githubUrl: '#',
        featured: false,
        gallery: [
            'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80'
        ]
    },
    {
        id: 'hr-sports',
        slug: 'hr-sports',
        title: 'HR Sports Landing Page',
        date: '20/08/2025',
        category: 'Web Application',
        description: 'Landing page responsif toko sepatu dan perlengkapan olahraga modern dengan optimasi performa dan animasi transisi antarmuka.',
        overview: 'Responsive storefront landing page built for shoe and sportswear showcase featuring optimized UI transitions and clean responsive layouts.',
        status: 'Active',
        projectStatus: 'Completed',
        createdDate: 'August 20, 2025',
        updatedDate: 'August 20, 2025',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        tags: ['React', 'Vite', 'Tailwind CSS', 'AOS'],
        demoUrl: 'https://hrsports.truecupzz.tech',
        githubUrl: '#',
        featured: false,
        gallery: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
        ]
    }
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