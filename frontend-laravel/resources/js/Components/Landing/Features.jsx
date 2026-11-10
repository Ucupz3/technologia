// resources/js/Components/Landing/Features.jsx
import React from "react";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, Globe2, Cpu, Database } from "lucide-react";

export default function Features({ mode }) {
    const isDark = mode === "dark";
    
    const cardBg = isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200 shadow-sm";
    const textMuted = isDark ? "text-slate-400" : "text-slate-500";

    const features = [
        {
            icon: <Globe2 className="w-6 h-6 text-cyan-400" />,
            title: "Global Infrastructure",
            desc: "Deploy your applications to edge nodes across 120+ countries seamlessly."
        },
        {
            icon: <Zap className="w-6 h-6 text-yellow-400" />,
            title: "Real-time Analytics",
            desc: "Process terabytes of data per second with sub-millisecond latency."
        },
        {
            icon: <Shield className="w-6 h-6 text-emerald-400" />,
            title: "Enterprise Security",
            desc: "End-to-end encryption with SOC2 Type II and ISO 27001 compliance."
        },
        {
            icon: <Cpu className="w-6 h-6 text-purple-400" />,
            title: "AI-Powered Engine",
            desc: "Intelligent routing and predictive scaling for your global operations."
        },
        {
            icon: <Database className="w-6 h-6 text-blue-400" />,
            title: "Unified Data Lake",
            desc: "Connect and query data from any source without complex ETL pipelines."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-rose-400" />,
            title: "Custom Dashboards",
            desc: "Build and share interactive visualizations tailored to your business."
        }
    ];

    return (
        <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    Everything you need to <br className="hidden md:block"/>
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">scale globally</span>
                </h2>
                <p className={`text-lg ${textMuted}`}>
                    Tekna provides the infrastructure, tools, and data you need to build, deploy, and scale your applications worldwide.
                </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`p-8 rounded-3xl border backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg ${cardBg}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                            {feat.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                        <p className={`text-sm leading-relaxed ${textMuted}`}>
                            {feat.desc}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}