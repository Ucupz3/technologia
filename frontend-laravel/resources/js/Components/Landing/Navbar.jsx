// resources/js/Components/Landing/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { Menu, X } from "lucide-react";

export default function Navbar({ mode }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isDark = mode === "dark";
    const navBg = isScrolled 
        ? (isDark ? "bg-[#03091e]/80 backdrop-blur-md border-b border-white/10" : "bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm")
        : "bg-transparent border-transparent";

    const textColor = isDark ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900";
    const logoColor = isDark ? "text-white" : "text-slate-900";

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBg}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-white">T</div>
                        <span className={`font-bold text-xl tracking-tight ${logoColor}`}>Tekna.</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className={`text-sm font-medium transition-colors ${textColor}`}>Features</a>
                        <a href="#solutions" className={`text-sm font-medium transition-colors ${textColor}`}>Solutions</a>
                        <a href="#pricing" className={`text-sm font-medium transition-colors ${textColor}`}>Pricing</a>
                        <a href="#docs" className={`text-sm font-medium transition-colors ${textColor}`}>Docs</a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login" className={`text-sm font-medium transition-colors ${textColor}`}>
                            Sign In
                        </Link>
                        <Link 
                            href="/register" 
                            className="text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={logoColor}>
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className={`md:hidden absolute top-20 left-0 w-full border-b ${isDark ? "bg-[#03091e] border-white/10" : "bg-white border-slate-200"}`}>
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <a href="#features" className={`block px-3 py-2 rounded-md text-base font-medium ${textColor}`}>Features</a>
                        <a href="#solutions" className={`block px-3 py-2 rounded-md text-base font-medium ${textColor}`}>Solutions</a>
                        <a href="#pricing" className={`block px-3 py-2 rounded-md text-base font-medium ${textColor}`}>Pricing</a>
                        <div className="pt-4 flex flex-col gap-3">
                            <Link href="/login" className={`block text-center px-3 py-2 rounded-md text-base font-medium border ${isDark ? "border-white/20 text-white" : "border-slate-300 text-slate-800"}`}>Sign In</Link>
                            <Link href="/register" className="block text-center px-3 py-2 rounded-md text-base font-medium bg-cyan-500 text-white">Get Started</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}