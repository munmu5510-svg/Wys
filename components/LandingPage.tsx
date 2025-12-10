

import React, { useState } from 'react';
import { LogoIcon, CheckIcon, RocketLaunchIcon, SparklesIcon, ChartBarIcon, Squares2x2Icon, FacebookIcon, WhatsappIcon } from './icons';
import { Button } from './Button';
import { PRICING, COMMUNITY_PHONE } from '../constants';

interface LandingPageProps {
    onNavigateToAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  const t = {
    en: {
        heroTitle: "Professional YouTube Scripts, Powered by AI",
        heroSubtitle: "Stop overthinking. Start creating. Turn ideas into viral-ready scripts in seconds.",
        cta: "Start Creating Now",
        whyTitle: "Why WySlider?",
        whyDesc: "Creating engaging content is hard. WySlider makes it effortless. Our AI understands pacing, tone, and retention, giving you a competitive edge.",
        features: [
            { title: "Smart Context", desc: "AI that adapts to your niche and unique voice." },
            { title: "Retention Focused", desc: "Hooks and structures designed to keep viewers watching." },
            { title: "Visual Direction", desc: "Get camera angles and B-roll suggestions automatically." }
        ],
        communityTitle: "Community Blueprints",
        pricingTitle: "Simple, Transparent Pricing",
        footer: "Join the WySlider Revolution"
    },
    fr: {
        heroTitle: "Scripts YouTube Professionnels, Propulsés par l'IA",
        heroSubtitle: "Arrêtez de réfléchir. Créez. Transformez vos idées en scripts viraux en quelques secondes.",
        cta: "Commencer Maintenant",
        whyTitle: "Pourquoi WySlider ?",
        whyDesc: "Créer du contenu engageant est difficile. WySlider rend cela facile. Notre IA comprend le rythme, le ton et la rétention.",
        features: [
            { title: "Contexte Intelligent", desc: "Une IA qui s'adapte à votre niche et votre voix." },
            { title: "Focus Rétention", desc: "Des hooks et structures conçus pour garder l'audience." },
            { title: "Direction Visuelle", desc: "Suggestions d'angles de caméra et B-roll automatiques." }
        ],
        communityTitle: "Modèles Communautaires",
        pricingTitle: "Tarifs Simples et Transparents",
        footer: "Rejoignez la Révolution WySlider"
    }
  };

