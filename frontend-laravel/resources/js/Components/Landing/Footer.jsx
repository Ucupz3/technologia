// resources/js/Components/Landing/Footer.jsx
import React from "react";
import { Link } from "@inertiajs/react";

// Kita buat komponen SVG manual untuk menghindari error lucide-react
const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer({ mode }) {
    const isDark = mode === "dark";
    const borderColor = isDark ? "border-white/10" : "border-slate-200";
    const textMuted = isDark ? "text-slate-400" : "text-slate-500";

    return (
        <footer className={`relative z-10 border-t ${borderColor} ${isDark ? "bg-[#03091e]/80 backdrop-blur-lg" : "bg-white/80 backdrop-blur-lg"} pt-16 pb-8`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-white">T</div>
                            <span className="font-bold text-xl tracking-tight">Tekna.</span>
                        </div>
                        <p className={`text-sm ${textMuted} mb-6`}>
                            The global network intelligence platform for modern businesses.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className={`${textMuted} hover:text-cyan-400 transition-colors`}><GithubIcon className="w-5 h-5" /></a>
                            <a href="#" className={`${textMuted} hover:text-cyan-400 transition-colors`}><TwitterIcon className="w-5 h-5" /></a>
                            <a href="#" className={`${textMuted} hover:text-cyan-400 transition-colors`}><LinkedinIcon className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className={`space-y-3 text-sm ${textMuted}`}>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">API Reference</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className={`space-y-3 text-sm ${textMuted}`}>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className={`space-y-3 text-sm ${textMuted}`}>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>

                <div className={`border-t ${borderColor} pt-8 flex flex-col md:flex-row justify-between items-center gap-4`}>
                    <p className={`text-sm ${textMuted}`}>
                        © {new Date().getFullYear()} Tekna Global Inc. All rights reserved.
                    </p>
                    <div className={`flex gap-4 text-sm ${textMuted}`}>
                        <span>Status: <span className="text-emerald-500 font-medium">All systems operational</span></span>
                    </div>
                </div>
            </div>
        </footer>
    );
}