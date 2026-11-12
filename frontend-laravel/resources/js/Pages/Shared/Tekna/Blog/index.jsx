import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';
import {
    Search,
    Star,
    Calendar,
    Eye,
    Link as LinkIcon,
    ChevronDown,
} from 'lucide-react';

const articles = [
    {
        id: 1,
        title: 'The Future of Web Development in 2024',
        excerpt:
            'Explore the latest trends and technologies that will shape web development in 2024 and beyond.',
        category: 'Technology',
        categoryColor: '#3b82f6',
        author: 'Jane Smith',
        initials: 'JS',
        role: 'Content Writer',
        dateLabel: '8 November 2025',
        dateISO: '2025-11-08',
        featured: true,
        views: 0,
        slug: 'future-of-web-development-2024',
    },
    {
        id: 2,
        title: 'How AI is Transforming Business Operations',
        excerpt:
            'Discover how artificial intelligence is revolutionizing the way businesses operate and make decisions.',
        category: 'Business',
        categoryColor: '#10b981',
        author: 'John Doe',
        initials: 'JD',
        role: 'Content Writer',
        dateLabel: '7 November 2025',
        dateISO: '2025-11-07',
        featured: false,
        views: 0,
        slug: 'ai-transforming-business-operations',
    },
    {
        id: 3,
        title: 'Building Scalable Web Applications',
        excerpt:
            'Learn the best practices for building web applications that can handle growth and increased traffic.',
        category: 'Development',
        categoryColor: '#f59e0b',
        author: 'Mike Johnson',
        initials: 'MJ',
        role: 'Content Writer',
        dateLabel: '6 November 2025',
        dateISO: '2025-11-06',
        featured: false,
        views: 0,
        slug: 'building-scalable-web-applications',
    },
    {
        id: 4,
        title: 'The Future of Web Development in 2024',
        excerpt:
            'Explore the latest trends and technologies that will shape web development in 2024 and beyond.',
        category: 'Web Development',
        categoryColor: '#10b981',
        author: 'Jane Smith',
        initials: 'JS',
        role: 'Content Writer',
        dateLabel: '21 Agustus 2025',
        dateISO: '2025-08-21',
        featured: true,
        views: 125,
        slug: 'future-web-dev-2024',
    },
    {
        id: 5,
        title: 'How AI is Transforming Business Operations',
        excerpt:
            'Discover how artificial intelligence is revolutionizing the way businesses operate and make decisions.',
        category: 'AI & Machine Learning',
        categoryColor: '#8b5cf6',
        author: 'John Doe',
        initials: 'JD',
        role: 'Content Writer',
        dateLabel: '20 Agustus 2025',
        dateISO: '2025-08-20',
        featured: false,
        views: 89,
        slug: 'ai-business-operations',
    },
    {
        id: 6,
        title: 'Building Scalable Web Applications',
        excerpt:
            'Learn the best practices for building web applications that can handle growth and increased traffic.',
        category: 'Web Development',
        categoryColor: '#10b981',
        author: 'Mike Johnson',
        initials: 'MJ',
        role: 'Content Writer',
        dateLabel: '19 Agustus 2025',
        dateISO: '2025-08-19',
        featured: false,
        views: 67,
        slug: 'scalable-web-apps',
    },
];

const categories = [
    'Technology',
    'Business',
    'Development',
    'Web Development',
    'AI & Machine Learning',
];

