import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import TeknaNavbar from '../TeknaNavbar';
import TeknaFooter from '../TeknaFooter';
import {
    Search,
    ChevronDown,
    LayoutGrid,
    List,
    Package,
} from 'lucide-react';

export default function ProductsIndex() {
    const { theme, toggle } = useTheme();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState('featured');
    const [view, setView] = useState('grid');

    // Belum ada produk — placeholder untuk masa depan
    const products = [];

    return (
        <div
            id="top"
            className="relative min-h-screen w-full overflow-x-hidden bg-[rgb(var(--brand-primary))] text-[rgb(var(--brand-text))] transition-colors duration-500"
        >
            <TeknaNavbar theme={theme} onToggleTheme={toggle} />

            <div className="container mx-auto px-4 pt-24 pb-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Products</h1>
                    <p className="text-sm md:text-base text-[rgb(var(--brand-text-muted))] max-w-2xl mx-auto">
                        Explore our innovative products and solutions with transparent pricing.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-2 mb-6 pb-4 border-b border-[rgb(var(--brand-border))]/40">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--brand-text-muted))]/60 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-9 pl-8 pr-3 bg-transparent text-sm border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none transition-colors placeholder:text-[rgb(var(--brand-text-muted))]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap lg:flex-nowrap items-center">
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="appearance-none w-full lg:w-auto h-9 px-2 pr-8 text-sm bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none cursor-pointer text-[rgb(var(--brand-text))]"
                            >
                                <option value="All">All Products</option>
                                <option value="web">Web Apps</option>
                                <option value="mobile">Mobile Apps</option>
                                <option value="iot">IoT Solutions</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        </div>
                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="appearance-none w-full lg:w-auto h-9 px-2 pr-8 text-sm bg-transparent border-0 border-b border-transparent focus:border-[rgb(var(--brand-accent))]/50 outline-none cursor-pointer text-[rgb(var(--brand-text))]"
                            >
                                <option value="featured">Featured First</option>
                                <option value="newest">Newest First</option>
                                <option value="price">Price (Low to High)</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        </div>
                        <div className="flex border-b border-transparent">
                            <button
                                type="button"
                                onClick={() => setView('grid')}
                                aria-label="Grid view"
                                className={`inline-flex items-center gap-1.5 h-9 px-2 border-b-2 transition-colors ${
                                    view === 'grid'
                                        ? 'border-[rgb(var(--brand-accent))] text-[rgb(var(--brand-accent))]'
                                        : 'border-transparent text-[rgb(var(--brand-text-muted))] hover:text-[rgb(var(--brand-text))]'
                                }`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                aria-label="List view"
                                className={`inline-flex items-center gap-1.5 h-9 px-2 border-b-2 transition-colors ${
                                    view === 'list'
                                        ? 'border-[rgb(var(--brand-accent))] text-[rgb(var(--brand-accent))]'
                                        : 'border-transparent text-[rgb(var(--brand-text-muted))] hover:text-[rgb(var(--brand-text))]'
                                }`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Count */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-[rgb(var(--brand-text-muted))]">
                        {products.length} products found
                    </div>
                </div>

                {/* Content */}
                {products.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto bg-[rgb(var(--brand-muted))]/20 rounded-full flex items-center justify-center mb-3">
                            <Search className="h-6 w-6 text-[rgb(var(--brand-text-muted))]" />
                        </div>
                        <h3 className="text-base font-medium mb-1">No products found</h3>
                        <p className="text-sm text-[rgb(var(--brand-text-muted))] mb-3">
                            No products are available at the moment.
                        </p>
                    </div>
                ) : (
                    <div
                        className={
                            view === 'grid'
                                ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
                                : 'space-y-4'
                        }
                    >
                        {products.map((p) => (
                            <div
                                key={p.id}
                                className="bg-[rgb(var(--brand-secondary))] border border-[rgb(var(--brand-border))] rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Package className="w-5 h-5 text-[rgb(var(--brand-accent))]" />
                                    <h3 className="font-semibold text-[rgb(var(--brand-text))]">
                                        {p.name}
                                    </h3>
                                </div>
                                <p className="text-sm text-[rgb(var(--brand-text-muted))]">
                                    {p.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TeknaFooter />
        </div>
    );
}