// resources/js/Pages/Shared/Welcome.jsx
import React, { useState, useEffect } from "react";
import Navbar from "@/Components/Landing/Navbar";
import Features from "@/Components/Landing/Features";
import Footer from "@/Components/Landing/Footer";
import GlobeHero from "@/Components/Globe/GlobeHero";
import { Sun, Moon } from "lucide-react";

export default function Welcome() {
    // State untuk tema (default: dark)
    const [themeMode, setThemeMode] = useState("dark");

    // Sinkronisasi state React dengan class 'dark' di tag <html>
    // Ini wajib agar GlobeBackground versi Three.js Anda mendeteksi perubahan tema
    useEffect(() => {
        if (themeMode === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-white dark:bg-[#030712] text-slate-900 dark:text-white transition-colors duration-500">
            
            {/* 1. Navbar (Fixed di atas) */}
            <Navbar mode={themeMode} />

            {/* 2. Hero Section dengan Globe 3D & Sticky Scroll */}
            <GlobeHero 
                badge="Software House • IoT • Mobile • Web"
                title="With Us Serving The Universe"
                description="Building scalable websites, mobile apps, and IoT solutions for the future."
                primary={{ label: "Reach Us", href: "#contact" }}
                secondary={{ label: "Our Projects", href: "#features" }}
                stage2={{ 
                    title: "Innovation Meets Excellence", 
                    description: "From concept to deployment, we deliver technology that transforms your business." 
                }}
            />

            {/* 3. Section Fitur / Bento Grid */}
            <Features mode={themeMode} />
            
            {/* 4. Footer */}
            <Footer mode={themeMode} />

            {/* 5. Floating Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all hover:scale-105 border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
                {themeMode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
        </div>
    );
}