function ArticleCard({ article }) {
    return (
        <article className="flex flex-col">
            <a href={`/blog/${article.slug}`} className="group block h-full">
                <div className="bg-[rgb(var(--brand-secondary))] text-[rgb(var(--brand-text))] flex flex-col rounded-xl border border-[rgb(var(--brand-border))] py-6 shadow-sm h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[rgb(var(--brand-accent))] group-focus-visible:ring-offset-2">
                    {/* Cover */}
                    <div className="relative">
                        <div className="aspect-video relative overflow-hidden bg-[rgb(var(--brand-muted))]">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[rgb(var(--brand-text-muted))] group-hover:scale-105 transition-transform duration-300">
                                <div className="w-16 h-16 rounded-full bg-[rgb(var(--brand-text-muted))]/10 flex items-center justify-center mb-3">
                                    <span className="text-sm font-medium">Tekna</span>
                                </div>
                                <p className="text-xs opacity-60">Blog Image Placeholder</p>
                            </div>
                        </div>
                        {article.featured && (
                            <div className="absolute top-4 left-4">
                                <span className="inline-flex items-center gap-1 rounded-md border border-transparent bg-[rgb(var(--brand-accent))] text-[rgb(var(--brand-white))] px-2 py-0.5 text-xs font-medium shadow-lg">
                                    <Star className="h-3 w-3 fill-current" />
                                    Featured
                                </span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4">
                            <span
                                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white shadow-lg"
                                style={{ backgroundColor: article.categoryColor }}
                            >
                                {article.category}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="text-base font-semibold leading-snug group-hover:text-[rgb(var(--brand-accent))] transition-colors line-clamp-2 mb-2">
                            {article.title}
                        </h3>
                        <p className="text-sm text-[rgb(var(--brand-text-muted))] line-clamp-2 leading-relaxed">
                            {article.excerpt}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-0 mt-auto">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[rgb(var(--brand-accent))]/10 text-[rgb(var(--brand-accent))] font-medium text-xs flex items-center justify-center ring-2 ring-[rgb(var(--brand-muted))]">
                                    {article.initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[rgb(var(--brand-text))] text-sm">
                                        {article.author}
                                    </p>
                                    <p className="text-xs text-[rgb(var(--brand-text-muted))]">
                                        {article.role}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[rgb(var(--brand-text-muted))] border-t border-[rgb(var(--brand-border))] pt-3">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <time dateTime={article.dateISO}>{article.dateLabel}</time>
                                </div>
                                <div className="flex items-center gap-3">
                                    {article.views > 0 ? (
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            <span>{article.views} views</span>
                                        </div>
                                    ) : (
                                        <span>0</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigator.clipboard?.writeText(
                                                `${window.location.origin}/blog/${article.slug}`
                                            );
                                        }}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-[rgb(var(--brand-muted))] text-[rgb(var(--brand-text))] transition-colors"
                                        aria-label="Copy link"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </article>
    );
}

export default function BlogIndex() {
    const { theme, toggle } = useTheme();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState('newest');
    const [featuredOnly, setFeaturedOnly] = useState(false);

    const filtered = articles.filter((a) => {
        if (featuredOnly && !a.featured) return false;
        if (category !== 'All' && a.category !== category) return false;
        if (
            search &&
            !`${a.title} ${a.excerpt} ${a.category}`.toLowerCase().includes(search.toLowerCase())
        )
            return false;
        return true;
    });

    return (
        <div
            id="top"
            className="relative min-h-screen w-full overflow-x-hidden bg-[rgb(var(--brand-primary))] text-[rgb(var(--brand-text))] transition-colors duration-500"
        >
            <TeknaNavbar theme={theme} onToggleTheme={toggle} />

            <div className="container mx-auto px-4 pt-24 pb-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Insights &amp; Latest News</h1>
                    <p className="text-sm md:text-base text-[rgb(var(--brand-text-muted))] max-w-2xl mx-auto">
                        Explore our articles about technology, design, and innovation that
                        shape the future of digital experiences.
                    </p>
                </div>

                <main role="main" aria-label="Blog articles">
                    <section className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col lg:flex-row gap-2 mb-6 pb-4 border-b border-[rgb(var(--brand-border))]/40">
                            <div className="flex-1">
                                <div className="relative">
                                    <label htmlFor="blog-search" className="sr-only">
                                        Search articles
                                    </label>
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--brand-text-muted))]/60 w-3.5 h-3.5" />
                                    <input
                                        id="blog-search"
                                        type="text"
                                        placeholder="Search articles..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full h-9 pl-8 pr-3 bg-transparent text-sm border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none transition-colors placeholder:text-[rgb(var(--brand-text-muted))]"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-1.5 flex-wrap lg:flex-nowrap">
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="appearance-none w-full lg:w-auto h-9 px-2 pr-8 text-sm bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none cursor-pointer transition-colors"
                                    >
                                        <option value="All">All Categories</option>
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="appearance-none w-full lg:w-auto h-9 px-2 pr-8 text-sm bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none cursor-pointer transition-colors"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFeaturedOnly((v) => !v)}
                                    className={`inline-flex items-center gap-1.5 h-9 px-2 border-b-2 transition-colors ${
                                        featuredOnly
                                            ? 'border-[rgb(var(--brand-accent))] text-[rgb(var(--brand-accent))]'
                                            : 'border-transparent text-[rgb(var(--brand-text-muted))] hover:text-[rgb(var(--brand-text))]'
                                    }`}
                                >
                                    Featured
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs text-[rgb(var(--brand-text-muted))]">
                                {filtered.length} articles found
                            </div>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-base font-medium mb-1">No articles found</h3>
                                <p className="text-sm text-[rgb(var(--brand-text-muted))]">
                                    Coba ubah kata kunci atau filter.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filtered.map((a) => (
                                    <ArticleCard key={a.id} article={a} />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            <TeknaFooter />
        </div>
    );
}