  const text = t[lang];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans animate-fade-in flex flex-col relative overflow-x-hidden">
        {/* REVERTED BACKGROUND: Texture + Gradient */}
        <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        {/* Navigation / Language Toggle */}
        <nav className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
                <LogoIcon className="h-8 md:h-10 w-auto text-white" />
                <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">WySlider</span>
            </div>
            <div className="flex items-center space-x-3 md:space-x-4">
                <div className="bg-gray-800/80 backdrop-blur rounded-full p-1 flex space-x-1 border border-gray-700">
                    <button onClick={() => setLang('en')} className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold transition ${lang === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
                    <button onClick={() => setLang('fr')} className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold transition ${lang === 'fr' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>FR</button>
                </div>
                <Button onClick={onNavigateToAuth} variant="secondary" className="px-3 md:px-4 py-2 text-xs md:text-sm bg-gray-800/80 backdrop-blur hover:bg-gray-700">Login</Button>
            </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-28 pb-16 md:pt-48 md:pb-32 px-4 md:px-6 z-10">
            <div className="max-w-4xl mx-auto text-center relative">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1.5 mb-6 md:mb-8 backdrop-blur-sm">
                    <SparklesIcon className="h-3 w-3 md:h-4 md:w-4 text-indigo-400" />
                    <span className="text-xs md:text-sm font-medium text-indigo-300">New: Viral Idea Generator V2</span>
                </div>
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 md:mb-8 leading-tight drop-shadow-lg">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                        {text.heroTitle}
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md px-2">
                    {text.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button onClick={onNavigateToAuth} className="w-full sm:w-auto text-lg px-8 py-4 rounded-full shadow-xl shadow-indigo-600/20">
                        {text.cta}
                    </Button>
                    <button onClick={onNavigateToAuth} className="text-gray-300 hover:text-white font-medium px-6 py-4 flex items-center transition">
                        <RocketLaunchIcon className="h-5 w-5 mr-2" />
                        View Demo
                    </button>
                </div>
            </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 md:py-24 bg-black/30 border-y border-white/5 backdrop-blur-sm z-10">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">{text.whyTitle}</h2>
                    <p className="text-gray-400 text-base md:text-lg">{text.whyDesc}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {text.features.map((f, i) => (
                        <div key={i} className="bg-gray-800/40 p-6 md:p-8 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition group backdrop-blur-md">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-700/50 rounded-lg flex items-center justify-center mb-4 md:mb-6 group-hover:bg-indigo-600 transition">
                                <ChartBarIcon className="h-5 w-5 md:h-6 md:w-6 text-white"/>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">{f.title}</h3>
                            <p className="text-gray-400 text-sm md:text-base">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 relative z-10">
             <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">{text.pricingTitle}</h2>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {/* Starter */}
                    <div className="bg-gray-800/60 backdrop-blur p-6 md:p-8 rounded-3xl border border-gray-700 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Starter</h3>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-bold text-white">${PRICING.starter}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> 10 Scripts</li>
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> Social Posts</li>
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> Viral Idea Generator</li>
                        </ul>
                        <Button onClick={onNavigateToAuth} variant="secondary" className="w-full">Get Started</Button>
                    </div>

                    {/* Creator - Highlighted */}
                    <div className="bg-gray-800/80 backdrop-blur p-6 md:p-8 rounded-3xl border border-indigo-500 shadow-2xl shadow-indigo-900/20 relative flex flex-col transform md:scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">POPULAR</div>
                        <h3 className="text-xl font-bold text-indigo-400 mb-2">Creator</h3>
                        <div className="flex items-baseline mb-6">
                            <span className="text-5xl font-bold text-white">${PRICING.creator}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-white text-sm"><CheckIcon className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0"/> 30 Scripts</li>
                            <li className="flex items-center text-white text-sm"><CheckIcon className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0"/> Social Posts</li>
                            <li className="flex items-center text-white text-sm"><CheckIcon className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0"/> Viral Idea Generator</li>
                            <li className="flex items-center text-white font-bold text-sm"><CheckIcon className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0"/> Serial Prod (5 Eps)</li>
                        </ul>
                        <Button onClick={onNavigateToAuth} className="w-full py-4 text-lg font-bold">Choose Creator</Button>
                    </div>

                    {/* Pro */}
                    <div className="bg-gray-800/60 backdrop-blur p-6 md:p-8 rounded-3xl border border-gray-700 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-300 mb-2">Pro Authority</h3>
                        <div className="flex items-baseline mb-6">
                            <span className="text-4xl font-bold text-white">${PRICING.pro}</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> 50 Scripts</li>
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> Everything in Creator</li>
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> Serial Prod (3-20 Eps)</li>
                            <li className="flex items-center text-gray-300 text-sm"><CheckIcon className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0"/> Priority Support</li>
                        </ul>
                        <Button onClick={onNavigateToAuth} variant="secondary" className="w-full">Go Pro</Button>
                    </div>
                </div>
             </div>
        </section>
        
        <footer className="py-8 md:py-12 bg-black border-t border-gray-800 relative z-10">
            <div className="container mx-auto px-6 text-center">
                <div className="mb-8">
                    <h4 className="text-lg md:text-xl font-bold mb-4">{text.footer}</h4>
                    <p className="text-gray-500 mb-6 text-sm">Community Support: {COMMUNITY_PHONE}</p>
                    <div className="flex justify-center space-x-6">
                        <a href="https://facebook.com/WySlider" target="_blank" className="text-gray-400 hover:text-indigo-500 transition">
                            <FacebookIcon className="h-6 w-6" />
                        </a>
                        {/* Whatsapp removed per request */}
                    </div>
                </div>
                <div className="text-gray-600 text-xs md:text-sm">
                    &copy; {new Date().getFullYear()} WySlider. All rights reserved.
                </div>
            </div>
        </footer>
    </div>
  );
};